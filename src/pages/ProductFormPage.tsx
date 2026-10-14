import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import {
  ArrowLeft,
  Barcode,
  Check,
  CheckCircle2,
  CircleHelp,
  ImagePlus,
  Lightbulb,
  PackageCheck,
  Plus,
  Save,
  ScanLine,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import type { Product } from '../data/products'
import { formatRupiah } from '../data/products'
import './ProductFormPage.css'

export type ProductFormValues = Omit<Product, 'id'>

type ProductFormPageProps = {
  product?: Product
  categories: string[]
  onAddCategory: (name: string) => void
  onSave: (product: ProductFormValues) => void
  onCancel: () => void
}

const units = [
  { label: 'Pcs / Bungkus', value: 'bungkus' },
  { label: 'Pouch Refill', value: 'pouch' },
  { label: 'Botol', value: 'botol' },
  { label: 'Sachet / Renceng', value: 'renceng' },
  { label: 'Dus / Karton', value: 'dus' },
  { label: 'Sak / Karung', value: 'sak' },
  { label: 'Kg (Kiloan)', value: 'kg' },
  { label: 'Liter', value: 'liter' },
  { label: 'Tabung', value: 'tabung' },
]

function ProductFormPage({
  product,
  categories,
  onAddCategory,
  onSave,
  onCancel,
}: ProductFormPageProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? categories[0] ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'bungkus')
  const [cost, setCost] = useState(String(product?.cost ?? ''))
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [stock, setStock] = useState(String(product?.stock ?? 0))
  const [minStock, setMinStock] = useState(String(product?.minStock ?? 5))
  const [location, setLocation] = useState(product?.location ?? '')
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [posEnabled, setPosEnabled] = useState(product?.posEnabled ?? true)
  const [formError, setFormError] = useState('')

  const costValue = Number(cost) || 0
  const priceValue = Number(price) || 0
  const marginValue = priceValue > 0
    ? ((priceValue - costValue) / priceValue) * 100
    : 0
  const profitValue = priceValue - costValue

  function loadImage(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFormError('Pilih file gambar dengan format yang didukung.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Ukuran foto maksimal 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result)
        setFormError('')
      }
    })
    reader.addEventListener('error', () => {
      setFormError('Foto produk gagal dibaca. Silakan coba file lain.')
    })
    reader.readAsDataURL(file)
  }

  function updateImage(event: ChangeEvent<HTMLInputElement>) {
    loadImage(event.target.files?.[0])
    event.currentTarget.value = ''
  }

  function dropImage(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    loadImage(event.dataTransfer.files[0])
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (priceValue <= costValue) {
      setFormError('Harga jual harus lebih tinggi dari harga modal untuk mendapatkan keuntungan.')
      return
    }
    setFormError('')
    onSave({
      name: name.trim(),
      category,
      sku: sku.trim(),
      barcode: barcode.trim(),
      unit,
      cost: costValue,
      price: priceValue,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      location: location.trim(),
      imageUrl,
      posEnabled,
    })
  }

  function generateSku() {
    const generated = `MD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    setSku(generated)
    setBarcode(generated)
  }

  function addCategory() {
    const value = window.prompt('Masukkan nama kategori baru')
    const newCategory = value?.trim()
    if (!newCategory) return
    const existingCategory = categories.find(
      (item) => item.toLowerCase() === newCategory.toLowerCase(),
    )
    if (existingCategory) {
      setCategory(existingCategory)
      return
    }
    onAddCategory(newCategory)
    setCategory(newCategory)
  }

  return (
    <main className="product-form-page">
      <nav className="product-form-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={onCancel}>Manajemen Produk</button>
        <span>›</span>
        <strong>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</strong>
      </nav>

      <form
        className="product-form"
        onSubmit={submit}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
          } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            event.currentTarget.requestSubmit()
          }
        }}
      >
        <header className="product-form-heading">
          <div className="product-form-title">
            <button className="product-back-button" type="button" aria-label="Kembali ke produk" onClick={onCancel}>
              <ArrowLeft size={17} />
            </button>
            <div>
              <h2>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <p>Masukkan rincian informasi barang dagangan baru untuk etalase dan kasir toko.</p>
            </div>
          </div>
          <div className="product-form-top-actions">
            <button className="product-form-cancel" type="button" onClick={onCancel}><X size={13} /> Batal</button>
            <button className="product-form-save" type="submit"><CheckCircle2 size={14} /> Simpan Produk</button>
          </div>
        </header>

        <div className="product-form-layout">
          <div className="product-form-main">
            <section className="product-form-card basic-product-card">
              <header className="product-section-title">
                <span><Barcode size={15} /></span>
                <strong>Informasi Dasar Produk</strong>
                <small>Langkah 1 dari 3</small>
              </header>

              <label className="product-form-field">
                <span>Nama Produk Lengkap <b>*</b></span>
                <input
                  required
                  autoFocus
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Contoh: Minyak Goreng 2 Liter"
                />
                <small>Tuliskan merek, jenis, dan takaran/bobot agar kasir mudah membedakan.</small>
              </label>

              <div className="product-form-two-columns">
                <label className="product-form-field">
                  <span>Kategori Produk <b>*</b></span>
                  <select required value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <button className="product-inline-link" type="button" onClick={addCategory}><Plus size={10} /> +Tambah Kategori</button>
                </label>

                <label className="product-form-field">
                  <span>Barcode / Kode SKU</span>
                  <div className="product-input-with-action">
                    <input
                      value={barcode || sku}
                      onChange={(event) => {
                        setBarcode(event.target.value)
                        setSku(event.target.value)
                      }}
                      placeholder="Masukkan barcode atau SKU"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const generated = `899${Date.now().toString().slice(-10)}`
                        setBarcode(generated)
                        setSku(generated)
                      }}
                    ><ScanLine size={13} /> Scan</button>
                  </div>
                  <button className="product-inline-link sku-generate" type="button" onClick={generateSku}><Sparkles size={10} /> Buat Otomatis</button>
                </label>
              </div>

              <fieldset className="product-units">
                <legend>Satuan Barang Terkecil (Dijual per)</legend>
                <div>
                  {units.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={unit === item.value ? 'selected' : ''}
                      onClick={() => setUnit(item.value)}
                    >
                      {unit === item.value && <Check size={11} />}{item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="product-form-field product-location-field">
                <span>Catatan Letak Rak / Posisi Barang <small>Opsional</small></span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Contoh: Rak depan, bawah etalase bumbu"
                />
              </label>
            </section>

            <section className="product-form-card price-product-card">
              <header className="product-section-title">
                <span className="price-icon"><CircleHelp size={15} /></span>
                <div><strong>Harga Jual &amp; Margin Keuntungan</strong><small>Kalkulator margin otomatis terhitung saat nominal diisi.</small></div>
                <small className="auto-margin"><span>●</span> Auto-Margin</small>
              </header>

              <div className="product-form-two-columns">
                <label className="product-form-field">
                  <span>Harga Modal Beli (Kulakan) <CircleHelp size={10} /></span>
                  <div className="rupiah-input"><b>Rp</b><input type="number" required min="0" value={cost} onChange={(event) => setCost(event.target.value)} /></div>
                  <small>Modal per 1 kemasan {unit.toLowerCase()}.</small>
                </label>
                <label className="product-form-field">
                  <span>Harga Jual Kasir <b>*</b></span>
                  <div className="rupiah-input sale-price"><b>Rp</b><input type="number" required min="1" value={price} onChange={(event) => setPrice(event.target.value)} /></div>
                  <small>Harga resmi yang dibayar oleh pembeli.</small>
                </label>
              </div>

              <div className={`product-profit-preview ${profitValue < 0 ? 'negative' : ''}`}>
                <span><TrendingUp size={18} /></span>
                <div><small>KEUNTUNGAN BERSIH / PCS</small><strong>{formatRupiah(profitValue)}</strong></div>
                <div className="product-margin-result"><small>Persentase Margin</small><strong>{marginValue.toFixed(1)}% <em>{marginValue >= 15 ? 'Sangat Sehat' : 'Perlu Diperhatikan'}</em></strong></div>
              </div>
            </section>

            <section className="product-form-card stock-product-card">
              <header className="product-section-title">
                <span><PackageCheck size={15} /></span>
                <strong>Manajemen Stok &amp; Peringatan Kulakan</strong>
                <small>Inventori Warung</small>
              </header>
              <div className="product-form-two-columns">
                <label className="product-form-field">
                  <span>Jumlah Stok Tersedia Saat Ini</span>
                  <div className="product-stock-input">
                    <input type="number" required min="0" value={stock} onChange={(event) => setStock(event.target.value)} />
                    <span>{unit}</span>
                  </div>
                  <small>Sesuai hitungan fisik saat barang masuk warung.</small>
                </label>
                <label className="product-form-field">
                  <span>Batas Peringatan Stok Menipis <b className="warning-star">⚠</b></span>
                  <div className="product-stock-input">
                    <input type="number" min="0" value={minStock} onChange={(event) => setMinStock(event.target.value)} />
                    <button type="button">Batas Min.</button>
                  </div>
                  <small>Munculkan badge orange jika tersisa {minStock || 0} {unit}.</small>
                </label>
              </div>
              <div className="product-pos-toggle">
                <div><strong>Status Penjualan Kasir</strong><small>Jika dimatikan, produk ini disimpan di database namun disembunyikan dari layar transaksi kasir harian.</small></div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={posEnabled}
                  aria-label="Status penjualan kasir"
                  className={posEnabled ? 'enabled' : ''}
                  onClick={() => setPosEnabled((enabled) => !enabled)}
                ><span /></button>
              </div>
            </section>

            {formError && <p className="product-form-error" role="alert">{formError}</p>}
          </div>

          <aside className="product-form-side">
            <section className="product-form-card product-photo-card">
              <header className="product-section-title"><span><ImagePlus size={15} /></span><strong>Foto Produk</strong></header>
              <div
                className="product-upload-area"
                role="button"
                tabIndex={0}
                aria-label="Pilih atau seret foto produk"
                onClick={() => fileInput.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    fileInput.current?.click()
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={dropImage}
              >
                {imageUrl ? <img src={imageUrl} alt="Pratinjau produk" /> : <ImagePlus size={35} />}
                {!imageUrl && <strong>Klik untuk Ganti Foto</strong>}
                <span>Seret foto barang kemasan dari laptop atau ambil via kamera smartphone.</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={updateImage}
                />
              </div>
              <p className="product-image-help">ⓘ Maksimal ukuran file 2 MB (.jpg, .png). Jika tidak memiliki foto, kasir akan otomatis menampilkan ikon ilustrasi kategori sembako.</p>
              <div className="product-photo-actions">
                <button type="button" onClick={() => fileInput.current?.click()}><ImagePlus size={12} /> Pilih Berkas</button>
                {imageUrl && <button type="button" className="delete-photo" onClick={() => setImageUrl('')}><Trash2 size={12} /> Hapus</button>}
              </div>
            </section>

            <section className="product-form-card product-tips-card">
              <header><Lightbulb size={15} /><strong>Tips Sukses Warung Madura</strong></header>
              <p>"Pastikan selisih antara harga kulakan dan harga eceran kasir minimal 8% – 15% untuk produk sembako basah/kering guna mencukupi biaya operasional lampu penerangan 24 jam &amp; kebersihan toko."</p>
              <div className="product-keyboard-help">
                <strong>Pintasan Keyboard</strong><span>Cepat &amp; Praktis</span>
                <small>Simpan Cepat <b>Ctrl + Enter</b></small>
                <small>Batal &amp; Kembali <b>Esc</b></small>
              </div>
            </section>
          </aside>
        </div>

        <footer className="product-form-footer">
          <span><i /> Data belum tersimpan. Pastikan harga modal &amp; harga kasir telah diverifikasi.</span>
          <div>
            <button type="button" onClick={onCancel}>Batal</button>
            <button type="submit"><Save size={13} /> Simpan Produk Baru</button>
          </div>
        </footer>
      </form>
    </main>
  )
}

export default ProductFormPage
