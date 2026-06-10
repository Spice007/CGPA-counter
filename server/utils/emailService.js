const nodemailer = require('nodemailer');

const sendResetEmail = async (email, resetUrl) => {
    const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!hasSmtp) {
        console.log('\n==================================================');
        console.log(`🔑 PASSWORD RESET REQUEST`);
        console.log(`To: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('==================================================\n');
        return {
            success: true,
            simulated: true,
            url: resetUrl
        };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.FROM_EMAIL || '"Naija CGPA Pro" <noreply@cgpa-counter.com>',
        to: email,
        subject: 'Naija CGPA Pro - Password Reset Request',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #10b981; text-align: center;">Naija CGPA Pro</h2>
                <h3 style="color: #1e293b;">Password Reset Request</h3>
                <p>Hello,</p>
                <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
                <p>Please click the button below or copy and paste the URL into your browser to reset your password. This link is valid for 1 hour:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="word-break: break-all; color: #64748b; font-size: 0.875rem;">
                    If the button does not work, copy and paste this link: <br>
                    <a href="${resetUrl}">${resetUrl}</a>
                </p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #94a3b8; font-size: 0.75rem; text-align: center;">Naija CGPA Pro — Your Premium Academic Companion</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, simulated: false };
};

module.exports = { sendResetEmail };
