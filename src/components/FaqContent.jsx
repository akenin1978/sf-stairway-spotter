import { useEffect, useRef } from 'react';
import source from '../faq.md?raw';
import './faq.css';

export const slug = (text) => text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const faqSections = source.split(/^## /m).slice(1).map((section) => {
  const [title, ...questions] = section.split(/^### /m);
  return { title: title.trim(), id: slug(title.trim()), questions: questions.map((entry) => {
    const end = entry.indexOf('\n');
    const question = entry.slice(0, end).replace(/^\d+\. /, '').trim();
    return { question, id: slug(question), answer: entry.slice(end).trim() };
  }) };
});

function Inline({ text }) {
  return text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*)/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={i} href={link[2]}>{link[1]}</a>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

export default function FaqContent({ embedded = false }) {
  const root = useRef(null);
  useEffect(() => {
    if (embedded) return;
    const previousTitle = document.title;
    document.title = 'Frequently Asked Questions | SF Stairway Spotter';
    const showAnchor = () => {
      const id = window.location.hash.slice(1);
      const element = [...root.current.querySelectorAll('[id]')].find((node) => node.id === id);
      if (!element) return;
      if (element.tagName === 'DETAILS') element.open = true;
      requestAnimationFrame(() => element.scrollIntoView({ block: 'start' }));
    };
    showAnchor();
    window.addEventListener('hashchange', showAnchor);
    return () => { window.removeEventListener('hashchange', showAnchor); document.title = previousTitle; };
  }, [embedded]);
  const jump = (id) => {
    const element = [...root.current.querySelectorAll('[id]')].find((node) => node.id === id);
    element?.scrollIntoView({ block: 'start' });
  };
  return <div className="faq-content" ref={root}>
    <p>Find answers about exploring stairways, saving your progress, friends, and your account.</p>
    <nav className="faq-topics" aria-label="Jump to a topic">
      <h2>Jump to a topic</h2>
      {faqSections.map((section) => embedded
        ? <button key={section.id} onClick={() => jump(section.id)}>{section.title}</button>
        : <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
    </nav>
    {faqSections.map((section) => <section key={section.id} id={section.id} className="faq-section">
      <h2>{section.title}</h2>
      {section.questions.map((entry) => <details key={entry.id} id={entry.id} open={!embedded && window.location.hash === `#${entry.id}` ? true : undefined}>
        <summary>{entry.question}</summary>
        <div className="faq-answer">
          {entry.answer.split(/\n\s*\n/).map((paragraph, i) => paragraph.startsWith('- ')
            ? <ul key={i}><li><Inline text={paragraph.slice(2)} /></li></ul>
            : <p key={i}><Inline text={paragraph} /></p>)}
          <a className="faq-permalink" href={`https://www.sfstairwayspotter.com/faq#${entry.id}`} target={embedded ? '_blank' : undefined} rel={embedded ? 'noreferrer' : undefined} aria-label={`Link to answer: ${entry.question}`}>Link to this answer</a>
        </div>
      </details>)}
    </section>)}
    <p>Still need help? Visit <a href="https://www.sfstairwayspotter.com/support">Support</a> or email <a href="mailto:info@urbanhikersf.com">info@urbanhikersf.com</a>.</p>
  </div>;
}
