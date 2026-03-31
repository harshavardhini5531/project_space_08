export const maxDuration = 60

export async function POST(request) {
  try {
    const { rollNumber } = await request.json()
    if (!rollNumber) {
      return Response.json({ error: 'Roll number required' }, { status: 400 })
    }

    let queryRoll = rollNumber.toUpperCase()
    if (queryRoll.startsWith('TEST')) queryRoll = '23MH1A4930'

    let url = 'http://node.technicalhub.io:4001/api/get-students-data-by-acet'
    if (queryRoll.includes('A9')) url = 'http://node.technicalhub.io:4001/api/get-students-data-by-aec'

    // Use shorter date range to reduce data size
    const toDate = new Date().toISOString().split('T')[0]
    const body = JSON.stringify({ fromDate: '2024-09-01', toDate })

    console.log('Maya: fetching', url, 'roll:', queryRoll)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 50000)

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.log('Maya: API error', res.status)
      return Response.json({ coding: null })
    }

    // Read response as text first, then parse
    const text = await res.text()
    console.log('Maya: response size', text.length, 'chars')

    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.log('Maya: JSON parse failed')
      return Response.json({ coding: null })
    }

    if (!Array.isArray(data)) {
      console.log('Maya: not an array')
      return Response.json({ coding: null })
    }

    console.log('Maya: total records', data.length)

    // Filter for this student
    const totals = { c: 0, cpp: 0, java: 0, python: 0 }
    const dates = new Set()
    let found = 0

    for (const r of data) {
      if (r.roll_no && r.roll_no.toUpperCase() === queryRoll) {
        totals.c += r.c || 0
        totals.cpp += r.cpp || 0
        totals.java += r.java || 0
        totals.python += r.python || 0
        if (r.date) dates.add(r.date)
        found++
      }
    }

    console.log('Maya: found', found, 'records, totals:', totals)

    if (found === 0) {
      return Response.json({ coding: null, message: 'No records' })
    }

    return Response.json({
      coding: {
        c: totals.c,
        cpp: totals.cpp,
        java: totals.java,
        python: totals.python,
        total: totals.c + totals.cpp + totals.java + totals.python,
        activeDays: dates.size,
      }
    })

  } catch (err) {
    console.error('Maya error:', err.name === 'AbortError' ? 'timeout' : err.message)
    return Response.json({ coding: null })
  }
}