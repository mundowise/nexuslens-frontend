export interface User {
  id: string
  email: string
  created_at: string
}

export interface Document {
  id: string
  name: string
  category: string | null
  uploaded_at: string
  page_count: number | null
  overall_risk_score: number | null
  analysis_json: Record<string, unknown> | null
}

export interface DocumentDetail extends Document {
  raw_text: string | null
  findings: Finding[]
}

export interface Finding {
  id: string
  document_id: string
  type: 'risk' | 'obligation' | 'deadline' | 'cost' | 'question'
  severity: 'critical' | 'warning' | 'info' | 'ok'
  title: string
  description: string | null
  original_text: string | null
  human_explanation: string | null
  page_number: number | null
  position_json: PositionInfo | null
  confidence: number | null
  suggested_questions: string[] | null
}

export interface PositionInfo {
  page: number
  char_offset: number
  char_length: number
  relative_position: number
}

export interface Connection {
  id: string
  source_finding_id: string
  target_finding_id: string
  strength: number | null
  relationship_type: string | null
  explanation: string | null
  human_explanation: string | null
  severity: string | null
  source_document_name: string | null
  target_document_name: string | null
  source_finding_title: string | null
  target_finding_title: string | null
}

export interface TimelineEvent {
  id: string
  document_id: string
  finding_id: string | null
  event_date: string | null
  event_type: string | null
  description: string | null
  severity: string | null
  is_recurring: boolean
  recurrence_pattern: string | null
  document_name: string | null
  document_category: string | null
}

export interface Alert {
  event: TimelineEvent
  alert_message: string
  days_until: number
  related_events: TimelineEvent[]
}

export interface GraphNode {
  id: string
  label: string
  category: string | null
  risk_score: number | null
  finding_count: number
  node_type: 'document' | 'finding'
  parent_id: string | null
  x: number
  y: number
  z: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  strength: number | null
  relationship_type: string | null
  severity: string | null
  label: string | null
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface CompareChange {
  type: 'added' | 'removed' | 'modified'
  severity: string
  description: string
  original_text: string | null
  new_text: string | null
  impact: string | null
}

export interface CompareResult {
  summary: string
  changes: CompareChange[]
  risk_change: 'increased' | 'decreased' | 'unchanged'
  recommendation: string
}

export interface AnalysisProgress {
  step: string
  progress: number
  document_id: string
}

export type AppMode = 'nexus' | 'lens' | 'timeline'
export type Theme = 'dark' | 'light'
export type Lang = 'es' | 'en'
