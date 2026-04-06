import { auth } from './firebase'

const PROJECT = 'myway-app-d3b78'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

async function getToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

function fromFirestore(fields: Record<string, { stringValue?: string }>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(fields)) {
    result[key] = val.stringValue || ''
  }
  return result
}

function toFirestore(data: Record<string, string>): { fields: Record<string, { stringValue: string }> } {
  const fields: Record<string, { stringValue: string }> = {}
  for (const [key, val] of Object.entries(data)) {
    fields[key] = { stringValue: val }
  }
  return { fields }
}

export async function getProfile(uid: string) {
  const token = await getToken()
  const res = await fetch(`${BASE}/users/${uid}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  const doc = await res.json()
  return fromFirestore(doc.fields)
}

export async function setProfile(uid: string, data: Record<string, string>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/users?documentId=${uid}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestore(data))
  })
  if (!res.ok) {
    // Try PATCH if document already exists
    const res2 = await fetch(`${BASE}/users/${uid}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(toFirestore(data))
    })
    if (!res2.ok) throw new Error('Firestore write failed')
  }
}
