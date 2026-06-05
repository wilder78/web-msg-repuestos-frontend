import React from "react";
import { AlertTriangle } from "lucide-react";

export default class ProfileSectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Profile section error boundary caught an error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-50 p-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                No fue posible abrir esta seccion
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ocurrio un problema al renderizar el perfil o los ajustes de cuenta.
              </p>
              <button
                type="button"
                onClick={this.handleReset}
                className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
