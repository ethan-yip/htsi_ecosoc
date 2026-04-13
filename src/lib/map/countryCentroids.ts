import countries from 'world-countries'

interface WorldCountryRecord {
  name: {
    common: string
    official: string
  }
  altSpellings?: string[]
  cca2?: string
  cca3?: string
  latlng?: number[]
}

export interface CountryCentroid {
  lat: number
  lng: number
}

const centroidLookup = new Map<string, CountryCentroid>()

const aliasMap: Record<string, string> = {
  'usa': 'United States',
  'u.s.a.': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'uae': 'United Arab Emirates',
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

for (const country of countries as WorldCountryRecord[]) {
  if (!country.latlng || country.latlng.length < 2) {
    continue
  }

  const centroid = {
    lat: country.latlng[0],
    lng: country.latlng[1],
  }

  const keys = [
    country.name.common,
    country.name.official,
    country.cca2 ?? '',
    country.cca3 ?? '',
    ...(country.altSpellings ?? []),
  ]

  for (const key of keys) {
    const normalized = normalizeName(key)
    if (normalized) {
      centroidLookup.set(normalized, centroid)
    }
  }
}

export function getCountryCentroid(countryName: string): CountryCentroid | null {
  const normalized = normalizeName(countryName)
  const resolvedName = aliasMap[normalized] ? normalizeName(aliasMap[normalized]) : normalized
  return centroidLookup.get(resolvedName) ?? null
}
