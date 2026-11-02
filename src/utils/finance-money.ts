// API amounts are decimal text; never coerce financial values through Number.
export function moneyText(value: string | number): string {
  const [whole, fraction = ''] = String(value).split('.');
  const digits = fraction.replace(/0+$/, '');
  return BigInt(whole).toLocaleString('vi-VN') + (digits ? ',' + digits : '') + ' ₫';
}
function minor(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
}
export function refundableVnd(amount: string, reserved: string): string {
  const available = minor(amount) - minor(reserved);
  return (available > 0n ? available / 100n : 0n).toString();
}
