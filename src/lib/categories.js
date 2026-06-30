export const CATEGORIES = {
  design: { label: 'Design', dot: '#2454D9' },
  drawing: { label: 'Drawing', dot: '#15B87B' },
  assembly: { label: 'Assembly', dot: '#C97A12' },
  revisi: { label: 'Revisi', dot: '#D6395A' },
  meeting: { label: 'Meeting', dot: '#6E56CF' },
  lainnya: { label: 'Lainnya', dot: '#5C6B85' },
}

export const PRIORITY_STYLES = {
  tinggi: 'bg-danger-soft text-danger',
  sedang: 'bg-warning-soft text-warning',
  rendah: 'bg-surface-soft text-ink-soft',
}

export const STATUS_STYLES = {
  berjalan: 'bg-primary-soft text-primary',
  menunggu: 'bg-purple-soft text-purple',
  review: 'bg-success-soft text-success',
  selesai: 'bg-success-soft text-success',
}

export function todayISO(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}
