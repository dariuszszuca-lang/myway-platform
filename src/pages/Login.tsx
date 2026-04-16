import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await signIn(email, password)
      window.location.href = '/'
    } catch {
      setError('Nieprawidłowy email lub hasło')
      setLoading(false)
    }
  }

  return (
    <div className="platform-shell min-h-dvh flex flex-col justify-center px-6">
      <div className="max-w-sm mx-auto w-full space-y-10">
        <div className="text-center">
          <img src="/favicon.svg" alt="MyWay" className="w-20 h-20 mx-auto mb-5" style={{ borderRadius: 24, boxShadow: '0 24px 70px rgba(114, 213, 199, 0.2)' }} />
          <h1 className="text-[34px] font-black text-white tracking-tight">MyWay</h1>
          <p className="text-[12px] font-black uppercase tracking-[0.22em] mt-2 text-[#d6a85f]">Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="premium-panel p-5 space-y-4">
          {error && (
            <div className="rounded-xl p-3 text-[12px] font-black text-center" style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185' }}>
              {error}
            </div>
          )}
          {info && (
            <div className="rounded-xl p-3 text-[12px] font-black text-center" style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}>
              {info}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#c9d8cd' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="input-dark" placeholder="twoj@email.pl" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#c9d8cd' }}>Hasło</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="input-dark" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full text-[15px] font-black py-3.5 rounded-2xl transition-all disabled:opacity-40 mt-2"
            style={{ background: 'linear-gradient(145deg, #a8f1e8, #72d5c7)', color: '#071411' }}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
          <button type="button" onClick={async () => {
            if (!email) { setError('Wpisz email'); return }
            try { await sendPasswordResetEmail(auth, email); setError(''); setInfo('Link do resetu hasła wysłany na ' + email) }
            catch { setError('Nie udało się wysłać maila') }
          }} className="w-full text-[13px] font-bold py-2 text-center" style={{ color: '#72867a' }}>
            Zapomniałem hasła
          </button>
        </form>

        <p className="text-center text-[12px] font-bold" style={{ color: '#72867a' }}>
          Nie masz konta? <Link to="/register" className="font-black" style={{ color: '#a8f1e8' }}>Zarejestruj się</Link>
        </p>
      </div>
    </div>
  )
}
