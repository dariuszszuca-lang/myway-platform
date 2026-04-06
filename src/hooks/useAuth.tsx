import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getProfile, setProfile as restSetProfile } from '../lib/firestore-rest'

const ADMIN_EMAILS = [
  'krystiannagaba@gmail.com',
  'npucz708@gmail.com',
  'mywaymarcin@gmail.com',
  'dariusz.szuca@gmail.com',
]

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export interface UserProfile {
  name: string
  sobrietyDate: string
  role: 'patient' | 'therapist'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserProfile | null>
  signUp: (email: string, password: string, name: string, sobrietyDate?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const skipNextAuthRead = useRef(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setLoading(false)
        return
      }
      if (skipNextAuthRead.current) {
        skipNextAuthRead.current = false
        setLoading(false)
        return
      }
      try {
        const data = await getProfile(firebaseUser.uid)
        if (data) setProfile(data as unknown as UserProfile)
      } catch { /* ignore */ }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string): Promise<UserProfile | null> => {
    skipNextAuthRead.current = true
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const data = await getProfile(cred.user.uid)
    if (data) {
      const p = data as unknown as UserProfile
      if (isAdminEmail(email) && p.role !== 'therapist') {
        p.role = 'therapist'
        await restSetProfile(cred.user.uid, { ...data, role: 'therapist' })
      }
      setProfile(p)
      setLoading(false)
      return p
    }
    setLoading(false)
    return null
  }

  const signUp = async (email: string, password: string, name: string, sobrietyDate?: string) => {
    skipNextAuthRead.current = true
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const role = isAdminEmail(email) ? 'therapist' : 'patient'
    const profileData = {
      name,
      sobrietyDate: sobrietyDate || '',
      role,
      createdAt: new Date().toISOString(),
    }
    await restSetProfile(cred.user.uid, profileData)
    setProfile(profileData as UserProfile)
    setLoading(false)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
