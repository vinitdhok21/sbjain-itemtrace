import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { runEnvironmentDiagnostics } from './utils/envCheck';

// Run development diagnostics
runEnvironmentDiagnostics();

createRoot(document.getElementById('root')).render(
  <App />
);