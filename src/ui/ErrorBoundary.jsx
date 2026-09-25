import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL SCENE / GAME ERROR CAUGHT BY ERROR BOUNDARY:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReturnToMenu = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReturnToMenu) {
      this.props.onReturnToMenu();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at center, #1e112a 0%, #0a0512 80%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 24,
            color: '#f3f4f6',
            textAlign: 'center'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '36px 48px',
              maxWidth: 580,
              border: '2px solid #ef4444',
              boxShadow: '0 0 35px rgba(239, 68, 68, 0.4)'
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: '4px', color: '#a855f7', fontWeight: 800, marginBottom: 8 }}>
              RECOVERY MODE
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontWeight: 900,
                fontSize: 28,
                color: '#c084fc',
                margin: '0 0 14px 0'
              }}
            >
              SAFE RECOVERY
            </h2>
            <p style={{ fontSize: 15, color: '#e5e7eb', marginBottom: 12, lineHeight: 1.6 }}>
              The previous save state or scene asset could not be completely rendered.
              <br />
              We have safely restored your last valid checkpoint.
            </p>
            {process.env.NODE_ENV !== 'production' && (
              <div
                style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '8px 12px',
                  borderRadius: 4,
                  marginBottom: 20,
                  fontFamily: 'monospace',
                  wordBreak: 'break-word',
                  maxHeight: 90,
                  overflowY: 'auto'
                }}
              >
                {this.state.error?.message || 'Handled runtime state recovery'}
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                className="btn-rpg"
                style={{ padding: '12px 24px', fontSize: 14 }}
              >
                [ CONTINUE ]
              </button>
              <button
                onClick={this.handleReturnToMenu}
                className="btn-rpg btn-rpg-secondary"
                style={{ padding: '12px 24px', fontSize: 14 }}
              >
                [ RETURN TO MENU ]
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
