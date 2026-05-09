export function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function isValidPhilippinePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Accepts: 09XXXXXXXXX (11 digits) or 639XXXXXXXXX (12 digits without +)
  return /^(09\d{9}|639\d{9})$/.test(cleaned);
}

export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  return /^\d{7,15}$/.test(cleaned);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function isValidUsername(username: string): boolean {
  // 3-20 chars, alphanumeric + underscores + hyphens, no consecutive special chars
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,18}[a-zA-Z0-9]$/.test(username);
}

export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export function isValidAmount(amountInCents: number): boolean {
  return (
    Number.isInteger(amountInCents) &&
    amountInCents > 0 &&
    amountInCents <= 100_000_000_00 // max 1B PHP
  );
}

export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(code);
}
