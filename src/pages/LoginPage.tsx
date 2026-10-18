
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store,
  Eye,
  EyeOff,
  ArrowRightToLine,
  CircleAlert,
} from 'lucide-react'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const [identity, setIdentity] = useState('cakmahmud@warung.com')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Prototype only: any identity and password of at least six characters are accepted.
    console.log({ identity, remember })
    navigate('/dashboard')
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <h1>Masuk ke Akun Warung</h1>
          <p>Catat transaksi dan pantau omzet warung dengan mudah</p>
        </header>

        {error && (
          <div className="login-alert" role="alert">
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="identity">Email atau Nomor HP</label>

            <div className="login-input-wrap">
              <input
                id="identity"
                type="text"
                placeholder="Masukkan email atau nomor HP"
                value={identity}
                onChange={(event) => {
                  setIdentity(event.target.value)
                  setError('')
                }}
                autoComplete="username"
                required
              />
              <Store size={16} aria-hidden="true" />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">Kata Sandi</label>

            <div className="login-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                autoComplete="current-password"
                minLength={6}
                required
              />

              <button
                type="button"
                className="login-eye"
                aria-label={
                  showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {password.length > 0 && password.length < 6 && (
              <p className="password-hint">
                <CircleAlert size={12} />
                Kata sandi wajib diisi minimal 6 karakter.
              </p>
            )}
          </div>

          <label className="remember-option">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Ingat saya di komputer kasir ini</span>
          </label>

          <button className="login-submit" type="submit">
            <span>Masuk ke Warung</span>
            <ArrowRightToLine size={17} />
          </button>
        </form>

        <aside className="login-help">
          <p>Lupa kata sandi atau butuh bantuan pendaftaran?</p>
          <strong>Hubungi pemilik warung atau admin.</strong>
        </aside>

        <footer className="login-footer">
          Belum punya akun warung? <Link to="/">Daftar sekarang</Link>
        </footer>
      </section>
    </main>
  )
}

export default LoginPage
