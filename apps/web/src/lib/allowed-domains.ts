export const ALLOWED_EMAIL_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || 'rishihood.edu.in,nst.rishihood.edu.in'
)
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);

export function formatAllowedDomainsHint(): string {
  if (ALLOWED_EMAIL_DOMAINS.length === 1) return `@${ALLOWED_EMAIL_DOMAINS[0]}`;
  return ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(', ');
}
