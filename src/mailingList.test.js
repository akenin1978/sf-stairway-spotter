import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeToMailingList } from './mailingList';
let script;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('window', {});
  vi.stubGlobal('document', {
    createElement: () => ({ remove: vi.fn() }),
    head: { append: value => { script = value; } },
  });
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const fields = () => new Map([['EMAIL','test@example.invalid'],['gdpr[91744]','Y'],['b_1554420032553d4d674c87ce9_281e883bf2','']]);
function reply(response) { window[new URL(script.src).searchParams.get('c')](response); }
describe('Mailchimp embedded submission', () => {
  it('preserves consent, audience and spam-trap fields and waits for a real response', async () => {
    const pending = subscribeToMailingList(fields());
    const url = new URL(script.src);
    expect(url.origin).toBe('https://urbanhikersf.us6.list-manage.com');
    expect(url.pathname).toBe('/subscribe/post-json');
    expect(url.searchParams.get('id')).toBe('281e883bf2');
    for (const [key,value] of fields()) expect(url.searchParams.get(key)).toBe(value);
    reply({result:'success',msg:'Please check your email to confirm.'});
    await expect(pending).resolves.toEqual({result:'success',msg:'Please check your email to confirm.'});
    expect(script.remove).toHaveBeenCalled();
  });
  it('preserves Mailchimp errors instead of reporting a successful signup', async () => {
    const pending=subscribeToMailingList(fields());
    reply({result:'error',msg:'Additional verification required.'});
    await expect(pending).resolves.toMatchObject({result:'error'});
  });
  it('rejects malformed replies', async () => {
    const pending=subscribeToMailingList(fields());
    const check=expect(pending).rejects.toThrow('Unexpected response');
    reply({}); await check;
  });
  it('times out and safely ignores a late response', async () => {
    const pending=subscribeToMailingList(fields());
    const callback = new URL(script.src).searchParams.get('c');
    const check=expect(pending).rejects.toThrow('Timed out');
    await vi.advanceTimersByTimeAsync(15000); await check;
    expect(()=>window[callback]({result:'success',msg:'Late'})).not.toThrow();
    await vi.advanceTimersByTimeAsync(60000); expect(window[callback]).toBeUndefined();
  });
  it('cleans up on network failure and unmount', async () => {
    let pending=subscribeToMailingList(fields());
    let check=expect(pending).rejects.toThrow('Connection failed');
    script.onerror(); await check;
    const controller=new AbortController();
    pending=subscribeToMailingList(fields(),{signal:controller.signal});
    check=expect(pending).rejects.toThrow('Aborted'); controller.abort(); await check;
    expect(script.remove).toHaveBeenCalled();
  });
});
