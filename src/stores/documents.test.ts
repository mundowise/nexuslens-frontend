import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDocuments } from './documents'

vi.mock('@/services/api', () => ({
  docsApi: {
    list: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    compare: vi.fn(),
  },
  graphApi: { get: vi.fn() },
  connectionsApi: { list: vi.fn() },
  timelineApi: { events: vi.fn(), alerts: vi.fn() },
}))

import { docsApi, graphApi, connectionsApi, timelineApi } from '@/services/api'

const doc1 = { id: 'd1', name: 'contrato.pdf', category: 'housing', uploaded_at: '2026-01-01', page_count: 3, overall_risk_score: 7.5, analysis_json: null }
const doc2 = { id: 'd2', name: 'poliza.pdf', category: 'insurance', uploaded_at: '2026-01-02', page_count: 2, overall_risk_score: 4.0, analysis_json: null }

beforeEach(() => {
  useDocuments.setState({
    documents: [], current: null, graph: null, connections: [],
    timelineEvents: [], alerts: [], analysisProgress: null,
    compareResult: null, loading: false, error: null,
  })
  vi.clearAllMocks()
})

describe('documents store', () => {
  it('fetchDocuments populates list', async () => {
    vi.mocked(docsApi.list).mockResolvedValue({ data: { documents: [doc1, doc2], total: 2 } } as any)

    await useDocuments.getState().fetchDocuments()

    expect(useDocuments.getState().documents).toHaveLength(2)
    expect(useDocuments.getState().loading).toBe(false)
  })

  it('fetchDocuments sets error on failure', async () => {
    vi.mocked(docsApi.list).mockRejectedValue(new Error('network'))

    await useDocuments.getState().fetchDocuments()

    expect(useDocuments.getState().error).toBe('Failed to load documents')
    expect(useDocuments.getState().loading).toBe(false)
  })

  it('fetchDocument sets current', async () => {
    const detail = { ...doc1, raw_text: 'texto', findings: [] }
    vi.mocked(docsApi.get).mockResolvedValue({ data: detail } as any)

    await useDocuments.getState().fetchDocument('d1')

    expect(useDocuments.getState().current).toEqual(detail)
  })

  it('fetchGraph stores graph data', async () => {
    const graph = { nodes: [{ id: 'n1' }], edges: [] }
    vi.mocked(graphApi.get).mockResolvedValue({ data: graph } as any)

    await useDocuments.getState().fetchGraph()

    expect(useDocuments.getState().graph).toEqual(graph)
  })

  it('fetchTimeline stores events', async () => {
    const events = [{ id: 'e1', event_date: '2026-06-01' }]
    vi.mocked(timelineApi.events).mockResolvedValue({ data: { events } } as any)

    await useDocuments.getState().fetchTimeline()

    expect(useDocuments.getState().timelineEvents).toEqual(events)
  })

  it('fetchAlerts stores alerts', async () => {
    const alerts = [{ event: { id: 'a1' }, alert_message: 'urgente', days_until: 3 }]
    vi.mocked(timelineApi.alerts).mockResolvedValue({ data: { alerts } } as any)

    await useDocuments.getState().fetchAlerts(30)

    expect(useDocuments.getState().alerts).toEqual(alerts)
  })

  it('deleteDocument removes from list and refreshes', async () => {
    useDocuments.setState({ documents: [doc1, doc2] })
    vi.mocked(docsApi.delete).mockResolvedValue({} as any)
    vi.mocked(graphApi.get).mockResolvedValue({ data: { nodes: [], edges: [] } } as any)
    vi.mocked(timelineApi.events).mockResolvedValue({ data: { events: [] } } as any)
    vi.mocked(connectionsApi.list).mockResolvedValue({ data: { connections: [] } } as any)

    await useDocuments.getState().deleteDocument('d1')

    expect(useDocuments.getState().documents).toHaveLength(1)
    expect(useDocuments.getState().documents[0].id).toBe('d2')
  })

  it('deleteDocument clears current if deleted', async () => {
    useDocuments.setState({ documents: [doc1], current: { ...doc1, raw_text: null, findings: [] } })
    vi.mocked(docsApi.delete).mockResolvedValue({} as any)
    vi.mocked(graphApi.get).mockResolvedValue({ data: { nodes: [], edges: [] } } as any)
    vi.mocked(timelineApi.events).mockResolvedValue({ data: { events: [] } } as any)
    vi.mocked(connectionsApi.list).mockResolvedValue({ data: { connections: [] } } as any)

    await useDocuments.getState().deleteDocument('d1')

    expect(useDocuments.getState().current).toBeNull()
  })

  it('compareDocuments stores result', async () => {
    const result = { summary: 'diff', changes: [], risk_change: 'increased', recommendation: 'revisa' }
    vi.mocked(docsApi.compare).mockResolvedValue({ data: result } as any)

    await useDocuments.getState().compareDocuments('d1', 'd2')

    expect(useDocuments.getState().compareResult).toEqual(result)
  })

  it('compareDocuments sets error on failure', async () => {
    vi.mocked(docsApi.compare).mockRejectedValue(new Error('fail'))

    await useDocuments.getState().compareDocuments('d1', 'd2')

    expect(useDocuments.getState().error).toBe('Comparison failed')
  })

  it('clearCurrent resets current and compareResult', () => {
    useDocuments.setState({ current: { ...doc1, raw_text: null, findings: [] }, compareResult: { summary: 'x', changes: [], risk_change: 'unchanged', recommendation: '' } })

    useDocuments.getState().clearCurrent()

    expect(useDocuments.getState().current).toBeNull()
    expect(useDocuments.getState().compareResult).toBeNull()
  })

  it('setAnalysisProgress updates state', () => {
    useDocuments.getState().setAnalysisProgress({ step: 'parsing', progress: 20, document_id: 'd1' })
    expect(useDocuments.getState().analysisProgress?.step).toBe('parsing')
  })
})
