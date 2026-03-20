import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryColor(category: string | null): string {
  const map: Record<string, string> = {
    housing: '#3b82f6',
    financial: '#10b981',
    employment: '#8b5cf6',
    medical: '#ef4444',
    insurance: '#f59e0b',
    subscription: '#ec4899',
    legal: '#6366f1',
    other: '#6b7280',
  }
  return map[category ?? 'other'] ?? map.other
}

export function getSeverityClass(severity: string): string {
  const map: Record<string, string> = {
    critical: 'severity-critical',
    warning: 'severity-warning',
    info: 'severity-info',
    ok: 'severity-ok',
  }
  return map[severity] ?? ''
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}
