/** Set to true only after counsel signs off in docs/compliance/legal-review-signoff.md */
export function isLegalReviewComplete() {
  return process.env.EXPO_PUBLIC_LEGAL_REVIEW_COMPLETE === 'true';
}
