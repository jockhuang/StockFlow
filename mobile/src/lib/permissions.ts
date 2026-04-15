import type { UserProfile } from '../types'

export function hasAuthority(profile: UserProfile | null, authority?: string) {
  if (!authority) {
    return true
  }

  return profile?.authorities.includes(authority) ?? false
}

export function hasAnyAuthority(profile: UserProfile | null, authorities: string[]) {
  return authorities.some((authority) => hasAuthority(profile, authority))
}
