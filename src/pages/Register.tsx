import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sobrietyDate, setSobrietyDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Hasło musi mieć minimum 6 znaków'); return }

    setLoading(true)
    setError('')
    try {
      await signUp(email, password, name, sobrietyDate || undefined)
      window.location.href = '/'
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || ''
      setError(code === 'auth/email-already-in-use' ? 'Ten email jest już zajęty.' : 'Nie udało się utworzyć konta.')
      setLoading(false)
    }
  }

  return (
    <div className="platform-shell min-h-dvh bg-bg-primary flex flex-col justify-center px-6 py-10">
      <div className="max-w-sm mx-auto w-full space-y-8">
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
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#c9d8cd' }}>Twoje imię</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-dark" placeholder="np. Tomek" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#c9d8cd' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="input-dark" placeholder="twoj@email.pl" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#c9d8cd' }}>Hasło</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="input-dark" placeholder="Minimum 6 znaków" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#c9d8cd' }}>
              Data trzeźwości <span style={{ color: '#72867a' }}>(opcjonalne)</span>
            </label>
            <input type="date" value={sobrietyDate} onChange={(e) => setSobrietyDate(e.target.value)} className="input-dark" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full text-[15px] font-black py-3.5 rounded-2xl transition-all disabled:opacity-40 mt-2"
            style={{ background: 'linear-gradient(145deg, #a8f1e8, #72d5c7)', color: '#071411' }}>
            {loading ? 'Tworzę konto...' : 'Utwórz konto'}
          </button>
        </form>
        <p className="text-center text-[12px] font-bold" style={{ color: '#72867a' }}>
          Masz już konto? <Link to="/login" className="font-black" style={{ color: '#a8f1e8' }}>Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}
