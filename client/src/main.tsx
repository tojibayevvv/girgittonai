import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import MenuPage from './pages/MenuPage';
import NotFound from './pages/NotFound';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* QR kodi shu manzilga olib keladi: /t/<table-code> */}
        <Route path="/t/:tableCode" element={<MenuPage />} />
        <Route path="/" element={<Navigate to="/t/demotable1" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
