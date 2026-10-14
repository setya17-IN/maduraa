
import { useMemo, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingBasket,
  Package,
  Shapes,
  ChartNoAxesCombined,
  Store,
  LogOut,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  Wallet,
  AlertTriangle,
  Mail,
  Phone,
  LockKeyhole,
  ShieldCheck,
  Save,
  Printer,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  loadDemoStoreProfile,
  saveDemoStoreProfile,
  type StoreProfile,
} from '../data/demoStoreProfile'
import ProductsPage from './ProductsPage'
import ReportsPage from './ReportsPage'
import CategoriesPage from './CategoriesPage'
import OverviewPage from './OverviewPage'
import {
  formatRupiah,
  initialProducts,
  productCategories,
  type Product,
} from '../data/products'
import { initialDemoSales, type SaleTransaction } from '../data/sales'
import './DashboardPage.css'

type ProfileSettingsProps = {
  profile: StoreProfile
  onChange: (field: keyof StoreProfile, value: string) => void
  onSave: () => void
  saved: boolean
  onLogout: () => void
}

function ProfileSettings({
  profile,
  onChange,
  onSave,
  saved,
  onLogout,
}: ProfileSettingsProps) {
  const [printerReady, setPrinterReady] = useState(true)
  const initials = profile.ownerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0].toUpperCase())
    .join('')

  function field(
    key: keyof StoreProfile,
    label: string,
    type = 'text',
  ) {
    return (
      <label className="profile-field">
        <span>{label}</span>
        <input
          type={type}
          value={profile[key]}
          onChange={(event) => onChange(key, event.target.value)}
          required
        />
      </label>
    )
  }

  return (
    <div className="profile-page">
      <header className="profile-page-heading">
        <div>
          <span className="profile-eyebrow">
            <Store size={13} /> PENGATURAN AKUN &amp; TOKO
          </span>
          <h2>Profil Warung &amp; Akun</h2>
          <p>Kelola identitas warung, informasi cetak struk, dan hak akses staf kasir.</p>
        </div>
        <button className="profile-logout" type="button" onClick={onLogout}>
          <LogOut size={14} /> Keluar Akun (Logout)
        </button>
      </header>

      <div className="profile-layout">
        <aside className="profile-sidebar-cards">
          <section className="profile-owner-card">
            <div className="profile-owner-avatar">{initials || 'CM'}</div>
            <h3>{profile.ownerName || 'Nama Pemilik'}</h3>
            <span className="profile-owner-badge">Pemilik Warung (Owner)</span>
            <div className="profile-account-details">
              <div>
                <Mail size={13} />
                <span><small>Email Terdaftar</small>{profile.email}</span>
              </div>
              <div>
                <Phone size={13} />
                <span><small>Nomor WhatsApp</small>{profile.phone}</span>
              </div>
              <div>
                <LockKeyhole size={13} />
                <span><small>PIN Keamanan Kasir</small>Aktif ({profile.pin.length} Digit)</span>
              </div>
            </div>
          </section>

          <section className="profile-access-card">
            <h3><ShieldCheck size={14} /> Batasan Hak Staf Kasir</h3>
            <p>Karyawan jaga toko hanya diberikan akses untuk melayani pembeli dan cek ketersediaan stok produk:</p>
            <div><span>Transaksi Kasir (POS)</span><strong>Bisa Akses</strong></div>
            <div><span>Lihat Stok Produk</span><strong>Bisa Akses</strong></div>
            <div className="restricted"><span>Laporan Omzet &amp; Margin</span><strong>Terkunci</strong></div>
          </section>
        </aside>

        <div className="profile-main-column">
          <form
            className="profile-form-card"
            onSubmit={(event) => {
              event.preventDefault()
              onSave()
            }}
          >
            <div className="profile-form-heading">
              <div>
                <h3>Informasi Identitas Warung</h3>
                <p>Data ini otomatis tercetak pada bagian kepala struk belanja pembeli.</p>
              </div>
              <Store size={17} />
            </div>

            <div className="profile-fields-grid">
              {field('storeName', 'Nama Warung')}
              {field('operatingHours', 'Status Operasional')}
              {field('address', 'Alamat Lengkap Warung')}
              {field('receiptFooter', 'Pesan Kaki Struk (Footer Receipt)')}
            </div>
            <p className="profile-helper">Kalimat sapaan khas Madura yang akan tercetak otomatis di ujung bawah struk.</p>

            <button
              className={`printer-status ${printerReady ? '' : 'printer-off'}`}
              type="button"
              onClick={() => setPrinterReady((ready) => !ready)}
            >
              <Printer size={16} />
              <span><strong>Printer Thermal Kasir</strong><small>Bluetooth / USB 58mm &amp; 80mm</small></span>
              <b>{printerReady ? 'Siap Cetak' : 'Tidak Aktif'}</b>
            </button>

            <div className="profile-save-row">
              {saved && <span role="status">Perubahan profil berhasil diperbarui.</span>}
              <button className="profile-save-button" type="submit">
                <Save size={14} /> Simpan Perubahan
              </button>
            </div>
          </form>

          <section className="receipt-preview-card">
            <h3>PRATINJAU STRUK CETAK</h3>
            <div className="receipt-preview">
              <strong>{profile.storeName || 'NAMA WARUNG'}</strong>
              <span>{profile.address}</span>
              <span>{profile.operatingHours}</span>
              <hr />
              <div><span>24/10/2024 14:30</span><span>Kasir: {profile.ownerName}</span></div>
              <div><b>Total Belanja:</b><b>Rp 185.000</b></div>
              <em>“{profile.receiptFooter}”</em>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('Transaksi Kasir')
  const [productList, setProductList] = useState(initialProducts)
  const [categories, setCategories] = useState(
    productCategories.filter((category) => category !== 'Semua'),
  )
  const [sales, setSales] = useState(initialDemoSales)
  const [storeProfile, setStoreProfile] = useState(loadDemoStoreProfile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [category, setCategory] = useState('Semua')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cash, setCash] = useState('200000')
  const [discount, setDiscount] = useState(0)
  const [notice, setNotice] = useState('')
  const ownerInitials = storeProfile.ownerName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0].toUpperCase())
    .join('')
  const todayLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const filteredProducts = productList.filter((product) => {
    const matchCategory =
      category === 'Semua' || product.category === category
    const matchSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase())

    return product.posEnabled !== false && matchCategory && matchSearch
  })

  const cartItems = productList.filter((product) => (cart[product.id] ?? 0) > 0)

  const subtotal = useMemo(
    () =>
      productList.reduce(
        (total, product) =>
          total +
          (product.posEnabled !== false ? product.price * (cart[product.id] ?? 0) : 0),
        0,
      ),
    [cart, productList],
  )

  const total = Math.max(0, subtotal - discount)
  const cashAmount = Number(cash) || 0
  const change = Math.max(0, cashAmount - total)

  function addProduct(product: Product) {
    if ((cart[product.id] ?? 0) >= product.stock) {
      setNotice('Stok produk tidak mencukupi.')
      return
    }

    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] ?? 0) + 1,
    }))
    setNotice('')
  }

  function updateQuantity(id: number, amount: number) {
    setCart((current) => {
      const next = { ...current }
      const quantity = (next[id] ?? 0) + amount

      if (quantity <= 0) {
        delete next[id]
      } else {
        next[id] = Math.min(
          quantity,
          productList.find((product) => product.id === id)?.stock ?? quantity,
        )
      }

      return next
    })
    setNotice('')
  }

  function saveTransaction() {
    if (cartItems.length === 0) {
      setNotice('Tambahkan produk ke keranjang terlebih dahulu.')
      return
    }

    if (cashAmount < total) {
      setNotice('Uang yang diterima belum mencukupi.')
      return
    }

    const now = new Date()
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const transaction: SaleTransaction = {
      id: `TRX-${date.replaceAll('-', '')}-${String(now.getTime()).slice(-4)}`,
      date,
      time,
      items: cartItems.map(
        (product) => `${product.name} (${cart[product.id]}x)`,
      ),
      productLines: cartItems.map((product) => ({
        productId: product.id,
        quantity: cart[product.id] ?? 0,
      })),
      total,
      profit: Math.max(
        0,
        cartItems.reduce(
          (amount, product) =>
            amount + (product.price - product.cost) * (cart[product.id] ?? 0),
          0,
        ) - discount,
      ),
      payment: 'Tunai',
      status: 'Selesai',
      cashier: storeProfile.ownerName,
    }
    setSales((current) => [transaction, ...current])
    setProductList((current) =>
      current.map((product) => ({
        ...product,
        stock: Math.max(0, product.stock - (cart[product.id] ?? 0)),
      })),
    )
    setNotice('Transaksi berhasil dicatat pada demo ini.')
    setCart({})
    setCash('200000')
    setDiscount(0)
  }

  function handleMenu(menu: string) {
    setActiveMenu(menu)

    if (
      menu !== 'Transaksi Kasir' &&
      menu !== 'Dashboard' &&
      menu !== 'Profil Warung' &&
      menu !== 'Produk' &&
      menu !== 'Laporan Omzet' &&
      menu !== 'Kategori'
    ) {
      setNotice(`Menu ${menu} belum diimplementasikan.`)
    } else {
      setNotice('')
    }
  }

  function updateStoreProfile(field: keyof StoreProfile, value: string) {
    setStoreProfile((current) => ({ ...current, [field]: value }))
    setProfileSaved(false)
  }

  function updateProducts(nextProducts: Product[]) {
    setProductList(nextProducts)
    setCart((current) =>
      Object.fromEntries(
        Object.entries(current).flatMap(([id, quantity]) => {
          const product = nextProducts.find((item) => item.id === Number(id))
          return product && product.stock > 0 && product.posEnabled !== false
            ? [[Number(id), Math.min(quantity, product.stock)]]
            : []
        }),
      ),
    )
  }

  return (
    <main className="cashier-app">
      <aside className="cashier-sidebar">
        <div className="brand">
          <Store size={25} />
          <div>
            <strong>Maduraa</strong>
            <span>Sistem Kasir Toko</span>
          </div>
        </div>

        <div className="store-card">
          <Store size={18} />
          <div>
            <strong>{storeProfile.storeName || 'Nama Warung'}</strong>
            <span>● {storeProfile.operatingHours}</span>
          </div>
        </div>

        <nav className="side-menu">
          {[
            { label: 'Dashboard', icon: LayoutDashboard },
            { label: 'Transaksi Kasir', icon: ShoppingBasket },
            { label: 'Produk', icon: Package },
            { label: 'Kategori', icon: Shapes },
            { label: 'Laporan Omzet', icon: ChartNoAxesCombined },
            { label: 'Profil Warung', icon: Store },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={activeMenu === label ? 'active' : ''}
              onClick={() => handleMenu(label)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <button
          className="logout-button"
          onClick={() => navigate('/login')}
        >
          <LogOut size={16} />
          Keluar
        </button>
      </aside>

      <section className="cashier-main">
        <header className="cashier-topbar">
          <div>
            <h1>Halo, {storeProfile.ownerName || 'Pemilik Warung'}!</h1>
            <p>{todayLabel}</p>
          </div>

          <div className="topbar-info">
            <span className="online-badge">● Kasir Online</span>
            <span className="balance-badge">
              <Wallet size={13} /> Kas Fisik: Rp 450.000
            </span>
            <span className="user-avatar">{ownerInitials || 'PW'}</span>
          </div>
        </header>

        {activeMenu === 'Dashboard' ? (
          <OverviewPage
            products={productList}
            sales={sales}
            onNavigate={handleMenu}
          />
        ) : activeMenu === 'Profil Warung' ? (
          <ProfileSettings
            profile={storeProfile}
            onChange={updateStoreProfile}
            onSave={() => {
              saveDemoStoreProfile(storeProfile)
              setProfileSaved(true)
            }}
            saved={profileSaved}
            onLogout={() => navigate('/login')}
          />
        ) : activeMenu === 'Produk' ? (
          <ProductsPage
            products={productList}
            categories={categories}
            onProductsChange={updateProducts}
            onCategoriesChange={setCategories}
          />
        ) : activeMenu === 'Kategori' ? (
          <CategoriesPage
            categories={categories}
            products={productList}
            sales={sales}
            onCategoriesChange={setCategories}
            onProductsChange={updateProducts}
          />
        ) : activeMenu === 'Laporan Omzet' ? (
          <ReportsPage sales={sales} />
        ) : (
        <div className="cashier-workspace">
          <section className="product-section">
            <div className="product-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari produk (ketik beras, minyak, rokok, mie...)"
              />
              <span>▥ Pindai</span>
            </div>

            <div className="category-list">
              {productCategories.map((item) => (
                <button
                  key={item}
                  className={category === item ? 'selected' : ''}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            {notice && (
              <div className="cashier-notice" role="status">
                <AlertTriangle size={15} />
                {notice}
              </div>
            )}

            {activeMenu !== 'Transaksi Kasir' && (
              <div className="section-placeholder">
                <h2>{activeMenu}</h2>
                <p>
                  Bagian ini masih berupa tampilan awal. Fitur
                  {` ${activeMenu.toLowerCase()} `}dapat dikembangkan
                  berikutnya.
                </p>
                <button onClick={() => handleMenu('Transaksi Kasir')}>
                  Kembali ke Transaksi Kasir
                </button>
              </div>
            )}

            {activeMenu === 'Transaksi Kasir' && (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article
                    className={`product-card ${
                      product.stock === 0 ? 'out-of-stock' : ''
                    }`}
                    key={product.id}
                  >
                    <div className="product-meta">
                      <span>{product.category}</span>
                      <span className={product.stock === 0 ? 'stock-empty' : 'stock-badge'}>
                        {product.stock === 0
                          ? 'Stok Habis'
                          : `Stok: ${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    <h3>{product.name}</h3>
                    <strong className="product-price">
                      {formatRupiah(product.price)}
                    </strong>

                    <button
                      className="add-product"
                      disabled={
                        product.stock === 0 ||
                        (cart[product.id] ?? 0) >= product.stock
                      }
                      onClick={() => addProduct(product)}
                    >
                      <Plus size={15} />
                      Tambah
                    </button>
                  </article>
                ))}

                {filteredProducts.length === 0 && (
                  <p>Produk tidak ditemukan.</p>
                )}
              </div>
            )}
          </section>

          <aside className="cart-panel">
            <div className="cart-heading">
              <h2><ShoppingCart size={19} /> Keranjang Belanja</h2>
              <button onClick={() => setCart({})}>Kosongkan</button>
            </div>

            <div className="cart-subheading">
              <span>#TRX-DEMO-0001</span>
              <span>{cartItems.length} Macam Barang</span>
            </div>

            <div className="stock-warning">
              <AlertTriangle size={15} />
              <div>
                <strong>Pemberitahuan Stok</strong>
                <p>Periksa stok produk sebelum menyelesaikan transaksi.</p>
              </div>
            </div>

            <div className="cart-items">
              {cartItems.length === 0 && (
                <p className="empty-cart">
                  Keranjang masih kosong. Tambahkan produk terlebih dahulu.
                </p>
              )}

              {cartItems.map((product) => {
                const quantity = cart[product.id] ?? 0

                return (
                  <div className="cart-item" key={product.id}>
                    <div className="cart-item-info">
                      <strong>{product.name}</strong>
                      <span>{formatRupiah(product.price)} / {product.unit}</span>
                    </div>

                    <div className="quantity-control">
                      <button
                        aria-label={`Kurangi ${product.name}`}
                        onClick={() => updateQuantity(product.id, -1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        aria-label={`Tambah ${product.name}`}
                        disabled={quantity >= product.stock}
                        onClick={() => updateQuantity(product.id, 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <strong className="line-total">
                      {formatRupiah(product.price * quantity)}
                    </strong>
                  </div>
                )
              })}
            </div>

            <section className="total-box">
              <div>
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div>
                <label htmlFor="discount">Diskon/Potongan (Rp)</label>
                <input
                  id="discount"
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(event) =>
                    setDiscount(
                      Math.min(subtotal, Math.max(0, Number(event.target.value))),
                    )
                  }
                />
              </div>
              <div className="grand-total">
                <strong>TOTAL HARGA:</strong>
                <strong>{formatRupiah(total)}</strong>
              </div>
            </section>

            <section className="cash-section">
              <label htmlFor="cash">Uang Diterima (Tunai)</label>
              <div className="cash-input">
                <span>Rp</span>
                <input
                  id="cash"
                  type="number"
                  min="0"
                  value={cash}
                  onChange={(event) => setCash(event.target.value)}
                />
              </div>
            </section>

            <section className="change-box">
              <div>
                <span>KEMBALIAN PELANGGAN</span>
                <strong>Kembalian:</strong>
              </div>
              <strong>{formatRupiah(change)}</strong>
            </section>

            <button className="save-transaction" onClick={saveTransaction}>
              <CheckCircle size={18} />
              Simpan Transaksi (Selesai)
            </button>

            <p className="cashier-footnote">
              ⚡ Pencatatan transaksi demo belum disimpan ke server.
            </p>
          </aside>
        </div>
        )}
      </section>
    </main>
  )
}

export default DashboardPage
