import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { fileToBase64, validateFeedbackPhoto } from '../feedbackPhoto';
import useDialogFocus from './useDialogFocus';

export default function FeedbackModal({ stairway, onClose }) {
  const dialogRef = useDialogFocus(onClose);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!photo) {
      setPhotoPreview('');
      return undefined;
    }
    const preview = URL.createObjectURL(photo);
    setPhotoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [photo]);

  function handlePhotoChange(event) {
    const nextPhoto = event.target.files?.[0] || null;
    const validationError = validateFeedbackPhoto(nextPhoto);
    if (validationError) {
      event.target.value = '';
      setPhoto(null);
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }
    setErrorMsg('');
    setStatus('idle');
    setPhoto(nextPhoto);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('submitting');

    let photoBase64 = null;
    if (photo) {
      try {
        photoBase64 = await fileToBase64(photo);
      } catch {
        setStatus('error');
        setErrorMsg("We couldn't read that photo. Please choose it again.");
        return;
      }
    }

    const { error } = await supabase.functions.invoke('submit-feedback', {
      body: {
        stairwayId: stairway?.id ?? null,
        stairwayDescription: stairway?.description ?? null,
        message: message.trim(),
        contactEmail: email.trim() || null,
        photo: photo
          ? { data: photoBase64, contentType: photo.type, name: photo.name }
          : null,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('success');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={dialogRef} className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title" tabIndex={-1}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {status === 'success' ? (
          <div>
            <h2 id="feedback-dialog-title">Thanks!</h2>
            <p>Your message has been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="feedback-dialog-title">{stairway ? 'Report an issue' : 'Send feedback'}</h2>

            {stairway && (
              <p className="modal-context">Re: {stairway.description}</p>
            )}

            <textarea
              placeholder={
                stairway
                  ? "What's wrong with this stairway's listing?"
                  : 'Missing a stairway, or something not working right? Let me know.'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />

            <input
              type="email"
              placeholder="Your email (optional, if you'd like a reply)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="feedback-photo-field">
              <label className="feedback-photo-button">
                {photo ? 'Change photo' : 'Add a photo (optional)'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={handlePhotoChange}
                  disabled={status === 'submitting'}
                />
              </label>
              <span className="feedback-photo-help">JPEG, PNG, WebP, HEIC or HEIF; up to 5 MB.</span>
              {photoPreview && (
                <div className="feedback-photo-preview">
                  <img src={photoPreview} alt="Selected feedback attachment" />
                  <button type="button" onClick={() => setPhoto(null)}>
                    Remove photo
                  </button>
                </div>
              )}
            </div>

            {status === 'error' && (
              <p className="modal-error">Something went wrong: {errorMsg}</p>
            )}

            <button type="submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
