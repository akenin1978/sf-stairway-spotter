import { useLayoutEffect, useRef } from 'react';
import { LAUNCH_LINKS, freshPublicPageUrl } from '../launchLinks';
import {
  PrivacyContent,
  SupportContent,
  TermsContent,
} from './PublicPages';
import useDialogFocus from './useDialogFocus';

const PAGE_DETAILS = {
  support: {
    title: 'Support',
    path: LAUNCH_LINKS.support,
    Content: SupportContent,
  },
  privacy: {
    title: 'Privacy Policy',
    path: LAUNCH_LINKS.privacy,
    Content: PrivacyContent,
  },
  terms: {
    title: 'Terms of Use',
    path: LAUNCH_LINKS.terms,
    Content: TermsContent,
  },
};

export default function InAppPublicPage({ page, onClose }) {
  const dialogRef = useDialogFocus(onClose);
  const scrollRef = useRef(null);
  const details = PAGE_DETAILS[page];

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [page]);

  if (!details) return null;
  const { title, path, Content } = details;

  return (
    <section
      className="in-app-public-page"
      role="dialog"
      aria-modal="true"
      aria-labelledby="in-app-public-page-title"
      ref={dialogRef}
    >
      <header className="in-app-public-page-header">
        <h1 id="in-app-public-page-title">{title}</h1>
        <button
          type="button"
          className="in-app-public-page-close"
          onClick={onClose}
          aria-label={`Close ${title}`}
        >
          ×
        </button>
      </header>
      <div className="in-app-public-page-scroll" ref={scrollRef}>
        <div className="in-app-public-page-content">
          <Content />
          <a
            className="in-app-public-page-browser-link"
            href={freshPublicPageUrl(path)}
            target="_blank"
            rel="noreferrer"
          >
            Open in browser
          </a>
        </div>
      </div>
    </section>
  );
}
