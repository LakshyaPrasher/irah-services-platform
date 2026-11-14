/**
 * Cloudflare Pages Function: /api/enquire
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function oneLine(str, maxLen = 120) {
  return String(str ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
}

function safeReplyTo(email) {
  const s = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : 'harikant.irah@gmail.com';
}

function parseDestinations(raw) {
  if (!raw) return ['harikant.irah@gmail.com'];
  const list = String(raw).split(',').map((s) => s.trim()).filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return list.length ? list : ['harikant.irah@gmail.com'];
}

async function sendResendMail(apiKey, { subject, html, replyTo, attachments, fromEmail, destinations }) {
  if (!apiKey || !String(apiKey).trim()) {
    return { status: 'not_configured', detail: 'missing_api_key' };
  }
  const key = String(apiKey).trim();
  const toList = Array.isArray(destinations) && destinations.length ? destinations : ['harikant.irah@gmail.com'];
  const validReplyTo = safeReplyTo(replyTo);
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  let lastDetail = 'unknown_error';

  const senders = [];
  const primaryFrom = (fromEmail || 'IRAH Services LLP <info@irah.co.in>').trim();
  senders.push(primaryFrom);
  if (!primaryFrom.toLowerCase().includes('onboarding@resend.dev')) {
    senders.push('IRAH Services LLP <onboarding@resend.dev>');
  }

  for (const sender of senders) {
    try {
      const payload = {
        from: sender,
        to: toList,
        reply_to: validReplyTo,
        subject: subject,
        html: html
      };
      if (hasAttachments) {
        payload.attachments = attachments;
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
          'User-Agent': 'IRAH-Cloudflare-Worker/1.1'
        },
        body: JSON.stringify(payload)
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body && body.id) {
        return { status: 'sent', detail: 'ok', id: body.id };
      }
      lastDetail = `resend_http_${res.status}_${(body && (body.name || body.message)) ? String(body.name || body.message).slice(0, 60) : 'rejected'}`;
    } catch (e) {
      lastDetail = `network_error_${e && e.message ? String(e.message).slice(0, 40) : 'fetch_failed'}`;
    }
  }

  return { status: 'fallback', detail: lastDetail };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  const resendKey = (env && (env.IRAH_RESEND_API_KEY || env.RESEND_API_KEY)) || '';
  const reportDestinations = parseDestinations(env && env.IRAH_REPORT_TO);
  const fromSender = (env && env.IRAH_FROM_EMAIL) || 'IRAH Services LLP <info@irah.co.in>';

  try {
    let data;
    try {
      data = await request.json();
    } catch (_) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    const cleanStr = (v) => (typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v).trim() : ''));
    const name = cleanStr(data.name);
    const email = cleanStr(data.email);
    const phone = cleanStr(data.phone);
    const vertical = cleanStr(data.vertical) || 'Financial Services';
    const investmentInterest = cleanStr(data.investmentInterest);
    const investmentBracket = cleanStr(data.investmentBracket);
    const educationTopic = cleanStr(data.educationTopic);
    const message = cleanStr(data.message);

    if (!name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Please provide your full name, email address, and contact number.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!data.consent || data.consent.given !== true) {
      return new Response(JSON.stringify({ error: 'Consent is required to submit an inquiry.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const refId = 'IRAH-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000).toString(16).toUpperCase();
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const knownKeys = new Set([
      'name', 'email', 'phone', 'vertical', 'investmentInterest', 'investmentBracket',
      'educationTopic', 'message', 'consent', 'timestamp'
    ]);

    let detailsRows = `
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 35%;">Reference ID:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(refId)}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Client Name:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email Address:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Contact Number:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(phone)}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Primary Area of Interest:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(vertical)}</td></tr>
    `;

    if (investmentInterest && investmentInterest !== 'N/A') {
      detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Preferred Asset Class:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(investmentInterest)}</td></tr>`;
    }
    if (investmentBracket && investmentBracket !== 'N/A') {
      detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Anticipated Allocation Range:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(investmentBracket)}</td></tr>`;
    }
    if (educationTopic && educationTopic !== 'N/A') {
      detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Educational Program Focus:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(educationTopic)}</td></tr>`;
    }
    if (message) {
      detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Client Notes / Specific Inquiries:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(message)}</td></tr>`;
    }
    for (const [k, v] of Object.entries(data)) {
      if (knownKeys.has(k) || v === null || v === undefined) continue;
      if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue;
      const sval = String(v).trim();
      if (sval && sval !== 'N/A') {
        detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${escapeHtml(k)}:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(sval)}</td></tr>`;
      }
    }
    detailsRows += `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Submission Timestamp:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(nowStr)}</td></tr>`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0b1f3a; margin-top: 0;">New Client Inquiry — IRAH Services LLP</h2>
        <p style="color: #475569; font-size: 14px;">A new client relationship inquiry has been submitted via irah.co.in. Every entered detail is captured below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          ${detailsRows}
        </table>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">This notification was delivered to ${escapeHtml(reportDestinations.join(', '))}.</p>
      </div>
    `;

    const mailResult = await sendResendMail(resendKey, {
      subject: `[IRAH Inquiry] ${oneLine(name, 80)} (${oneLine(vertical, 40)})`,
      html: htmlBody,
      replyTo: email,
      fromEmail: fromSender,
      destinations: reportDestinations
    });
    const emailDelivery = mailResult.status;

    return new Response(JSON.stringify({
      ok: true,
      reference_id: refId,
      email_delivery: emailDelivery,
      email_dispatched: emailDelivery === 'sent',
      email_status_detail: mailResult.detail,
      recipient: reportDestinations[0],
      message: emailDelivery === 'sent'
        ? 'Inquiry received. Our team will contact you shortly.'
        : 'Inquiry recorded, but email relay is not configured on this edge node.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
