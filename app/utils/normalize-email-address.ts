/**
 * Normalizes an email address for comparison purposes.
 *
 * This is deliberately conservative: only surrounding whitespace is removed
 * and casing is normalized. Provider-specific alias rules are not applied
 * because they are not universally valid and could conflate distinct
 * mailboxes.
 */
export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

/** Compares two email addresses using the shared conservative normalization. */
export function emailAddressesMatch(emailA: string, emailB: string): boolean {
  return normalizeEmailAddress(emailA) === normalizeEmailAddress(emailB);
}
