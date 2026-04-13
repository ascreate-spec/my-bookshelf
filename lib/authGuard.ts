export const ALLOWED_EMAILS = [
  "asako.hafs@gmail.com",
];

export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false;

  return ALLOWED_EMAILS.some(
    (allowed) => allowed.toLowerCase() === email.toLowerCase()
  );
}