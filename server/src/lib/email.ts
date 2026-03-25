/**
 * Email notifications via nodemailer
 * Supports SMTP (works with Gmail, Zoho, any SMTP provider)
 */

import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'Srinidhi Boutique <noreply@srinidhiboutique.in>';

function createTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();
  if (!transporter) {
    return { success: false, error: 'SMTP not configured' };
  }
  try {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ── HTML Templates ─────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Srinidhi Boutique</title>
<style>
  body{margin:0;padding:0;background:#faf9f7;font-family:'Georgia',serif;color:#3a3a3a}
  .wrapper{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#B76E79,#d4a0a7);padding:32px 40px;text-align:center}
  .header h1{margin:0;color:#fff;font-size:28px;letter-spacing:2px;font-weight:400}
  .header p{margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px;letter-spacing:1px}
  .body{padding:32px 40px}
  .section{margin-bottom:24px}
  .label{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#B76E79;margin-bottom:8px}
  .order-box{background:#fdf6f7;border-left:3px solid #B76E79;border-radius:4px;padding:16px 20px}
  .item-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0e8e9;font-size:14px}
  .item-row:last-child{border-bottom:none}
  .total-row{display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:bold;color:#B76E79;border-top:2px solid #f0e8e9;margin-top:8px}
  .btn{display:inline-block;background:#B76E79;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;letter-spacing:1px;margin-top:16px}
  .footer{background:#f7f0f1;padding:20px 40px;text-align:center;font-size:12px;color:#999}
  .footer a{color:#B76E79;text-decoration:none}
</style>
</head>
<body>
<div style="padding:20px 0">
<div class="wrapper">
  <div class="header">
    <h1>Srinidhi Boutique</h1>
    <p>Premium Women's Fashion · Hyderabad</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>Srinidhi Boutique, Hyderabad, Telangana, India</p>
    <p><a href="https://srinidhiboutique.in">srinidhiboutique.in</a> &nbsp;·&nbsp; +91 98765 43210</p>
    <p style="margin-top:8px;color:#ccc">You received this email because you placed an order with us.</p>
  </div>
</div>
</div>
</body>
</html>`;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number; size?: string; color?: string; image?: string }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  address: { line1: string; line2?: string; city: string; state?: string; pincode: string; country?: string };
}

export function renderOrderConfirmationEmail(data: OrderEmailData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <div class="item-row">
      <span>${item.name}${item.size ? ` (${item.size})` : ''}${item.color ? ` · ${item.color}` : ''} × ${item.quantity}</span>
      <span>₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
    </div>`
    )
    .join('');

  const addressStr = [data.address.line1, data.address.line2, data.address.city, data.address.state, data.address.pincode]
    .filter(Boolean)
    .join(', ');

  const content = `
    <div class="section">
      <p style="font-size:18px;margin:0 0 4px">Thank you, ${data.customerName}! 🌸</p>
      <p style="color:#888;font-size:14px;margin:0">Your order has been placed successfully.</p>
    </div>
    <div class="section">
      <div class="label">Order Details</div>
      <div class="order-box">
        <p style="margin:0 0 12px;font-size:13px;color:#888">Order #${data.orderNumber}</p>
        ${itemsHtml}
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0e8e9;font-size:13px;color:#888">
          <div style="display:flex;justify-content:space-between;padding:4px 0">
            <span>Subtotal</span><span>₹${data.subtotal.toLocaleString('en-IN')}</span>
          </div>
          ${data.shipping > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>Shipping</span><span>₹${data.shipping.toLocaleString('en-IN')}</span></div>` : ''}
          ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;color:#4caf50"><span>Discount</span><span>-₹${data.discount.toLocaleString('en-IN')}</span></div>` : ''}
        </div>
        <div class="total-row">
          <span>Total</span><span>₹${data.total.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="label">Delivery Address</div>
      <p style="margin:0;font-size:14px;line-height:1.6">${addressStr}</p>
    </div>
    <div class="section">
      <div class="label">Payment</div>
      <p style="margin:0;font-size:14px">${data.paymentMethod.toUpperCase()}</p>
    </div>
    <a href="https://srinidhiboutique.in/orders" class="btn">Track Your Order</a>`;

  return baseTemplate(content);
}

export function renderShippingEmail(data: { customerName: string; orderNumber: string; trackingId?: string }): string {
  const content = `
    <div class="section">
      <p style="font-size:18px;margin:0 0 4px">Your order is on its way! 📦</p>
      <p style="color:#888;font-size:14px;margin:0">We're excited to get your items to you.</p>
    </div>
    <div class="section">
      <div class="order-box">
        <p style="margin:0;font-size:14px"><strong>Order:</strong> #${data.orderNumber}</p>
        ${data.trackingId ? `<p style="margin:8px 0 0;font-size:14px"><strong>Tracking ID:</strong> ${data.trackingId}</p>` : ''}
        <p style="margin:8px 0 0;font-size:13px;color:#888">Estimated delivery: 3–5 business days</p>
      </div>
    </div>
    <p style="font-size:14px;color:#666">Questions about your order? Reply to this email and we'll help you out.</p>
    <a href="https://srinidhiboutique.in/track-order" class="btn">Track Order</a>`;

  return baseTemplate(content);
}

export function renderWelcomeEmail(data: { name: string }): string {
  const content = `
    <div class="section">
      <p style="font-size:18px;margin:0 0 4px">Welcome to Srinidhi Boutique, ${data.name}! 🌸</p>
      <p style="color:#888;font-size:14px;margin:0">We're so glad you're here.</p>
    </div>
    <div class="section">
      <p style="font-size:14px;line-height:1.7;color:#555">
        Discover our latest collections — from elegant sarees to festive lehengas,
        we bring you premium women's fashion crafted with love.
      </p>
    </div>
    <div class="section">
      <div class="order-box">
        <p style="margin:0;font-size:14px;font-weight:bold;color:#B76E79">Use code <span style="letter-spacing:2px">SRINIDHI20</span> for 20% off your first order!</p>
      </div>
    </div>
    <a href="https://srinidhiboutique.in/shop" class="btn">Shop Now</a>`;

  return baseTemplate(content);
}

// ── Send helpers ───────────────────────────────────────────────────────────────

export async function sendOrderConfirmationEmail(to: string, data: OrderEmailData) {
  return sendEmail(to, `Order Confirmed — #${data.orderNumber} | Srinidhi Boutique`, renderOrderConfirmationEmail(data));
}

export async function sendShippingEmail(to: string, data: { customerName: string; orderNumber: string; trackingId?: string }) {
  return sendEmail(to, `Your order #${data.orderNumber} is on its way! | Srinidhi Boutique`, renderShippingEmail(data));
}

export async function sendWelcomeEmail(to: string, data: { name: string }) {
  return sendEmail(to, 'Welcome to Srinidhi Boutique! 🌸', renderWelcomeEmail(data));
}
