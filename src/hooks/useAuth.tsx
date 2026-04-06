import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

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
  sobrietyDate: string // ISO date string
  role: 'patient' | 'therapist'
  createdAt: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserProfile | null>
  signUp: (email: string, password: string, name: string, sobrietyDate: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string): Promise<UserProfile | null> => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (snap.exists()) {
      const p = snap.data() as UserProfile
      // Auto-fix: admin z rolą patient → upgrade do therapist
      if (isAdminEmail(email) && p.role !== 'therapist') {
        p.role = 'therapist'
        await updateDoc(doc(db, 'users', cred.user.uid), { role: 'therapist' })
      }
      setProfile(p)
      return p
    }
    return null
  }

  const signUp = async (email: string, password: string, name: string, sobrietyDate?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const role = isAdminEmail(email) ? 'therapist' : 'patient'
    const newProfile: UserProfile = {
      name,
      sobrietyDate: sobrietyDate || '',
      role,
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), newProfile)
    setProfile(newProfile)
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
