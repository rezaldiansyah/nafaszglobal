/**
 * Nafasz Global — Page Builder Script
 * Generates static HTML pages from markdown content files.
 *
 * This script reads markdown files from src/content/pages/,
 * parses the frontmatter and body, then generates HTML pages
 * using a consistent template that matches the site's design.
 *
 * Usage: node scripts/build-pages.js
 * Called automatically before `vite build`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CONTENT_DIR = path.join(ROOT, 'src/content/pages');
const OUTPUT_DIR = path.join(ROOT, 'pages');
const LOCALES_DIR = path.join(ROOT, 'src/locales');

/**
 * Simple frontmatter parser (no external deps needed)
 * Handles two formats:
 *   1. Standard: --- delimited with separate body
 *   2. CMS format: Body embedded as YAML multiline scalar (no closing ---)
 */
function parseFrontmatter(content) {
    // Try standard frontmatter first (--- ... --- body)
    const standardMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (standardMatch) {
        return { data: parseYamlBlock(standardMatch[1]), body: standardMatch[2].trim() };
    }

    // CMS format: everything after opening --- is YAML (including body: >-)
    const cmsMatch = content.match(/^---\n([\s\S]+)$/);
    if (cmsMatch) {
        return { data: parseYamlBlock(cmsMatch[1]), body: '' };
    }

    return { data: {}, body: content };
}

/**
 * Parse a YAML block into key-value pairs
 * Handles: strings, booleans, numbers, quoted strings, multiline scalars (>-)
 */
function parseYamlBlock(yamlStr) {
    const frontmatter = {};
    const lines = yamlStr.split('\n');
    let currentKey = null;
    let currentValue = '';
    let inMultiline = false;

    for (const line of lines) {
        if (inMultiline) {
            if (/^\S/.test(line) && line.includes(':') && !line.startsWith(' ')) {
                frontmatter[currentKey] = currentValue.trim();
                inMultiline = false;
            } else {
                currentValue += line.replace(/^ {2}/, '') + '\n';
                continue;
            }
        }

        const keyMatch = line.match(/^([\w]+):\s*(.*)$/);
        if (keyMatch) {
            currentKey = keyMatch[1];
            const val = keyMatch[2].trim();
            if (val === '>-' || val === '|') {
                inMultiline = true;
                currentValue = '';
            } else if (val.startsWith('"') && val.endsWith('"')) {
                frontmatter[currentKey] = val.slice(1, -1);
            } else if (val === 'true') {
                frontmatter[currentKey] = true;
            } else if (val === 'false') {
                frontmatter[currentKey] = false;
            } else if (/^\d+$/.test(val)) {
                frontmatter[currentKey] = parseInt(val, 10);
            } else {
                frontmatter[currentKey] = val;
            }
        }
    }
    if (inMultiline && currentKey) {
        frontmatter[currentKey] = currentValue.trim();
    }

    return frontmatter;
}

/**
 * Very simple Markdown to HTML converter (no external deps)
 * Handles: headings, paragraphs, bold, italic, links, images, lists
 */
function markdownToHtml(md) {
    if (!md) return '';
    let html = md
        // Headings
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Images
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Unordered lists
        .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
        // Horizontal rules
        .replace(/^---$/gm, '<hr />')
        // Line breaks → paragraphs
        .split(/\n\n+/)
        .map((block) => {
            block = block.trim();
            if (!block) return '';
            if (block.startsWith('<h') || block.startsWith('<hr') || block.startsWith('<img')) {
                return block;
            }
            if (block.includes('<li>')) {
                return `<ul>${block}</ul>`;
            }
            return `<p>${block.replace(/\n/g, '<br />')}</p>`;
        })
        .join('\n');

    return html;
}

/**
 * Load footer translations for the page template
 */
function loadLocale(lang) {
    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return {};
}

/**
 * Generate an HTML page from parsed frontmatter + body
 */
