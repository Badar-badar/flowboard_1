/** The API returns PostgreSQL IDs as `id`; the UI uses `_id` internally. */
export function normalizeApiIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(normalizeApiIds) as T
  }

  if (value && typeof value === 'object') {
    const normalized = Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeApiIds(nested)]),
    ) as Record<string, unknown>

    if (typeof normalized.id === 'string' && typeof normalized._id !== 'string') {
      normalized._id = normalized.id
    }

    return normalized as T
  }

  return value
}
