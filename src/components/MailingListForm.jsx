export default function MailingListForm() {
  return <form className="mailing-list-form" action="https://urbanhikersf.us6.list-manage.com/subscribe/post?u=1554420032553d4d674c87ce9&id=281e883bf2&f_id=005124e2f0" method="post" target="_blank" rel="noopener noreferrer">
    <label htmlFor="mce-EMAIL">Email address</label>
    <input type="email" name="EMAIL" id="mce-EMAIL" autoComplete="email" required placeholder="you@example.com" />
    <label className="mailing-list-consent" htmlFor="gdpr_91744">
      <input type="checkbox" id="gdpr_91744" name="gdpr[91744]" value="Y" required />
      <span>Yes, I’d like emails from Urban Hiker SF, including SF Stairway Spotter news and launch updates.</span>
    </label>
    <p className="mailing-list-note">You can unsubscribe at any time using the link in our emails. Read our <a href="/privacy">privacy policy</a>.</p>
    <p className="mailing-list-note">We use Mailchimp as our marketing platform. By subscribing, you acknowledge that your information will be transferred to Mailchimp for processing. <a href="https://mailchimp.com/legal/terms/">Learn more about Mailchimp’s practices</a>.</p>
    <div style={{position:'absolute',left:'-5000px'}} aria-hidden="true"><input type="text" name="b_1554420032553d4d674c87ce9_281e883bf2" tabIndex={-1} defaultValue="" autoComplete="off" /></div>
    <button type="submit" name="subscribe">Join the mailing list</button>
    <p className="mailing-list-note">Mailchimp will open in a new tab to complete your signup.</p>
  </form>;
}
