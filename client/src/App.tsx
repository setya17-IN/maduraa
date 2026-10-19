import { useEffect, useState } from 'react'
import { getOmzetList, type OmzetRecord } from './services/omzetService'

function App() {
  const [omzetData, setOmzetData] = useState<OmzetRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOmzetList()
        setOmzetData(data)
      } catch (err) {
        console.error('Gagal memuat data transaksi:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <h1>Sistem Pencatatan Omzet Toko Madura</h1>

      {loading ? (
        <p>Memuat data dari Supabase...</p>
      ) : (
        <div>
          <h2>Daftar Transaksi</h2>
          {omzetData.length === 0 ? (
            <p>Belum ada data transaksi di database.</p>
          ) : (
            <ul>
              {omzetData.map((item) => (
                <li key={item.id}>
                  <strong>{new Date(item.created_at || '').toLocaleDateString('id-ID')}</strong>: Rp{' '}
                  {item.total_amount?.toLocaleString('id-ID') || 0}{' '}
                  {item.payment_method ? `- Metode: ${item.payment_method}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default App