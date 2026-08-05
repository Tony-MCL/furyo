import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { Slot } from "expo-router";

export default function Layout() {
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const hideNavigationBar = () => {
      NavigationBar.setHidden(true);
    };

    hideNavigationBar();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        hideNavigationBar();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <Slot />;
}
