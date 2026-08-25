export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function toInternationalFormat(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `521${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return `521${digits.slice(2)}`;
  if (digits.length === 13 && digits.startsWith('521')) return digits;
  return digits;
}
