import { useState, useEffect } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import { runQuery, addDoc as restAddDoc, deleteDoc as restDeleteDoc } from '../../lib/firestore-rest'

export default function PlatformMaterials() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('ebook')
  const [premium, setPremium] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [materials, setMaterials] = useState<Array<{ id: string; title: string; category: string; premium: boolean; description: string }>>([])

  useEffect(() => { load() }, [])
  const load = async () => {
    const docs = await runQuery('materials', { orderBy: { field: 'createdAt', direction: 'DESCENDING' } })
    setMaterials(docs.map((d) => ({
      id: d.id,
      title: String(d.title || ''),
      category: String(d.category || ''),
      premium: Boolean(d.premium),
      description: String(d.description || ''),
    })))
  }

  const upload = async () => {
    if (!file || !title.trim()) return
    setUploading(true)
    try {
      const fileRef = ref(storage, `materials/${Date.now()}_${file.name}`)
      await uploadBytes(fileRef, file)
      const fileUrl = await getDownloadURL(fileRef)
      await restAddDoc('materials', {
        title: title.trim(),
        description: description.trim(),
        category,
        premium,
        fileUrl,
        createdAt: new Date().toISOString(),
      })
      setTitle(''); setDescription(''); setFile(null); setPremium(false)
      await load()
    } finally { setUploading(false) }
  }

  const remove = async (id: string) => {
    await restDeleteDoc(`materials/${id}`)
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  const cats = [['ebook','Ebook'],['audio','Audio'],['exercise','Ćwiczenie'],['video','Video']] as const

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-black text-white">Materiały</h1>
        <p className="font-bold text-sm mt-1" style={{ color: '#5a6178' }}>Zarządzaj biblioteką materiałów dla pacjentów</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Upload — dark card */}
        <div className="dark-card p-6 space-y-4">
          <h3 className="text-sm font-black text-white">Dodaj materiał</h3>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł"
            className="input-platform" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opis"
            className="input-platform resize-none h-20" />
          <div className="flex gap-2">
            {cats.map(([k,l]) => (
              <button key={k} onClick={() => setCategory(k)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                style={{
                  background: category === k ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.04)',
                  color: category === k ? 'white' : '#5a6178',
                  border: category === k ? 'none' : '1px solid rgba(255,255,255,0.08)',
                }}>{l}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: '#a0aec0' }}>
            <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} className="rounded" /> Premium
          </label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:cursor-pointer"
            style={{ color: '#5a6178' }}
          />
          <button onClick={upload} disabled={!file || !title.trim() || uploading}
            className="w-full text-white font-bold py-2.5 rounded-xl disabled:opacity-30 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #e879f9)' }}>{uploading ? 'Uploaduję...' : 'Dodaj'}</button>
        </div>

        {/* List — dark cards */}
        <div className="col-span-2 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#5a6178' }}>Dodane ({materials.length})</p>
          {materials.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: '#5a6178' }}>Brak materiałów</p>
          ) : materials.map((m) => (
            <div key={m.id} className="dark-card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'rgba(34, 211, 238, 0.1)' }}>
                  {m.category === 'ebook' ? '📖' : m.category === 'audio' ? '🎧' : m.category === 'exercise' ? '✍️' : '🎬'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{m.title}</p>
                    {m.premium && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>PREMIUM</span>}
                  </div>
                  <p className="text-xs" style={{ color: '#5a6178' }}>{m.category} {m.description && `· ${m.description.slice(0, 50)}`}</p>
                </div>
              </div>
              <button onClick={() => remove(m.id)} className="transition-colors" style={{ color: '#5a6178' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#5a6178')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
