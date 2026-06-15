/**
 * API Client — calls worldcup26.ir directly from the browser.
 * No API key required. No proxy needed. Works on GitHub Pages.
 *
 * Base: https://worldcup26.ir
 * Endpoints:
 *   GET /get/games         → all 104 fixtures with live scores
 *   GET /get/groups        → group standings (all 12 groups)
 *   GET /get/teams         → all 48 teams
 *   GET /get/stadiums      → all 16 stadiums
 *
 * Fallback for static schedule data: openfootball/worldcup.json on GitHub raw
 */

const BASE = 'https://worldcup26.ir'

// Generic fetch with timeout
async function apiFetch(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

// ── Main data sources ─────────────────────────────────────

/** All 104 fixtures — includes live scores during matches */
export const fetchAllFixtures = () =>
  apiFetch(`${BASE}/get/games`)

/** All 12 group standings */
export const fetchGroups = () =>
  apiFetch(`${BASE}/get/groups`)

/** All 48 teams */
export const fetchTeams = () =>
  apiFetch(`${BASE}/get/teams`)

/** All 16 stadiums */
export const fetchStadiums = () =>
  apiFetch(`${BASE}/get/stadiums`)

// ── Fallback: openfootball static JSON ────────────────────
// Used if worldcup26.ir is down; schedule data only, no live scores

const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

export const fetchOpenFootballSchedule = () =>
  apiFetch(OPENFOOTBALL_URL)
