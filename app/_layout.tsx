import { Slot } from "expo-router";
import NavigationBarController from "../components/navigation-bar-controller";

export default function Layout() {
  return (
    <>
      <NavigationBarController />
      <Slot />
    </>
  );
}
