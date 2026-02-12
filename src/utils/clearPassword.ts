// src/utils/adminPassword.ts
export function verifyAdminPassword(input: string) {
  const pw = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;
  if (!pw) {
    console.warn("VITE_ADMIN_PASSWORD not set");
    return false;
  }
  return input === pw;
}
