import { useEffect, useRef } from 'react';

const dialogStack = [];

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Gives a modal predictable keyboard and assistive-technology behavior. */
export default function useDialogFocus(
  onClose,
  { active = true, closeOnEscape = true, returnFocusSelector = null } = {}
) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const previouslyFocused = document.activeElement;
    dialogStack.push(dialog);

    const focusFirstControl = () => {
      const preferred = dialog.querySelector('[data-dialog-initial-focus]');
      const firstFocusable = preferred || dialog.querySelector(FOCUSABLE);
      (firstFocusable || dialog).focus({ preventScroll: true });
    };
    const frame = window.requestAnimationFrame(focusFirstControl);

    function handleKeyDown(event) {
      if (dialogStack.at(-1) !== dialog) return;

      if (event.key === 'Escape' && closeOnEscape && onCloseRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(
        (element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true'
      );
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      const index = dialogStack.lastIndexOf(dialog);
      if (index >= 0) dialogStack.splice(index, 1);
      window.setTimeout(() => {
        const returnTarget =
          previouslyFocused instanceof HTMLElement &&
          previouslyFocused !== document.body &&
          previouslyFocused !== document.documentElement &&
          previouslyFocused.isConnected
            ? previouslyFocused
            : returnFocusSelector
              ? document.querySelector(returnFocusSelector)
              : null;
        returnTarget?.focus({ preventScroll: true });
      }, 0);
    };
  }, [active, closeOnEscape, returnFocusSelector]);

  return dialogRef;
}
