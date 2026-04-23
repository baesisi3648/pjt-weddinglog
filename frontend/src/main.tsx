import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CoupleProvider } from './context/CoupleContext';
import App from './App';
import './styles/globals.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CoupleProvider>
        <App />
      </CoupleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
