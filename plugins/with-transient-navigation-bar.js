const {
  withDangerousMod,
  withAndroidManifest,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PACKAGE_NAME = "com.morningcoffeelabs.furyo";
const PACKAGE_PATH = PACKAGE_NAME.replace(/\./g, "/");
const CLASS_NAME = "TransientNavigationBarPackage";

function withTransientNavigationBar(config) {
  config = withAndroidManifest(config, (config) => {
    // No manifest changes are required, but keeping this mod makes the plugin
    // explicitly Android-scoped and easy to extend later if needed.
    return config;
  });

  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const sourceDir = path.join(
        projectRoot,
        "app",
        "src",
        "main",
        "java",
        PACKAGE_PATH,
      );

      fs.mkdirSync(sourceDir, { recursive: true });

      const packageFile = path.join(sourceDir, `${CLASS_NAME}.kt`);

      const source = `package ${PACKAGE_NAME}

import android.app.Activity
import android.os.Bundle
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class ${CLASS_NAME} : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Activity): List<ReactActivityLifecycleListener> {
    return listOf(object : ReactActivityLifecycleListener {
      override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
        configure(activity)
      }

      override fun onResume(activity: Activity) {
        configure(activity)
      }
    })
  }

  private fun configure(activity: Activity) {
    val controller = WindowCompat.getInsetsController(activity.window, activity.window.decorView)
    controller.systemBarsBehavior =
      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    controller.hide(WindowInsetsCompat.Type.navigationBars())
  }
}
`;

      fs.writeFileSync(packageFile, source);

      return config;
    },
  ]);
}

module.exports = withTransientNavigationBar;
