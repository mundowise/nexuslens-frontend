import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex items-center justify-center px-4"
          style={{ background: 'var(--color-surface-0)' }}>
          <div className="glass p-8 max-w-md text-center">
            <p className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              NexusLens
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              {this.state.error.message}
            </p>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ background: 'var(--color-accent)' }}>
              &circlearrowright;
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
