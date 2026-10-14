import { useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Printer,
  Search,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import { formatRupiah } from '../data/products'
import type { SaleTransaction } from '../data/sales'
import './ReportsPage.css'

type Period = 'Harian' | 'Mingguan' | 'Bulanan'

type ReportsPageProps = {
  sales: SaleTransaction[]
}

function localDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function ReportsPage({ sales }: ReportsPageProps) {
  const [period, setPeriod] = useState<Period>('Harian')
  const [search, setSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState<SaleTransaction | null>(null)
  const today = localDateString(new Date())
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  const monthStart = `${today.slice(0, 7)}-01`

  const startDate =
    period === 'Harian' ? today : period === 'Mingguan' ? localDateString(weekStart) : monthStart
  const periodSales = sales
    .filter((sale) => sale.date >= startDate && sale.date <= today)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))

  const filteredSales = periodSales.filter((sale) => {
    const query = search.trim().toLowerCase()
    return (
      sale.id.toLowerCase().includes(query) ||
      sale.items.some((item) => item.toLowerCase().includes(query))
    )
  })
  const revenue = periodSales.reduce((total, sale) => total + sale.total, 0)
  const profit = periodSales.reduce((total, sale) => total + sale.profit, 0)
  const cashReceived = periodSales
    .filter((sale) => sale.payment === 'Tunai')
    .reduce((total, sale) => total + sale.total, 0)
  const averageTransaction = periodSales.length ? revenue / periodSales.length : 0
  const margin = revenue ? (profit / revenue) * 100 : 0

  function printReport() {
    window.print()
  }

  return (
    <main className="reports-page">
      <header className="reports-heading">
        <div>
          <span className="reports-eyebrow"><TrendingUp size={13} /> RINGKASAN KEUANGAN</span>
          <h2>Laporan Omzet &amp; Penjualan</h2>
          <p>Pantau pendapatan harian dan estimasi keuntungan bersih toko tanpa grafik rumit.</p>
        </div>
        <button className="reports-print" onClick={printReport}>
          <Printer size={14} /> Cetak Laporan
        </button>
      </header>

      <section className="reports-period-bar" aria-label="Periode laporan">
        <div className="reports-period-options">
          {(['Harian', 'Mingguan', 'Bulanan'] as const).map((item) => (
            <button
              key={item}
              className={period === item ? 'selected' : ''}
              onClick={() => setPeriod(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <span className="reports-date"><CalendarDays size={13} /> {formatDate(today)}</span>
      </section>

      <section className="reports-summary">
        <article className="revenue">
          <span>TOTAL OMZET</span>
          <strong>{formatRupiah(revenue)}</strong>
          <small>● {periodSales.length} transaksi pada periode ini</small>
          <CircleDollarSign size={22} />
        </article>
        <article className="profit">
          <span>ESTIMASI KEUNTUNGAN</span>
          <strong>{formatRupiah(profit)}</strong>
          <small>Margin bersih warung: {margin.toFixed(1)}%</small>
          <TrendingUp size={22} />
        </article>
        <article>
          <span>JUMLAH TRANSAKSI</span>
          <strong>{periodSales.length} Transaksi</strong>
          <small>Rata-rata: {formatRupiah(averageTransaction)} / belanja</small>
          <Clock3 size={22} />
        </article>
        <article className="cash">
          <span>TOTAL KAS DITERIMA</span>
          <strong>{formatRupiah(cashReceived)}</strong>
          <small><CheckCircle2 size={11} /> 100% Tunai (Lunas)</small>
          <Wallet size={22} />
        </article>
      </section>

      <section className="reports-history">
        <header>
          <div>
            <h3>Riwayat Transaksi Penjualan</h3>
            <p>Daftar struk belanja pembeli terbaru pada periode ini</p>
          </div>
          <label className="reports-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor struk atau barang..."
            />
          </label>
        </header>

        <div className="reports-table-scroll">
          <table className="reports-table">
            <thead>
              <tr>
                <th>NO. STRUK</th><th>WAKTU</th><th>ITEM BELANJA</th>
                <th>TOTAL BELANJA</th><th>PEMBAYARAN</th><th>STATUS</th><th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td><strong className="report-receipt-id">#{sale.id}</strong></td>
                  <td>{sale.time}<small>{formatDate(sale.date)}</small></td>
                  <td>
                    {sale.items.slice(0, 2).join(', ')}
                    <small>{sale.items.length} barang belanja</small>
                  </td>
                  <td><strong>{formatRupiah(sale.total)}</strong></td>
                  <td><span className="report-payment">{sale.payment}</span></td>
                  <td><span className="report-status">{sale.status}</span></td>
                  <td><button className="report-view-receipt" onClick={() => setSelectedSale(sale)}>Lihat Struk</button></td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr><td colSpan={7} className="reports-empty">Belum ada transaksi yang sesuai pada periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedSale && (
        <div className="receipt-modal-backdrop" role="presentation" onClick={() => setSelectedSale(null)}>
          <section
            className="receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h3 id="receipt-title">Detail Struk</h3>
              <button aria-label="Tutup" onClick={() => setSelectedSale(null)}><X size={17} /></button>
            </header>
            <div className="receipt-modal-content">
              <strong>TOKO BERKAH MADURA</strong>
              <span>#{selectedSale.id}</span>
              <span>{formatDate(selectedSale.date)} · {selectedSale.time}</span>
              <hr />
              {selectedSale.items.map((item) => <span key={item}>{item}</span>)}
              <hr />
              <strong>Total: {formatRupiah(selectedSale.total)}</strong>
              <span>Pembayaran: {selectedSale.payment}</span>
              <span>Kasir: {selectedSale.cashier}</span>
            </div>
            <button className="reports-print" onClick={printReport}><Printer size={14} /> Cetak Struk</button>
          </section>
        </div>
      )}
    </main>
  )
}

export default ReportsPage
