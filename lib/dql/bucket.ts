/** Duration of one log bucket in milliseconds (4 hours). */
export const BUCKET_MS = 4 * 60 * 60 * 1000;

/** Compute the current time bucket ID. Safe to use on both client and server. */
export function getCurrentBucketId(): number {
  return Math.floor(Date.now() / BUCKET_MS);
}
