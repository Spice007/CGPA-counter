const nodemailer = require('nodemailer');

const hasSmtpConfig = () => {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
};

const hasEmailService = () => {
    return Boolean(process.env.RESEND_API_KEY || hasSmtpConfig());
};

// Resend HTTPS API dispatcher (bypasses Render port 465/587 firewall blocks)
const sendViaResend = async ({ to, subject, html, bcc }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;

    const from = process.env.RESEND_FROM || 'Spice CGPA Pro <onboarding@resend.dev>';
    const payload = {
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
    };

    if (bcc) {
        payload.bcc = Array.isArray(bcc) ? bcc : [bcc];
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || (typeof data === 'object' ? JSON.stringify(data) : 'Resend API error'));
    }
    return data;
};

const getTransporter = () => {
    const user = (process.env.SMTP_USER || '').trim();
    const rawPass = process.env.SMTP_PASS || '';
    const pass = rawPass.replace(/\s+/g, '');

    // If a custom SMTP host other than Gmail is specified
    if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.gmail.com') {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });
    }

    // Default to Gmail service (or when SMTP_HOST is smtp.gmail.com)
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
    });
};

const getFromEmail = () => {
    const from = process.env.FROM_EMAIL;
    if (from && !from.includes('your-gmail-address@gmail.com') && !from.includes('Naija CGPA Pro')) {
        return from;
    }
    if (process.env.SMTP_USER) {
        return `"Spice CGPA Pro" <${process.env.SMTP_USER}>`;
    }
    return '"Spice CGPA Pro" <noreply@cgpa-counter.com>';
};

