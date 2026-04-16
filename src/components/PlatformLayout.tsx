import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true, category: 'START' },
  { to: '/pacjenci', label: 'Pacjenci', icon: PatientsIcon, category: 'PRACA' },
  { to: '/materialy', label: 'Materiały', icon: MaterialsIcon, category: 'PRACA' },
  { to: '/sesje', label: 'Sesje', icon: SessionsIcon, category: 'PRACA' },
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
    <div className="platform-shell flex min-h-dvh bg-bg-primary">
      {/* Sidebar */}
      <aside className="w-[292px] flex flex-col shrink-0 p-5">
        <div className="flex min-h-[calc(100dvh-40px)] flex-col rounded-[34px] border border-border-light bg-[#07110e]/78 glass shadow-[0_28px_90px_rgba(0,0,0,0.42)] overflow-hidden">
        {/* Logo */}
        <div className="p-5 pb-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="MyWay" className="w-12 h-12" style={{ borderRadius: 16, boxShadow: '0 18px 42px rgba(114, 213, 199, 0.18)' }} />
            <div>
              <p className="text-text-primary font-black text-base tracking-tight">MyWay</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d6a85f]">Platform</p>
            </div>
          </div>
          <div className="mt-5 rounded-[24px] border border-border bg-[#fff8ec]/7 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d6a85f]">Centrum pracy</p>
            <p className="mt-2 text-xl font-black leading-tight text-text-primary">Prowadź pacjentów bez szumu.</p>
          </div>
        </div>

        {/* Nav with categories */}
        <nav className="flex-1 px-4 space-y-5">
          {Object.entries(categories).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] px-3 mb-2 text-text-muted">{cat}</p>
              <div className="space-y-2">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-bold transition-all relative ${
                        isActive
                          ? 'text-[#071411]'
                          : 'text-text-muted hover:text-text-secondary hover:bg-[#fff8ec]/6'
                      }`
                    }
                    style={({ isActive }) => isActive ? { background: 'linear-gradient(145deg, #fff8ec, #d9efe8)', boxShadow: '0 14px 34px rgba(0,0,0,0.18)' } : {}}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full" style={{ background: 'linear-gradient(180deg, #72d5c7, #d6a85f)' }} />
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
        <div className="p-4" style={{ borderTop: '1px solid rgba(245,232,204,0.1)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black" style={{ background: 'linear-gradient(145deg, #a8f1e8, #72d5c7)', color: '#071411' }}>
                {profile?.name?.charAt(0) || 'T'}
              </div>
              <div>
                <p className="text-text-primary text-xs font-bold">{profile?.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">Terapeuta</p>
              </div>
            </div>
            <button onClick={signOut} className="hover:opacity-80 transition-opacity" style={{ color: '#5a6178' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function DashboardIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#071411' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
}
function PatientsIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#071411' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
}
function MaterialsIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#071411' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
}
function SessionsIcon({ active }: { active?: boolean }) {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={active ? '#071411' : 'currentColor'} strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
}
