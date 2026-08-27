import appIconUrl from '../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
import badgesImageUrl from '../assets/landing/badges.jpg';
import checkInImageUrl from '../assets/landing/check-in.jpg';
import mapImageUrl from '../assets/landing/map.jpg';
import { LAUNCH_LINKS } from '../launchLinks';

const WEB_APP_URL = 'https://sfstairwayspotter.app';
const SUPPORT_EMAIL = 'info@urbanhikersf.com';

const features = [
  {
    image: mapImageUrl,
    imageAlt: 'SF Stairway Spotter map filled with color-coded stairway markers',
    imagePosition: 'center 38%',
    title: 'Uncover the city’s stairways',
    body: 'Browse more than 1,200 public stairways across San Francisco, color-coded by rating.',
  },
  {
    image: checkInImageUrl,
    imageAlt: 'Nearby stairways displayed in the SF Stairway Spotter check-in screen',
    imagePosition: 'center 23%',
    title: 'Track every climb',
    body: 'Check in as you explore, build streaks, and watch your personal stairway count grow.',
  },
  {
    image: badgesImageUrl,
    imageAlt: 'Earned neighborhood badges in SF Stairway Spotter',
    imagePosition: 'center 20%',
    title: 'Earn badges for your explorations',
    body: 'Turn a walk across the city into a collection of discoveries, milestones, and local challenges.',
  },
];

function DotStairway() {
  return (
    <div className="landing-dot-stairway" aria-hidden="true">
      <span className="landing-dot landing-dot-red landing-dot-1" />
      <span className="landing-dot landing-dot-red landing-dot-2" />
      <span className="landing-dot landing-dot-red landing-dot-3" />
      <span className="landing-dot landing-dot-red landing-dot-4" />
      <span className="landing-dot landing-dot-red landing-dot-5" />
      <span className="landing-dot landing-dot-orange landing-dot-6" />
      <span className="landing-dot landing-dot-orange landing-dot-7" />
      <span className="landing-dot landing-dot-orange landing-dot-8" />
      <span className="landing-dot landing-dot-orange landing-dot-9" />
      <span className="landing-dot landing-dot-yellow landing-dot-10" />
      <span className="landing-dot landing-dot-yellow landing-dot-11" />
      <span className="landing-dot landing-dot-yellow landing-dot-12" />
      <span className="landing-dot landing-dot-green landing-dot-13" />
      <span className="landing-dot landing-dot-green landing-dot-14" />
      <span className="landing-dot landing-dot-blue landing-dot-15" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <a className="landing-brand" href="/" aria-label="SF Stairway Spotter home">
          <img src={appIconUrl} alt="" />
          <span>SF Stairway Spotter</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href={LAUNCH_LINKS.support}>Support</a>
          <a className="landing-nav-cta" href={WEB_APP_URL}>Open the map</a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">Step up, San Francisco!</p>
          <h1>San&nbsp;Francisco’s stairways are now at your fingertips.</h1>
          <p className="landing-hero-intro">
            Discover, track, and explore more than 1,200 public stairways — one
            climb at a time.
          </p>
          <div className="landing-actions">
            <a
              className="landing-primary-button"
              href={`mailto:${SUPPORT_EMAIL}?subject=SF%20Stairway%20Spotter%20beta`}
            >
              Join the beta
            </a>
          </div>
          <p className="landing-beta-note">iPhone beta testing is underway · Android coming next</p>
        </div>

        <div className="landing-hero-art" aria-label="Colorful stairway-rating dots">
          <div className="landing-art-glow" />
          <DotStairway />
          <div className="landing-art-card landing-art-card-top">
            <span>1,200+</span>
            <small>stairways to discover</small>
          </div>
          <div className="landing-art-card landing-art-card-bottom">
            <span>★</span>
            <small>Climb. Check in. Collect.</small>
          </div>
        </div>
      </section>

      <section className="landing-proof" aria-label="About the collection">
        <p>Built in San Francisco</p>
        <span />
        <p>Every stairway photographed firsthand</p>
        <span />
        <p>Free to browse</p>
      </section>

      <section className="landing-features" id="how-it-works">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">Conquer the city’s stairs</p>
          <h2>An app for curious walkers.</h2>
          <p>
            Plan an outing or see what’s around the next corner.
            <br />
            An account is optional until you want to save your progress.
          </p>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => (
            <article key={feature.title}>
              <img
                className="landing-feature-image"
                src={feature.image}
                alt={feature.imageAlt}
                style={{ objectPosition: feature.imagePosition }}
              />
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta-section">
        <img src={appIconUrl} alt="SF Stairway Spotter app icon" />
        <div>
          <p className="landing-eyebrow">Ready to take the first step?</p>
          <h2>There is always another stairway.</h2>
        </div>
        <a className="landing-primary-button" href={WEB_APP_URL}>Open SF Stairway Spotter</a>
      </section>

      <footer className="landing-footer">
        <div>
          <strong>SF Stairway Spotter</strong>
          <p>Discover San Francisco, one stairway at a time.</p>
        </div>
        <nav aria-label="Legal and support links">
          <a href={LAUNCH_LINKS.privacy}>Privacy</a>
          <a href={LAUNCH_LINKS.terms}>Terms</a>
          <a href={LAUNCH_LINKS.support}>Support</a>
          <a href={LAUNCH_LINKS.deleteAccount}>Delete Account</a>
        </nav>
        <p>© 2026 Alexandra Kenin</p>
      </footer>
    </main>
  );
}
