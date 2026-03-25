/**
 * Nafasz Global — Form / Funnel Module
 * Native form with optional Tally/Typeform embed
 */

export function initForm() {
    const form = document.getElementById('funnel-form');
    const successEl = document.getElementById('funnel-success');
    const modal = document.getElementById('success-modal');
    const okBtn = document.getElementById('modal-ok-btn');
    const closeBtn = document.getElementById('modal-close-btn');
    const modalBackdrop = document.getElementById('modal-backdrop');

    // Update worker URL to point to your new Cloudflare Worker
    const WORKER_URL = 'https://nafaszglobal-form.raldiansyah339.workers.dev';

    const closeModal = () => {
        if (modal) {
            modal.classList.remove('is-open');
            setTimeout(() => {
                modal.hidden = true;
                // Optional: scroll back to top or elsewhere
            }, 400);
        }
    };

    if (okBtn) okBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Loading state
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.innerHTML = 'Submitting...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (result.success) {
                // Show success modal
                if (modal) {
                    modal.hidden = false;
                    setTimeout(() => { modal.classList.add('is-open'); }, 10);
                } else if (successEl) {
                    // Fallback to inline success if modal not found
                    form.style.display = 'none';
                    successEl.hidden = false;
                    successEl.classList.add('visible');
                    successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                form.reset();
            } else {
                throw new Error(result.error || (result.errors && result.errors.join(', ')) || 'Submission failed');
            }
        } catch (err) {
            console.error('Form submission error:', err);
            alert('Sorry, there was an error: ' + err.message);
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.innerHTML = originalBtnText;
        }
    });
}
