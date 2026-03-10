/**
 * Nafasz Global — Hamburger Menu Module
 * 
 * Loads menu configuration from /menu-data.json (build-time) and
 * /src/content/settings.json (real-time toggle from CMS).
 * 
 * Menu can be enabled/disabled from the CMS Settings panel.
 * Individual pages can be shown/hidden in the menu from their page editor.
 */

let menuData = null;
let isMenuOpen = false;
let currentLang = 'en';
let eventsbound = false;

const hamburgerBtn = document.getElementById('hamburger-btn');
const menuOverlay = document.getElementById('menu-overlay');
const menuCloseBtn = document.getElementById('menu-close-btn');
const menuBackdrop = document.getElementById('menu-backdrop');
const menuNav = document.getElementById('menu-nav');

/**
 * Fetch menu data
 * Always checks settings.json for the real-time enabled flag,
 * then loads items from menu-data.json.
 */
async function loadMenuData() {
    let enabled = false;
    let settingsLoaded = false;
    let items = [];

    // 1) Check settings.json for the menu_enabled flag (real-time from CMS)
    try {
        const settingsRes = await fetch('/src/content/settings.json?' + Date.now());
        if (settingsRes.ok) {
            const settings = await settingsRes.json();
            enabled = settings.menu_enabled === true;
            settingsLoaded = true;
        }
    } catch (e) {
        // If settings.json not accessible, fall through to menu-data.json
    }

    // 2) Load menu items from menu-data.json (generated at build time)
    try {
        const response = await fetch('/menu-data.json?' + Date.now());
        if (response.ok) {
            const data = await response.json();
            items = data.items || [];
            // Only use menu-data.json's enabled flag if settings.json wasn't available
            if (!settingsLoaded) {
                enabled = data.enabled === true;
            }
        }
    } catch (e) {
        // No menu data available
    }

    menuData = { enabled, items };
}

/**
 * Initialize the menu system
 */
export async function initMenu() {
    await loadMenuData();

    if (!menuData || !menuData.enabled) {
        // Menu is disabled — hide hamburger and close menu if open
        if (hamburgerBtn) hamburgerBtn.style.display = 'none';
        if (isMenuOpen) closeMenu();
        return;
    }

    // Show the hamburger button
    if (hamburgerBtn) {
        hamburgerBtn.style.display = 'flex';
    }

    // Render menu items
    renderMenuItems();

    // Bind events (only once)
    if (!eventsbound) {
        bindMenuEvents();
        eventsbound = true;
    }
}

/**
 * Render menu links into the overlay panel
 */
function renderMenuItems() {
    if (!menuNav || !menuData.items.length) {
        if (menuNav) {
            menuNav.innerHTML = '<div class="menu-overlay__loading">No pages available</div>';
        }
        return;
    }

    const linksHtml = menuData.items
        .map((item, index) => {
            const title = currentLang === 'id' ? (item.title_id || item.title) : item.title;
            const number = String(index + 1).padStart(2, '0');
            return `
                <a href="/pages/${item.slug}/" class="menu-overlay__link" data-title-en="${item.title}" data-title-id="${item.title_id || item.title}">
                    <span class="menu-overlay__link-number">${number}</span>
                    <span class="menu-overlay__link-text">${title}</span>
                </a>
            `;
        })
        .join('');

    menuNav.innerHTML = linksHtml;
}

/**
 * Open the menu
 */
function openMenu() {
    if (!menuOverlay) return;
    isMenuOpen = true;
    menuOverlay.classList.add('is-open');
    menuOverlay.setAttribute('aria-hidden', 'false');
    hamburgerBtn?.classList.add('is-active');
    document.body.classList.add('menu-open');
}

/**
 * Close the menu
 */
function closeMenu() {
    if (!menuOverlay) return;
    isMenuOpen = false;
    menuOverlay.classList.remove('is-open');
    menuOverlay.setAttribute('aria-hidden', 'true');
    hamburgerBtn?.classList.remove('is-active');
    document.body.classList.remove('menu-open');
}

/**
 * Toggle the menu
 */
function toggleMenu() {
    if (isMenuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
}

/**
 * Bind all menu-related events
 */
function bindMenuEvents() {
    // Hamburger button click
    hamburgerBtn?.addEventListener('click', toggleMenu);

    // Close button click
    menuCloseBtn?.addEventListener('click', closeMenu);

    // Backdrop click
    menuBackdrop?.addEventListener('click', closeMenu);

    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });

    // Listen for Vite HMR / file changes — re-check menu settings
    // This handles the case when CMS saves settings.json
    if (import.meta.hot) {
        // Vite dev mode: poll settings every 5s for changes
        setInterval(async () => {
            const prevEnabled = menuData?.enabled;
            await loadMenuData();
            if (menuData.enabled !== prevEnabled) {
                if (menuData.enabled) {
                    if (hamburgerBtn) hamburgerBtn.style.display = 'flex';
                    renderMenuItems();
                } else {
                    if (hamburgerBtn) hamburgerBtn.style.display = 'none';
                    if (isMenuOpen) closeMenu();
                }
            }
        }, 5000);
    }
}

/**
 * Update menu language (called from i18n module)
 */
export function updateMenuLanguage(lang) {
    currentLang = lang;

    // Update link texts
    const links = menuNav?.querySelectorAll('.menu-overlay__link');
    links?.forEach((link) => {
        const titleEn = link.getAttribute('data-title-en');
        const titleId = link.getAttribute('data-title-id');
        const textEl = link.querySelector('.menu-overlay__link-text');
        if (textEl) {
            textEl.textContent = lang === 'id' ? (titleId || titleEn) : titleEn;
        }
    });
}
