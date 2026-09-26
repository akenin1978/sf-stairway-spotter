export default function MailingListForm() {
  return <form className="mailing-list-form" action="https://urbanhikersf.us6.list-manage.com/subscribe/post?u=1554420032553d4d674c87ce9&id=281e883bf2&f_id=005124e2f0" method="post" target="_blank" rel="noopener noreferrer">
    <label htmlFor="mce-EMAIL">Email address</label>
    <input type="email" name="EMAIL" id="mce-EMAIL" autoComplete="email" required placeholder="you@example.com" />
    <label className="mailing-list-consent" htmlFor="gdpr_91744">
      <input type="checkbox" id="gdpr_91744" name="gdpr[91744]" value="Y" required />
      <span>Yes, send me news and updates from Urban Hiker SF.</span>
    </label>
    <div style={{position:'absolute',left:'-5000px'}} aria-hidden="true"><input type="text" name="b_1554420032553d4d674c87ce9_281e883bf2" tabIndex={-1} defaultValue="" autoComplete="off" /></div>
    <button type="submit" name="subscribe">Keep me in the loop</button>
    <p className="mailing-list-reassurance">Unsubscribe anytime.</p>
    <p className="mailing-list-note">We use Mailchimp to send our emails. By subscribing, you agree to share your email address with Mailchimp for this purpose. <a href="/privacy">Our privacy policy</a> · <a href="https://mailchimp.com/legal/privacy/">Mailchimp’s privacy policy</a></p>
    <p className="mailing-list-note mailing-list-new-tab">Signup continues in a new tab.</p>
  </form>;
}
