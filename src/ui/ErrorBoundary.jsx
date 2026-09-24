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
            <div style={{ fontSize: 13, letterSpacing: '4px', color: '#f87171', fontWeight: 800, marginBottom: 8 }}>
              RECOVERY SYSTEM
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontWeight: 900,
                fontSize: 32,
                color: '#ef4444',
                margin: '0 0 14px 0'
              }}
            >
              GAME ERROR
            </h2>
            <p style={{ fontSize: 15, color: '#e5e7eb', marginBottom: 12 }}>
              The 3D scene failed to load.
            </p>
            <div
              style={{
                fontSize: 12,
                color: '#fca5a5',
                background: 'rgba(0, 0, 0, 0.6)',
                padding: '10px 14px',
                borderRadius: 4,
                marginBottom: 24,
                fontFamily: 'monospace',
                wordBreak: 'break-word',
                maxHeight: 120,
                overflowY: 'auto'
              }}
            >
              {this.state.error?.message || 'WebGL Context Creation Failure or Shader Error'}
            </div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                className="btn-rpg"
                style={{ padding: '12px 24px', fontSize: 14 }}
              >
                [ RETRY ]
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
