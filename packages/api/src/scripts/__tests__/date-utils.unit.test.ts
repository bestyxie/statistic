import { afterEach, describe, expect, it, vi } from 'vitest'
import { getBeijingToday, getBeijingYesterday } from '../date-utils'

function mockNow(utcIso: string) {
  vi.useFakeTimers({ now: new Date(utcIso).getTime() })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('getBeijingYesterday', () => {
  it('returns previous Beijing day when UTC is early morning Beijing time', () => {
    // 2026-05-20 01:00 北京时间 = 2026-05-19 17:00 UTC
    mockNow('2026-05-19T17:00:00Z')
    expect(getBeijingYesterday()).toBe('2026-05-19')
  })

  it('returns previous Beijing day when UTC is mid-day Beijing time', () => {
    // 2026-05-20 09:00 北京时间 = 2026-05-20 01:00 UTC
    mockNow('2026-05-20T01:00:00Z')
    expect(getBeijingYesterday()).toBe('2026-05-19')
  })

  it('returns previous Beijing day when UTC is late evening Beijing time', () => {
    // 2026-05-20 23:00 北京时间 = 2026-05-20 15:00 UTC
    mockNow('2026-05-20T15:00:00Z')
    expect(getBeijingYesterday()).toBe('2026-05-19')
  })

  it('handles the boundary at 00:30 Beijing time', () => {
    // 2026-05-20 00:30 北京时间 = 2026-05-19 16:30 UTC
    mockNow('2026-05-19T16:30:00Z')
    expect(getBeijingYesterday()).toBe('2026-05-19')
  })

  it('crosses year boundary correctly', () => {
    // 2026-01-01 01:00 北京时间 = 2025-12-31 17:00 UTC
    mockNow('2025-12-31T17:00:00Z')
    expect(getBeijingYesterday()).toBe('2025-12-31')
  })
})

describe('getBeijingToday', () => {
  it('returns current Beijing day when UTC is previous day', () => {
    // 2026-05-20 01:00 北京时间 = 2026-05-19 17:00 UTC
    mockNow('2026-05-19T17:00:00Z')
    expect(getBeijingToday()).toBe('2026-05-20')
  })
})
