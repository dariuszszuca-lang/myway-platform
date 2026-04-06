import { auth } from './firebase'

const PROJECT = 'myway-app-d3b78'
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

async function getToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  return user.getIdToken()
}

// ── Firestore value type definitions ──

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } }

type FirestoreFields = Record<string, FirestoreValue>

// ── Decode Firestore REST response to plain JS objects ──

function decodeValue(val: FirestoreValue): unknown {
  if ('stringValue' in val) return val.stringValue
  if ('integerValue' in val) return Number(val.integerValue)
  if ('doubleValue' in val) return val.doubleValue
  if ('booleanValue' in val) return val.booleanValue
  if ('timestampValue' in val) return val.timestampValue
  if ('nullValue' in val) return null
  if ('mapValue' in val) return fromFirestore(val.mapValue.fields || {})
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeValue)
  return null
}

function fromFirestore(fields: FirestoreFields): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(fields)) {
    result[key] = decodeValue(val)
  }
  return result
}

// ── Encode plain JS values to Firestore REST format ──

function encodeValue(val: unknown): FirestoreValue {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === 'string') return { stringValue: val }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) }
    return { doubleValue: val }
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() }
  if (Array.isArray(val)) return { arrayValue: { values: val.map(encodeValue) } }
  if (typeof val === 'object') {
    const fields: Record<string, FirestoreValue> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      fields[k] = encodeValue(v)
    }
    return { mapValue: { fields } }
  }
  return { stringValue: String(val) }
}

function toFirestore(data: Record<string, unknown>): { fields: FirestoreFields } {
  const fields: FirestoreFields = {}
  for (const [key, val] of Object.entries(data)) {
    fields[key] = encodeValue(val)
  }
  return { fields }
}

// ── Document ID extraction helper ──

function extractId(name: string): string {
  // name is like "projects/xxx/databases/(default)/documents/collection/docId"
  const parts = name.split('/')
  return parts[parts.length - 1]
}

// ── REST API operations ──

export interface RestDoc {
  id: string
  [key: string]: unknown
}

/** Get a single document by path */
export async function getDoc(path: string): Promise<RestDoc | null> {
  const token = await getToken()
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  const doc = await res.json()
  if (!doc.fields) return { id: extractId(doc.name) }
  return { id: extractId(doc.name), ...fromFirestore(doc.fields) }
}

/** Get all documents in a collection (no ordering — returns all) */
export async function getCollection(collectionPath: string): Promise<RestDoc[]> {
  const token = await getToken()
  const results: RestDoc[] = []
  let pageToken: string | undefined

  do {
    const url = new URL(`${BASE}/${collectionPath}`)
    url.searchParams.set('pageSize', '300')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) break
    const data = await res.json()
    const docs = data.documents || []
    for (const doc of docs) {
      if (!doc.fields) {
        results.push({ id: extractId(doc.name) })
      } else {
        results.push({ id: extractId(doc.name), ...fromFirestore(doc.fields) })
      }
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  return results
}

/** Run a structured query on a collection (supports orderBy, limit, where) */
export async function runQuery(
  collectionPath: string,
  options: {
    orderBy?: { field: string; direction?: 'ASCENDING' | 'DESCENDING' }
    limit?: number
    where?: { field: string; op: string; value: unknown }
  } = {},
): Promise<RestDoc[]> {
  const token = await getToken()

  // Parent is everything before the last segment
  const parts = collectionPath.split('/')
  const collectionId = parts.pop()!
  const parent = parts.length > 0 ? `${BASE}/${parts.join('/')}` : BASE

  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId }],
  }

  if (options.orderBy) {
    structuredQuery.orderBy = [
      {
        field: { fieldPath: options.orderBy.field },
        direction: options.orderBy.direction || 'ASCENDING',
      },
    ]
  }

  if (options.limit) {
    structuredQuery.limit = options.limit
  }

  if (options.where) {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: options.where.field },
        op: options.where.op,
        value: encodeValue(options.where.value),
      },
    }
  }

  const res = await fetch(`${parent}:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery }),
  })

  if (!res.ok) {
    console.error('runQuery failed:', res.status, await res.text())
    return []
  }

  const results: RestDoc[] = []
  const data = await res.json()
  for (const item of data) {
    if (!item.document) continue
    const doc = item.document
    if (!doc.fields) {
      results.push({ id: extractId(doc.name) })
    } else {
      results.push({ id: extractId(doc.name), ...fromFirestore(doc.fields) })
    }
  }
  return results
}

/** Add a new document to a collection (auto-generated ID) */
export async function addDoc(collectionPath: string, data: Record<string, unknown>): Promise<string> {
  const token = await getToken()
  const res = await fetch(`${BASE}/${collectionPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestore(data)),
  })
  if (!res.ok) throw new Error(`addDoc failed: ${res.status}`)
  const doc = await res.json()
  return extractId(doc.name)
}

/** Update (PATCH) an existing document */
export async function updateDoc(docPath: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  const res = await fetch(`${BASE}/${docPath}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestore(data)),
  })
  if (!res.ok) throw new Error(`updateDoc failed: ${res.status}`)
}

/** Delete a document */
export async function deleteDoc(docPath: string): Promise<void> {
  const token = await getToken()
  const res = await fetch(`${BASE}/${docPath}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`deleteDoc failed: ${res.status}`)
}

/** Set (create or overwrite) a document with a specific ID */
export async function setDoc(docPath: string, data: Record<string, unknown>): Promise<void> {
  const token = await getToken()
  // PATCH creates or overwrites
  const res = await fetch(`${BASE}/${docPath}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestore(data)),
  })
  if (!res.ok) throw new Error(`setDoc failed: ${res.status}`)
}

// ── Legacy helpers (used by useAuth) ──

export async function getProfile(uid: string) {
  const token = await getToken()
  const res = await fetch(`${BASE}/users/${uid}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) return null
  const doc = await res.json()
  if (!doc.fields) return null
  // Legacy: return as Record<string, string> for useAuth compatibility
  const result: Record<string, string> = {}
  for (const [key, val] of Object.entries(doc.fields as FirestoreFields)) {
    result[key] = String(decodeValue(val) ?? '')
  }
  return result
}

export async function setProfile(uid: string, data: Record<string, string>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/users?documentId=${uid}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(toFirestore(data)),
  })
  if (!res.ok) {
    // Try PATCH if document already exists
    const res2 = await fetch(`${BASE}/users/${uid}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(toFirestore(data)),
    })
    if (!res2.ok) throw new Error('Firestore write failed')
  }
}
