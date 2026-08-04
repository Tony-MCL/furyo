export async function preloadRewardedRevive() {
  // Rewarded ads are native-only. Keep web development unaffected.
}

export async function showRewardedRevive(): Promise<boolean> {
  // Web remains a development fallback: simulate a completed rewarded ad.
  return true;
}
