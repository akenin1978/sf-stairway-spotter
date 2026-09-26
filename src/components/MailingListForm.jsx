import { useEffect, useRef, useState } from 'react';
import { MAILCHIMP_ACTION, subscribeToMailingList, mailingListMessage } from '../mailingList';

export default function MailingListForm() {
  const [state, setState] = useState({ status: 'idle', message: '' });
  const activeRequest = useRef(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  async function submit(event) {
    if (event.nativeEvent.submitter?.value === 'hosted') return;
    event.preventDefault();
    if (activeRequest.current) return;
    const fields = new FormData(event.currentTarget);
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ status: 'pending', message: '' });
    try {
      const result = await subscribeToMailingList(fields, { signal: controller.signal });
      if (!controller.signal.aborted) setState({ status: result.result, message: mailingListMessage(result.msg) });
    } catch {
      if (!controller.signal.aborted) setState({ status: 'error', message: 'We couldn’t confirm your signup. Check your inbox, try again, or continue with Mailchimp below.' });
    } finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  if (state.status === 'success') return <div className="mailing-list-confirmation" role="status">
    <h2>Thanks for signing up!</h2><p>{state.message}</p>
    <p><a href="/">Back to SF Stairway Spotter</a></p>
  </div>;
  return <form className="mailing-list-form" action={MAILCHIMP_ACTION} onSubmit={submit} method="post" target="_blank" rel="noopener noreferrer">
    <label htmlFor="mce-EMAIL">Email address</label>
    <input type="email" name="EMAIL" id="mce-EMAIL" autoComplete="email" required placeholder="you@example.com" />
    <label className="mailing-list-consent" htmlFor="gdpr_91744">
      <input type="checkbox" id="gdpr_91744" name="gdpr[91744]" value="Y" required />
      <span>Yes, send me news and updates from Urban Hiker SF.</span>
    </label>
    <div style={{position:'absolute',left:'-5000px'}} aria-hidden="true"><input type="text" name="b_1554420032553d4d674c87ce9_281e883bf2" tabIndex={-1} defaultValue="" autoComplete="off" /></div>
    <button type="submit" name="subscribe" disabled={state.status === 'pending'}>{state.status === 'pending' ? 'Signing you up…' : 'Keep me in the loop'}</button>
    <div aria-live="polite" aria-atomic="true">{state.status === 'error' && <p className="mailing-list-error">{state.message}</p>}</div>
    {state.status === 'error' && <button className="mailing-list-fallback" type="submit" name="continue" value="hosted">Continue with Mailchimp (new tab)</button>}
    <p className="mailing-list-reassurance">Unsubscribe anytime.</p>
    <p className="mailing-list-note">We use Mailchimp to send our emails. By subscribing, you agree to share your email address with Mailchimp for this purpose. <a href="/privacy">Our privacy policy</a> · <a href="https://mailchimp.com/legal/privacy/">Mailchimp’s privacy policy</a></p>
    <noscript><p className="mailing-list-note">With JavaScript disabled, signup continues on Mailchimp in a new tab.</p></noscript>
  </form>;
}
