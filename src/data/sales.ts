export type SaleTransaction = {
  id: string
  date: string
  time: string
  items: string[]
  productLines: { productId: number; quantity: number }[]
  total: number
  profit: number
  payment: 'Tunai'
  status: 'Selesai'
  cashier: string
}

function dateDaysAgo(daysAgo: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = dateDaysAgo(0)
const dateStamp = today.replaceAll('-', '')

export const initialDemoSales: SaleTransaction[] = [
  {
    id: `TRX-${dateStamp}-0042`,
    date: today,
    time: '21:45',
    items: ['Djarum Super 12 (1x)', 'Aqua 600ml (2x)'],
    productLines: [{ productId: 8, quantity: 1 }, { productId: 7, quantity: 2 }],
    total: 31000,
    profit: 6500,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
  {
    id: `TRX-${dateStamp}-0041`,
    date: today,
    time: '21:12',
    items: ['Beras Ramos 5kg (1x)', 'Minyak Bimoli 2L (1x)'],
    productLines: [{ productId: 1, quantity: 1 }, { productId: 2, quantity: 1 }],
    total: 109000,
    profit: 15000,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
  {
    id: `TRX-${dateStamp}-0040`,
    date: today,
    time: '20:30',
    items: ['Indomie Goreng (5x)', 'Telur Ayam 1/2kg (1x)'],
    productLines: [{ productId: 6, quantity: 5 }, { productId: 3, quantity: 1 }],
    total: 31500,
    profit: 7500,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
  {
    id: `TRX-${dateStamp}-0039`,
    date: today,
    time: '19:55',
    items: ['Tabung Gas Elpiji 3kg (1x)'],
    productLines: [{ productId: 5, quantity: 1 }],
    total: 21000,
    profit: 3000,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
  {
    id: `TRX-${dateDaysAgo(1).replaceAll('-', '')}-0038`,
    date: dateDaysAgo(1),
    time: '18:42',
    items: ['Gula Pasir 1kg (2x)', 'Aqua 600ml (1x)'],
    productLines: [{ productId: 9, quantity: 2 }, { productId: 7, quantity: 1 }],
    total: 38000,
    profit: 7000,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
  {
    id: `TRX-${dateDaysAgo(3).replaceAll('-', '')}-0037`,
    date: dateDaysAgo(3),
    time: '16:18',
    items: ['Beras Ramos 5kg (1x)', 'Indomie Goreng (4x)'],
    productLines: [{ productId: 1, quantity: 1 }, { productId: 6, quantity: 4 }],
    total: 89000,
    profit: 11000,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
  {
    id: `TRX-${dateDaysAgo(8).replaceAll('-', '')}-0036`,
    date: dateDaysAgo(8),
    time: '14:05',
    items: ['Minyak Bimoli 2L (2x)', 'Telur Ayam 1kg (1x)'],
    productLines: [{ productId: 2, quantity: 2 }, { productId: 3, quantity: 1 }],
    total: 96000,
    profit: 11000,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
  {
    id: `TRX-${dateDaysAgo(20).replaceAll('-', '')}-0035`,
    date: dateDaysAgo(20),
    time: '10:22',
    items: ['Gas Elpiji 3kg (2x)', 'Gula Pasir 1kg (1x)'],
    productLines: [{ productId: 5, quantity: 2 }, { productId: 9, quantity: 1 }],
    total: 59000,
    profit: 9000,
    payment: 'Tunai',
    status: 'Selesai',
    cashier: 'Cak Mahmud',
  },
]
