const RAW = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026'
const MATCHES_RAW = 'https://raw.githubusercontent.com/aybc2025/worldcup-2026/main/V3/matches'

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

// Maps "openfootball home name|openfootball away name" → match filename (without .json)
// Keys use the exact team names openfootball uses (same as COUNTRY_CODES keys)
const MATCH_FILES = {
  'Mexico|South Africa':           'wc2026-group-a-mexico-south-africa',
  'South Korea|Czech Republic':    'wc2026-group-a-korea-republic-czechia',
  'Canada|Bosnia & Herzegovina':   'wc2026-group-b-canada-bosnia-and-herzegovina',
  'Qatar|Switzerland':             'wc2026-group-b-qatar-switzerland',
  'Brazil|Morocco':                'wc2026-group-c-brazil-morocco',
  'Haiti|Scotland':                'wc2026-group-c-haiti-scotland',
  'USA|Paraguay':                  'wc2026-group-d-usa-paraguay',
  'Australia|Turkey':              'wc2026-group-d-australia-turkiye',
  'Germany|Curaçao':               'wc2026-group-e-germany-curacao',
  'Ivory Coast|Ecuador':           'wc2026-group-e-cote-divoire-ecuador',
  'Netherlands|Japan':             'wc2026-group-f-netherlands-japan',
  'Sweden|Tunisia':                'wc2026-group-f-sweden-tunisia',
  'Belgium|Egypt':                 'wc2026-group-g-belgium-egypt',
  'Iran|New Zealand':              'wc2026-group-g-ir-iran-new-zealand',
  'Spain|Cape Verde':              'wc2026-group-h-spain-cabo-verde',
  'Saudi Arabia|Uruguay':          'wc2026-group-h-saudi-arabia-uruguay',
  'France|Senegal':                'wc2026-group-i-france-senegal',
  'Iraq|Norway':                   'wc2026-group-i-iraq-norway',
  'Argentina|Algeria':             'wc2026-group-j-argentina-algeria',
  'Austria|Jordan':                'wc2026-group-j-austria-jordan',
  'Portugal|DR Congo':             'wc2026-group-k-portugal-congo-dr',
  'Uzbekistan|Colombia':           'wc2026-group-k-uzbekistan-colombia',
  'England|Croatia':               'wc2026-group-l-england-croatia',
  'Ghana|Panama':                  'wc2026-group-l-ghana-panama',
  // Matchday 4 — June 18
  'Czech Republic|South Africa':      'wc2026-group-a-czechia-south-africa',
  'Switzerland|Bosnia & Herzegovina': 'wc2026-group-b-switzerland-bosnia-and-herzegovina',
  'Canada|Qatar':                     'wc2026-group-b-canada-qatar',
  'Mexico|South Korea':               'wc2026-group-a-mexico-korea-republic',
  // Matchday 5 — June 19–20
  'USA|Australia':                    'wc2026-group-d-usa-australia',
  'Scotland|Morocco':                 'wc2026-group-c-scotland-morocco',
  'Brazil|Haiti':                     'wc2026-group-c-brazil-haiti',
  'Turkey|Paraguay':                  'wc2026-group-d-turkey-paraguay',
  'Netherlands|Sweden':               'wc2026-group-f-netherlands-sweden',
  'Germany|Ivory Coast':              'wc2026-group-e-germany-cote-divoire',
  'Ecuador|Curaçao':                  'wc2026-group-e-ecuador-curacao',
  'Tunisia|Japan':                    'wc2026-group-f-tunisia-japan',
  // Matchday 6 — June 21
  'Spain|Saudi Arabia':              'wc2026-group-h-spain-saudi-arabia',
  'Belgium|Iran':                    'wc2026-group-g-belgium-ir-iran',
  'Uruguay|Cape Verde':              'wc2026-group-h-uruguay-cabo-verde',
  'New Zealand|Egypt':               'wc2026-group-g-new-zealand-egypt',
  // Matchday 7 — June 22
  'Argentina|Austria':               'wc2026-group-j-argentina-austria',
  'France|Iraq':                     'wc2026-group-i-france-iraq',
  'Norway|Senegal':                  'wc2026-group-i-norway-senegal',
  'Jordan|Algeria':                  'wc2026-group-j-jordan-algeria',
  // Matchday 8 — June 23
  'Portugal|Uzbekistan':             'wc2026-group-k-portugal-uzbekistan',
  'England|Ghana':                   'wc2026-group-l-england-ghana',
  'Panama|Croatia':                  'wc2026-group-l-panama-croatia',
  'Colombia|DR Congo':               'wc2026-group-k-colombia-congo-dr',
  // Matchday 9 — June 24
  'Switzerland|Canada':              'wc2026-group-b-switzerland-canada',
  'Bosnia & Herzegovina|Qatar':      'wc2026-group-b-bosnia-and-herzegovina-qatar',
  'Scotland|Brazil':                 'wc2026-group-c-scotland-brazil',
  'Morocco|Haiti':                   'wc2026-group-c-morocco-haiti',
  'Czech Republic|Mexico':           'wc2026-group-a-czechia-mexico',
  'South Africa|South Korea':        'wc2026-group-a-south-africa-korea-republic',
}

// All 104 fixtures with scores and goal events
export const fetchAllFixtures = () => apiFetch(`${RAW}/worldcup.json`)

// All 48 teams (name, fifa_code, group, continent, confed)
export const fetchTeamsData = () => apiFetch(`${RAW}/worldcup.teams.json`)

// Detailed match data (stats, lineups, richer events) from our match JSON files.
// Tries home|away, then away|home, so team ordering doesn't need to be exact.
export function fetchMatchDetail(homeTeam, awayTeam) {
  const filename =
    MATCH_FILES[`${homeTeam}|${awayTeam}`] ??
    MATCH_FILES[`${awayTeam}|${homeTeam}`]
  if (!filename) return Promise.resolve(null)
  return apiFetch(`${MATCHES_RAW}/${filename}.json`)
}
