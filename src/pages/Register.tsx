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
    <div className="min-h-dvh bg-bg-primary flex flex-col justify-center px-6">
      <div className="max-w-sm mx-auto w-full space-y-8">
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
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#a0aec0' }}>Twoje imię</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-dark" placeholder="np. Tomek" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#a0aec0' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="input-dark" placeholder="twoj@email.pl" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#a0aec0' }}>Hasło</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="input-dark" placeholder="Minimum 6 znaków" />
          </div>
          <div>
            <label className="block text-[12px] font-black mb-2" style={{ color: '#a0aec0' }}>
              Data trzeźwości <span style={{ color: '#5a6178' }}>(opcjonalne)</span>
            </label>
            <input type="date" value={sobrietyDate} onChange={(e) => setSobrietyDate(e.target.value)} className="input-dark" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full text-[15px] font-black py-3.5 rounded-xl transition-all disabled:opacity-40 text-white mt-2"
            style={{ background: 'linear-gradient(135deg, #0891b2, #22d3ee)' }}>
            {loading ? 'Tworzę konto...' : 'Utwórz konto'}
          </button>
        </form>
        <p className="text-center text-[12px] font-bold" style={{ color: '#5a6178' }}>
          Masz już konto? <Link to="/login" className="font-black" style={{ color: '#22d3ee' }}>Zaloguj się</Link>
        </p>
      </div>
    </div>
  )
}
