export type StoreProfile = {
  ownerName: string
  email: string
  phone: string
  pin: string
  storeName: string
  operatingHours: string
  address: string
  receiptFooter: string
}

export const initialStoreProfile: StoreProfile = {
  ownerName: 'Cak Mahmud',
  email: 'cakmahmud@warung.com',
  phone: '0812-3456-7890',
  pin: '123456',
  storeName: 'Toko Berkah Madura',
  operatingHours: 'Buka 24 Jam Non-Stop',
  address: 'Jl. Raya Kalianget No. 12, Sumenep, Madura',
  receiptFooter: 'Matur sakalangkong telah belanja di Toko Berkah Madura',
}

const profileStorageKey = 'maduraa-demo-store-profile'

function isStoreProfile(value: unknown): value is StoreProfile {
  if (typeof value !== 'object' || value === null) return false

  const profile = value as Record<string, unknown>
  return (
    typeof profile.ownerName === 'string' &&
    typeof profile.email === 'string' &&
    typeof profile.phone === 'string' &&
    typeof profile.pin === 'string' &&
    typeof profile.storeName === 'string' &&
    typeof profile.operatingHours === 'string' &&
    typeof profile.address === 'string' &&
    typeof profile.receiptFooter === 'string'
  )
}

export function loadDemoStoreProfile(): StoreProfile {
  const storedProfile = localStorage.getItem(profileStorageKey)
  if (storedProfile === null) return initialStoreProfile

  const profile: unknown = JSON.parse(storedProfile)
  if (!isStoreProfile(profile)) {
    throw new Error('Data profil demo warung tidak valid. Hapus data demo browser lalu daftar kembali.')
  }
  return profile
}

export function saveDemoStoreProfile(profile: StoreProfile) {
  localStorage.setItem(profileStorageKey, JSON.stringify(profile))
}
