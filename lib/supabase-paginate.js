// lib/supabase-paginate.js
// Universal helper that paginates ANY Supabase query to avoid the silent 1000/2000 row cap.
// Use this for EVERY query that could return >1000 rows — especially attendance_logs.

/**
 * Fetches all rows from a Supabase query, paginated.
 * @param {() => any} buildQuery — function returning a Supabase query builder
 * @param {object} opts — { pageSize: 1000, maxPages: 100, label: 'name' }
 * @returns {Promise<Array>} all rows
 */
export async function fetchAll(buildQuery, opts = {}) {
  const pageSize = opts.pageSize || 1000
  const maxPages = opts.maxPages || 100
  const label = opts.label || 'query'

  let all = []
  let from = 0
  let pages = 0

  while (pages < maxPages) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1)
    if (error) {
      console.error(`[fetchAll:${label}] error:`, error.message)
      break
    }
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < pageSize) break
    from += pageSize
    pages++
  }

  if (pages >= maxPages) {
    console.warn(`[fetchAll:${label}] hit maxPages=${maxPages} cap — may be missing rows!`)
  }
  return all
}

/**
 * Fetches all rows that match a list of values via .in() — paginates BOTH the input list
 * AND the output rows. Necessary when the filter list itself exceeds Postgres limits (~1000).
 * @param {() => any} buildBaseQuery — function returning Supabase query builder (no .in() yet)
 * @param {string} column — column name to filter on
 * @param {Array} values — array of values to match
 * @param {object} opts
 */
export async function fetchAllByIn(buildBaseQuery, column, values, opts = {}) {
  const filterChunk = opts.filterChunk || 500
  const all = []
  for (let i = 0; i < values.length; i += filterChunk) {
    const chunk = values.slice(i, i + filterChunk)
    const rows = await fetchAll(() => buildBaseQuery().in(column, chunk), { ...opts, label: `${opts.label || 'query'}-chunk${i / filterChunk}` })
    all.push(...rows)
  }
  return all
}