import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { AuthProvider } from 'context/AuthContext';
import { PreferencesProvider } from 'context/PreferencesContext';
import { WebSocketProvider } from 'context/WebSocketContext';
import 'scss/global.scss';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196F3',
      dark: '#1565C0',
      light: '#E3F2FD',
    },
    error: {
      main: '#F44336',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF9800',
    },
    background: {
      default: '#F0F4F8',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PreferencesProvider>
          <WebSocketProvider>
            <App />
          </WebSocketProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
