import { useEffect } from 'react';
import source from '../press.md?raw';
import './faq.css';

export const pressQuestions = source.split(/^### /m).slice(1).map((entry) => {
  const end = entry.indexOf('\n');
  return { title: entry.slice(0, end).trim(), answer: entry.slice(end).trim() };
});

function Inline({ text }) {
  return text.split(/(\[[^\]]+\]\((?:https?:\/\/|mailto:)[^)]+\)|\*\*[^*]+\*\*)/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)]+)\)$/);
    if (link) return <a key={i} href={link[2]}>{link[1]}</a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

export default function PressContent() {
  useEffect(() => { document.title = 'Press Resources | SF Stairway Spotter'; }, []);
  return <div className="faq-content">
    <p>SF Stairway Spotter helps people discover San Francisco, one public stairway at a time. The app brings together photos and information for more than 1,250 stairways, then lets people track their discoveries, verify visits, earn badges, and take part in an optional community leaderboard.</p>
    <p><strong>Discover, track, and explore San Francisco’s public stairways—one climb at a time.</strong></p>
    <h2>Download press assets</h2>
    <a className="public-page-primary" href="/press-assets/SF-Stairway-Spotter-Icons-and-Logos-2026-09-14.zip" download>Download app icon &amp; logos (ZIP)</a>
    <p>Includes high-resolution app icons, purple and white logos, transparent PNGs, scalable SVGs, and usage notes. Screenshots, founder portraits, and stairway photographs are available on request and are not included in this ZIP.</p>
    <p>Press contact: <a href="mailto:info@urbanhikersf.com">info@urbanhikersf.com</a></p>
    <h2>Press FAQ</h2>
    {pressQuestions.map((q, i) => <section key={q.title} className="faq-section" id={`press-question-${i+1}`}>
      <h3>{q.title}</h3>
      {q.answer.split(/\n\s*\n/).map((p, j) => p.startsWith('- ')
        ? <ul key={j}>{p.split('\n').map((line,k)=><li key={k}><Inline text={line.slice(2)}/></li>)}</ul>
        : <p key={j}><Inline text={p}/></p>)}
    </section>)}
    <p className="public-page-updated">Updated September 14, 2026. Launch timing and pricing are planned and subject to change.</p>
  </div>;
}
