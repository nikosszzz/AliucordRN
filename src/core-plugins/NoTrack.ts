// Thanks to Powercord and Zere
// https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/DoNotTrack/DoNotTrack.plugin.js
// https://github.com/powercord-org/powercord/blob/v2/src/Powercord/coremods/no-track/index.js

import { Plugin } from "../entities";
import { getByProps } from "../metro";
import { insteadDoNothing } from "../utils/patcher";

export default class NoTrack extends Plugin {
    public start() {
        const Analytics = getByProps("getSuperPropertiesBase64", "track");
        const Snitch = getByProps("submitLiveCrashReport");
        const { AnalyticsActionHandlers } = getByProps("AnalyticsActionHandlers");

        insteadDoNothing(Analytics, "track");
        insteadDoNothing(Snitch, "submitLiveCrashReport");
        insteadDoNothing(AnalyticsActionHandlers, "handleTrack");

        const sentry = (window as any).__SENTRY__;
        const hub = sentry.hub;

        sentry.logger.disable();

        insteadDoNothing(hub, "addBreadcrumb");

        hub.getClient().close(0);
        hub.getScope().clear();

        const c = console as any;
        for (const method in c) {
            if (c[method].__sentry_original__)
                c[method] = c[method].__sentry_original__;
            if (c[method].__REACT_DEVTOOLS_ORIGINAL_METHOD__?.__sentry_original__)
                c[method].__REACT_DEVTOOLS_ORIGINAL_METHOD__ = c[method].__REACT_DEVTOOLS_ORIGINAL_METHOD__.__sentry_original__;
        }
    }
}
