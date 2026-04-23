import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CoupleProvider } from './context/CoupleContext';
import App from './App.jsx';
import './styles/globals.css';

const container = document.getElementById('root');
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
