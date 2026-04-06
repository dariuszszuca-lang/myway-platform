import { useState, useEffect } from 'react'
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, orderBy, limit, Timestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { useAuth, type UserProfile } from '../hooks/useAuth'

interface PatientSummary {
  uid: string
  name: string
  sobrietyDate: string
  days: number
  lastMood: number | null
  lastJournalDate: string | null
}

interface JournalEntry {
  id: string
  mood: number
  note: string
  createdAt: Date
}

interface SessionSlot {
  id: string
  therapistName: string
  date: string
  time: string
  booked: boolean
  bookedBy?: string
  bookedByName?: string
}

type Tab = 'patients' | 'materials' | 'sessions'

export default function TherapistPanel() {
  const { profile, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('patients')

  if (profile?.role !== 'therapist') {
    return (
      <div className="px-5 pt-12 text-center">
        <p className="text-text-secondary">Brak dostępu. Panel tylko dla terapeutów.</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-12 pb-6 space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-text-secondary text-sm">Panel terapeuty</p>
          <h1 className="text-2xl font-bold text-text-primary">{profile.name}</h1>
        </div>
        <button onClick={signOut} className="text-text-muted text-xs hover:text-text-secondary">Wyloguj</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['patients', 'Pacjenci'], ['materials', 'Materiały'], ['sessions', 'Sesje']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === key ? 'bg-accent-green text-bg-primary' : 'bg-bg-card border border-border text-text-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'patients' && <PatientsTab />}
      {tab === 'materials' && <MaterialsTab />}
      {tab === 'sessions' && <SessionsTab therapistName={profile.name} />}
    </div>
  )
}

/* ==================== PACJENCI ==================== */
function PatientsTab() {
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loadingJournal, setLoadingJournal] = useState(false)

  useEffect(() => { loadPatients() }, [])

  const loadPatients = async () => {
    const snap = await getDocs(collection(db, 'users'))
    const now = new Date()
    const list: PatientSummary[] = []
    for (const d of snap.docs) {
      const data = d.data() as UserProfile
      if (data.role !== 'patient') continue
      const start = new Date(data.sobrietyDate)
      const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      let lastMood: number | null = null
      let lastJournalDate: string | null = null
      try {
        const jSnap = await getDocs(query(collection(db, 'users', d.id, 'journal'), orderBy('createdAt', 'desc'), limit(1)))
        if (!jSnap.empty) {
          const entry = jSnap.docs[0].data()
          lastMood = entry.mood
          lastJournalDate = (entry.createdAt as Timestamp).toDate().toLocaleDateString('pl-PL')
        }
      } catch { /* brak */ }
      list.push({ uid: d.id, name: data.name, sobrietyDate: data.sobrietyDate, days, lastMood, lastJournalDate })
    }
    setPatients(list.sort((a, b) => a.name.localeCompare(b.name)))
    setLoading(false)
  }

  const viewJournal = async (uid: string) => {
    setSelectedPatient(uid)
    setLoadingJournal(true)
    const q = query(collection(db, 'users', uid, 'journal'), orderBy('createdAt', 'desc'), limit(30))
    const snap = await getDocs(q)
    setJournalEntries(snap.docs.map((d) => ({
      id: d.id, ...d.data(), createdAt: (d.data().createdAt as Timestamp).toDate(),
    })) as JournalEntry[])
    setLoadingJournal(false)
  }

  const selectedData = patients.find((p) => p.uid === selectedPatient)

  if (selectedPatient && selectedData) {
    return (
      <div className="space-y-4" id="patient-report">
        <button onClick={() => setSelectedPatient(null)} className="text-accent-green text-sm font-medium print:hidden">
          ← Powrót
        </button>

        <div className="rounded-xl bg-bg-card border border-border p-5 space-y-3 print:bg-white print:text-black">
          <h2 className="text-xl font-bold text-text-primary print:text-black">{selectedData.name}</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-green print:text-green-700">{selectedData.days}</p>
              <p className="text-xs text-text-muted">dni</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary print:text-black">{Math.floor(selectedData.days / 7)}</p>
              <p className="text-xs text-text-muted">tygodni</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary print:text-black">{selectedData.lastMood ?? '-'}</p>
              <p className="text-xs text-text-muted">ostatni nastrój</p>
            </div>
          </div>
        </div>

        {/* Mini wykres nastroju */}
        {!loadingJournal && journalEntries.length > 1 && (
          <MoodChart entries={journalEntries} />
        )}

        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Dziennik</h3>
          <button onClick={() => window.print()} className="text-xs bg-accent-green/10 text-accent-green px-3 py-1.5 rounded-lg font-medium print:hidden">
            Eksport PDF
          </button>
        </div>

        {loadingJournal ? (
          <Spinner />
        ) : journalEntries.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">Brak wpisów</p>
        ) : (
          <div className="space-y-2">
            {journalEntries.map((e) => (
              <div key={e.id} className="rounded-xl bg-bg-card border border-border p-3 print:bg-white print:border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-text-muted">{e.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</span>
                  <span className={`text-sm font-bold ${e.mood >= 7 ? 'text-accent-green' : e.mood >= 4 ? 'text-accent-orange' : 'text-accent-red'}`}>{e.mood}/10</span>
                </div>
                {e.note && <p className="text-sm text-text-secondary">{e.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Pacjenci ({patients.length})</h2>
      {loading ? <Spinner /> : patients.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">Brak pacjentów</p>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <button key={p.uid} onClick={() => viewJournal(p.uid)}
              className="w-full rounded-xl bg-bg-card border border-border p-4 text-left hover:bg-bg-card-hover transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-muted mt-0.5">{p.days} dni{p.lastMood !== null && ` · Nastrój: ${p.lastMood}/10`}</p>
                </div>
                <span className={`text-lg font-bold ${p.days >= 90 ? 'text-accent-green' : p.days >= 30 ? 'text-accent-teal' : 'text-accent-orange'}`}>{p.days}d</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ==================== WYKRES NASTROJU ==================== */
function MoodChart({ entries }: { entries: JournalEntry[] }) {
  const sorted = [...entries].reverse().slice(-14) // ostatnie 14 wpisów
  const max = 10
  const h = 120
  const w = sorted.length > 1 ? 100 / (sorted.length - 1) : 100

  return (
    <div className="rounded-xl bg-bg-card border border-border p-4">
      <p className="text-xs font-semibold text-text-secondary mb-3">Nastrój w czasie</p>
      <div className="relative h-[120px]">
        {/* Linie tła */}
        {[2, 5, 8].map((v) => (
          <div key={v} className="absolute left-0 right-0 border-t border-border/50" style={{ bottom: `${(v / max) * 100}%` }}>
            <span className="absolute -left-0 -top-2 text-[9px] text-text-muted">{v}</span>
          </div>
        ))}
        {/* Punkty + linia */}
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 100 ${h}`} preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#34d399"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            points={sorted.map((e, i) => `${i * w},${h - (e.mood / max) * h}`).join(' ')}
          />
          {sorted.map((e, i) => (
            <circle
              key={i}
              cx={i * w}
              cy={h - (e.mood / max) * h}
              r="3"
              fill={e.mood >= 7 ? '#34d399' : e.mood >= 4 ? '#f59e0b' : '#ef4444'}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-text-muted">{sorted[0]?.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
        <span className="text-[9px] text-text-muted">{sorted[sorted.length - 1]?.createdAt.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  )
}

/* ==================== MATERIAŁY ==================== */
function MaterialsTab() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('ebook')
  const [premium, setPremium] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [materials, setMaterials] = useState<Array<{ id: string; title: string; category: string }>>([])

  useEffect(() => { loadMaterials() }, [])

  const loadMaterials = async () => {
    const snap = await getDocs(query(collection(db, 'materials'), orderBy('createdAt', 'desc')))
    setMaterials(snap.docs.map((d) => ({ id: d.id, title: d.data().title, category: d.data().category })))
  }

  const handleUpload = async () => {
    if (!file || !title.trim()) return
    setUploading(true)
    try {
      const fileRef = ref(storage, `materials/${Date.now()}_${file.name}`)
      await uploadBytes(fileRef, file)
      const fileUrl = await getDownloadURL(fileRef)

      await addDoc(collection(db, 'materials'), {
        title: title.trim(),
        description: description.trim(),
        category,
        premium,
        fileUrl,
        createdAt: Timestamp.now(),
      })

      setTitle('')
      setDescription('')
      setFile(null)
      setPremium(false)
      await loadMaterials()
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const removeMaterial = async (id: string) => {
    await deleteDoc(doc(db, 'materials', id))
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Upload form */}
      <div className="rounded-xl bg-bg-card border border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-text-primary">Dodaj materiał</p>

        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Tytuł" className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/50" />

        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Opis (opcjonalnie)" className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none h-16 focus:outline-none focus:border-accent-green/50" />

        <div className="flex gap-2">
          {['ebook', 'audio', 'exercise', 'video'].map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${category === c ? 'bg-accent-green text-bg-primary' : 'bg-bg-secondary text-text-muted'}`}>
              {c === 'ebook' ? 'Ebook' : c === 'audio' ? 'Audio' : c === 'exercise' ? 'Ćwiczenie' : 'Video'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} className="rounded" />
          Premium (płatne)
        </label>

        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-accent-green/10 file:text-accent-green" />

        <button onClick={handleUpload} disabled={!file || !title.trim() || uploading}
          className="w-full bg-accent-green text-bg-primary font-semibold py-2.5 rounded-xl disabled:opacity-30">
          {uploading ? 'Uploaduję...' : 'Dodaj materiał'}
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Dodane ({materials.length})</p>
        {materials.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg bg-bg-card border border-border p-3">
            <div>
              <p className="text-sm font-medium text-text-primary">{m.title}</p>
              <p className="text-xs text-text-muted">{m.category}</p>
            </div>
            <button onClick={() => removeMaterial(m.id)} className="text-text-muted hover:text-accent-red">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ==================== SESJE ==================== */
function SessionsTab({ therapistName }: { therapistName: string }) {
  const [slots, setSlots] = useState<SessionSlot[]>([])
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadSlots() }, [])

  const loadSlots = async () => {
    const snap = await getDocs(query(collection(db, 'sessions'), orderBy('date', 'asc')))
    setSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SessionSlot[])
  }

  const addSlot = async () => {
    if (!date || !time) return
    setAdding(true)
    await addDoc(collection(db, 'sessions'), {
      therapistName,
      date,
      time,
      booked: false,
      createdAt: Timestamp.now(),
    })
    setDate('')
    setTime('')
    await loadSlots()
    setAdding(false)
  }

  const removeSlot = async (id: string) => {
    await deleteDoc(doc(db, 'sessions', id))
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-5">
      {/* Dodaj termin */}
      <div className="rounded-xl bg-bg-card border border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-text-primary">Dodaj termin sesji</p>
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-green/50" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="w-28 bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-green/50" />
        </div>
        <button onClick={addSlot} disabled={!date || !time || adding}
          className="w-full bg-accent-green text-bg-primary font-semibold py-2.5 rounded-xl disabled:opacity-30">
          {adding ? 'Dodaję...' : 'Dodaj termin'}
        </button>
      </div>

      {/* Lista terminów */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Terminy ({slots.length})</p>
        {slots.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">Brak terminów</p>
        ) : slots.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg bg-bg-card border border-border p-3">
            <div>
              <p className="text-sm font-medium text-text-primary">{formatDate(s.date)} · {s.time}</p>
              <p className="text-xs text-text-muted">
                {s.booked ? `Zarezerwowane: ${s.bookedByName || 'pacjent'}` : 'Wolny'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${s.booked ? 'bg-accent-orange' : 'bg-accent-green'}`} />
              {!s.booked && (
                <button onClick={() => removeSlot(s.id)} className="text-text-muted hover:text-accent-red">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div className="text-center py-8">
      <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )
}
