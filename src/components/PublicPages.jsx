import { LAUNCH_LINKS } from '../launchLinks';

const EFFECTIVE_DATE = 'August 24, 2026';
const SUPPORT_EMAIL = 'info@urbanhikersf.com';

const PAGE_TITLES = {
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Use',
  '/support': 'Support',
  '/delete-account': 'Delete Your Account',
};

function PageShell({ title, children }) {
  return (
    <main className="public-page">
      <div className="public-page-card">
        <a className="public-page-brand" href="/">
          <span aria-hidden="true">▰</span> SF Stairway Spotter
        </a>
        <h1>{title}</h1>
        {children}
        <nav className="public-page-links" aria-label="Legal and support links">
          <a href={LAUNCH_LINKS.privacy}>Privacy</a>
          <a href={LAUNCH_LINKS.terms}>Terms</a>
          <a href={LAUNCH_LINKS.support}>Support</a>
          <a href={LAUNCH_LINKS.deleteAccount}>Delete Account</a>
        </nav>
        <p className="public-page-footer">© 2026 Alexandra Kenin</p>
      </div>
    </main>
  );
}

function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy">
      <p className="public-page-updated">Effective {EFFECTIVE_DATE}</p>
      <p>
        SF Stairway Spotter helps people discover and keep track of visits to
        public stairways in San Francisco. This policy explains what information
        the app handles and the choices available to you.
      </p>

      <h2>Who operates the app</h2>
      <p>
        SF Stairway Spotter is operated by Alexandra Kenin in San Francisco,
        California. Privacy questions can be sent to{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> your email address, account ID,
          sign-in provider, and any optional display name you choose.
        </li>
        <li>
          <strong>Activity information:</strong> stairway check-ins, verification
          method, dates, badges, streaks, leaderboard preferences, and friends.
        </li>
        <li>
          <strong>Location:</strong> precise location is accessed only when you
          choose a nearby-stairway or verification feature. It is used to provide
          that feature and is not used for advertising.
        </li>
        <li>
          <strong>Camera:</strong> when you choose photo verification, the app
          captures a temporary photo to verify an on-site visit. The photo is not
          saved or uploaded.
        </li>
        <li>
          <strong>Messages and submissions:</strong> feedback, reported issues,
          suggested stairway information, coordinates, and any optional contact
          email you provide.
        </li>
      </ul>

      <h2>How we use information</h2>
      <p>
        We use this information to operate authentication and accounts, display
        stairways, record progress, award badges, provide social features you
        select, verify visits, answer support requests, review submissions, keep
        the app secure, and fix problems.
      </p>

      <h2>Service providers</h2>
      <p>
        The app uses Supabase for database and authentication services, Google
        Maps for map features, and Vercel for web hosting. Apple or Google may
        process sign-in information when you choose their sign-in service. These
        providers process information under their own terms and privacy policies.
      </p>

      <h2>Sharing and advertising</h2>
      <p>
        We do not sell personal information. At launch, the app does not contain
        third-party advertising or behavioral advertising trackers. An optional
        display name and photo-verified total appear publicly only if you choose
        to join the leaderboard.
      </p>

      <h2>Retention</h2>
      <ul>
        <li>Account and progress data are kept while your account is active.</li>
        <li>
          Feedback messages and optional reply emails are normally kept for up to
          12 months, unless they are needed longer to resolve an active matter.
        </li>
        <li>
          Pending stairway submissions are kept while they are reviewed. Rejected
          or duplicate submissions are normally deleted within 90 days.
        </li>
        <li>
          Approved public stairway facts may remain as part of the public stairway
          directory, but the submitter’s account ID and contact email are removed.
        </li>
      </ul>

      <h2>Your choices</h2>
      <p>
        You may browse the stairway map without an account. Device permissions can
        be changed in your phone settings. Leaderboard participation is optional.
        You can delete your account in the app under Menu → Settings → Delete my
        account, or follow the instructions on the{' '}
        <a href={LAUNCH_LINKS.deleteAccount}>Delete Account page</a>.
      </p>

      <h2>Children</h2>
      <p>
        The app is intended for a general audience age 13 and older and is not
        directed to children under 13. We do not knowingly collect personal
        information from children under 13.
      </p>

      <h2>Security and changes</h2>
      <p>
        We use reasonable safeguards, but no online service can guarantee perfect
        security. We may update this policy as the app changes. The effective date
        above will be revised when material changes are made.
      </p>
    </PageShell>
  );
}

