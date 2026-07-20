export const EGYPTIAN_PHONE_REGEX = /^(010|011|012|015)\d{8}$/;

export const EGYPTIAN_PHONE_ERROR_MESSAGE_AR = "يجب إدخال رقم موبايل مصري صحيح مكون من 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.";
export const EGYPTIAN_PHONE_ERROR_MESSAGE_EN = "Must be a valid 11-digit Egyptian mobile number starting with 010, 011, 012, or 015.";

export function isValidEgyptianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.trim();
  return EGYPTIAN_PHONE_REGEX.test(cleanPhone);
}

export function cleanEgyptianPhoneInput(input: string): string {
  // Remove spaces, dashes, and any non-digit character
  let clean = input.replace(/\D/g, '');
  // Optionally handle +20 or 0020 if pasted, though the user requested no country code,
  // it's friendly to strip it if they paste it.
  if (clean.startsWith('201') && clean.length === 12) {
    clean = '0' + clean.substring(2);
  } else if (clean.startsWith('00201') && clean.length === 14) {
    clean = '0' + clean.substring(4);
  }
  // Max length 11
  return clean.slice(0, 11);
}
