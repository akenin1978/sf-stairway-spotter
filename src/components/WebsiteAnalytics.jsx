import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { analyticsPage, readAnalyticsChoice, saveAnalyticsChoice, startWebsiteAnalytics, stopWebsiteAnalytics } from '../websiteAnalytics';

export default function WebsiteAnalytics() {
  const page = analyticsPage(new URL(window.location.href), Capacitor.isNativePlatform());
  const [choice, setChoice] = useState(readAnalyticsChoice);
  const [open, setOpen] = useState(!choice);
  useEffect(() => {
    if (page && choice === 'granted') startWebsiteAnalytics(page);
  }, [page, choice]);
  if (!page) return null;
  function choose(next) {
    saveAnalyticsChoice(next);
    if (next === 'denied') stopWebsiteAnalytics();
    // Reload when changing an existing choice so the Google script is removed
    // on opt-out and a previously disabled tag is reinitialized on opt-in.
    if (choice && next !== choice) { window.location.reload(); return; }
    setChoice(next);
    setOpen(false);
  }
  return open ? (
    <section className="website-analytics-banner" aria-label="Website analytics preferences">
      <p>May we use Google Analytics cookies to understand website visits and which newsletters bring people here? <a href="/privacy">Privacy policy</a></p>
      <div>
        <button type="button" onClick={() => choose('granted')}>Allow analytics</button>
        <button type="button" onClick={() => choose('denied')}>No thanks</button>
        {choice && <button type="button" onClick={() => setOpen(false)}>Close</button>}
      </div>
    </section>
  ) : <button className="website-analytics-settings" type="button" onClick={() => setOpen(true)}>Analytics preferences</button>;
}
