import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { CheckInsProvider } from './CheckInsContext.jsx';
import { BadgesProvider } from './BadgesContext.jsx';
import { getPublicPage } from './components/PublicPages.jsx';
import LandingPage from './components/LandingPage.jsx';
import { shouldShowLandingPage } from './siteRouting.js';
import './index.css';

const PublicPage = getPublicPage(window.location.pathname);
const showLandingPage = shouldShowLandingPage(
  window.location.hostname,
  window.location.pathname
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {showLandingPage ? (
      <LandingPage />
    ) : PublicPage ? (
      <PublicPage />
    ) : (
      <AuthProvider>
        <CheckInsProvider>
          <BadgesProvider>
            <App />
          </BadgesProvider>
        </CheckInsProvider>
      </AuthProvider>
    )}
  </React.StrictMode>
);
