'use strict';
// Minimal mailer. Production: set RESEND_API_KEY and MAIL_FROM (https://resend.com) and mail is sent over HTTPS.
// Without a key (development) the message is printed to the console so password-reset links still work.
function createMailer({ apiKey = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM, log = console.log } = {}) {
  return {
    async send({ to, subject, text }) {
      if (!apiKey || !from) { log(`\n[mail:dev] To: ${to}\n[mail:dev] Subject: ${subject}\n${text}\n`); return { dev: true }; }
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text }), signal: AbortSignal.timeout(10000)
      });
      if (!r.ok) throw new Error('Mail provider error ' + r.status);
      return { ok: true };
    }
  };
}
module.exports = { createMailer };
