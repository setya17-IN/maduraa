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
        console.error('Gagal memuat data omzet:', err)
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
          <h2>Daftar Omzet</h2>
          {omzetData.length === 0 ? (
            <p>Belum ada data omzet di database.</p>
          ) : (
            <ul>
              {omzetData.map((item) => (
                <li key={item.id}>
                  <strong>{item.tanggal}</strong>: Rp{' '}
                  {item.jumlah_omzet.toLocaleString('id-ID')}{' '}
                  {item.keterangan ? `- ${item.keterangan}` : ''}
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