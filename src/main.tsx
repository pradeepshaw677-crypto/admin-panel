import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdminPanel } from './components/admin/AdminPanel';
import { initCodeProtection } from './utils/codeProtection';
import './index.css';

initCodeProtection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminPanel />
  </StrictMode>,
);
