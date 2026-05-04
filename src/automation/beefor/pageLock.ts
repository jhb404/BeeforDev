/**
 * Serializes Playwright operations on the shared Page.
 * Two concurrent navigations on the same page abort each other,
 * so all user actions must run one at a time.
 */
let chain: Promise<unknown> = Promise.resolve();

export function withPageLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}