const sendResetEmail = async (email, resetUrl) => {
    if (!hasEmailService()) {
        console.log('\n==================================================');
        console.log(`🔑 PASSWORD RESET REQUEST (SIMULATED)`);
        console.log(`To: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('==================================================\n');
        return {
            success: true,
            simulated: true,
            url: resetUrl
        };
    }

    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 2rem;">🎓</div>
                <h2 style="color: #059669; margin: 6px 0 0; font-weight: 800;">Spice CGPA Pro</h2>
            </div>
            <h3 style="color: #1e293b; margin-top: 0;">Password Reset Request</h3>
            <p style="color: #475569; line-height: 1.6;">Hello,</p>
            <p style="color: #475569; line-height: 1.6;">You are receiving this email because a password reset was requested for your Spice CGPA Pro account.</p>
            <p style="color: #475569; line-height: 1.6;">Please click the button below to reset your password. This link is valid for 1 hour:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="word-break: break-all; color: #64748b; font-size: 0.85rem; line-height: 1.5;">
                If the button does not work, copy and paste this link: <br>
                <a href="${resetUrl}" style="color: #059669;">${resetUrl}</a>
            </p>
            <p style="color: #94a3b8; font-size: 0.85rem;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">Spice CGPA Pro — Your Premium Academic Companion</p>
        </div>
    `;

    // 1. Try Resend HTTPS API first
    if (process.env.RESEND_API_KEY) {
        try {
            const resendResult = await sendViaResend({
                to: email,
                subject: 'Spice CGPA Pro - Password Reset Request',
                html: htmlContent
            });
            console.log(`🔑 Reset email sent via Resend HTTPS to ${email} (ID: ${resendResult.id})`);
            return { success: true, simulated: false, provider: 'resend', messageId: resendResult.id };
        } catch (resendErr) {
            console.warn(`⚠️ Resend HTTPS reset error: ${resendErr.message}. Attempting SMTP fallback...`);
        }
    }

    // 2. SMTP fallback
    if (hasSmtpConfig()) {
        const transporter = getTransporter();
        const mailOptions = {
            from: getFromEmail(),
            to: email,
            subject: 'Spice CGPA Pro - Password Reset Request',
            html: htmlContent
        };
        await transporter.sendMail(mailOptions);
        return { success: true, simulated: false, provider: 'smtp' };
    }

    return { success: true, simulated: true, url: resetUrl };
};

const sendWelcomeEmail = async (email, userName, options = {}) => {
    const cleanName = (userName || 'Scholar').trim();
    const usernameHandle = options.username ? options.username.trim() : '';
    const frontendUrl = options.frontendUrl || process.env.FRONTEND_URL || 'https://cgpa-counter.vercel.app';
    const dashboardUrl = `${frontendUrl.replace(/\/$/, '')}/index.html`;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (!hasEmailService()) {
        console.log('\n==================================================');
        console.log(`🎉 WELCOME EMAIL (SIMULATED)`);
        console.log(`To: ${email}`);
        console.log(`User: ${cleanName}`);
        console.log(`Handle: ${usernameHandle || 'None yet'}`);
        console.log('==================================================\n');
        return { success: true, simulated: true };
    }

    const usernameHtml = usernameHandle ? `
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
            <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #15803d; font-weight: 700;">Your Official Student Handle</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #166534; font-family: monospace; margin-top: 4px;">${usernameHandle}</div>
        </div>
    ` : '';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Spice CGPA Pro</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
                            <!-- Header Banner -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center;">
                                    <div style="font-size: 2.2rem; margin-bottom: 6px;">🎓</div>
                                    <h1 style="color: #ffffff; margin: 0; font-size: 1.65rem; font-weight: 800; letter-spacing: -0.025em;">Spice CGPA Pro</h1>
                                    <p style="color: #d1fae5; margin: 6px 0 0; font-size: 0.95rem; font-weight: 500;">Your Ultimate Academic Companion</p>
                                </td>
                            </tr>
                            
                            <!-- Body Content -->
                            <tr>
                                <td style="padding: 32px 28px;">
                                    <h2 style="color: #0f172a; margin-top: 0; font-size: 1.35rem; font-weight: 700;">Welcome aboard, ${cleanName}! 👋</h2>
                                    <p style="line-height: 1.65; color: #475569; font-size: 1rem; margin-bottom: 20px;">
                                        We are delighted to welcome you to <strong>Spice CGPA Pro</strong>. Whether you are aiming for a First Class, tracking your semester goals, or planning ahead for graduation, we've built the most precise tools to help you succeed.
                                    </p>

                                    ${usernameHtml}

                                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
                                        <div style="font-size: 0.85rem; font-weight: 700; color: #0f172a; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.04em;">What you can do right now:</div>
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 0.95rem; color: #334155; line-height: 1.5;">
                                                    <span style="color: #10b981; font-weight: bold; margin-right: 8px;">📊</span>
                                                    <strong>Instant CGPA Tracking</strong> — Add your courses and calculate your real-time cumulative grade point average instantly.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 0.95rem; color: #334155; line-height: 1.5;">
                                                    <span style="color: #10b981; font-weight: bold; margin-right: 8px;">📈</span>
                                                    <strong>Performance Analytics</strong> — Visualize your progress across levels, semesters, and sessions with intuitive charts.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 0.95rem; color: #334155; line-height: 1.5;">
                                                    <span style="color: #10b981; font-weight: bold; margin-right: 8px;">🎯</span>
                                                    <strong>Target CGPA Forecaster</strong> — Calculate the exact grades you need in upcoming semesters to hit your target degree classification.
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 0.95rem; color: #334155; line-height: 1.5;">
                                                    <span style="color: #10b981; font-weight: bold; margin-right: 8px;">📄</span>
                                                    <strong>PDF Result Slips</strong> — Export beautifully styled academic slips and transcripts ready for print or sharing.
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 32px 0 24px;">
                                        <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1rem; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
                                            Open Your Dashboard 🚀
                                        </a>
                                    </div>

                                    <p style="font-size: 0.85rem; color: #64748b; text-align: center; margin-top: 10px;">
                                        Or copy this link to your browser: <br>
                                        <a href="${dashboardUrl}" style="color: #059669; word-break: break-all;">${dashboardUrl}</a>
                                    </p>

                                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0;">

                                    <p style="color: #475569; font-size: 0.95rem; margin-bottom: 4px;">Wishing you academic brilliance and top grades,</p>
                                    <p style="color: #0f172a; font-weight: 700; margin: 0; font-size: 0.95rem;">The Spice CGPA Pro Team</p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                                    <p style="margin: 0; color: #94a3b8; font-size: 0.78rem;">
                                        &copy; ${new Date().getFullYear()} Spice CGPA Pro. All rights reserved.
                                    </p>
                                    <p style="margin: 6px 0 0; color: #94a3b8; font-size: 0.75rem;">
                                        You are receiving this email because an account was registered with this address.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    // 1. Try Resend HTTPS API first
    if (process.env.RESEND_API_KEY) {
        try {
            const resendResult = await sendViaResend({
                to: email,
                subject: 'Welcome to Spice CGPA Pro! 🎓 Track, Analyze & Excel',
                html: htmlContent,
                bcc: (adminEmail && adminEmail.toLowerCase() !== email.toLowerCase()) ? adminEmail : undefined
            });
            console.log(`📨 Welcome email sent via Resend HTTPS to ${email} (ID: ${resendResult.id})`);
            return { success: true, simulated: false, provider: 'resend', messageId: resendResult.id };
        } catch (resendErr) {
            console.warn(`⚠️ Resend HTTPS delivery error: ${resendErr.message}. Attempting SMTP fallback...`);
        }
    }

    // 2. SMTP fallback
    if (hasSmtpConfig()) {
        const transporter = getTransporter();
        const mailOptions = {
            from: getFromEmail(),
            to: email,
            subject: 'Welcome to Spice CGPA Pro! 🎓 Track, Analyze & Excel',
            html: htmlContent
        };

        if (adminEmail && adminEmail.toLowerCase() !== email.toLowerCase()) {
            mailOptions.bcc = adminEmail;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`📨 Welcome email sent via SMTP to ${email} (MessageID: ${info.messageId})`);
        return { success: true, simulated: false, provider: 'smtp', messageId: info.messageId };
    }

    return { success: true, simulated: true };
};

const sendLoginNotification = async (email, userName, ipAddress = 'Unknown IP', userAgent = 'Unknown Device') => {
    const timeString = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (!hasEmailService()) {
        console.log('\n==================================================');
        console.log(`🔔 LOGIN NOTIFICATION (SIMULATED)`);
        console.log(`To (User): ${email}`);
        console.log(`Bcc (Admin): ${adminEmail || 'None'}`);
        console.log(`User: ${userName}`);
        console.log(`Time: ${timeString}`);
        console.log(`IP: ${ipAddress}`);
        console.log(`Device: ${userAgent}`);
        console.log('==================================================\n');
        return {
            success: true,
            simulated: true
        };
    }

    const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 2rem;">🛡️</div>
                <h2 style="color: #059669; margin: 6px 0 0; font-weight: 800;">Spice CGPA Pro</h2>
                <h3 style="color: #1e293b; margin-top: 6px;">New Login Alert</h3>
            </div>
            <p style="color: #475569; line-height: 1.6;">Hello ${userName},</p>
            <p style="color: #475569; line-height: 1.6;">We detected a new sign-in to your Spice CGPA Pro account.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 110px;">Date/Time:</td>
                        <td style="padding: 6px 0; color: #1e293b;">${timeString}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: bold;">IP Address:</td>
                        <td style="padding: 6px 0; color: #1e293b;">${ipAddress}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Device:</td>
                        <td style="padding: 6px 0; color: #1e293b;">${userAgent}</td>
                    </tr>
                </table>
            </div>
            <p style="color: #64748b; font-size: 0.9rem;">If this was you, you can safely ignore this email.</p>
            <p style="color: #ef4444; font-weight: bold; font-size: 0.9rem;">If you did not log in, please reset your password immediately to secure your account.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">Spice CGPA Pro — Your Premium Academic Companion</p>
        </div>
    `;

    // 1. Try Resend HTTPS API first
    if (process.env.RESEND_API_KEY) {
        try {
            const resendResult = await sendViaResend({
                to: email,
                subject: 'Spice CGPA Pro - New Login Detected',
                html: htmlContent,
                bcc: (adminEmail && adminEmail.toLowerCase() !== email.toLowerCase()) ? adminEmail : undefined
            });
            console.log(`🔔 Login notification sent via Resend HTTPS to ${email} (ID: ${resendResult.id})`);
            return { success: true, simulated: false, provider: 'resend', messageId: resendResult.id };
        } catch (resendErr) {
            console.warn(`⚠️ Resend HTTPS login alert error: ${resendErr.message}. Attempting SMTP fallback...`);
        }
    }

    // 2. SMTP fallback
    if (hasSmtpConfig()) {
        const transporter = getTransporter();
        const mailOptions = {
            from: getFromEmail(),
            to: email,
            subject: 'Spice CGPA Pro - New Login Detected',
            html: htmlContent
        };

        if (adminEmail && adminEmail.toLowerCase() !== email.toLowerCase()) {
            mailOptions.bcc = adminEmail;
        }

        await transporter.sendMail(mailOptions);
        return { success: true, simulated: false, provider: 'smtp' };
    }

    return { success: true, simulated: true };
};

module.exports = {
    sendResetEmail,
    sendLoginNotification,
    sendWelcomeEmail
};
