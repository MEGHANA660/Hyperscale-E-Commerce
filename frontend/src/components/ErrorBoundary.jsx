import { Component } from 'react'

// Shows a readable message instead of a blank white page if something crashes.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ maxWidth: 640, margin: '12vh auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#0f172a' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Something went wrong on this page</h1>
        <p style={{ color: '#475569', marginBottom: 16 }}>
          Try reloading. If it keeps happening, copy the message below and send it to the developer.
        </p>
        <pre style={{ background: '#f1f5f9', padding: 16, borderRadius: 12, whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {String(this.state.error?.message || this.state.error)}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ marginTop: 16, background: '#0f172a', color: '#fff', border: 0, borderRadius: 999, padding: '10px 22px', fontWeight: 700, cursor: 'pointer' }}
        >
          Reload page
        </button>
      </div>
    )
  }
}
