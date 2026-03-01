/**
 * Nafasz Global — Form / Funnel Module
 * Native form with optional Tally/Typeform embed
 */

export function initForm() {
    const form = document.getElementById('funnel-form');
    const successEl = document.getElementById('funnel-success');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Log form data (in production, this would send to backend/Tally)
        console.log('Form submitted:', data);

        // Show success state
        form.style.display = 'none';
        if (successEl) {
            successEl.hidden = false;
            successEl.classList.add('visible');
        }

        // Optional: redirect to Calendly after delay
        // setTimeout(() => {
        //   window.open('https://calendly.com/nafaszglobal/discovery', '_blank');
        // }, 2000);
    });
}
