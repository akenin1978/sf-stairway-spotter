export default function NewStairwayModal({ stairwayCount, addedCount, onShow, onDismiss }) {
  const headline =
    addedCount === 1
      ? 'A new stairway joined the map!'
      : `${addedCount} new stairways joined the map!`;

  return (
    <div className="new-stairway-overlay" role="presentation" onClick={onDismiss}>
      <section
        className="new-stairway-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-stairway-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="new-stairway-close"
          aria-label="Close"
          onClick={onDismiss}
        >
          ×
        </button>
        <div className="new-stairway-icon" aria-hidden="true">
          <svg width="42" height="42" viewBox="0 0 42 42">
            <rect x="3" y="29" width="9" height="8" fill="currentColor" />
            <rect x="12" y="21" width="9" height="16" fill="currentColor" />
            <rect x="21" y="13" width="9" height="24" fill="currentColor" />
            <rect x="30" y="5" width="9" height="32" fill="currentColor" />
          </svg>
        </div>
        <h2 id="new-stairway-title">{headline}</h2>
        <p>San Francisco now has {stairwayCount.toLocaleString()} stairways.</p>
        <button type="button" className="new-stairway-show" onClick={onShow}>
          Show me <span aria-hidden="true">→</span>
        </button>
      </section>

      <style>{`
        .new-stairway-overlay {
          position: fixed;
          inset: 0;
          z-index: 1150;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(24, 21, 48, 0.58);
        }

        .new-stairway-card {
          position: relative;
          width: min(100%, 360px);
          padding: 30px 26px 26px;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 22px 70px rgba(20, 16, 55, 0.32);
          text-align: center;
        }

        .new-stairway-close {
          position: absolute;
          top: 10px;
          right: 12px;
          border: 0;
          background: transparent;
          color: #6f6b78;
          font-size: 30px;
          line-height: 1;
          cursor: pointer;
        }

        .new-stairway-icon {
          display: grid;
          place-items: center;
          width: 66px;
          height: 66px;
          margin: 0 auto 18px;
          border-radius: 50%;
          background: #4b3ce0;
          color: #ffffff;
        }

        .new-stairway-card h2 {
          margin: 0 0 10px;
          color: #171426;
          font-size: 24px;
          line-height: 1.2;
        }

        .new-stairway-card p {
          margin: 0 0 22px;
          color: #676372;
          font-size: 16px;
          line-height: 1.45;
        }

        .new-stairway-show {
          width: 100%;
          border: 0;
          border-radius: 999px;
          padding: 13px 18px;
          background: #4b3ce0;
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .new-stairway-show:hover {
          background: #3c2fc4;
        }
      `}</style>
    </div>
  );
}
