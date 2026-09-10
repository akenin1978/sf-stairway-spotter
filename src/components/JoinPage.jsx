import appIconUrl from '../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
import StoreDownloadLinks from './StoreDownloadLinks';
import { hasStoreLinks, STORE_LINKS } from '../storeLinks';

const WEB_APP_URL = 'https://sfstairwayspotter.app';

export default function JoinPage() {
  const storesAreLive = hasStoreLinks();

  return (
    <main id="top" className="join-page">
      <section className="join-card">
        <a className="join-brand" href="/" aria-label="SF Stairway Spotter home">
          <img src={appIconUrl} alt="" />
          <span>SF Stairway Spotter</span>
        </a>

        <p className="landing-eyebrow">Step up, San Francisco!</p>
        <h1>Your friend invited you to SF Stairway Spotter.</h1>
        <p className="join-intro">
          Discover San Francisco’s public stairways, track your progress, and
          compare verified climbs.
        </p>

        <StoreDownloadLinks className="join-store-links" />

        {!storesAreLive && (
          <div className="join-coming-soon" role="status">
            <strong>The iPhone app is launching soon.</strong>
            <span>Android is coming later.</span>
          </div>
        )}

        {STORE_LINKS.appStore && !STORE_LINKS.googlePlay && (
          <p className="join-platform-note">Android is coming soon.</p>
        )}

        <a className="join-web-link" href={WEB_APP_URL}>
          Explore the web map
        </a>
      </section>
    </main>
  );
}
