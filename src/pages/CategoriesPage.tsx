import { useState, type FormEvent } from 'react'
import {
  Archive,
  CirclePlus,
  Coffee,
  Folder,
  Pencil,
  Search,
  Shapes,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { formatRupiah, type Product } from '../data/products'
import type { SaleTransaction } from '../data/sales'
import './CategoriesPage.css'

type CategoriesPageProps = {
  categories: string[]
  products: Product[]
  sales: SaleTransaction[]
  onCategoriesChange: (categories: string[]) => void
  onProductsChange: (products: Product[]) => void
}

const iconPalette = [
  { className: 'green', Icon: Folder },
  { className: 'blue', Icon: Coffee },
  { className: 'orange', Icon: Shapes },
  { className: 'red', Icon: Archive },
  { className: 'purple', Icon: ShieldCheck },
]

function normalizedName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function CategoriesPage({
  categories,
  products,
  sales,
  onCategoriesChange,
  onProductsChange,
}: CategoriesPageProps) {
  const [search, setSearch] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const categorySales = new Map<string, number>()
  for (const sale of sales) {
    for (const item of sale.items) {
      const itemName = normalizedName(item.replace(/\s*\(\d+x\)\s*$/i, ''))
      const matchingProduct = products.find((product) => {
        const productName = normalizedName(product.name)
        return itemName.includes(productName) || productName.includes(itemName)
      })
      if (matchingProduct) {
        const quantity = Number(item.match(/\((\d+)x\)\s*$/i)?.[1] ?? 1)
        categorySales.set(
          matchingProduct.category,
          (categorySales.get(matchingProduct.category) ?? 0) +
            matchingProduct.price * quantity,
        )
      }
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const categoryWithMostSales = categories.reduce(
    (best, category) =>
      (categorySales.get(category) ?? 0) > (categorySales.get(best) ?? 0)
        ? category
        : best,
    categories[0] ?? 'Belum ada kategori',
  )
  const categorizedProductCount = products.filter((product) =>
    categories.includes(product.category),
  ).length

  function openAddDialog() {
    setEditingCategory(null)
    setCategoryName('')
    setModalOpen(true)
  }

  function openEditDialog(category: string) {
    setEditingCategory(category)
    setCategoryName(category)
    setModalOpen(true)
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = categoryName.trim()
    if (!normalized) return

    if (editingCategory === null) {
      if (categories.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
        window.alert('Nama kategori tersebut sudah digunakan.')
        return
      }
      onCategoriesChange([...categories, normalized])
    } else {
      if (
        categories.some(
          (item) =>
            item !== editingCategory &&
            item.toLowerCase() === normalized.toLowerCase(),
        )
      ) {
        window.alert('Nama kategori tersebut sudah digunakan.')
        return
      }
      onCategoriesChange(
        categories.map((item) => item === editingCategory ? normalized : item),
      )
      onProductsChange(
        products.map((product) =>
          product.category === editingCategory
            ? { ...product, category: normalized }
            : product,
        ),
      )
    }
    setModalOpen(false)
  }

  function deleteCategory(category: string) {
    const productCount = products.filter(
      (product) => product.category === category,
    ).length
    if (productCount > 0) {
      window.alert(
        `Kategori ini masih digunakan oleh ${productCount} produk. Pindahkan produk tersebut sebelum menghapus kategori.`,
      )
      return
    }
    if (!window.confirm(`Hapus kategori "${category}" dari prototipe?`)) {
      return
    }
    onCategoriesChange(categories.filter((item) => item !== category))
  }

  return (
    <main className="categories-page">
      <header className="categories-heading">
        <div>
          <span className="categories-eyebrow"><Shapes size={13} /> PENGELOMPOKAN BARANG</span>
          <h2>Kategori Produk</h2>
          <p>Kelola kategori dagangan warung agar pencarian di kasir cepat dan tertata rapi.</p>
        </div>
        <button className="category-add-button" onClick={openAddDialog}>
          <CirclePlus size={14} /> Tambah Kategori Baru
        </button>
      </header>

      <section className="category-stats">
        <article>
          <span>Total Kategori</span>
          <strong>{categories.length}</strong>
          <small><ShieldCheck size={10} /> Semua aktif di etalase</small>
          <Folder className="category-stat-icon green" size={22} />
        </article>
        <article>
          <span>Total Produk Terkategori</span>
          <strong>{categorizedProductCount}</strong>
          <small>Rata-rata {categories.length ? Math.round(categorizedProductCount / categories.length) : 0} item / kategori</small>
          <Archive className="category-stat-icon blue" size={22} />
        </article>
        <article>
          <span>Kategori Terlaris Bulan Ini</span>
          <strong className="category-best-seller">{categoryWithMostSales}</strong>
          <small className="category-sales-note">
            {formatRupiah(categorySales.get(categoryWithMostSales) ?? 0)} omzet demo
          </small>
          <Shapes className="category-stat-icon orange" size={22} />
        </article>
      </section>

      <section className="category-table-card">
        <div className="category-toolbar">
          <label className="category-search">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama kategori..."
            />
          </label>
          <span>Menampilkan {filteredCategories.length} kategori</span>
        </div>
        <div className="category-table-scroll">
          <table className="category-table">
            <thead>
              <tr>
                <th>NAMA KATEGORI</th>
                <th>CONTOH BARANG</th>
                <th>JUMLAH PRODUK</th>
                <th>PENJUALAN BULAN INI</th>
                <th>STATUS</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => {
                const groupProducts = products.filter(
                  (product) => product.category === category,
                )
                const { className, Icon } = iconPalette[index % iconPalette.length]
                return (
                  <tr key={category}>
                    <td>
                      <div className="category-name">
                        <span className={`category-icon ${className}`}><Icon size={15} /></span>
                        <strong>{category}</strong>
                      </div>
                    </td>
                    <td className="category-examples">
                      {groupProducts.length
                        ? groupProducts.slice(0, 4).map((product) => product.name).join(', ')
                        : 'Belum ada produk'}
                    </td>
                    <td><strong>{groupProducts.length} item</strong></td>
                    <td className="category-sales-value">
                      {formatRupiah(categorySales.get(category) ?? 0)}
                    </td>
                    <td><span className="category-active-badge">Aktif</span></td>
                    <td>
                      <div className="category-actions">
                        <button aria-label={`Edit kategori ${category}`} title="Edit" onClick={() => openEditDialog(category)}><Pencil size={13} /></button>
                        <button aria-label={`Hapus kategori ${category}`} title="Hapus" onClick={() => deleteCategory(category)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredCategories.length === 0 && (
                <tr><td colSpan={6} className="category-empty">Kategori tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="category-modal-backdrop" role="presentation">
          <form
            className="category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onSubmit={saveCategory}
          >
            <header>
              <div>
                <h3 id="category-modal-title">{editingCategory === null ? 'Tambah Kategori' : 'Edit Kategori'}</h3>
                <p>Kategori akan langsung tersedia saat menambah atau mengedit produk.</p>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setModalOpen(false)}><X size={17} /></button>
            </header>
            <label>
              Nama Kategori
              <input
                autoFocus
                required
                maxLength={40}
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Contoh: Perlengkapan Rumah"
              />
            </label>
            <footer>
              <button type="button" className="category-cancel" onClick={() => setModalOpen(false)}>Batal</button>
              <button type="submit" className="category-add-button">{editingCategory === null ? 'Tambah Kategori' : 'Simpan Perubahan'}</button>
            </footer>
          </form>
        </div>
      )}
    </main>
  )
}

export default CategoriesPage
