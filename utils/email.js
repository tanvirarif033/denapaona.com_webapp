// server/utils/email.js
import dotenv from "dotenv";
dotenv.config(); // <<< IMPORTANT: load .env before reading process.env

import nodemailer from "nodemailer";

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- OPTION A: explicit host/port (recommended) ---------- */
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com"; // fallback so we never hit localhost
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = SMTP_PORT === 465; // 465 = true, 587 = false (STARTTLS)
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_USER || !SMTP_PASS) {
  console.error("SMTP_USER/SMTP_PASS missing. Check your .env");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  // Optional hardening (sometimes helps behind strict proxies)
  tls: { rejectUnauthorized: false },
});

/* ---------- OPTION B: Gmail service shortcut (use this instead of A if you prefer)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
------------------------------------------------------------------ */

transporter.verify().then(
  () => console.log(`SMTP: ready (host=${SMTP_HOST}, port=${SMTP_PORT}, secure=${SMTP_SECURE})`),
  (err) => console.error("SMTP verify error:", err?.message || err)
);

export async function sendOrderConfirmation({
  to,
  name,
  orderId,
  items = [],
  total = 0,
  placedAt = new Date(),
}) {
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    throw new Error("Invalid recipient");
  }

  const fromName = process.env.SMTP_FROM_NAME || "denapaona.com";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const currency = (n) => Number(n || 0).toFixed(2);

  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(it.name || "Product")}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #eee">$${currency(it.price)}</td>
      </tr>`
    )
    .join("");

  const subject = `Payment successful — Order #${orderId}`;
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px">
      <h2 style="margin:0 0 8px">Payment confirmed 🎉</h2>
      <p>Hi ${escapeHtml(name || "there")}, your payment was successful and your order has been placed.</p>
      <p><b>Order ID:</b> ${escapeHtml(String(orderId))}</p>
      <p><b>Placed at:</b> ${new Date(placedAt).toLocaleString()}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr>
          <th style="text-align:left;padding:8px 12px;border-bottom:1px solid #ccc">Item</th>
          <th style="text-align:right;padding:8px 12px;border-bottom:1px solid #ccc">Price</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td style="padding:12px 12px;text-align:right"><b>Total</b></td>
          <td style="padding:12px 12px;text-align:right"><b>$${currency(total)}</b></td>
        </tr></tfoot>
      </table>
      <p style="opacity:.8">— ${escapeHtml(fromName)}</p>
    </div>`;

  const text =
    `Payment confirmed\n` +
    `Order #${orderId}\n` +
    `Total: $${currency(total)}\n` +
    `Placed at: ${new Date(placedAt).toLocaleString()}\n` +
    items.map((i) => `- ${i.name}: $${currency(i.price)}`).join("\n");

  await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });
}
