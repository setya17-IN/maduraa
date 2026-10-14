
import ProfilePage from './pages/ProfilePage'

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
  useNavigate,
} from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { initialStoreProfile, saveDemoStoreProfile } from './data/demoStoreProfile'

import { useState, type FormEvent, type ReactNode } from 'react'
import {
  Store,
  UserRound,
  MapPin,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
} from 'lucide-react'
import './App.css'

interface RegisterForm {
  ownerName: string
  storeName: string
  phone: string
  address: string
  password: string
  confirmPassword: string
}

interface InputFieldProps {
  id: string
  label: string
  placeholder: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  suffix?: ReactNode
  hint?: string
  autoComplete?: string
}

function InputField({
  id,
  label,
  placeholder,
  icon,
  value,
  onChange,
  type = 'text',
  required = true,
  suffix,
  hint,
  autoComplete,
}: InputFieldProps) {
  return (
    <div className="form-group">
      <div className="label-row">
        <label htmlFor={id}>{label}</label>
        {hint ? (
          <span className="field-hint">{hint}</span>
        ) : required ? (
          <span className="required">Wajib</span>
        ) : null}
      </div>

      <div className="input-wrapper">
        <span className="input-icon" aria-hidden="true">
          {icon}
        </span>

        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={id === 'password' ? 6 : undefined}
        />

        {suffix}
      </div>
    </div>
  )
}

const initialForm: RegisterForm = {
  ownerName: '',
  storeName: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
}

function RegisterPage(){
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>(
    'error',
  )

  function updateField(field: keyof RegisterForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
    setMessage('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!agree) {
      setMessage('Silakan setujui ketentuan layanan terlebih dahulu.')
      setMessageType('error')
      return
    }

    if (form.password.length < 6) {
      setMessage('Kata sandi harus memiliki minimal 6 karakter.')
      setMessageType('error')
      return
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Konfirmasi kata sandi tidak sesuai.')
      setMessageType('error')
      return
    }

    saveDemoStoreProfile({
      ...initialStoreProfile,
      ownerName: form.ownerName.trim(),
      storeName: form.storeName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      receiptFooter: `Matur sakalangkong telah belanja di ${form.storeName.trim()}`,
    })

    navigate('/dashboard')
  }

  return (
    <main className="page-container">
      <section className="register-card" aria-labelledby="page-title">
        <div className="top-decoration" aria-hidden="true" />
        <div className="bottom-decoration" aria-hidden="true" />

        <div className="card-content">
          <header className="header">
            <div className="brand-badge">
              <Store size={12} strokeWidth={2.5} />
              <span>Aplikasi Kasir &amp; Pembukuan Warung Madura</span>
            </div>

            <h1 id="page-title">Daftar Akun Baru</h1>

            <p className="subtitle">
              Mulai kelola kasir cepat, stok barang 24 jam, dan pantau
              omzet warung harian lebih rapi.
            </p>
          </header>

          <form onSubmit={handleSubmit}>
            <InputField
              id="ownerName"
              label="Nama Pemilik Warung"
              placeholder="Contoh: H. Abdul Rasyid"
              icon={<UserRound size={15} />}
              value={form.ownerName}
              onChange={(value) => updateField('ownerName', value)}
              autoComplete="name"
            />

            <InputField
              id="storeName"
              label="Nama Toko / Warung"
              placeholder="Contoh: Toko Berkah Madura 24 Jam"
              icon={<Store size={15} />}
              value={form.storeName}
              onChange={(value) => updateField('storeName', value)}
              autoComplete="organization"
            />

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="phone">No. WhatsApp / HP</label>
                <span className="field-hint">
                  Untuk kirim laporan kasir
                </span>
              </div>

              <div className="input-wrapper">
                <Phone
                  size={15}
                  className="input-icon"
                  aria-hidden="true"
                />

                <span className="country-code">+62</span>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="812-3456-7890"
                  value={form.phone}
                  onChange={(event) =>
                    updateField('phone', event.target.value)
                  }
                  autoComplete="tel-national"
                  required
                />
              </div>
            </div>

            <InputField
              id="address"
              label="Kota / Alamat Singkat Warung"
              placeholder="Contoh: Kebayoran Lama, Jakarta Selatan"
              icon={<MapPin size={15} />}
              value={form.address}
              onChange={(value) => updateField('address', value)}
              autoComplete="street-address"
            />

            <InputField
              id="password"
              label="Buat Kata Sandi"
              placeholder="Minimal 6 karakter"
              icon={<LockKeyhole size={15} />}
              value={form.password}
              onChange={(value) => updateField('password', value)}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              suffix={
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              }
            />

            <InputField
              id="confirmPassword"
              label="Ulangi Kata Sandi"
              placeholder="Ketik ulang kata sandi"
              icon={<CheckCircle2 size={15} />}
              value={form.confirmPassword}
              onChange={(value) =>
                updateField('confirmPassword', value)
              }
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              suffix={
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showConfirmPassword
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              }
            />

            <label className="terms">
              <input
                type="checkbox"
                checked={agree}
                onChange={(event) => {
                  setAgree(event.target.checked)
                  setMessage('')
                }}
              />

              <span>
                Saya menyetujui{' '}
                <a href="#ketentuan">Ketentuan Layanan</a> &amp;{' '}
                <a href="#privasi">Kebijakan Privasi</a> Maduraa.
              </span>
            </label>

            {message && (
              <p
                className={`message ${messageType}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            )}

            <button className="submit-button" type="submit">
              <span>Daftar Warung Sekarang</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="security-note">
            <ShieldCheck size={13} />
            <span>
              100% Gratis • Data Stok &amp; Penjualan Tersimpan Aman
            </span>
          </div>

          
        <footer className="footer">
          <span>Sudah punya akun warung?</span>{' '}
          <Link to="/login">
            Masuk di sini <span aria-hidden="true">›</span>
          </Link>
        </footer>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
