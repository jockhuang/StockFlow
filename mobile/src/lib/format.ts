export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString()
}

export function formatMoney(value: number | null | undefined) {
  if (value == null) {
    return '-'
  }
  return value.toFixed(2)
}

export function formatList(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(', ') || '-'
}