function TermsPage() {
  return (
    <PageShell title="Terms of Use">
      <p className="public-page-updated">Effective {EFFECTIVE_DATE}</p>
      <p>
        These terms govern your use of SF Stairway Spotter. By using the app, you
        agree to them. If you do not agree, please do not use the app.
      </p>

      <h2>Eligibility and accounts</h2>
      <p>
        You must be at least 13 to create an account. You are responsible for your
        account credentials and for activity performed through your account. You
        may browse the map without creating an account.
      </p>

      <h2>Outdoor activity and safety</h2>
      <p>
        Walking, running, climbing stairs, and navigating city streets involve
        risks. Conditions can change because of weather, construction, closures,
        traffic, private-property boundaries, or other hazards. Use your own
        judgment, obey posted signs and laws, remain aware of your surroundings,
        and do not rely on the app for emergency, accessibility, or safety advice.
      </p>

      <h2>Map and stairway information</h2>
      <p>
        Stairway locations, descriptions, ratings, step counts, photos, routes,
        and availability may be incomplete or inaccurate. The app does not
        guarantee that a stairway is public, open, safe, accessible, or suitable
        for any particular person or purpose.
      </p>

      <h2>Your content and conduct</h2>
      <p>
        You may submit feedback, corrections, and stairway suggestions. You
        promise that your submissions are lawful, accurate to the best of your
        knowledge, and do not violate another person’s rights. You grant us
        permission to review, edit, and use submitted stairway facts to operate
        and improve the public directory. Do not misuse the app, interfere with
        its operation, submit harmful content, impersonate others, or attempt
        unauthorized access.
      </p>

      <h2>Third-party services</h2>
      <p>
        The app depends on services such as Google Maps, Supabase, Apple, Google,
        and Vercel. Their services may be unavailable or governed by separate
        terms. We are not responsible for third-party services or external links.
      </p>

      <h2>Availability and accounts</h2>
      <p>
        We may change, suspend, or discontinue features and may restrict accounts
        that violate these terms or threaten the service or other users. You may
        delete your account at any time from Settings.
      </p>

      <h2>Disclaimer and limitation of liability</h2>
      <p>
        The app is provided “as is” and “as available,” without warranties to the
        fullest extent permitted by law. To the fullest extent permitted by law,
        Alexandra Kenin will not be liable for indirect, incidental, special,
        consequential, or punitive damages arising from use of the app or outdoor
        activities undertaken with it. Nothing in these terms limits rights that
        cannot legally be limited.
      </p>

      <h2>Governing law and contact</h2>
      <p>
        These terms are governed by California law, without regard to conflict-of-
        law principles. Questions may be sent to{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </PageShell>
  );
}

function SupportPage() {
  return (
    <PageShell title="Support">
      <p>
        Need help with SF Stairway Spotter, found incorrect stairway information,
        or encountered a problem?
      </p>
      <a className="public-page-primary" href={`mailto:${SUPPORT_EMAIL}`}>
        Email {SUPPORT_EMAIL}
      </a>
      <p>
        Please include what you were trying to do, what happened, your device type
        (iPhone, Android, or web), and a screenshot if one is helpful. Do not send
        passwords, authentication codes, or other sensitive information.
      </p>
      <h2>Account help</h2>
      <p>
        For account deletion, use Menu → Settings → Delete my account. If you
        cannot access your account, see the{' '}
        <a href={LAUNCH_LINKS.deleteAccount}>Delete Account page</a>.
      </p>
      <h2>Safety</h2>
      <p>
        This support channel is not monitored for emergencies. For an emergency,
        contact local emergency services.
      </p>
    </PageShell>
  );
}

function DeleteAccountPage() {
  return (
    <PageShell title="Delete Your Account">
      <p>
        You can permanently delete your SF Stairway Spotter account directly in
        the app.
      </p>
      <ol>
        <li>Sign in to the account you want to delete.</li>
        <li>Open Menu, then choose Settings.</li>
        <li>Select “Delete my account” and confirm.</li>
      </ol>
      <p>
        This deletes your account and account-linked progress, including check-ins,
        verification records, badges, leaderboard settings, and friend connections.
        Pending or rejected stairway submissions linked to your account are also
        deleted. Approved public stairway facts may remain in the directory without
        your account ID or contact email.
      </p>
      <h2>If you cannot access the app</h2>
      <p>
        Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the
        address associated with your account and use the subject “Delete my SF
        Stairway Spotter account.” We may need to verify that you control the
        account before completing the request.
      </p>
      <p>
        Account deletion is permanent and cannot be undone. If you only want to
        leave the leaderboard, turn off leaderboard participation in Settings
        instead.
      </p>
    </PageShell>
  );
}

export function getPublicPage(pathname) {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  if (!PAGE_TITLES[normalizedPath]) return null;

  const pages = {
    '/privacy': PrivacyPage,
    '/terms': TermsPage,
    '/support': SupportPage,
    '/delete-account': DeleteAccountPage,
  };
  return pages[normalizedPath];
}
