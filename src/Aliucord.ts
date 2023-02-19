import { Settings, startCorePlugins, startPlugins } from "./api";
import { sha } from "aliucord-version";
import { mkdir } from "./native/fs";
import patchNavigator from "./patches/patchNavigator";
import patchSettings from "./patches/patchSettings";
import patchTheme from "./patches/patchTheme";
import { PLUGINS_DIRECTORY, SETTINGS_DIRECTORY, THEME_DIRECTORY } from "./utils/constants";
import { startDebugWs, startReactDevTools } from "./utils/debug";
import { Logger } from "./utils/Logger";

interface SettingsSchema {
    autoUpdateAliucord: boolean;
    autoUpdatePlugins: boolean;
    debugWS: boolean;
    reactDevTools: boolean;
    disablePluginsOnCrash: boolean;
    acknowlegedNoSupportChannels: boolean;
    plugins: Record<string, boolean>;
    theme: string;
}

export * as pluginManager from "./api/PluginManager";
export const logger = new Logger("Aliucord");
export const errors = {} as Record<string, string>;
export let settings: Settings<SettingsSchema>;
export const version = sha;

let aliucordLoaded = false;

export async function load() {
    if (aliucordLoaded) throw "no";
    aliucordLoaded = true;

    logger.info("Loading...");

    try {
        mkdir(PLUGINS_DIRECTORY);
        mkdir(THEME_DIRECTORY);
        mkdir(SETTINGS_DIRECTORY);

        settings = new Settings("Aliucord");
        patchSettings();
        patchTheme();
        patchNavigator();

        await startCorePlugins();
        await startPlugins();
        startReactDevTools();
        startDebugWs();
    } catch (err) {
        logger.error("Failed to load Aliucord", err);
    }
}
