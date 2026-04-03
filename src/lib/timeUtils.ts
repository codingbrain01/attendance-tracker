export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60) % 24
  const m = Math.abs(minutes) % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function calcHoursWorked(
  timeIn: string | null | undefined,
  timeOut: string | null | undefined,
  breakStart?: string | null,
  breakEnd?: string | null,
): number {
  if (!timeIn || !timeOut) return 0
  let worked = timeToMinutes(timeOut.slice(0, 5)) - timeToMinutes(timeIn.slice(0, 5))
  if (breakStart && breakEnd) {
    worked -= timeToMinutes(breakEnd.slice(0, 5)) - timeToMinutes(breakStart.slice(0, 5))
  }
  return Math.max(0, worked / 60)
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0 && m === 0) return '0h'
  if (m === 0) return `${h}h`
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '—'
  return time.slice(0, 5)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function nowTimeStr(): string {
  return new Date().toTimeString().split(' ')[0] // HH:MM:SS
}

export function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // back to Monday
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export function getMonthStart(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
