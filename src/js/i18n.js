/**
 * Nafasz Global — i18n Module
 * Bilingual toggle system (EN ↔ ID)
 */

import en from '../locales/en.json';
import id from '../locales/id.json';
import { updateMenuLanguage } from './menu.js';

const translations = { en, id };
let currentLang = localStorage.getItem('nafasz-lang') || 'en';

/**
 * Get a nested translation value by dot-notation key
 */
function getTranslation(key) {
    const keys = key.split('.');
    let value = translations[currentLang];
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            return key;
        }
    }
    return value || key;
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
export function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const text = getTranslation(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = text;
        } else {
            // Preserve SVG icons if they exist
            const svg = el.querySelector('svg');
            el.textContent = text;
            if (svg) el.appendChild(svg);
        }
    });

    // Update language toggle active state
    const toggles = document.querySelectorAll('.nav__lang-btn');
    toggles.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

/**
 * Get current language
 */
export function getCurrentLang() {
    return currentLang;
}

/**
 * Set language and re-apply translations
 */
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('nafasz-lang', lang);
        applyTranslations();
        updateMenuLanguage(lang);
    }
}

/**
 * Toggle between EN and ID
 */
export function toggleLanguage() {
    setLanguage(currentLang === 'en' ? 'id' : 'en');
}

/**
 * Initialize i18n
 */
export function initI18n() {
    applyTranslations();

    // Bind language toggle buttons
    document.querySelectorAll('.nav__lang-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });
}
