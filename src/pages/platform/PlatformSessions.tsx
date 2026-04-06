import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../../hooks/useAuth'

interface SessionSlot {
  id: string; therapistName: string; date: string; time: string; booked: boolean; bookedByName?: string
}

export default function PlatformSessions() {
  const { profile } = useAuth()
  const [slots, setSlots] = useState<SessionSlot[]>([])
  const [date, setDate] = useState(''); const [time, setTime] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => {
    const snap = await getDocs(query(collection(db, 'sessions'), orderBy('date', 'asc')))
    setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SessionSlot[])
  }
  const add = async () => {
    if (!date || !time || !profile) return; setAdding(true)
    await addDoc(collection(db, 'sessions'), { therapistName: profile.name, date, time, booked: false, createdAt: Timestamp.now() })
    setDate(''); setTime(''); await load(); setAdding(false)
  }
  const remove = async (id: string) => { await deleteDoc(doc(db, 'sessions', id)); setSlots(p => p.filter(s => s.id !== id)) }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = slots.filter(s => s.date >= today)
  const past = slots.filter(s => s.date < today)
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-black text-white">Sesje</h1>
        <p className="font-bold text-sm mt-1" style={{ color: '#5a6178' }}>Zarządzaj terminami sesji terapeutycznych</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Add form — dark card */}
        <div className="dark-card p-6 space-y-4">
          <h3 className="text-sm font-black text-white">Nowy termin</h3>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="input-platform" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="input-platform" />
          <button onClick={add} disabled={!date || !time || adding}
            className="w-full text-white font-bold py-2.5 rounded-xl disabled:opacity-30 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #0891b2, #2dd4bf)' }}>{adding ? 'Dodaję...' : 'Dodaj termin'}</button>
        </div>

        {/* List — dark cards */}
        <div className="col-span-2 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#22d3ee' }}>Nadchodzące ({upcoming.length})</p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#5a6178' }}>Brak nadchodzących sesji</p>
          ) : upcoming.map(s => (
            <div key={s.id} className="dark-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full" style={{
                  background: s.booked ? '#f59e0b' : '#2dd4bf',
                  boxShadow: `0 0 8px ${s.booked ? '#f59e0b' : '#2dd4bf'}40`,
                }} />
                <div>
                  <p className="text-sm font-bold text-white">{formatDate(s.date)} · {s.time}</p>
                  <p className="text-xs" style={{ color: '#5a6178' }}>{s.booked ? `Zarezerwowane: ${s.bookedByName || 'pacjent'}` : 'Wolny termin'}</p>
                </div>
              </div>
              {!s.booked && (
                <button onClick={() => remove(s.id)} className="text-xs font-bold transition-colors" style={{ color: '#5a6178' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#5a6178')}>Usuń</button>
              )}
            </div>
          ))}

          {past.length > 0 && (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-6" style={{ color: '#5a6178' }}>Przeszłe ({past.length})</p>
              {past.slice(0, 5).map(s => (
                <div key={s.id} className="dark-card p-4 opacity-50">
                  <p className="text-sm" style={{ color: '#a0aec0' }}>{formatDate(s.date)} · {s.time} — {s.booked ? s.bookedByName : 'Niewykorzystany'}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
