/**
 * POST /api/contact — Vercel serverless function for the contact form.
 *
 * Sends the enquiry by email through Resend's HTTP API (https://resend.com). No npm packages needed.
 *
 * Required environment variables (Vercel → Project → Settings → Environment Variables):
 *   RESEND_API_KEY      Resend API key. Never commit this or expose it to the browser.
 *   CONTACT_TO_EMAIL    Inbox that should receive enquiries.
 * Optional:
 *   CONTACT_FROM_EMAIL  Verified sender, e.g. "Portfolio <hello@yourdomain.com>".
 *                       Defaults to Resend's test sender, which can only deliver to your own Resend account email.
 */

const LIMITS = { name: 100, email: 200, company: 150, projectType: 100, budget: 50, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validate(input) {
  const errors = {};
  if (input.name.length < 2) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(input.email)) errors.email = "Please enter a valid email address.";
  if (!input.projectType) errors.projectType = "Please choose what you're building.";
  if (input.message.length < 20) errors.message = "Please add a few more details (at least 20 characters).";
  return errors;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid JSON" });
    }
  }

  // Honeypot: real visitors never fill this in. Pretend success so bots move on.
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const input = {};
  Object.keys(LIMITS).forEach((key) => {
    input[key] = clean(body[key], LIMITS[key]);
  });

  const errors = validate(input);
  if (Object.keys(errors).length) {
    return res.status(400).json({ ok: false, errors });
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    console.error("Contact form is not configured: set RESEND_API_KEY and CONTACT_TO_EMAIL.");
    return res.status(503).json({ ok: false, error: "Contact form is not configured" });
  }

  const text = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Company: ${input.company || "—"}`,
    `Project type: ${input.projectType}`,
    `Budget: ${input.budget || "Not specified"}`,
    "",
    input.message,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
        to: [CONTACT_TO_EMAIL],
        reply_to: input.email,
        subject: `New project enquiry: ${input.projectType} — ${input.name}`,
        text,
      }),
    });

    if (!response.ok) {
      console.error("Resend error", response.status, await response.text());
      return res.status(502).json({ ok: false, error: "Email provider error" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact form failed", err);
    return res.status(500).json({ ok: false, error: "Unexpected error" });
  }
};
