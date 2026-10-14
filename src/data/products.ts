export type Product = {
  id: number
  name: string
  category: string
  sku: string
  cost: number
  price: number
  stock: number
  minStock?: number
  unit: string
  imageUrl?: string
  barcode?: string
  location?: string
  posEnabled?: boolean
}

export const initialProducts: Product[] = [
  { id: 1, sku: 'BR-RM-05', name: 'Beras Ramos 5 Kg', category: 'Sembako', cost: 68000, price: 75000, stock: 25, minStock: 10, unit: 'sak', barcode: '8991001000012', location: 'Rak depan, bawah etalase bumbu' },
  { id: 2, sku: 'MK-BM-2L', name: 'Minyak Bimoli 2L', category: 'Sembako', cost: 30500, price: 34000, stock: 4, unit: 'pouch', barcode: '8991001000029' },
  { id: 3, sku: 'TL-NG-KG', name: 'Telur Ayam Negeri', category: 'Sembako', cost: 24500, price: 28000, stock: 18, unit: 'kg', barcode: '8991001000036' },
  { id: 4, sku: 'TP-SB-01', name: 'Tepung Segitiga Biru 1kg', category: 'Bumbu & Mie Instan', cost: 10500, price: 12500, stock: 3, unit: 'bungkus', barcode: '8991001000043' },
  { id: 5, sku: 'GS-LP-03', name: 'Gas Elpiji 3 Kg', category: 'Kebutuhan Rumah Tangga', cost: 18000, price: 21000, stock: 5, unit: 'tabung', barcode: '8991001000050' },
  { id: 6, sku: 'IM-GR-85', name: 'Indomie Mi Goreng 85g', category: 'Bumbu & Mie Instan', cost: 2800, price: 3500, stock: 96, unit: 'bungkus', barcode: '8991001000067' },
  { id: 7, sku: 'AQ-BT-60', name: 'Aqua Botol 600 ml', category: 'Minuman & Es', cost: 3000, price: 4000, stock: 48, unit: 'botol', barcode: '8991001000074' },
  { id: 8, sku: 'GG-FL-12', name: 'Gudang Garam Filter 12', category: 'Rokok & Tembakau', cost: 23500, price: 26000, stock: 2, unit: 'bungkus', barcode: '8991001000081' },
  { id: 9, sku: 'GL-PS-01', name: 'Gula Pasir 1 Kg', category: 'Sembako', cost: 14500, price: 17000, stock: 22, unit: 'bungkus', barcode: '8991001000098' },
]

export const productCategories = [
  'Sembako',
  'Minuman & Es',
  'Bumbu & Mie Instan',
  'Rokok & Tembakau',
  'Kebutuhan Rumah Tangga',
  'Lainnya',
]

export const formatRupiah = (value: number) =>
  'Rp ' + value.toLocaleString('id-ID')
