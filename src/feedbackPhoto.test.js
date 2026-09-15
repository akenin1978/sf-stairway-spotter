import { describe, expect, it } from 'vitest';
import {
  MAX_FEEDBACK_PHOTO_BYTES,
  validateFeedbackPhoto,
} from './feedbackPhoto';

describe('validateFeedbackPhoto', () => {
  it('allows no attachment', () => {
    expect(validateFeedbackPhoto(null)).toBe('');
  });

  it('allows supported images within the limit', () => {
    expect(validateFeedbackPhoto({ type: 'image/jpeg', size: 1200 })).toBe('');
  });

  it('rejects unsupported files', () => {
    expect(validateFeedbackPhoto({ type: 'application/pdf', size: 1200 })).toContain('JPEG');
  });

  it('rejects images larger than 5 MB', () => {
    expect(
      validateFeedbackPhoto({
        type: 'image/png',
        size: MAX_FEEDBACK_PHOTO_BYTES + 1,
      })
    ).toContain('smaller than 5 MB');
  });
});
