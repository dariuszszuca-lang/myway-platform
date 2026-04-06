import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sobrietyDate, setSobrietyDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, name, sobrietyDate)
      navigate('/')
    } catch {
      setError('Nie udało się utworzyć konta. Spróbuj inny email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col justify-center px-6">
      <div className="max-w-sm mx-auto w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-text-primary">
            MyWay <span className="text-accent-green">App</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2">Rozpocznij swoją drogę</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-3 text-sm text-accent-red text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Twoje imię</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-dark"
              placeholder="np. Tomek"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-dark"
              placeholder="twoj@email.pl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="input-dark"
              placeholder="Minimum 6 znaków"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Data rozpoczęcia trzeźwości
            </label>
            <input
              type="date"
              value={sobrietyDate}
              onChange={(e) => setSobrietyDate(e.target.value)}
              required
              className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-green/50"
            />
            <p className="text-xs text-text-muted mt-1">Od kiedy liczysz trzeźwość?</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-green text-bg-primary font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50"
          >
            {loading ? 'Tworzę konto...' : 'Utwórz konto'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted">
          Masz już konto?{' '}
          <Link to="/login" className="text-accent-green font-medium">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}
