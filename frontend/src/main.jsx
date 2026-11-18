import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import UporabnikProvider from './auth/UporabnikProvider.jsx';
import IzbiraProvider from './izbira/IzbiraProvider.jsx';
import ObvestilaProvider from './obvestila/ObvestilaProvider.jsx';
import { poti } from './poti.jsx';
import './index.css';

// BASE_URL je lokalno '/', na GitHub Pages pa podpot repozitorija (vite build --base).
const router = createBrowserRouter(poti, { basename: import.meta.env.BASE_URL });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UporabnikProvider>
      <IzbiraProvider>
        <ObvestilaProvider>
          <RouterProvider router={router} />
        </ObvestilaProvider>
      </IzbiraProvider>
    </UporabnikProvider>
  </StrictMode>,
);
