import { useState, useEffect } from 'react'
import { getCollection, runQuery, type RestDoc } from '../../lib/firestore-rest'
import type { UserProfile } from '../../hooks/useAuth'

interface Stats {
  totalPatients: number
  avgMood: number
  avgDays: number
  sessionsToday: number
  recentEntries: Array<{ name: string; mood: number; date: string }>
  moodDistribution: number[]
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
    const users = await getCollection('users')
    const sessions = await getCollection('sessions').catch(() => [] as RestDoc[])
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    let totalPatients = 0
    let totalDays = 0
    let totalMood = 0
    let moodCount = 0
    const recentEntries: Stats['recentEntries'] = []
    const moodDistribution = Array(10).fill(0)

    for (const d of users) {
      const data = d as unknown as UserProfile & { id: string }
      if (data.role !== 'patient') continue
      totalPatients++
      const days = Math.floor((now.getTime() - new Date(data.sobrietyDate).getTime()) / (1000 * 60 * 60 * 24))
      totalDays += days

      try {
        const journalDocs = await runQuery(`users/${d.id}/journal`, {
          orderBy: { field: 'createdAt', direction: 'DESCENDING' },
          limit: 5,
        })
        for (const j of journalDocs) {
          const mood = Number(j.mood) || 0
          totalMood += mood
          moodCount++
          if (mood >= 1 && mood <= 10) moodDistribution[mood - 1]++
          if (recentEntries.length < 8) {
            const createdAt = j.createdAt as string
            const dateObj = createdAt ? new Date(createdAt) : new Date()
            recentEntries.push({
              name: data.name,
              mood,
              date: dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
            })
          }
        }
      } catch { /* skip */ }
    }

    const sessionsToday = sessions.filter((s) => s.date === today && s.booked).length

    setStats({
      totalPatients,
      avgMood: moodCount > 0 ? Math.round((totalMood / moodCount) * 10) / 10 : 0,
      avgDays: totalPatients > 0 ? Math.round(totalDays / totalPatients) : 0,
      sessionsToday,
      recentEntries,
      moodDistribution,
    })
    setLoading(false)
    } catch (err) {
      console.error('Dashboard load error:', err)
      setStats({ totalPatients: 0, avgMood: 0, avgDays: 0, sessionsToday: 0, recentEntries: [], moodDistribution: Array(10).fill(0) })
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#72d5c7', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d6a85f]">MyWay Platform</p>
        <h1 className="text-[34px] font-black text-text-primary tracking-tight">Dashboard</h1>
        <p className="text-[13px] font-bold mt-1 text-text-secondary/70">Przegląd aktywności pacjentów</p>
      </div>

      {/* KPI Cards — 2 large gradient + 2 dark */}
      <div className="grid grid-cols-4 gap-5">
        {/* Large gradient: Patients */}
        <div className="gradient-purple p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(7,20,17,0.1)' }}>
              <UsersIcon />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#52655b]">Pacjenci</p>
          </div>
          <p className="text-[48px] font-black text-[#071411] leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{stats.totalPatients}</p>
          <p className="text-[11px] font-bold mt-2 text-[#52655b]">Aktywnych w systemie</p>
        </div>

        {/* Large gradient: Avg Mood */}
        <div className="gradient-cyan p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.55), transparent)', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.14)' }}>
              <MoodIcon />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.7)' }}>Średni nastrój</p>
          </div>
          <p className="text-[48px] font-black text-white leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{stats.avgMood}<span className="text-lg opacity-50">/10</span></p>
          <p className="text-[11px] font-bold mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Wszystkich pacjentów</p>
        </div>

        {/* Dark card: Avg Days */}
        <div className="dark-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(214, 168, 95, 0.18)' }}>
              <CalendarIcon color="#d6a85f" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5a6178' }}>Śr. dni trzeźw.</p>
          </div>
          <p className="text-[36px] font-black text-white leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{stats.avgDays}</p>
          <p className="text-[11px] font-bold mt-2" style={{ color: '#5a6178' }}>Średnia pacjentów</p>
        </div>

        {/* Dark card: Sessions Today */}
        <div className="dark-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(114, 213, 199, 0.16)' }}>
              <SessionIcon color="#72d5c7" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#5a6178' }}>Sesje dziś</p>
          </div>
          <p className="text-[36px] font-black text-white leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{stats.sessionsToday}</p>
          <p className="text-[11px] font-bold mt-2" style={{ color: '#5a6178' }}>Zarezerwowanych</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Mood Distribution — dark card */}
        <div className="col-span-2 dark-card p-6">
          <h3 className="text-sm font-black text-white mb-4">Rozkład nastroju</h3>
          <div className="flex items-end justify-between gap-1.5 h-32">
            {stats.moodDistribution.map((count, i) => {
              const maxCount = Math.max(...stats.moodDistribution, 1)
              const height = (count / maxCount) * 100
              const getColor = () => {
                if (i >= 7) return '#72d5c7'
                if (i >= 5) return '#7db7d7'
                if (i >= 3) return '#d6a85f'
                return '#e85f5c'
              }
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold" style={{ color: '#5a6178' }}>{count || ''}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      opacity: count > 0 ? 1 : 0.15,
                      background: getColor(),
                      boxShadow: count > 0 ? `0 0 12px ${getColor()}40` : 'none',
                    }}
                  />
                  <span className="text-[10px] font-bold" style={{ color: '#5a6178' }}>{i + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity — dark card */}
        <div className="col-span-3 dark-card p-6">
          <h3 className="text-sm font-black text-white mb-4">Ostatnia aktywność</h3>
          {stats.recentEntries.length === 0 ? (
            <p className="text-sm font-bold py-8 text-center" style={{ color: '#5a6178' }}>Brak wpisów</p>
          ) : (
            <div className="space-y-2.5">
              {stats.recentEntries.map((e, i) => {
                const avatarColors = ['#72d5c7', '#7db7d7', '#d6a85f', '#b6a4e6', '#5ab7c0', '#d58aa6', '#2fbf9b', '#e85f5c']
                const avatarBg = avatarColors[i % avatarColors.length]
                return (
                  <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: i < stats.recentEntries.length - 1 ? '1px solid rgba(245,232,204,0.08)' : 'none' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: avatarBg }}>
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{e.name}</p>
                        <p className="text-[11px] font-medium" style={{ color: '#5a6178' }}>{e.date}</p>
                      </div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: e.mood >= 7 ? '#72d5c7' : e.mood >= 4 ? '#d6a85f' : '#e85f5c' }}>
                      {e.mood}/10
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UsersIcon() { return <svg className="w-4 h-4 text-[#071411]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> }
function MoodIcon() { return <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg> }
function CalendarIcon({ color = 'currentColor' }: { color?: string }) { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75" /></svg> }
function SessionIcon({ color = 'currentColor' }: { color?: string }) { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
