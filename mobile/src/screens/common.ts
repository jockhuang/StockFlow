import type { WarehouseApi } from '../api/client'
import type { UserProfile } from '../types'

export type ScreenProps = {
  api: WarehouseApi
  profile: UserProfile
  onBack: () => void
}
