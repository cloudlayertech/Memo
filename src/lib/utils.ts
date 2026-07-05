import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, addDays, subDays, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

export function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "EEEE, MMMM d")
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d")
}

export function formatDayName(dateStr: string): string {
  return format(parseISO(dateStr), "EEE")
}

export function getNextDay(dateStr: string): string {
  return format(addDays(parseISO(dateStr), 1), "yyyy-MM-dd")
}

export function getPrevDay(dateStr: string): string {
  return format(subDays(parseISO(dateStr), 1), "yyyy-MM-dd")
}

export function getWeekDays(endDate: string): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    days.push(format(subDays(parseISO(endDate), i), "yyyy-MM-dd"))
  }
  return days
}

export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd")
}
