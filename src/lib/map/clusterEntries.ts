import type { FocusArea } from '../form/formState'
import type { EntryDomainModel } from '../supabase/types'
import { getCountryByCode, getStateByCode } from './countryCentroids'

export const FOCUS_COLOR: Record<FocusArea, string> = {
   '': '#bdbdbd',
   'entrepreneurship': '#f2b223',
   'education': '#22b2f2',
   'employment': '#56d66a',
   'peacebuilding-civic-engagement': '#9f7be8',
   'technology-innovation': '#f27f22',
   'other': '#a0a0a0',
}

export const ROLE_COLOR: Record<string, string> = {
  'youth-program-operator': '#ff7f50',
  'ngo-nonprofit': '#6a5acd',
  'school-university': '#20b2aa',
  'startup-builder': '#db7093',
  'government-policy': '#4682b4',
  'funder-donor': '#ffd700',
  'other': '#a0a0a0',
};

export const CONSTRAINT_COLOR: Record<string, string> = {
  'funding': '#e57373',
  'execution-capacity': '#81c784',
  'engagement': '#64b5f6',
  'institutional-support': '#ffb74d',
  'training-skills': '#ba68c8',
  'other': '#a0a0a0',
};

export interface CountryCluster {
  country: string
  state?: string
  lat: number
  lng: number
  count: number
  totalReach: number
  entries: EntryDomainModel[]
  dominantFocus: FocusArea
  color: string
}

export interface EntryMetrics {
  totalEntries: number
  totalReach: number
  countryCount: number
}

function getDominantFocus(entries: EntryDomainModel[]): FocusArea {
  const counts: Record<FocusArea, number> = {
    '': 0,
    'entrepreneurship': 0,
    'education': 0,
    'employment': 0,
    'peacebuilding-civic-engagement': 0,
    'technology-innovation': 0,
    'other': 0,
  }

  for (const entry of entries) {
    counts[entry.focusArea] += 1
  }

  return (Object.keys(counts) as FocusArea[]).reduce((currentBest, candidate) => {
    return counts[candidate] > counts[currentBest] ? candidate : currentBest
  }, 'education')
}

export function buildCountryClusters(entries: EntryDomainModel[]): CountryCluster[] {
  const grouped = new Map<string, EntryDomainModel[]>()

  for (const entry of entries) {
    const key = `${entry.country}-${entry.state || 'none'}`
    const existing = grouped.get(key)
    if (existing) {
      existing.push(entry)
    } else {
      grouped.set(key, [entry])
    }
  }

  const clusters: CountryCluster[] = []

    for (const groupedEntries of grouped.values()) {
      const first = groupedEntries[0]
      const countryCode = first.country
      const stateCode = first.state
  
      const country = getCountryByCode(countryCode)
      if (!country) continue
  
      let lat = Number.parseFloat(country.latitude)
      let lng = Number.parseFloat(country.longitude)
  
      if (stateCode) {
        const state = getStateByCode(country.isoCode, stateCode)
        if (state && state.latitude && state.longitude) {
          lat = Number.parseFloat(state.latitude)
          lng = Number.parseFloat(state.longitude)
        }
      }

    const dominantFocus = getDominantFocus(groupedEntries)
    const totalReach = groupedEntries.reduce((sum, item) => sum + item.estimatedReach, 0)

    clusters.push({
      country: country.name,
      state: stateCode || undefined,
      lat,
      lng,
      count: groupedEntries.length,
      totalReach,
      entries: groupedEntries,
      dominantFocus,
      color: FOCUS_COLOR[dominantFocus],
    })
  }

  return clusters
}

export function getEntryMetrics(entries: EntryDomainModel[]): EntryMetrics {
  return {
    totalEntries: entries.length,
    totalReach: entries.reduce((sum, item) => sum + item.estimatedReach, 0),
    countryCount: new Set(entries.map((entry) => entry.country)).size,
  }
}
