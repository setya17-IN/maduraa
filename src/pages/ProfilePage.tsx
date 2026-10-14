
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBasket,
  Package,
  Shapes,
  ChartNoAxesColumn,
  Store,
  LogOut,
  Mail,
  Phone,
  LockKeyhole,
  Printer,
  Save,
  ShieldCheck,
} from 'lucide-react'
import './ProfilePage.css'

function ProfilePage() {
  const navigate = useNavigate()

  const [owner, setOwner] = useState('Cak Mahmud')
  const [email] = useState('cakmahmud@warung.com')
  const [phone, setPhone] = useState('0812-3456-7890')
  const [storeName, setStoreName] = useState('Toko Berkah Madura')
  const [status, setStatus] = useState('Buka 24 Jam Non-Stop')
  const [address, setAddress] = useState(
    'Jl. Raya Kalianget No. 12, Sumenep, Madura',
  )
  const [receiptMessage, setReceiptMessage] = useState(
    'Matur sakalangkong telah belanja di Toko Berkah Madura',
  )
  const [notice, setNotice] = useState('')

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Demo frontend: data belum disimpan ke database.
    setNotice('Perubahan berhasil diterapkan pada tampilan ini.')
  }

  function handleLogout() {
    navigate('/login')
  }

  return (
    <main className="profile-app">
      <aside className="profile-sidebar">
        <div className="profile-brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>Maduraa</strong>
            <span>Catatan Omzet Warung</span>
          </div>
        </div>

        <div className="profile-store-badge">
          <Store size={17} />
          <div>
            <strong>{storeName}</strong>
            <span>● Buka 24 Jam</span>
          </div>
        </div>

        <nav className="profile-menu">
          <button onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={15} /> Dashboard
          </button>
          <button onClick={() => navigate('/dashboard')}>
            <ShoppingBasket size={15} /> Transaksi
          </button>
          <button onClick={() => navigate('/dashboard')}>
            <Package size={15} /> Produk
          </button>
          <button onClick={() => navigate('/dashboard')}>
            <Shapes size={15} /> Kategori
          </button>
          <button onClick={() => navigate('/dashboard')}>
            <ChartNoAxesColumn size={15} /> Laporan
          </button>
          <button className="active">
            <Store size={15} /> Profil Warung
          </button>
        </nav>

        <button className="profile-logout" onClick={handleLogout}>
          <LogOut size={16} /> Keluar akun
        </button>
      </aside>

      <section className="profile-main">
        <header className="profile-topbar">
          <div>
            <strong>Halo, {owner}!</strong>
            <span>Senin, 24 Oktober 2024</span>
          </div>

          <div className="profile-topbar-right">
            <span className="profile-online">● Kasir Aktif</span>
            <span className="profile-balance">💵 Kas Fisik: <b>Rp 450.000</b></span>
          </div>
        </header>

        <div className="profile-content">
          <section className="profile-page-heading">
            <div>
              <span className="profile-eyebrow">
                <Store size={12} /> PENGATURAN AKUN & TOKO
              </span>
              <h1>Profil Warung & Akun</h1>
              <p>Kelola identitas warung, informasi cetak struk, dan hak akses staf kasir.</p>
            </div>

            <button className="profile-logout-top" onClick={handleLogout}>
              <LogOut size={14} /> Keluar Akun (Logout)
            </button>
          </section>

          <div className="profile-columns">
            <div className="profile-left-column">
              <section className="profile-owner-card">
                <div className="owner-avatar">
                  {owner.trim().slice(0, 2).toUpperCase() || 'CM'}
                </div>
                <h2>{owner}</h2>
                <span className="owner-role">Pemilik Warung (Owner)</span>

                <div className="owner-divider" />

                <div className="owner-detail">
                  <Mail size={14} />
                  <div>
                    <span>Email Terdaftar</span>
                    <strong>{email}</strong>
                  </div>
                </div>

                <div className="owner-detail">
                  <Phone size={14} />
                  <div>
                    <span>Nomor WhatsApp</span>
                    <strong>{phone}</strong>
                  </div>
                </div>

                <div className="owner-detail">
                  <LockKeyhole size={14} />
                  <div>
                    <span>PIN Keamanan Kasir</span>
                    <strong className="pin-status">Aktif (6 Digit)</strong>
                  </div>
                </div>
              </section>

              <section className="staff-card">
                <h3><ShieldCheck size={15} /> Batasan Hak Staf Kasir</h3>
                <p>
                  Karyawan jaga toko hanya diberikan akses untuk melayani
                  pembeli dan cek ketersediaan stok produk.
                </p>

                <div className="permission-row">
                  <span>Transaksi Kasir (POS)</span>
                  <strong>Bisa Akses</strong>
                </div>
                <div className="permission-row">
                  <span>Lihat Stok Produk</span>
                  <strong>Bisa Akses</strong>
                </div>
                <div className="permission-row locked">
                  <span>Laporan Omzet & Margin</span>
                  <strong>Terkunci</strong>
                </div>
              </section>
            </div>

            <div className="profile-right-column">
              <form className="store-settings-card" onSubmit={handleSave}>
                <div className="settings-heading">
                  <div>
                    <h2>Informasi Identitas Warung</h2>
                    <p>Data ini otomatis tercetak pada bagian kepala struk belanja pembeli.</p>
                  </div>
                  <Store size={18} />
                </div>

                <div className="profile-form-grid">
                  <label>
                    Nama Pemilik
                    <input
                      value={owner}
                      onChange={(event) => setOwner(event.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Status Operasional
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                    >
                      <option>Buka 24 Jam Non-Stop</option>
                      <option>Buka</option>
                      <option>Tutup Sementara</option>
                    </select>
                  </label>

                  <label className="full-width">
                    Nama Warung
                    <input
                      value={storeName}
                      onChange={(event) => setStoreName(event.target.value)}
                      required
                    />
                  </label>

                  <label className="full-width">
                    Alamat Lengkap Warung
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      required
                    />
                  </label>

                  <label className="full-width">
                    Pesan Kaki Struk (Footer Receipt)
                    <input
                      value={receiptMessage}
                      onChange={(event) => setReceiptMessage(event.target.value)}
                    />
                    <small>
                      Kalimat sapaan khas warung yang akan tercetak otomatis
                      di ujung bawah struk.
                    </small>
                  </label>

                  <label className="full-width">
                    Nomor WhatsApp Warung
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="printer-info">
                  <Printer size={20} />
                  <div>
                    <strong>Printer Thermal Kasir</strong>
                    <span>Bluetooth / USB 58mm & 80mm</span>
                  </div>
                  <span className="printer-status">Siap Cetak</span>
                </div>

                {notice && (
                  <p className="profile-save-notice" role="status">
                    {notice}
                  </p>
                )}

                <div className="profile-save-actions">
                  <button type="submit">
                    <Save size={14} /> Simpan Perubahan
                  </button>
                </div>
              </form>

              <section className="receipt-preview-card">
                <span className="receipt-section-title">
                  PRATINJAU STRUK CETAK
                </span>

                <div className="receipt-paper">
                  <strong className="receipt-store-name">{storeName}</strong>
                  <p>{address}</p>
                  <p>{status}</p>

                  <div className="receipt-line" />

                  <div className="receipt-row">
                    <span>24/10/2024 14:30</span>
                    <span>Kasir: {owner}</span>
                  </div>

                  <div className="receipt-row receipt-total">
                    <strong>Total Belanja:</strong>
                    <strong>Rp 185.000</strong>
                  </div>

                  <div className="receipt-line" />

                  <p className="receipt-footer-message">
                    "{receiptMessage}"
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProfilePage
