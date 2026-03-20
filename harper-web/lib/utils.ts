import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getScoreColour(score: number): string {
  if (score >= 71) return '#2D6A4F';
  if (score >= 41) return '#D4A017';
  return '#C0392B';
}

export function formatCurrency(amount: number, currency: 'GBP' | 'USD'): string {
  const symbol = currency === 'GBP' ? '£' : '$';
  return `${symbol}${(amount / 100).toFixed(0)}`;
}
