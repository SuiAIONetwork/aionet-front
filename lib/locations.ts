import countries from 'world-countries'

// Location data with flags for leaderboard filtering using world-countries
export interface Location {
  code: string // ISO 2-letter code
  name: string
  region: string
}

// Get formatted countries from world-countries package
export const LOCATIONS: Location[] = countries.map((country) => ({
  code: country.cca2, // ISO 2-letter code for flags
  name: country.name.common,
  region: country.region
})).sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically

// Helper functions
export const getLocationByCode = (code: string): Location | undefined => {
  return LOCATIONS.find(location => location.code === code)
}

export const getLocationByName = (name: string): Location | undefined => {
  return LOCATIONS.find(location => 
    location.name.toLowerCase() === name.toLowerCase()
  )
}

export const getLocationsByRegion = (region: string): Location[] => {
  return LOCATIONS.filter(location => location.region === region)
}

// Function to get country code by location name (for flag display)
export const getCountryCodeByName = (name: string): string | null => {
  if (!name) return null

  const normalizedName = name.toLowerCase().trim()

  // Handle common country name variations
  const countryVariations: Record<string, string> = {
    'usa': 'US',
    'united states of america': 'US',
    'america': 'US',
    'uk': 'GB',
    'united kingdom': 'GB',
    'britain': 'GB',
    'great britain': 'GB',
    'england': 'GB',
    'russia': 'RU',
    'russian federation': 'RU',
    'south korea': 'KR',
    'korea': 'KR',
    'north korea': 'KP',
    'china': 'CN',
    'prc': 'CN',
    "people's republic of china": 'CN',
    'taiwan': 'TW',
    'republic of china': 'TW',
    'hong kong': 'HK',
    'vietnam': 'VN',
    'viet nam': 'VN',
    'uae': 'AE',
    'united arab emirates': 'AE',
    'czech republic': 'CZ',
    'czechia': 'CZ'
  }

  // Check direct variations first
  if (countryVariations[normalizedName]) {
    return countryVariations[normalizedName]
  }

  // Try exact match first
  let location = LOCATIONS.find(l =>
    l.name.toLowerCase() === normalizedName
  )

  if (location) return location.code

  // Try partial matches
  location = LOCATIONS.find(l =>
    l.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(l.name.toLowerCase())
  )

  return location?.code || null
}
