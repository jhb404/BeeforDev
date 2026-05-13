import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../../services/logger';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const label = this.props.label ?? 'unknown';
    logger.error(`[ErrorBoundary:${label}]`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset);
      return (
        <div className="error-boundary">
          <p>Algo deu errado nesta seção.</p>
          <pre>{error.message}</pre>
          <button type="button" onClick={this.reset}>
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
