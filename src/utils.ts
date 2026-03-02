export function eurosToCents(euros: string): number {
  return Math.round(Number.parseFloat(euros) * 100);
}
