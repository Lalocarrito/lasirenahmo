export function parseDuration(duration: string | undefined | null): number {
  if (!duration) return 60

  const trimmed = duration.trim().toLowerCase()

  const hoursMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/)
  if (hoursMatch) return Math.round(parseFloat(hoursMatch[1]) * 60)

  const minutesMatch = trimmed.match(/^(\d+)\s*m(?:in(?:utes?)?)?$/)
  if (minutesMatch) return parseInt(minutesMatch[1], 10)

  const numMatch = trimmed.match(/^(\d+)$/)
  if (numMatch) return parseInt(numMatch[1], 10)

  return 60
}
