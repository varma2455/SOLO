import React from 'react';

/**
 * Three.js React Error Boundary
 * Safely catches runtime errors inside a Three.js / R3F Canvas tree.
 * Renders an optional 3D fallback group instead of crashing the entire scene.
 */
export class ThreeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const name = this.props.name || 'ThreeSceneComponent';
    console.warn(`[ThreeErrorBoundary] Caught error in 3D sub-tree "${name}":`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps) {
    // Reset boundary if resetKeys change
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Return empty group so R3F reconciler stays stable without throwing
      return <group name={`error_fallback_${this.props.name || 'unknown'}`} />;
    }
    return this.props.children;
  }
}
