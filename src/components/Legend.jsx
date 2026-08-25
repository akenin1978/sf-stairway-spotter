import { RATING_STYLES } from '../ratingColors';

export default function Legend() {
  const entries = [5, 4, 3, 2, 1].map((rating) => ({
    key: rating,
    rating,
    ...RATING_STYLES[rating],
  }));

  return (
    <div>
      {entries.map(
        ({ key, rating, color, label, description }) => (
          <div className="legend-row" key={key} title={description}>
            <span className="legend-dot" style={{ backgroundColor: color }} />
            <span>{rating != null ? `${rating} — ${label}` : label}</span>
          </div>
        )
      )}
    </div>
  );
}
