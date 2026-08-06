import { Platform } from "react-native";
import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";

const REWARDED_AD_UNIT_ID = Platform.select({
  android: "ca-app-pub-7463440033205599/4716786385",
  ios: "ca-app-pub-7463440033205599/1386659856",
})!;

let initialized = false;
let rewarded: RewardedAd | null = null;
let loadingPromise: Promise<void> | null = null;

async function ensureMobileAdsInitialized() {
  if (initialized) {
    return;
  }

  await mobileAds().initialize();
  initialized = true;
}

async function createLoadedRewardedAd() {
  await ensureMobileAdsInitialized();

  if (rewarded) {
    return rewarded;
  }

  if (!loadingPromise) {
    loadingPromise = new Promise<void>((resolve, reject) => {
      const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      const unsubscribeLoaded = ad.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          unsubscribeLoaded();
          unsubscribeError();
          rewarded = ad;
          loadingPromise = null;
          resolve();
        },
      );

      const unsubscribeError = ad.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          unsubscribeLoaded();
          unsubscribeError();
          loadingPromise = null;
          reject(error);
        },
      );

      ad.load();
    });
  }

  await loadingPromise;
  return rewarded!;
}

export async function preloadRewardedRevive() {
  try {
    await createLoadedRewardedAd();
  } catch {
    // Preloading is best effort only. The Home button can retry later.
  }
}

export async function showRewardedRevive(): Promise<boolean> {
  const ad = await createLoadedRewardedAd();

  return new Promise<boolean>((resolve) => {
    let earnedReward = false;

    const unsubscribeEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earnedReward = true;
      },
    );

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      rewarded = null;
      void preloadRewardedRevive();
      resolve(earnedReward);
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      rewarded = null;
      resolve(false);
    });

    ad.show().catch(() => {
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
      rewarded = null;
      resolve(false);
    });
  });
}
