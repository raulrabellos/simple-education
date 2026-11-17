import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fontes instaladas pelo npm: funcionam mesmo sem internet na apresentação.
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/nunito/800.css';
import './styles/global.css';
import './styles/pages.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
