import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true, category: 'OVERVIEW' },
  { to: '/pacjenci', label: 'Pacjenci', icon: PatientsIcon, category: 'MANAGEMENT' },
  { to: '/materialy', label: 'Materiały', icon: MaterialsIcon, category: 'MANAGEMENT' },
  { to: '/sesje', label: 'Sesje', icon: SessionsIcon, category: 'MANAGEMENT' },
]

export default function PlatformLayout() {
  const { profile, signOut } = useAuth()

  // Group nav items by category
  const categories = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col shrink-0" style={{ background: '#0f0d1a' }}>
        {/* Logo */}
        <div className="p-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #22d3ee)' }}>
              <span className="text-white font-black text-xl" style={{ fontFamily: 'var(--font-mono)' }}>M</span>
            </div>
            <div>
              <p className="text-white font-black text-base tracking-tight">MyWay</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#e879f9' }}>Platform</p>
            </div>
          </div>
        </div>

        {/* Nav with categories */}
        <nav className="flex-1 px-3 space-y-5">
          {Object.entries(categories).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] px-3 mb-2" style={{ color: cat === 'OVERVIEW' ? '#e879f9' : '#22d3ee' }}>{cat}</p>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                        isActive
                          ? 'text-white'
                          : 'text-[#5a6178] hover:text-[#a0aec0]'
                      }`
                    }
                    style={({ isActive }) => isActive ? { background: 'rgba(167, 139, 250, 0.12)' } : {}}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'linear-gradient(180deg, #a78bfa, #22d3ee)' }} />
                        )}
                        <item.icon active={isActive} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'linear-gradient(135deg, #7c3aed, #e879f9)', color: 'white' }}>
                {profile?.name?.charAt(0) || 'T'}
              </div>
              <div>
                <p className="text-white text-xs font-bold">{profile?.name}</p>
                <p className="text-[10px] font-bold" style={{ color: '#5a6178' }}>Terapeuta</p>
              </div>
            </div>
            <button onClick={signOut} className="hover:opacity-80 transition-opacity" style={{ color: '#5a6178' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#13111c' }}>
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function DashboardIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
}
function PatientsIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#22d3ee' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
}
function MaterialsIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#e879f9' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
}
function SessionsIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#2dd4bf' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
}
