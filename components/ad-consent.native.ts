import mobileAds, {
  AdsConsent,
  AdsConsentStatus,
  AdsConsentDebugGeography,
} from "react-native-google-mobile-ads";

let mobileAdsInitialized = false;
let consentReady = false;

export async function initializeAdsConsent(): Promise<boolean> {
  try {
    const consentInfo = await AdsConsent.requestInfoUpdate();

    if (consentInfo.isConsentFormAvailable) {
      const currentInfo = await AdsConsent.getConsentInfo();
      if (currentInfo.status === AdsConsentStatus.REQUIRED) {
        await AdsConsent.loadAndShowConsentFormIfRequired();
      }
    }

    const updatedInfo = await AdsConsent.getConsentInfo();
    consentReady = updatedInfo.canRequestAds;

    if (consentReady && !mobileAdsInitialized) {
      await mobileAds().initialize();
      mobileAdsInitialized = true;
    }

    return consentReady;
  } catch {
    try {
      const previousInfo = await AdsConsent.getConsentInfo();
      consentReady = previousInfo.canRequestAds;

      if (consentReady && !mobileAdsInitialized) {
        await mobileAds().initialize();
        mobileAdsInitialized = true;
      }

      return consentReady;
    } catch {
      consentReady = false;
      return false;
    }
  }
}

export function canRequestAds(): boolean {
  return consentReady;
}

export async function showPrivacyOptions(): Promise<boolean> {
  try {
    const info = await AdsConsent.getConsentInfo();
    if (!info.isConsentFormAvailable) {
      return false;
    }

    await AdsConsent.showPrivacyOptionsForm();

    const updatedInfo = await AdsConsent.getConsentInfo();
    consentReady = updatedInfo.canRequestAds;

    if (consentReady && !mobileAdsInitialized) {
      await mobileAds().initialize();
      mobileAdsInitialized = true;
    }

    return true;
  } catch {
    return false;
  }
}

export { AdsConsentDebugGeography };
