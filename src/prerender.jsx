import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LandingPage from './components/LandingPage';
import { getPublicPage } from './components/PublicPages';
export function renderPublicPage(path) {
  const Page = path === '/welcome' ? LandingPage : getPublicPage(path);
  if (!Page) throw new Error(`Unknown public route: ${path}`);
  return renderToStaticMarkup(<Page />);
}
export function renderMapIntroduction() {
  return renderToStaticMarkup(<main className="public-page"><div className="public-page-card">
    <h1>SF Stairway Spotter</h1><p>Explore more than 1,200 San Francisco stairways with an interactive map, photos, and visit tracking.</p>
    <p>The interactive map requires JavaScript. If JavaScript is enabled, it will open shortly.</p>
    <nav aria-label="About SF Stairway Spotter">{['welcome','mailing-list','pricing','faq','press','terms','privacy','support'].map(path =>
      <p key={path}><a href={`/${path}`}>{path === 'welcome' ? 'About the app' : path === 'faq' ? 'FAQ' : path[0].toUpperCase()+path.slice(1)}</a></p>)}</nav>
  </div></main>);
}
