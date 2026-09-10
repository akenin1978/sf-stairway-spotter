import { describe, expect, it } from 'vitest';
import { hasStoreLinks, STORE_LINKS } from './storeLinks';

describe('store launch links', () => {
  it('keeps download buttons hidden until a public listing URL is provided', () => {
    expect(STORE_LINKS.appStore).toBe('');
    expect(STORE_LINKS.googlePlay).toBe('');
    expect(hasStoreLinks()).toBe(false);
  });
});
