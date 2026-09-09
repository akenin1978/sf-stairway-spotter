import useDialogFocus from './useDialogFocus';

export default function AlertDialog({ message, onClose }) {
  const dialogRef = useDialogFocus(onClose);
  return (
    <div className="alert-dialog-overlay" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className="alert-dialog-card"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-describedby="location-boundary-message"
        tabIndex={-1}
      >
        <p id="location-boundary-message" className="alert-dialog-message">
          {message}
        </p>
        <button type="button" className="alert-dialog-button" onClick={onClose} data-dialog-initial-focus>
          OK
        </button>
      </div>

      <style>{`
        .alert-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 30, 15, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
        }

        .alert-dialog-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 28px 24px 20px;
          max-width: 320px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .alert-dialog-message {
          font-size: 15px;
          line-height: 1.5;
          color: #1a1a1a;
          margin: 0 0 20px;
        }

        .alert-dialog-button {
          width: 100%;
          border: none;
          border-radius: 999px;
          padding: 11px 16px;
          background: #4b3ce0;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
