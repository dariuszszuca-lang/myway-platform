import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await signIn(email, password)
      if (profile?.role !== 'therapist') {
        setError('Brak uprawnień. Platforma tylko dla terapeutów.')
        setLoading(false)
        return
      }
      navigate('/')
    } catch {
      setError('Nieprawidłowy email lub hasło')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6" style={{ background: '#13111c' }}>
      <div className="max-w-sm mx-auto w-full space-y-10">
        <div className="text-center">
          <img src="/favicon.svg" alt="MyWay" className="w-20 h-20 mx-auto mb-5" style={{ borderRadius: 22, boxShadow: '0 0 40px rgba(124, 58, 237, 0.3)' }} />
          <h1 className="text-[34px] font-black text-white tracking-tight">MyWay</h1>
          <p className="text-[14px] font-bold mt-1" style={{ color: '#22d3ee' }}>Panel terapeuty</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl p-3 text-[12px] font-black text-center" style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185' }}>
              {error}
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
        </form>

        <p className="text-center text-[12px] font-bold" style={{ color: '#5a6178' }}>
          Nie masz konta? <Link to="/register" className="font-black" style={{ color: '#22d3ee' }}>Zarejestruj się</Link>
        </p>
      </div>
    </div>
  )
}
