// Keep the existing message intact while separating the problem from the
// recovery instruction, keeping full sentences and their punctuation.
export default function VerificationError({ message }) {
  if (!message) return null;
  const separator = / -- |(?<=[.!?])\s+/.exec(message);
  const problem = separator ? message.slice(0, separator.index) : message;
  const instruction = separator
    ? message.slice(separator.index + separator[0].length)
    : '';

  return (
    <div className="verify-error" role="alert" aria-atomic="true">
      <strong>{problem}</strong>
      {instruction && <span>{instruction}</span>}
    </div>
  );
}