function generatePageHtml(data, bodyHtml, bodyIdHtml, locale) {
    const title = data.title || 'Nafasz Global';
    const description = data.description || '';
    const featuredImage = data.featured_image || '';

    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Nafasz Global</title>
    <meta name="description" content="${description}" />

    <!-- Open Graph -->
    <meta property="og:title" content="${title} — Nafasz Global" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    ${featuredImage ? `<meta property="og:image" content="${featuredImage}" />` : ''}

    <!-- Preconnect Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

    <!-- Favicon -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <script type="module" src="/src/main.js"></script>
</head>

<body class="gate-open page-inner">

    <!-- Grain texture overlay -->
    <div class="grain-overlay" aria-hidden="true"></div>

    <!-- Navigation -->
    <nav class="nav" id="nav">
        <div class="container nav__inner">
            <a href="/" class="nav__logo">
                <img src="/logo.png" alt="Nafasz Global" class="nav__logo-img" />
            </a>
            <div class="nav__actions">
                <a href="/" class="nav__back-link" data-i18n="nav.enter">← Back</a>
                <div class="nav__lang-toggle" id="lang-toggle">
                    <button class="nav__lang-btn active" data-lang="en">EN</button>
                    <span style="color: var(--color-white-muted);">|</span>
                    <button class="nav__lang-btn" data-lang="id">ID</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Page Content -->
    <main>
        <section class="page-content" id="page-content">
            <div class="container container--narrow">
                <div class="reveal">
                    <h1 class="page-content__title" data-page-title-en="${data.title || ''}" data-page-title-id="${data.title_id || ''}">${title}</h1>
                </div>
                <article class="page-content__body reveal" data-page-body-lang="en">
                    ${bodyHtml}
                </article>
                <article class="page-content__body reveal" data-page-body-lang="id" style="display:none;">
                    ${bodyIdHtml}
                </article>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer" id="footer">
        <div class="container">
            <div class="footer__grid">
                <div class="footer__branch">
                    <span class="footer__branch-label" data-i18n="footer.au_branch">${locale.footer?.au_branch || ''}</span>
                    <p class="footer__branch-legal" data-i18n="footer.au_legal">${locale.footer?.au_legal || ''}</p>
                </div>
                <div class="footer__branch">
                    <span class="footer__branch-label" data-i18n="footer.id_branch">${locale.footer?.id_branch || ''}</span>
                    <p class="footer__branch-legal" data-i18n="footer.id_legal">${locale.footer?.id_legal || ''}</p>
                </div>
            </div>
            <div class="footer__compliance" data-i18n="footer.compliance">${locale.footer?.compliance || ''}</div>
            <p class="footer__copyright" data-i18n="footer.copyright">${locale.footer?.copyright || ''}</p>
        </div>
    </footer>

    <!-- Page language toggle script -->
    <script type="module">
        // Handle language switching for page content
        function updatePageLang(lang) {
            const titleEl = document.querySelector('.page-content__title');
            if (titleEl) {
                const enTitle = titleEl.getAttribute('data-page-title-en');
                const idTitle = titleEl.getAttribute('data-page-title-id');
                titleEl.textContent = lang === 'id' ? (idTitle || enTitle) : enTitle;
            }
            document.querySelectorAll('[data-page-body-lang]').forEach(el => {
                el.style.display = el.getAttribute('data-page-body-lang') === lang ? 'block' : 'none';
            });
        }

        // Listen for language changes
        document.querySelectorAll('.nav__lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                updatePageLang(btn.dataset.lang);
            });
        });

        // Set initial language
        const savedLang = localStorage.getItem('nafasz-lang') || 'en';
        updatePageLang(savedLang);
    </script>

</body>

</html>`;
}

// ============================================================
// MAIN BUILD PROCESS
// ============================================================
function build() {
    console.log('📄 Building pages from content...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Check if content directory exists
    if (!fs.existsSync(CONTENT_DIR)) {
        console.log('ℹ️  No content directory found. Skipping page generation.');
        return;
    }

    const locale = loadLocale('en');
    const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));

    if (files.length === 0) {
        console.log('ℹ️  No markdown files found. Skipping page generation.');
        return;
    }

    let generated = 0;
    const menuItems = [];

    for (const file of files) {
        const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
        const { data, body } = parseFrontmatter(raw);

        // Skip unpublished pages
        if (data.published === false) {
            console.log(`   ⏭️  Skipping "${data.title}" (not published)`);
            continue;
        }

        const slug = data.slug || path.basename(file, '.md');
        const bodyHtml = markdownToHtml(body);
        const bodyIdHtml = markdownToHtml(data.body_id || '');

        const pageHtml = generatePageHtml(data, bodyHtml, bodyIdHtml, locale);

        // Write to pages/<slug>/index.html for clean URLs
        const pageDir = path.join(OUTPUT_DIR, slug);
        if (!fs.existsSync(pageDir)) {
            fs.mkdirSync(pageDir, { recursive: true });
        }
        fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml, 'utf-8');
        generated++;
        console.log(`   ✅ Generated: /${slug}/`);

        // Collect menu items
        if (data.show_in_menu === true) {
            menuItems.push({
                title: data.title || slug,
                title_id: data.title_id || data.title || slug,
                slug: slug,
                order: parseInt(data.menu_order) || 10,
            });
        }
    }

    // ============================================================
    // GENERATE MENU DATA
    // ============================================================
    console.log('🍔 Building menu data...');

    // Read global settings
    const settingsPath = path.join(ROOT, 'src/content/settings.json');
    let settings = { menu_enabled: false };
    if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }

    // Sort menu items by order
    menuItems.sort((a, b) => a.order - b.order);

    const menuData = {
        enabled: settings.menu_enabled === true,
        items: menuItems,
    };

    // Write menu data to public directory (accessible at /menu-data.json)
    const menuDataPath = path.join(ROOT, 'public/menu-data.json');
    fs.writeFileSync(menuDataPath, JSON.stringify(menuData, null, 2), 'utf-8');
    console.log(`   🍔 Menu: ${menuData.enabled ? 'ENABLED' : 'DISABLED'}, ${menuItems.length} item(s)`);

    console.log(`📄 Done! Generated ${generated} page(s).`);
}

build();
