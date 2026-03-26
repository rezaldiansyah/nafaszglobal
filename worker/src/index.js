/**
 * Nafasz Global — Form Submission Worker
 * Cloudflare Worker that handles contact form submissions
 * and sends emails via Resend API.
 *
 * Sends 2 emails per submission:
 *   1. Notification to admin (it.nafaszglobal@gmail.com)
 *   2. Auto-reply to the person who submitted the form
 */

const RESEND_API = 'https://api.resend.com/emails';

/**
 * Build CORS headers — allow requests from the live site
 */
function corsHeaders(origin, allowedOrigin) {
    // Allow both www and non-www, plus localhost for dev
    const allowed = [
        allowedOrigin,
        allowedOrigin.replace('https://', 'https://www.'),
        'http://localhost:3000',
        'http://localhost:4173',
        'http://localhost:5173',
    ];

    const isAllowed = allowed.includes(origin);

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

/**
 * Build the admin notification email HTML
 */
function buildNotificationEmail({ name, email, organisation, vision }) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#111; font-family:'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a; border-radius:12px; overflow:hidden; border:1px solid #2a2a2a;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a); padding:32px 40px; border-bottom:2px solid #B35900;">
                            <h1 style="margin:0; color:#E8A050; font-size:20px; font-weight:600; letter-spacing:2px;">
                                NAFASZ GLOBAL
                            </h1>
                            <p style="margin:4px 0 0; color:#888; font-size:12px; letter-spacing:1px;">
                                NEW FORM SUBMISSION
                            </p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px 40px;">
                            <p style="color:#ccc; font-size:14px; margin:0 0 24px; line-height:1.6;">
                                A new enquiry has been received through the Sovereign Trust Portal.
                            </p>

                            <!-- Name -->
                            <table width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td style="color:#888; font-size:11px; letter-spacing:1px; text-transform:uppercase; padding-bottom:4px;">
                                        Name
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color:#f5f5f5; font-size:16px; padding:12px 16px; background:#222; border-radius:8px; border-left:3px solid #B35900;">
                                        ${escapeHtml(name)}
                                    </td>
                                </tr>
                            </table>

                            <!-- Email -->
                            <table width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td style="color:#888; font-size:11px; letter-spacing:1px; text-transform:uppercase; padding-bottom:4px;">
                                        Email
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color:#E8A050; font-size:16px; padding:12px 16px; background:#222; border-radius:8px; border-left:3px solid #B35900;">
                                        <a href="mailto:${escapeHtml(email)}" style="color:#E8A050; text-decoration:none;">
                                            ${escapeHtml(email)}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Organisation -->
                            <table width="100%" style="margin-bottom:16px;">
                                <tr>
                                    <td style="color:#888; font-size:11px; letter-spacing:1px; text-transform:uppercase; padding-bottom:4px;">
                                        Organisation
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color:#f5f5f5; font-size:16px; padding:12px 16px; background:#222; border-radius:8px; border-left:3px solid #B35900;">
                                        ${escapeHtml(organisation || '—')}
                                    </td>
                                </tr>
                            </table>

                            <!-- Vision -->
                            <table width="100%" style="margin-bottom:8px;">
                                <tr>
                                    <td style="color:#888; font-size:11px; letter-spacing:1px; text-transform:uppercase; padding-bottom:4px;">
                                        Their Vision for 300 Years of Exchange
                                    </td>
                                </tr>
                                <tr>
                                    <td style="color:#f5f5f5; font-size:15px; padding:16px; background:#222; border-radius:8px; border-left:3px solid #B35900; line-height:1.7; white-space:pre-wrap;">
${escapeHtml(vision)}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px; border-top:1px solid #2a2a2a;">
                            <p style="color:#555; font-size:11px; margin:0; text-align:center;">
                                Received via nafaszglobal.com — Sovereign Trust Portal
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Build the auto-reply email HTML sent to the person who filled the form
 */
function buildAutoReplyEmail({ name }) {
    const firstName = name.split(' ')[0];
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#111; font-family:'Helvetica Neue',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111; padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a; border-radius:12px; overflow:hidden; border:1px solid #2a2a2a;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#1a1a1a,#2a2a2a); padding:40px; border-bottom:2px solid #B35900; text-align:center;">
                            <h1 style="margin:0; color:#E8A050; font-size:22px; font-weight:600; letter-spacing:3px;">
                                NAFASZ GLOBAL
                            </h1>
                            <p style="margin:8px 0 0; color:#999; font-size:12px; letter-spacing:2px;">
                                SOVEREIGN TRUST PORTAL
                            </p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <p style="color:#f5f5f5; font-size:18px; margin:0 0 8px; font-weight:500;">
                                Dear ${escapeHtml(firstName)},
                            </p>
                            <p style="color:#ccc; font-size:15px; margin:0 0 20px; line-height:1.8;">
                                Thank you for connecting with Nafasz Global.
                            </p>
                            <p style="color:#bbb; font-size:14px; margin:0 0 20px; line-height:1.8;">
                                At Nafasz Global, we begin each engagement with a focused initial Zoom conversation to understand your objectives and assess alignment.
                            </p>
                            <p style="color:#bbb; font-size:14px; margin:0 0 20px; line-height:1.8;">
                                Our team will reach out shortly to coordinate a suitable time for this discussion. If you have a preferred time, please feel free to let us know.<br><br>
                                Alternatively, you may select a time here if convenient: <a href="https://calendly.com/it-nafaszglobal/30min" style="color:#E8A050; text-decoration:none;">https://calendly.com/it-nafaszglobal/30min</a>
                            </p>
                            <p style="color:#bbb; font-size:14px; margin:0 0 20px; line-height:1.8;">
                                Following this conversation, we will outline appropriate next steps based on your priorities and nature of the opportunity.
                            </p>
                            <p style="color:#bbb; font-size:14px; margin:0 0 20px; line-height:1.8;">
                                We look forward to speaking with you.
                            </p>

                            <!-- Divider -->
                            <table width="100%" style="margin:28px 0;">
                                <tr>
                                    <td style="border-bottom:1px solid #333;">&nbsp;</td>
                                    <td style="padding:0 16px; color:#B35900; font-size:18px; white-space:nowrap;">◆</td>
                                    <td style="border-bottom:1px solid #333;">&nbsp;</td>
                                </tr>
                            </table>

                            <p style="color:#666; font-size:13px; margin:16px 0 0; line-height:1.6;">
                                Kind regards,<br><br>
                                <strong style="color:#ccc;">Nafasz Global team</strong>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 40px; border-top:1px solid #2a2a2a; text-align:center;">
                            <p style="color:#555; font-size:11px; margin:0; line-height:1.6;">
                                Nafasz Global Pty Ltd · Level 15, 28 Freshwater Place, Southbank<br>
                                Strategic & Cultural Consultancy only. No financial product advice provided.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Send an email via Resend API
 */
async function sendEmail(apiKey, { from, to, subject, html, replyTo }) {
    const toArray = Array.isArray(to) ? to : to.split(',').map(e => e.trim()).filter(Boolean);

    const res = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: toArray, subject, html, reply_to: replyTo }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend API error (${res.status}): ${err}`);
    }

    return res.json();
}

/**
 * Validate form data
 */
function validateFormData({ name, email, vision }) {
    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Name is required (min 2 characters)');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
    if (!vision || vision.trim().length < 10) errors.push('Vision is required (min 10 characters)');
    return errors;
}

/**
 * Main request handler
 */
export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const headers = corsHeaders(origin, env.ALLOWED_ORIGIN);

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers });
        }

        const url = new URL(request.url);

        // --- GITHUB OAUTH ROUTES FOR DECAP CMS ---
        if (request.method === 'GET' && url.pathname === '/auth') {
            const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&scope=repo`;
            return Response.redirect(githubAuthUrl, 302);
        }

        if (request.method === 'GET' && url.pathname === '/callback') {
            const code = url.searchParams.get('code');
            if (!code) return new Response("Error: No code provided", { status: 400 });

            try {
                // Exchange code for token
                const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        client_id: env.GITHUB_CLIENT_ID,
                        client_secret: env.GITHUB_CLIENT_SECRET,
                        code: code
                    })
                });
                const tokenData = await tokenResponse.json();
                const token = tokenData.access_token;
                if (!token) throw new Error("No token returned by GitHub");

                // Post message back to Decap CMS popup
                const htmlResponse = `
                    <!DOCTYPE html><html><head><title>Success</title></head><body>
                    <p>Authentication successful! You can close this window if it doesn't close automatically.</p>
                    <script>
                        const receiveMessage = (message) => {
                            window.opener.postMessage(
                                'authorization:github:success:{"token":"' + "${token}" + '","provider":"github"}',
                                message.origin
                            );
                            window.removeEventListener("message", receiveMessage, false);
                        };
                        window.addEventListener("message", receiveMessage, false);
                        window.opener.postMessage("authorizing:github", "*");
                    </script></body></html>
                `;
                return new Response(htmlResponse, { headers: { "Content-Type": "text/html" } });
            } catch (err) {
                return new Response("OAuth Error: " + err.message, { status: 500 });
            }
        }

        // --- CONTACT FORM ROUTE ---
        // Only allow POST for the contact form
        if (request.method !== 'POST') {
            return Response.json(
                { success: false, error: 'Method not allowed' },
                { status: 405, headers }
            );
        }

        try {
            const data = await request.json();
            const { name, email, organisation, vision } = data;

            // Validate
            const errors = validateFormData({ name, email, vision });
            if (errors.length > 0) {
                return Response.json(
                    { success: false, errors },
                    { status: 400, headers }
                );
            }

            const senderFrom = `${env.SENDER_NAME} <${env.SENDER_EMAIL}>`;

            // Send both emails concurrently
            const [notifResult, replyResult] = await Promise.allSettled([
                // 1. Admin notification
                sendEmail(env.RESEND_API_KEY, {
                    from: senderFrom,
                    to: env.NOTIFY_EMAIL,
                    subject: `New Enquiry: ${name} — ${organisation || 'Individual'}`,
                    html: buildNotificationEmail({ name, email, organisation, vision }),
                    replyTo: email,
                }),
                // 2. Auto-reply to submitter
                sendEmail(env.RESEND_API_KEY, {
                    from: senderFrom,
                    to: email,
                    subject: 'Initial Discussion - Nafasz Global',
                    html: buildAutoReplyEmail({ name }),
                }),
            ]);

            // Check results
            const notifOk = notifResult.status === 'fulfilled';
            const replyOk = replyResult.status === 'fulfilled';

            if (!notifOk) {
                console.error('Notification email failed:', notifResult.reason);
            }
            if (!replyOk) {
                console.error('Auto-reply email failed:', replyResult.reason);
            }

            // As long as at least the notification was sent, consider it a success
            if (notifOk) {
                return Response.json(
                    {
                        success: true,
                        message: 'Form submitted successfully',
                        notification: 'sent',
                        autoReply: replyOk ? 'sent' : 'failed',
                    },
                    { status: 200, headers }
                );
            }

            // Both failed
            return Response.json(
                { success: false, error: 'Failed to send emails. Please try again.' },
                { status: 500, headers }
            );

        } catch (err) {
            console.error('Worker error:', err);
            return Response.json(
                { success: false, error: 'An unexpected error occurred.' },
                { status: 500, headers }
            );
        }
    },
};
