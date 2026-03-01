/**
 * Nafasz Global — Strategy Pillars Module
 * Tab/hover interaction (Desktop) | Accordion (Mobile)
 */

export function initPillars() {
    const cards = document.querySelectorAll('.pillar-card');

    if (!cards.length) return;

    // Desktop: hover-based interaction (handled by CSS)
    // Mobile: click to toggle accordion
    const isMobile = () => window.innerWidth < 1024;

    cards.forEach((card) => {
        card.addEventListener('click', () => {
            if (isMobile()) {
                // On mobile, toggle active state (accordion behavior)
                const wasActive = card.classList.contains('active');
                cards.forEach((c) => c.classList.remove('active'));
                if (!wasActive) {
                    card.classList.add('active');
                }
            }
        });
    });

    // Activate first pillar on mobile by default
    if (isMobile() && cards.length > 0) {
        cards[0].classList.add('active');
    }

    // Handle resize
    window.addEventListener('resize', () => {
        if (!isMobile()) {
            cards.forEach((c) => c.classList.remove('active'));
        } else if (!document.querySelector('.pillar-card.active') && cards.length > 0) {
            cards[0].classList.add('active');
        }
    });
}
