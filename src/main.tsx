import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { RoomProvider } from './context/RoomContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="遊戲室應用系統異常">
      <AuthProvider>
        <RoomProvider>
          <AppContent />
        </RoomProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
