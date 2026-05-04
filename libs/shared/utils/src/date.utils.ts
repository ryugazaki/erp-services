export function formatISODate(date: Date): string {
  return date.toISOString();
}

export function parseISODate(value: string): Date {
  return new Date(value);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isExpired(date: Date): boolean {
  return new Date() > date;
}
