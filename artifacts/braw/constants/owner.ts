export const OWNER_EMAIL = "barandamci@icloud.com";

export function isOwnerEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase().trim() === OWNER_EMAIL.toLowerCase();
}
