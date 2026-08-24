const nodemailer = require('nodemailer');

const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';
  return Boolean(user && pass && !user.includes('your-email'));
};

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    console.log(`📧 [email skipped] To: ${to} | ${subject}`);
    return { skipped: true };
  }

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"ShopEase" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
};

const orderConfirmationEmail = (order, user) => {
  const items = (order.orderItems || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  return {
    to: user.email,
    subject: `ShopEase order confirmed — ${order.orderNumber}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;">
        <h2 style="color:#2563eb;">Thanks for your order, ${user.name}!</h2>
        <p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f3f4f6;text-align:left;">
              <th style="padding:8px;">Item</th>
              <th style="padding:8px;">Qty</th>
              <th style="padding:8px;">Total</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
        <p><strong>Total:</strong> $${Number(order.totalPrice).toFixed(2)}</p>
        <p>We'll email you again when it ships.</p>
        <p style="color:#6b7280;font-size:12px;">ShopEase · Happy shopping</p>
      </div>
    `,
  };
};

const passwordResetEmail = (user, resetUrl) => ({
  to: user.email,
  subject: 'Reset your ShopEase password',
  html: `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2>Password reset requested</h2>
      <p>Hi ${user.name}, click the button below to reset your password. This link expires in 15 minutes.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Reset password</a></p>
      <p style="color:#6b7280;font-size:12px;">If you didn't request this, you can ignore this email.</p>
    </div>
  `,
});

const orderStatusEmail = (order, user, status) => ({
  to: user.email,
  subject: `Your ShopEase order ${order.orderNumber} is ${status}`,
  html: `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2>Order update</h2>
      <p>Hi ${user.name}, your order <strong>${order.orderNumber}</strong> is now <strong>${status}</strong>.</p>
      ${order.trackingNumber ? `<p>Tracking number: <strong>${order.trackingNumber}</strong></p>` : ''}
    </div>
  `,
});

module.exports = {
  sendEmail,
  isEmailConfigured,
  orderConfirmationEmail,
  passwordResetEmail,
  orderStatusEmail,
};
