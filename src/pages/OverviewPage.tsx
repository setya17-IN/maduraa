import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CirclePlus,
  Clock3,
  Package,
  ShoppingBasket,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { Product } from '../data/products'
import { formatRupiah } from '../data/products'
import type { SaleTransaction } from '../data/sales'
import './OverviewPage.css'

type OverviewPageProps = {
  products: Product[]
  sales: SaleTransaction[]
  onNavigate: (menu: string) => void
}

function localDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function OverviewPage({ products, sales, onNavigate }: OverviewPageProps) {
  const today = localDateString(new Date())
  const monthStart = `${today.slice(0, 7)}-01`
  const todaySales = sales.filter((sale) => sale.date === today)
  const monthSales = sales.filter(
    (sale) => sale.date >= monthStart && sale.date <= today,
  )
  const todayRevenue = todaySales.reduce((total, sale) => total + sale.total, 0)
  const monthRevenue = monthSales.reduce((total, sale) => total + sale.total, 0)
  const todayProfit = todaySales.reduce((total, sale) => total + sale.profit, 0)
  const averageTransaction = todaySales.length
    ? todayRevenue / todaySales.length
    : 0

  const bestSellers = new Map<number, number>()
  for (const sale of todaySales) {
    for (const line of sale.productLines) {
      bestSellers.set(
        line.productId,
        (bestSellers.get(line.productId) ?? 0) + line.quantity,
      )
    }
  }
  const topProducts = [...bestSellers.entries()]
    .map(([productId, quantity]) => ({
      product: products.find((item) => item.id === productId),
      quantity,
    }))
    .filter((item): item is { product: Product; quantity: number } =>
      Boolean(item.product),
    )
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const lowStockProducts = products
    .filter(
      (product) =>
        product.stock > 0 &&
        product.stock <= (product.minStock ?? 5),
    )
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${today}T12:00:00`))
  const todayStamp = today.replaceAll('-', '')

  return (
    <main className="overview-page">
      <header className="overview-welcome">
        <div>
          <h2><span aria-hidden="true">●</span> Ringkasan Warung Hari Ini</h2>
          <p><CalendarDays size={12} /> {dateLabel}</p>
        </div>
        <button onClick={() => onNavigate('Transaksi Kasir')}>
          <CirclePlus size={14} /> Catat Transaksi Baru
        </button>
      </header>

      <section className="overview-metrics">
        <article className="today-revenue">
          <span>OMZET HARI INI</span>
          <strong>{formatRupiah(todayRevenue)}</strong>
          <small><TrendingUp size={11} /> {todaySales.length} transaksi berhasil</small>
          <Wallet size={22} />
        </article>
        <article>
          <span>OMZET BULAN INI</span>
          <strong>{formatRupiah(monthRevenue)}</strong>
          <small><CalendarDays size={11} /> Akumulasi bulan berjalan</small>
          <CalendarDays size={22} />
        </article>
        <article>
          <span>JUMLAH TRANSAKSI</span>
          <strong>{todaySales.length} Transaksi</strong>
          <small><Clock3 size={11} /> Rata-rata {formatRupiah(averageTransaction)} / belanja</small>
          <ShoppingBasket size={22} />
        </article>
        <article className="overview-profit">
          <span>ESTIMASI KEUNTUNGAN</span>
          <strong>{formatRupiah(todayProfit)}</strong>
          <small>Margin bersih: {todayRevenue ? ((todayProfit / todayRevenue) * 100).toFixed(1) : '0.0'}%</small>
          <TrendingUp size={22} />
        </article>
      </section>

      <div className="overview-columns">
        <section className="overview-panel best-seller-panel">
          <header>
            <h3><TrendingUp size={15} /> Produk Terlaris Hari Ini</h3>
            <span>{topProducts.length} Teratas</span>
          </header>
          {topProducts.length ? (
            <div className="best-seller-list">
              {topProducts.map(({ product, quantity }, index) => (
                <article key={product.id}>
                  <span className={`seller-rank rank-${index + 1}`}>#{index + 1}</span>
                  <div className="seller-product">
                    <strong>{product.name}</strong>
                    <small>Kategori: {product.category}</small>
                  </div>
                  <span className="seller-quantity">{quantity} {product.unit}</span>
                  <strong className="seller-total">{formatRupiah(product.price * quantity)}</strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="overview-empty">Belum ada transaksi hari ini.</p>
          )}
          <button className="overview-panel-link" onClick={() => onNavigate('Laporan Omzet')}>
            Lihat Laporan Penjualan Lengkap <ArrowRight size={12} />
          </button>
        </section>

        <section className="overview-panel low-stock-panel">
          <header>
            <h3><AlertTriangle size={15} /> Peringatan Stok Menipis</h3>
            <span>{lowStockProducts.length} Butuh Kulakan</span>
          </header>
          <div className="stock-warning-note">
            <AlertTriangle size={13} />
            <span>Perhatian: Segera kulakan barang berikut sebelum kehabisan.</span>
          </div>
          {lowStockProducts.length ? (
            <div className="low-stock-list">
              {lowStockProducts.map((product) => (
                <article key={product.id}>
                  <span className="low-stock-icon"><Package size={13} /></span>
                  <div>
                    <strong>{product.name}</strong>
                    <small>Batas minimum: {product.minStock ?? 5} {product.unit}</small>
                  </div>
                  <span className="low-stock-count">Sisa {product.stock} {product.unit}</span>
                </article>
              ))}
            </div>
          ) : (
            <p className="overview-empty">Semua stok produk dalam batas aman.</p>
          )}
          <button className="overview-panel-link" onClick={() => onNavigate('Produk')}>
            Kelola Stok di Menu Produk <ArrowRight size={12} />
          </button>
        </section>
      </div>

      <span className="overview-demo-note">
        <span>●</span> Data prototipe · ID laporan hari ini #{todayStamp}
      </span>
    </main>
  )
}

export default OverviewPage
