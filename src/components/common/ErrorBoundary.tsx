import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 sm:p-7 border-2 border-white/80 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>

            <h3 className="font-extrabold text-lg text-[#2E2925] mb-1">
              {this.props.fallbackTitle || '房間載入異常'}
            </h3>
            <p className="text-xs text-[#96897B] font-medium leading-relaxed mb-6">
              連線或棋局狀態解析時發生問題，點擊下方按鈕可快速重新整理或返回大廳。
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#628395] hover:bg-[#526f7f] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重新整理</span>
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('duo_active_room_id');
                  window.location.href = '/';
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-[#2E2925] border border-[#96897B]/20 font-bold text-xs transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>返回大廳</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
