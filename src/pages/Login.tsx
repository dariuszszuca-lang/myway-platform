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
      const profile = await signIn(email, password)
      if (profile?.role !== 'therapist') {
        setError('Brak uprawnień. Platforma tylko dla terapeutów.')
        setLoading(false)
        return
      }
      window.location.href = '/'
    } catch {
      setError('Nieprawidłowy email lub hasło')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6" style={{ background: '#13111c' }}>
      <div className="max-w-sm mx-auto w-full space-y-10">
        <div className="text-center">
          <img src="/favicon.svg" alt="MyWay" className="w-20 h-20 mx-auto mb-5" style={{ borderRadius: 22, boxShadow: '0 0 40px rgba(124, 58, 237, 0.3)' }} />
          <h1 className="text-[34px] font-black text-white tracking-tight">MyWay</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-[12px] font-black mb-2" style={{ color: '#a0aec0' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="input-dark" placeholder="twoj@email.pl" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#a0aec0' }}>Hasło</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="input-dark" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full text-[15px] font-black py-3.5 rounded-xl transition-all disabled:opacity-40 text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #0891b2, #22d3ee)' }}>
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
          <button type="button" onClick={async () => {
            if (!email) { setError('Wpisz email'); return }
            try { await sendPasswordResetEmail(auth, email); setError(''); setInfo('Link do resetu hasła wysłany na ' + email) }
            catch { setError('Nie udało się wysłać maila') }
          }} className="w-full text-[13px] font-bold py-2 text-center" style={{ color: '#5a6178' }}>
            Zapomniałem hasła
          </button>
        </form>

        <p className="text-center text-[12px] font-bold" style={{ color: '#5a6178' }}>
          Nie masz konta? <Link to="/register" className="font-black" style={{ color: '#22d3ee' }}>Zarejestruj się</Link>
        </p>
      </div>
    </div>
  )
}
