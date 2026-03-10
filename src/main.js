/**
 * Nafasz Global — Main Entry Point
 * Sovereign Trust Portal
 */

import './css/variables.css';
import './css/base.css';
import './css/animations.css';
import './css/sections.css';

import { initCulturalGate } from './js/cultural-gate.js';
import { initI18n } from './js/i18n.js';
import { initAnimations } from './js/animations.js';
import { initPillars } from './js/pillars.js';
import { initForm } from './js/form.js';
import { initMenu } from './js/menu.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    initCulturalGate();
    initAnimations();
    initPillars();
    initForm();
    initMenu();
});
