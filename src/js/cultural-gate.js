/**
 * Nafasz Global — Cultural Gate Module
 * Full-screen acknowledgement modal before site entry
 */

export function initCulturalGate() {
    const gate = document.getElementById('cultural-gate');
    const cta = document.getElementById('gate-cta');

    if (!gate || !cta) return;

    // Check if user has already acknowledged in this session
    if (sessionStorage.getItem('nafasz-acknowledged')) {
        gate.hidden = true;
        document.body.classList.remove('gate-open');
        return;
    }

    // Show the gate
    document.body.classList.add('gate-open');
    gate.hidden = false;

    // Handle acknowledgement
    cta.addEventListener('click', () => {
        gate.classList.add('closing');

        // Wait for fade-out animation to complete
        gate.addEventListener('animationend', () => {
            gate.hidden = true;
            document.body.classList.remove('gate-open');
            sessionStorage.setItem('nafasz-acknowledged', 'true');
        }, { once: true });
    });
}
