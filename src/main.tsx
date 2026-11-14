import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { RoomProvider } from './context/RoomContext';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RoomProvider>
        <AppContent />
      </RoomProvider>
    </AuthProvider>
  </React.StrictMode>
);
