import { STORE_LINKS } from '../storeLinks';

export default function StoreDownloadLinks({ className = '' }) {
  if (!STORE_LINKS.appStore && !STORE_LINKS.googlePlay) return null;

  return (
    <div className={`store-download-links ${className}`.trim()}>
      {STORE_LINKS.appStore && (
        <a className="store-download-button" href={STORE_LINKS.appStore}>
          <span aria-hidden="true">●</span>
          <span>
            <small>Download on the</small>
            App Store
          </span>
        </a>
      )}
      {STORE_LINKS.googlePlay && (
        <a className="store-download-button" href={STORE_LINKS.googlePlay}>
          <span aria-hidden="true">▶</span>
          <span>
            <small>GET IT ON</small>
            Google Play
          </span>
        </a>
      )}
    </div>
  );
}
