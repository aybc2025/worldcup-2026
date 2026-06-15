export const TOURNAMENT = {
  name: 'FIFA World Cup 2026',
  startDate: '2026-06-11',
  endDate: '2026-07-19',
  hosts: ['USA', 'Canada', 'Mexico'],
  totalTeams: 48,
  totalMatches: 104,
  leagueId: 1,
  season: 2026,
}

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export const STAGES = {
  GROUP: 'Group Stage',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-finals',
  SF: 'Semi-finals',
  THIRD: '3rd Place',
  FINAL: 'Final',
}

// React Query stale times (ms)
export const TTL = {
  LIVE_MATCH: 30_000,        // 30 seconds — live score/events
  STANDINGS: 10 * 60_000,    // 10 minutes
  KNOCKOUT: 15 * 60_000,     // 15 minutes
  SQUAD: 24 * 60 * 60_000,   // 24 hours
  TOP_SCORERS: 10 * 60_000,  // 10 minutes
  FIXTURES_ALL: 5 * 60_000,  // 5 minutes (between matches)
}

// Polling intervals when a match is live vs. not
export const POLL = {
  LIVE: 30_000,
  IDLE: 5 * 60_000,
}

export const FLAG_URL = (code) =>
  `https://flagcdn.com/w80/${code?.toLowerCase()}.png`

export const COUNTRY_CODES = {
  'Brazil': 'br', 'France': 'fr', 'Germany': 'de', 'Argentina': 'ar',
  'England': 'gb-eng', 'Spain': 'es', 'Portugal': 'pt', 'Netherlands': 'nl',
  'Belgium': 'be', 'Italy': 'it', 'Croatia': 'hr', 'Uruguay': 'uy',
  'Mexico': 'mx', 'USA': 'us', 'Canada': 'ca', 'Japan': 'jp',
  'South Korea': 'kr', 'Morocco': 'ma', 'Senegal': 'sn', 'Ghana': 'gh',
  'Ecuador': 'ec', 'Colombia': 'co', 'Chile': 'cl', 'Peru': 'pe',
  'Australia': 'au', 'Iran': 'ir', 'Saudi Arabia': 'sa', 'Qatar': 'qa',
  'Poland': 'pl', 'Switzerland': 'ch', 'Denmark': 'dk', 'Serbia': 'rs',
  'Wales': 'gb-wls', 'Scotland': 'gb-sct', 'Austria': 'at', 'Turkey': 'tr',
  'Ukraine': 'ua', 'Hungary': 'hu', 'Slovakia': 'sk', 'Czech Republic': 'cz',
  'Romania': 'ro', 'Albania': 'al', 'Slovenia': 'si', 'Georgia': 'ge',
  'New Zealand': 'nz', 'Panama': 'pa', 'Costa Rica': 'cr', 'Honduras': 'hn',
}
