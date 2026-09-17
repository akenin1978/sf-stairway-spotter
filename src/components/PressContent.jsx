import { useEffect } from 'react';
import source from '../press.md?raw';
import './faq.css';

export const pressQuestions = source.split(/^### /m).slice(1).map((entry) => {
  const end = entry.indexOf('\n');
  return { title: entry.slice(0, end).trim(), answer: entry.slice(end).trim() };
});

function Inline({ text }) {
  return text.split(/(\[[^\]]+\]\((?:https?:\/\/|mailto:)[^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)]+)\)$/);
    if (link) return <a key={i} href={link[2]}><Inline text={link[1]} /></a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export default function PressContent() {
  useEffect(() => { document.title = 'Press Resources | SF Stairway Spotter'; }, []);
  return <div className="faq-content">
    <p><strong>Discover, track, and explore San Francisco’s public stairways—one climb at a time.</strong></p>
    <p>SF Stairway Spotter helps visitors and locals discover San Francisco on foot. The app brings together stairway photographs and details with a personal checklist, verified visits, badges, and optional community features like friends and a leaderboard.</p>
    <p>From celebrated mosaic steps to overlooked neighborhood shortcuts, park stairways, and gardens, the collection gives people new reasons to explore beyond the city’s familiar landmarks.</p>
    {pressQuestions.map((q, i) => <section key={q.title} className="faq-section" id={`press-question-${i+1}`}>
      <h2>{q.title}</h2>
      {q.answer.split(/\n\s*\n/).map((p, j) => p.startsWith('- ')
        ? <ul key={j}>{p.split('\n').map((line,k)=><li key={k}><Inline text={line.slice(2)}/></li>)}</ul>
        : <p key={j}><Inline text={p}/></p>)}
    </section>)}
    <p className="public-page-updated">Updated September 17, 2026. Launch timing and pricing are planned and subject to change.</p>
  </div>;
}
