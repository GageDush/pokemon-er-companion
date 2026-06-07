import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "local.pokemoner.companion",
  appName: "Pokemon ER Companion",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  }
};

export default config;
