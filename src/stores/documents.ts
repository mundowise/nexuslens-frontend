import { create } from 'zustand'
import type { Document, DocumentDetail, GraphData, Connection, TimelineEvent, Alert, AnalysisProgress, CompareResult } from '@/types'
import { docsApi, graphApi, connectionsApi, timelineApi } from '@/services/api'

interface DocumentsState {
  documents: Document[]
  current: DocumentDetail | null
  graph: GraphData | null
  connections: Connection[]
  timelineEvents: TimelineEvent[]
  alerts: Alert[]
  analysisProgress: AnalysisProgress | null
  compareResult: CompareResult | null
  loading: boolean
  error: string | null

  fetchDocuments: () => Promise<void>
  fetchDocument: (id: string) => Promise<void>
  fetchGraph: () => Promise<void>
  fetchConnections: (docId?: string) => Promise<void>
  fetchTimeline: () => Promise<void>
  fetchAlerts: (days?: number) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  clearAllDocuments: () => Promise<void>
  compareDocuments: (a: string, b: string) => Promise<void>
  setAnalysisProgress: (p: AnalysisProgress | null) => void
  clearCurrent: () => void
  clearError: () => void
}

export const useDocuments = create<DocumentsState>((set, get) => ({
  documents: [],
  current: null,
  graph: null,
  connections: [],
  timelineEvents: [],
  alerts: [],
  analysisProgress: null,
  compareResult: null,
  loading: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await docsApi.list()
      set({ documents: data.documents })
    } catch {
      set({ error: 'Failed to load documents' })
    } finally {
      set({ loading: false })
    }
  },

  fetchDocument: async (id) => {
    set({ loading: true, error: null })
    try {
      const { data } = await docsApi.get(id)
      set({ current: data })
    } catch {
      set({ error: 'Document not found' })
    } finally {
      set({ loading: false })
    }
  },

  fetchGraph: async () => {
    try {
      const { data } = await graphApi.get()
      set({ graph: data })
    } catch {
      set({ error: 'Failed to load graph' })
    }
  },

  fetchConnections: async (docId) => {
    try {
      const { data } = await connectionsApi.list(docId)
      set({ connections: data.connections })
    } catch { /* non-critical */ }
  },

  fetchTimeline: async () => {
    try {
      const { data } = await timelineApi.events()
      set({ timelineEvents: data.events })
    } catch {
      set({ error: 'Failed to load timeline' })
    }
  },

  fetchAlerts: async (days = 90) => {
    try {
      const { data } = await timelineApi.alerts(days)
      set({ alerts: data.alerts })
    } catch { /* non-critical */ }
  },

  deleteDocument: async (id) => {
    await docsApi.delete(id)
    const { fetchGraph, fetchTimeline, fetchConnections } = get()
    set((s) => ({
      documents: s.documents.filter((d) => d.id !== id),
      current: s.current?.id === id ? null : s.current,
    }))
    fetchGraph().catch(() => {})
    fetchTimeline().catch(() => {})
    fetchConnections().catch(() => {})
  },

  clearAllDocuments: async () => {
    await docsApi.deleteAll()
    set({
      documents: [], current: null, graph: null,
      connections: [], timelineEvents: [], alerts: [],
      compareResult: null, analysisProgress: null,
    })
  },

  compareDocuments: async (a, b) => {
    set({ loading: true, error: null })
    try {
      const { data } = await docsApi.compare(a, b)
      set({ compareResult: data })
    } catch {
      set({ error: 'Comparison failed' })
    } finally {
      set({ loading: false })
    }
  },

  setAnalysisProgress: (p) => set({ analysisProgress: p }),
  clearCurrent: () => set({ current: null, compareResult: null }),
  clearError: () => set({ error: null }),
}))
