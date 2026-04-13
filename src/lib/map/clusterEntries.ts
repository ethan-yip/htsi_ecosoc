import type { PrimaryConstraint } from '../form/formState'
import type { EntryDomainModel } from '../supabase/types'
import { getCountryCentroid } from './countryCentroids'

export const CONSTRAINT_COLOR: Record<PrimaryConstraint, string> = {
   '': '#bdbdbd', // or any neutral/placeholder color
   'funding': '#f2b223',
   'execution-capacity': '#22b2f2',
   'engagement': '#56d66a',
   'institutional-support': '#9f7be8',
   'training-skills': '#f27f22',
   'other': '#a0a0a0',
}

export interface CountryCluster {
  country: string
  lat: number
  lng: number
  count: number
  totalReach: number
  entries: EntryDomainModel[]
  dominantConstraint: PrimaryConstraint
  color: string
}

export interface EntryMetrics {
  totalEntries: number
  totalReach: number
  countryCount: number
}

function getDominantConstraint(entries: EntryDomainModel[]): PrimaryConstraint {
  const counts: Record<PrimaryConstraint, number> = {
    '': 0,
    funding: 0,
    'execution-capacity': 0,
    engagement: 0,
    'institutional-support': 0,
    'training-skills': 0,
    other: 0,
  }

  for (const entry of entries) {
    counts[entry.primaryConstraint] += 1
  }

  return (Object.keys(counts) as PrimaryConstraint[]).reduce((currentBest, candidate) => {
    return counts[candidate] > counts[currentBest] ? candidate : currentBest
  }, 'funding')
}

export function buildCountryClusters(entries: EntryDomainModel[]): CountryCluster[] {
  const grouped = new Map<string, EntryDomainModel[]>()

  for (const entry of entries) {
    const existing = grouped.get(entry.country)
    if (existing) {
      existing.push(entry)
    } else {
      grouped.set(entry.country, [entry])
    }
  }

  const clusters: CountryCluster[] = []

  for (const [country, groupedEntries] of grouped.entries()) {
    const centroid = getCountryCentroid(country)
    if (!centroid) {
      continue
    }

    const dominantConstraint = getDominantConstraint(groupedEntries)
    const totalReach = groupedEntries.reduce((sum, item) => sum + item.estimatedReach, 0)

    clusters.push({
      country,
      lat: centroid.lat,
      lng: centroid.lng,
      count: groupedEntries.length,
      totalReach,
      entries: groupedEntries,
      dominantConstraint,
      color: CONSTRAINT_COLOR[dominantConstraint],
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
