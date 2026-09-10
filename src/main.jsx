import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import { CheckInsProvider } from './CheckInsContext.jsx';
import { BadgesProvider } from './BadgesContext.jsx';
import { getPublicPage } from './components/PublicPages.jsx';
import LandingPage from './components/LandingPage.jsx';
import JoinPage from './components/JoinPage.jsx';
import { shouldShowLandingPage } from './siteRouting.js';
import './index.css';

const PublicPage = getPublicPage(window.location.pathname);
const showJoinPage = window.location.pathname.replace(/\/$/, '') === '/join';
const showLandingPage = shouldShowLandingPage(
  window.location.hostname,
  window.location.pathname,
  window.location.search
);

// The map is intentionally a fixed-height app, but public information pages
// should use Safari's normal document scrolling. A nested overflow container
// can fight the collapsing iOS address bar and snap the page back down.
document.documentElement.classList.toggle(
  'public-page-document',
  Boolean(PublicPage || showJoinPage)
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {showJoinPage ? (
      <JoinPage />
    ) : showLandingPage ? (
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
