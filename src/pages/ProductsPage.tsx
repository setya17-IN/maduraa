import { useState } from 'react'
import {
  AlertTriangle,
  Banknote,
  CirclePlus,
  Download,
  PackageCheck,
  Pencil,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { formatRupiah, type Product } from '../data/products'
import ProductFormPage, { type ProductFormValues } from './ProductFormPage'
import './ProductsPage.css'

type ProductsPageProps = {
  products: Product[]
  categories: string[]
  onProductsChange: (products: Product[]) => void
  onCategoriesChange: (categories: string[]) => void
}

function ProductsPage({
  products,
  categories,
  onProductsChange,
  onCategoriesChange,
}: ProductsPageProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Semua')
  const [stockFilter, setStockFilter] = useState('Semua Stok')
  const [page, setPage] = useState(1)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const pageSize = 8

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    const matchesCategory =
      categoryFilter === 'Semua' || product.category === categoryFilter
    const matchesStock =
      stockFilter === 'Semua Stok' ||
      (stockFilter === 'Stok Menipis' && product.stock > 0 && product.stock <= (product.minStock ?? 5)) ||
      (stockFilter === 'Stok Habis' && product.stock === 0) ||
      (stockFilter === 'Stok Aman' && product.stock > (product.minStock ?? 5))

    return matchesSearch && matchesCategory && matchesStock
  })
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )
  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= (product.minStock ?? 5),
  ).length
  const stockCapital = products.reduce(
    (total, product) => total + product.cost * product.stock,
    0,
  )
  const averageMargin = products.length
    ? products.reduce(
        (total, product) =>
          total +
          (product.price > 0
            ? ((product.price - product.cost) / product.price) * 100
            : 0),
        0,
      ) / products.length
    : 0
  const activeCategories = new Set(products.map((product) => product.category)).size
  const allCategories = [...new Set([...categories, ...products.map((product) => product.category)])]

  function openAddForm() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  function saveProduct(form: ProductFormValues) {
    const nextProducts = editingProduct
      ? products.map((product) =>
          product.id === editingProduct.id
            ? { ...product, ...form, sku: form.sku || product.sku }
            : product,
        )
      : [
          ...products,
          {
            ...form,
            id: Math.max(0, ...products.map((product) => product.id)) + 1,
            sku: form.sku || `DM-${Date.now().toString().slice(-6)}`,
          },
        ]

    onProductsChange(nextProducts)
    setFormOpen(false)
    setEditingProduct(null)
  }

  function deleteProduct(product: Product) {
    if (!window.confirm(`Hapus produk "${product.name}" dari daftar demo?`)) {
      return
    }
    onProductsChange(products.filter((item) => item.id !== product.id))
  }

  function exportProducts() {
    const rows = [
      ['SKU', 'Nama Produk', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok', 'Satuan'],
      ...filteredProducts.map((product) => [
        product.sku,
        product.name,
        product.category,
        String(product.cost),
        String(product.price),
        String(product.stock),
        product.unit,
      ]),
    ]
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\r\n')
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'daftar-produk-demo.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (formOpen) {
    return (
      <ProductFormPage
        key={editingProduct?.id ?? 'new'}
        product={editingProduct ?? undefined}
        categories={allCategories}
        onAddCategory={(name) => {
          if (!categories.some((category) => category.toLowerCase() === name.toLowerCase())) {
            onCategoriesChange([...categories, name])
          }
        }}
        onSave={saveProduct}
        onCancel={() => {
          setFormOpen(false)
          setEditingProduct(null)
        }}
      />
    )
  }

  return (
    <div className="inventory-page">
      <header className="inventory-heading">
        <div>
          <h2>Daftar Produk Warung</h2>
          <p>Kelola data barang dagangan, harga beli, harga jual, dan stok kelontong.</p>
        </div>
        <button className="inventory-add-button" onClick={openAddForm}>
          <CirclePlus size={15} /> Tambah Produk Baru
        </button>
      </header>

      <div className="inventory-stats">
        <article>
          <span>TOTAL ITEM PRODUK</span>
          <strong>{products.length}</strong>
          <small>{activeCategories} kategori aktif</small>
          <PackageCheck size={22} />
        </article>
        <article className="critical">
          <span>STOK MENIPIS / KRITIS</span>
          <strong>{lowStockCount}</strong>
          <small>Perlu lakukan segera</small>
          <AlertTriangle size={22} />
        </article>
        <article>
          <span>NILAI MODAL STOK</span>
          <strong>{formatRupiah(stockCapital)}</strong>
          <small>Estimasi aset berjalan</small>
          <Banknote size={22} />
        </article>
        <article className="margin">
          <span>POTENSI MARGIN RATA-RATA</span>
          <strong>{averageMargin.toFixed(1)}%</strong>
          <small>Berdasarkan HPP tercatat</small>
          <TrendingUp size={22} />
        </article>
      </div>

      <div className="inventory-toolbar">
        <label className="inventory-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Ketik nama produk atau kategori..."
          />
        </label>
        <select
          aria-label="Filter kategori"
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value)
            setPage(1)
          }}
        >
          <option>Semua</option>
          {allCategories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select
          aria-label="Filter stok"
          value={stockFilter}
          onChange={(event) => {
            setStockFilter(event.target.value)
            setPage(1)
          }}
        >
          <option>Semua Stok</option>
          <option>Stok Aman</option>
          <option>Stok Menipis</option>
          <option>Stok Habis</option>
        </select>
        <span className="inventory-result-count">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </span>
        <button
          className="inventory-export"
          aria-label="Unduh daftar produk sebagai CSV"
          title="Unduh CSV"
          onClick={exportProducts}
        >
          <Download size={15} />
        </button>
      </div>

      <div className="inventory-table-wrap">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>FOTO</th><th>NAMA PRODUK</th><th>KATEGORI</th>
              <th>HARGA BELI</th><th>HARGA JUAL</th>
              <th>STOK &amp; SATUAN</th><th>STATUS</th><th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="inventory-product-image">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt="" />
                      : <PackageCheck size={19} />}
                  </div>
                </td>
                <td><strong>{product.name}</strong><small>SKU: {product.sku}</small></td>
                <td><span className="inventory-category">{product.category}</span></td>
                <td>{formatRupiah(product.cost)}</td>
                <td><strong>{formatRupiah(product.price)}</strong></td>
                <td><strong>{product.stock}</strong> {product.unit}</td>
                <td>
                  {product.stock === 0
                    ? <span className="inventory-status empty">Habis</span>
                    : product.stock <= (product.minStock ?? 5)
                      ? <span className="inventory-status low"><AlertTriangle size={11} /> Menipis (Sisa {product.stock})</span>
                      : <span className="inventory-status safe">● Aman</span>}
                </td>
                <td>
                  <div className="inventory-row-actions">
                    <button aria-label={`Edit ${product.name}`} title="Edit" onClick={() => openEditForm(product)}><Pencil size={13} /></button>
                    <button aria-label={`Hapus ${product.name}`} title="Hapus" onClick={() => deleteProduct(product)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {visibleProducts.length === 0 && (
              <tr><td className="inventory-empty" colSpan={8}>Tidak ada produk yang cocok dengan pencarian atau filter.</td></tr>
            )}
          </tbody>
        </table>
        <footer className="inventory-pagination">
          <span>
            Menampilkan {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredProducts.length)} dari {filteredProducts.length} produk
          </span>
          <div>
            <button disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button>
            <span>Halaman {currentPage} / {pageCount}</span>
            <button disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Berikutnya</button>
          </div>
        </footer>
      </div>

    </div>
  )
}

export default ProductsPage
