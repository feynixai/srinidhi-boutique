/**
 * WhatsApp Cloud API integration
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Falls back to click-to-chat links when API credentials are missing.
 */

const WA_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_API_URL = 'https://graph.facebook.com/v18.0';

export interface WhatsAppMessage {
  to: string; // E.164 format, e.g. +919876543210
  templateName?: string;
  components?: object[];
  text?: string;
}

export interface OrderDetails {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
  status?: string;
  trackingId?: string;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function buildClickToChatLink(phone: string, message: string): string {
  const normalized = normalizePhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

async function sendWhatsAppMessage(payload: object): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!WA_API_TOKEN || !WA_PHONE_NUMBER_ID) {
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  try {
    const response = await fetch(
      `${WA_API_URL}/${WA_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json() as { messages?: Array<{ id: string }>; error?: { message: string } };

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'WhatsApp API error' };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function sendOrderConfirmationWhatsApp(order: OrderDetails): Promise<{ success: boolean; fallbackLink?: string; messageId?: string }> {
  const itemsText = order.items
    .map((i) => `• ${i.name} x${i.quantity} — ₹${i.price}`)
    .join('\n');

  const message = `Hi ${order.customerName}! 🎉\n\nYour order *#${order.orderNumber}* has been placed successfully.\n\n${itemsText}\n\n*Total: ₹${order.total}*\nPayment: ${order.paymentMethod.toUpperCase()}\n\nWe'll notify you once it ships. Thank you for shopping at *Srinidhi Boutique*! 🛍️`;

  const normalized = normalizePhone(order.customerPhone);

  const payload = {
    messaging_product: 'whatsapp',
    to: normalized,
    type: 'text',
    text: { body: message },
  };

  const result = await sendWhatsAppMessage(payload);
  if (!result.success) {
    return { success: false, fallbackLink: buildClickToChatLink(order.customerPhone, message) };
  }
  return { success: true, messageId: result.messageId };
}

export async function sendShippingUpdateWhatsApp(order: OrderDetails): Promise<{ success: boolean; fallbackLink?: string; messageId?: string }> {
  const trackingInfo = order.trackingId
    ? `\nTracking ID: *${order.trackingId}*`
    : '';

  const message = `Hi ${order.customerName}! 📦\n\nGreat news! Your order *#${order.orderNumber}* has been shipped.${trackingInfo}\n\nExpected delivery in 3-5 business days.\n\nQuestions? Reply to this message. 😊\n— *Srinidhi Boutique*`;

  const normalized = normalizePhone(order.customerPhone);

  const payload = {
    messaging_product: 'whatsapp',
    to: normalized,
    type: 'text',
    text: { body: message },
  };

  const result = await sendWhatsAppMessage(payload);
  if (!result.success) {
    return { success: false, fallbackLink: buildClickToChatLink(order.customerPhone, message) };
  }
  return { success: true, messageId: result.messageId };
}

export async function sendDeliveryWhatsApp(order: OrderDetails): Promise<{ success: boolean; fallbackLink?: string; messageId?: string }> {
  const message = `Hi ${order.customerName}! 🌸\n\nYour order *#${order.orderNumber}* has been delivered!\n\nWe hope you love it. Please take a moment to share your experience:\n⭐ Rate your order at: https://srinidhiboutique.in/review/${order.orderNumber}\n\nThank you for shopping with *Srinidhi Boutique*! 💖`;

  const normalized = normalizePhone(order.customerPhone);

  const payload = {
    messaging_product: 'whatsapp',
    to: normalized,
    type: 'text',
    text: { body: message },
  };

  const result = await sendWhatsAppMessage(payload);
  if (!result.success) {
    return { success: false, fallbackLink: buildClickToChatLink(order.customerPhone, message) };
  }
  return { success: true, messageId: result.messageId };
}

export async function sendAdminOrderNotification(order: OrderDetails): Promise<{ success: boolean; fallbackLink?: string }> {
  const adminPhone = process.env.ADMIN_WHATSAPP_PHONE;
  if (!adminPhone) return { success: false };

  const itemsText = order.items
    .map((i) => `• ${i.name} x${i.quantity}`)
    .join('\n');

  const message = `🛍️ *New Order Alert!*\n\nOrder: *#${order.orderNumber}*\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\n\n${itemsText}\n\n*Total: ₹${order.total}*\nPayment: ${order.paymentMethod.toUpperCase()}\n\nLog in to admin dashboard to process.`;

  const payload = {
    messaging_product: 'whatsapp',
    to: normalizePhone(adminPhone),
    type: 'text',
    text: { body: message },
  };

  const result = await sendWhatsAppMessage(payload);
  return { success: result.success };
}
