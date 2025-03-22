import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import CompleteSignup from './CompleteSignup';
import PublicSignup from './PublicSignup';
import './index.css'; // Make sure this file exists

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/complete-signup" element={<CompleteSignup />} />
        <Route path="/signup" element={<PublicSignup />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);