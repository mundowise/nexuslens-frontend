import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''
const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexuslens-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexuslens-token')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (email: string, password: string) =>
    api.post('/api/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
}

export const docsApi = {
  list: () => api.get('/api/documents'),
  get: (id: string) => api.get(`/api/documents/${id}`),
  getFileBlob: async (id: string): Promise<string> => {
    const resp = await api.get(`/api/documents/${id}/file`, { responseType: 'blob' })
    return URL.createObjectURL(resp.data)
  },
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  delete: (id: string) => api.delete(`/api/documents/${id}`),
  deleteAll: () => api.delete('/api/documents/all'),
  reanalyze: (id: string) => api.post(`/api/documents/${id}/reanalyze`),
  compare: (docAId: string, docBId: string) =>
    api.post('/api/documents/compare', { doc_a_id: docAId, doc_b_id: docBId }),
}

export const connectionsApi = {
  list: (docId?: string) =>
    api.get('/api/connections', { params: docId ? { doc_id: docId } : {} }),
  refresh: () => api.post('/api/connections/refresh'),
}

export const timelineApi = {
  events: () => api.get('/api/timeline'),
  alerts: (daysAhead = 90) =>
    api.get('/api/timeline/alerts', { params: { days_ahead: daysAhead } }),
}

export const graphApi = {
  get: () => api.get('/api/graph'),
}

export function connectAnalysisWS(
  documentId: string,
  onMessage: (data: { step: string; progress: number; document_id: string }) => void,
  onError?: (err: Event) => void
): WebSocket {
  const token = localStorage.getItem('nexuslens-token') || ''
  const ws = new WebSocket(`${WS_URL}/api/ws/analysis-progress/${documentId}?token=${token}`)

  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data))
    } catch {
      // skip malformed messages
    }
  }

  ws.onerror = (err) => onError?.(err)

  return ws
}

/**
 * Poll analysis progress via HTTP (reliable fallback for WebSocket).
 * Returns a cleanup function to stop polling.
 */
export function pollAnalysisProgress(
  documentId: string,
  onProgress: (data: { step: string; progress: number }) => void,
  intervalMs = 2000,
): () => void {
  let active = true

  const poll = async () => {
    while (active) {
      try {
        const { data } = await api.get(`/api/documents/${documentId}/progress`)
        onProgress(data)
        if (data.step === 'done' || data.step === 'error') {
          active = false
          return
        }
      } catch {
        // ignore polling errors
      }
      await new Promise(r => setTimeout(r, intervalMs))
    }
  }

  poll()

  return () => { active = false }
}

export default api
