import type { Env } from '../types/env';

export async function sendEmail(env: Env, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
    console.log(`[email skipped] ${to}: ${subject}`);
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'University Issue Tracker <noreply@youruniversity.edu>',
      to,
      subject,
      html
    })
  });

  if (!response.ok) throw new Error(`Resend failed: ${response.status}`);
  return response.json();
}
