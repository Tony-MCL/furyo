import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { NavigationBar } from "expo-navigation-bar";

const AUTO_HIDE_DELAY_MS = 2500;

export default function NavigationBarController() {
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const clearHideTimer = () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };

    const hideNavigationBar = () => {
      clearHideTimer();
      NavigationBar.setHidden(true);
      NavigationBar.setStyle("light");
    };

    const scheduleHide = () => {
      clearHideTimer();
      hideTimer.current = setTimeout(() => {
        NavigationBar.setHidden(true);
        hideTimer.current = null;
      }, AUTO_HIDE_DELAY_MS);
    };

    hideNavigationBar();

    const visibilitySubscription = NavigationBar.addVisibilityListener(({ visibility }) => {
      if (visibility === "visible") {
        scheduleHide();
      } else {
        clearHideTimer();
      }
    });

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        hideNavigationBar();
      }
    });

    return () => {
      clearHideTimer();
      visibilitySubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  return null;
}
