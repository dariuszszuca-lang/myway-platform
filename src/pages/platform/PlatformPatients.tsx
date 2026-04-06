import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { UserProfile } from '../../hooks/useAuth'

interface Patient {
  uid: string
  name: string
  sobrietyDate: string
  days: number
  lastMood: number | null
  journalCount: number
  createdAt: string
  recentMoods: number[]
}

interface JournalEntry {
  id: string
  mood: number
  note: string
  createdAt: Date
}

export default function PlatformPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)

  useEffect(() => { loadPatients() }, [])

  const loadPatients = async () => {
    try {
    const snap = await getDocs(collection(db, 'users'))
    const now = new Date()
    const list: Patient[] = []

    for (const d of snap.docs) {
      const data = d.data() as UserProfile
      if (data.role !== 'patient') continue
      const days = Math.floor((now.getTime() - new Date(data.sobrietyDate).getTime()) / (1000 * 60 * 60 * 24))

      let lastMood: number | null = null
      let journalCount = 0
      const recentMoods: number[] = []
      try {
        const jSnap = await getDocs(query(collection(db, 'users', d.id, 'journal'), orderBy('createdAt', 'desc'), limit(10)))
        journalCount = jSnap.size
        for (const j of jSnap.docs) {
          recentMoods.push(j.data().mood)
        }
        if (jSnap.docs.length > 0) lastMood = jSnap.docs[0].data().mood
      } catch { /* skip */ }

      list.push({
        uid: d.id, name: data.name, sobrietyDate: data.sobrietyDate,
        days, lastMood, journalCount, createdAt: data.createdAt, recentMoods: recentMoods.reverse(),
      })
    }
    setPatients(list.sort((a, b) => a.name.localeCompare(b.name)))
    setLoading(false)
    } catch (err) {
      console.error('Patients load error:', err)
      setLoading(false)
    }
  }

  const openProfile = async (uid: string) => {
    setSelected(uid)
    setLoadingJournal(true)
    const q = query(collection(db, 'users', uid, 'journal'), orderBy('createdAt', 'desc'), limit(30))
    const snap = await getDocs(q)
    setJournal(snap.docs.map((d) => ({
      id: d.id, ...d.data(), createdAt: (d.data().createdAt as Timestamp).toDate(),
    })) as JournalEntry[])
    setLoadingJournal(false)
  }

  const filtered = patients.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedPatient = patients.find((p) => p.uid === selected)

  if (selected && selectedPatient) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="text-sm font-bold hover:underline" style={{ color: '#a78bfa' }}>
          ← Powrót do listy
        </button>

        {/* Patient profile — dark card */}
        <div className="dark-card p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}>
              {selectedPatient.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-white">{selectedPatient.name}</h2>
              <p className="text-sm font-bold mt-0.5" style={{ color: '#5a6178' }}>
                Trzeźwość od {new Date(selectedPatient.sobrietyDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#2dd4bf' }}>{selectedPatient.days}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#5a6178' }}>dni trzeźwości</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{Math.floor(selectedPatient.days / 7)}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#5a6178' }}>tygodni</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{selectedPatient.lastMood ?? '-'}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#5a6178' }}>ostatni nastrój</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{selectedPatient.journalCount}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#5a6178' }}>wpisów</p>
                </div>
              </div>
            </div>
            <button onClick={() => window.print()} className="text-xs font-bold px-4 py-2 rounded-lg print:hidden" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
              Eksport PDF
            </button>
          </div>
        </div>

        {/* Mini trend — dark card */}
        {selectedPatient.recentMoods.length > 1 && (
          <div className="dark-card p-5">
            <h3 className="text-sm font-black text-white mb-3">Trend nastroju (ostatnie wpisy)</h3>
            <div className="flex items-end gap-1 h-16">
              {selectedPatient.recentMoods.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(m / 10) * 100}%`,
                      background: m >= 7 ? '#2dd4bf' : m >= 4 ? '#f59e0b' : '#f43f5e',
                      boxShadow: `0 0 8px ${m >= 7 ? '#2dd4bf' : m >= 4 ? '#f59e0b' : '#f43f5e'}30`,
                    }}
                  />
                  <span className="text-[9px]" style={{ color: '#5a6178' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Journal */}
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#5a6178' }}>Dziennik emocji</h3>
          {loadingJournal ? (
            <div className="text-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }} /></div>
          ) : journal.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#5a6178' }}>Brak wpisów</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {journal.map((e) => (
                <div key={e.id} className="dark-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs" style={{ color: '#5a6178' }}>
                      {e.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                    </span>
                    <span className="text-sm font-bold" style={{ color: e.mood >= 7 ? '#2dd4bf' : e.mood >= 4 ? '#f59e0b' : '#f43f5e' }}>
                      {e.mood}/10
                    </span>
                  </div>
                  {e.note && <p className="text-sm line-clamp-3" style={{ color: '#a0aec0' }}>{e.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-black text-white">Pacjenci</h1>
          <p className="font-bold text-sm mt-1" style={{ color: '#5a6178' }}>{patients.length} zarejestrowanych</p>
        </div>
      </div>

      {/* Search — dark input */}
      <div className="relative max-w-md">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#5a6178' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj pacjenta..."
          className="input-platform pl-11"
        />
      </div>

      {/* Table — dark */}
      {loading ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#a78bfa', borderTopColor: 'transparent' }} /></div>
      ) : (
        <div className="dark-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th className="text-left text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3" style={{ color: '#5a6178' }}>Pacjent</th>
                <th className="text-center text-[10px] font-black uppercase tracking-[0.2em] px-3 py-3" style={{ color: '#5a6178' }}>Dni trzeźwości</th>
                <th className="text-center text-[10px] font-black uppercase tracking-[0.2em] px-3 py-3" style={{ color: '#5a6178' }}>Nastrój</th>
                <th className="text-center text-[10px] font-black uppercase tracking-[0.2em] px-3 py-3" style={{ color: '#5a6178' }}>Wpisy</th>
                <th className="text-center text-[10px] font-black uppercase tracking-[0.2em] px-3 py-3" style={{ color: '#5a6178' }}>Trend</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => {
                const avatarColors = ['#7c3aed', '#0891b2', '#e879f9', '#2dd4bf', '#a78bfa', '#22d3ee']
                const bg = avatarColors[idx % avatarColors.length]
                return (
                  <tr key={p.uid} className="cursor-pointer transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-5 py-3.5" onClick={() => openProfile(p.uid)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: bg }}>
                          {p.name.charAt(0)}
                        </div>
                        <p className="text-sm font-bold text-white">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center" onClick={() => openProfile(p.uid)}>
                      <span className="text-sm font-bold" style={{ color: p.days >= 90 ? '#2dd4bf' : p.days >= 30 ? '#22d3ee' : '#f59e0b' }}>
                        {p.days}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center" onClick={() => openProfile(p.uid)}>
                      <span className="text-sm font-bold" style={{ color: (p.lastMood ?? 0) >= 7 ? '#2dd4bf' : (p.lastMood ?? 0) >= 4 ? '#f59e0b' : '#f43f5e' }}>
                        {p.lastMood ?? '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center text-sm" style={{ color: '#a0aec0' }} onClick={() => openProfile(p.uid)}>{p.journalCount}</td>
                    <td className="px-3 py-3.5" onClick={() => openProfile(p.uid)}>
                      {p.recentMoods.length > 1 && (
                        <div className="flex items-end gap-px h-5 justify-center">
                          {p.recentMoods.slice(-7).map((m, i) => (
                            <div key={i} className="w-1.5 rounded-sm"
                              style={{ height: `${(m / 10) * 100}%`, background: m >= 7 ? '#2dd4bf' : m >= 4 ? '#f59e0b' : '#f43f5e' }} />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-right" onClick={() => openProfile(p.uid)}>
                      <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>Profil →</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
