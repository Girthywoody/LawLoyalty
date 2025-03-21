import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import CompleteSignup from './CompleteSignup';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/complete-signup" element={<CompleteSignup />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);