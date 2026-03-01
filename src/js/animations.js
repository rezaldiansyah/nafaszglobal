/**
 * Nafasz Global — Scroll Animations Module
 * Intersection Observer-based reveal animations
 */

export function initAnimations() {
    // Reveal on scroll
    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger, .fade-in');

    if (!revealElements.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px',
        }
    );

    revealElements.forEach((el) => observer.observe(el));

    // Nav scroll effect
    const nav = document.querySelector('.nav');
    if (nav) {
        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            nav.classList.toggle('scrolled', scrollY > 60);
            lastScrollY = scrollY;
        }, { passive: true });
    }
}
