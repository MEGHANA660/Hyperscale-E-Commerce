// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveSession, getToken, getStoredUser, clearSession, orderApi } from '../services/api'

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

describe('login session', () => {
  it('saves and reads the token and user', () => {
    saveSession('tok', { id: 1, username: 'alice' })
    expect(getToken()).toBe('tok')
    expect(getStoredUser()).toEqual({ id: 1, username: 'alice' })
  })
  it('clears the session and announces the logout', () => {
    saveSession('tok', { id: 1 })
    const seen = vi.fn()
    window.addEventListener('hsc-logout', seen)
    clearSession()
    expect(getToken()).toBeNull()
    expect(seen).toHaveBeenCalled()
  })
})

describe('offline banner event', () => {
  it('reports offline when the server cannot be reached', async () => {
    const events = []
    window.addEventListener('hsc-backend', e => events.push(e.detail.online))
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(orderApi.placeOrder({})).rejects.toThrow(/reach the server/)
    expect(events).toContain(false)
  })
})