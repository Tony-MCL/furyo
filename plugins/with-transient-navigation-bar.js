const { withMainActivity } = require("@expo/config-plugins");

module.exports = function withTransientNavigationBar(config) {
  return withMainActivity(config, (config) => {
    let source = config.modResults.contents;

    if (!source.includes("WindowInsetsCompat")) {
      source = source.replace(
        /import android\.os\.Bundle\n/,
        "import android.os.Bundle\nimport androidx.core.view.WindowCompat\nimport androidx.core.view.WindowInsetsCompat\nimport androidx.core.view.WindowInsetsControllerCompat\n",
      );
    }

    if (!source.includes("configureTransientSystemBars()")) {
      source = source.replace(
        /super\.onCreate\(null\)\n/,
        "super.onCreate(null)\n    configureTransientSystemBars()\n",
      );

      source = source.replace(
        /\n}\s*$/,
        `\n\n  private fun configureTransientSystemBars() {\n    WindowCompat.setDecorFitsSystemWindows(window, false)\n    val controller = WindowCompat.getInsetsController(window, window.decorView)\n    controller.systemBarsBehavior =\n      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE\n    controller.hide(WindowInsetsCompat.Type.navigationBars())\n  }\n}\n`,
      );
    }

    config.modResults.contents = source;
    return config;
  });
};
