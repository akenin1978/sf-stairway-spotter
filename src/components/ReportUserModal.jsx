import { useState } from 'react';
import { supabase } from '../supabaseClient';

const REPORT_REASONS = [
  ['inappropriate-name', 'Inappropriate display name'],
  ['harassment', 'Harassment or unwanted contact'],
  ['spam', 'Spam'],
  ['other', 'Something else'],
];

export default function ReportUserModal({ userToReport, context, onClose }) {
  const [reason, setReason] = useState('inappropriate-name');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    const { error: reportError } = await supabase.rpc('report_user', {
      p_target_user_id: userToReport.user_id,
      p_category: reason,
      p_details: details.trim() || null,
      p_context: context,
    });

    if (reportError) {
      setStatus('error');
      setError("We couldn't send this report. Please try again.");
      return;
    }

    setStatus('success');
  }

  return (
    <div
      className="modal-backdrop safety-modal-backdrop"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {status === 'success' ? (
          <>
            <h2>Report received</h2>
            <p>Thank you. We’ll review it and take appropriate action.</p>
            <button type="button" className="safety-done-button" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Report {userToReport.display_name || 'user'}</h2>
            <label className="safety-field">
              Reason
              <select value={reason} onChange={(event) => setReason(event.target.value)}>
                {REPORT_REASONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="safety-field">
              Details (optional)
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Tell us what happened."
              />
            </label>
            {status === 'error' && <p className="modal-error">{error}</p>}
            <button type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function UserSafetyMenu({ person, onReport, onBlock }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="user-safety-menu">
      <button
        type="button"
        className="user-safety-menu-button"
        aria-label={`Safety options for ${person.display_name || 'this user'}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        •••
      </button>
      {open && (
        <span className="user-safety-menu-popover">
          <button type="button" onClick={() => onReport(person)}>Report</button>
          <button type="button" className="user-safety-block" onClick={() => onBlock(person)}>
            Block
          </button>
        </span>
      )}
    </span>
  );
}
