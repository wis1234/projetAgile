import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Composant a crashé:', error, info);
  }

  render() {
    if (this.state.hasError) return null; // échoue silencieusement, n'affecte pas le reste de l'app
    return this.props.children;
  }
}

export default ErrorBoundary;