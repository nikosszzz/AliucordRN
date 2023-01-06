import type { ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from "react-native";
import { Logger } from "../utils/Logger";

declare const __r: (moduleId: number) => any;
declare const modules: { [id: number]: any; };

const logger = new Logger("Metro");

/**
 * Module filter options
 */
type FilterOptions = {
    exports?: boolean;
    default?: false;
} | {
    exports?: true;
    default?: true;
};

/**
 * Make the property non enumerable so it is not included in module search.
 */
function blacklist(id: number) {
    Object.defineProperty(modules, id, {
        value: modules[id],
        enumerable: false,
        configurable: true,
        writable: true
    });
}

let nullProxyFound = false;

for (const key in modules) {
    const id = Number(key);
    const module = modules[id];

    if (!nullProxyFound && module.isInitialized && module.publicModule && module.publicModule.exports) {
        // Blacklist the stupid proxy that returns null to everything
        if (module.publicModule.exports["get defeated by your own weapon nerd"] === null) {
            blacklist(id);
            nullProxyFound = true;
            continue;
        }
    }

    if (module.factory) {
        const strings = AliuHermes.findStrings(module.factory);

        // Blacklist momentjs locale modules which change the language as a side effect
        if (strings.length === 8 && strings[6] === "moment") {
            blacklist(id);
            continue;
        }
    }
}

if (!nullProxyFound) {
    console.warn("Null proxy not found, expect problems");
}

// this is going to massively affect performance, TODO
const callbacks: ((id: number) => void)[] = [];

// call this whenever a module is initialized
const onModuleInitialization = (id: number) => {
    console.log(id);
    callbacks.forEach(cb => cb(id));
};

for (const key in modules) {
    const mod = modules[key];
    if (!mod) continue;

    if (!mod.isInitialized && mod.factory) {
        mod.originalFactory = mod.factory;
        mod.factory = (...args: any) => {
            const module = mod.originalFactory(...args);
            delete mod.originalFactory;

            onModuleInitialization(Number(key));
            return module;
        };
    }
}

/**
 * Get a module right after it was initialized.
 * @param filter Module filter
 * @param options Options.
 * @returns Promise that resolves to the module when it gets loaded.
 */
export async function getModuleLazy(filter: (module: any) => boolean, options?: any): Promise<any> {
    const { exports = true, default: defaultExport = true } = options ?? {};

    for (const key in modules) {
        const module = modules[key];
        if (!module || !module.isInitialized) continue;

        const mod = window.__r(key);
        if (!mod) continue;

        if (filter(mod)) {
            return exports ? mod : module.publicModule;
        }

        if (mod.default && filter(mod.default)) {
            return defaultExport ? mod.default : exports ? mod : module.publicModule;
        }
    }

    return await new Promise(resolve => {
        const lookup = (id: number) => {
            const module = window.__r(id);
            if (!module) return;

            if (filter(module)) {
                callbacks.splice(callbacks.indexOf(lookup), 1);
                resolve(exports ? module : modules[id].publicModule);
            } else if (module.default && filter(module.default)) {
                callbacks.splice(callbacks.indexOf(lookup), 1);
                resolve(defaultExport ? module.default : exports ? module : modules[id].publicModule);
            }
        };

        callbacks.push(lookup);
    });
}

/**
 * Find the id of a module from its factory strings, useful for finding modules that are not exported.
 * Make sure the factory strings are unique, otherwise it will return the first one it finds.
 * @param filter Strings filter
 * @returns Module id if found, else null
 */
export function getIdByFactoryStrings(filter: ((strings: string[]) => boolean)): number | null {
    for (const key in modules) {
        const module = modules[key];
        if (!module || !module.originalFactory || !module.factory) continue;

        const strings = AliuHermes.findStrings(module.originalFactory || module.factory);
        if (filter(strings)) return Number(key);
    }

    return null;
}

/**
 * Find a module from its factory strings, useful for finding modules that are not exported.
 * Make sure the factory strings are unique, otherwise it will return the first one it finds.
 * @param filter Strings filter
 * @returns Initialized module if found, else null
 */
export function getByFactoryStrings(filter: ((strings: string[]) => boolean)) {
    const id = getIdByFactoryStrings(filter);

    return id ? window.__r(id) : null;
}

/**
 * Find a Discord Module
 * @param filter Module filter
 * @param options Options.
 * @returns Module if found, else null
 */
export function getModule(filter: (module: any) => boolean, options?: FilterOptions) {
    const { exports = true, default: defaultExport = true } = options ?? {};

    for (const key in modules) {
        const id = Number(key);

        let mod;
        try {
            mod = __r(id);
        } catch {
            // Some modules throw error, ignore
        }
        if (!mod) continue;

        try {
            if (filter(mod)) {
                const module = modules[id].publicModule;
                return exports ? module.exports : module;
            }

            if (mod.default && filter(mod.default)) {
                const module = modules[id].publicModule;
                return defaultExport ? module.exports.default :
                    exports ? module.exports : module;
            }
        } catch (e: any) {
            (logger ?? console).error("Error during getModule", e?.stack ?? e);
        }
    }

    return null;
}

type PropIntellisense<P extends string> = Record<P, any> & Record<PropertyKey, any>;

/**
 * Find a module by props
 * @param props One or more props
 */
export function getByProps<T extends string>(...props: T[]): PropIntellisense<T>;
export function getByProps<T extends string>(...options: [...props: T[], options: FilterOptions]): PropIntellisense<T>;
export function getByProps<T extends string>(...options: [...props: T[], defaultExport: boolean]): PropIntellisense<T>;
export function getByProps(...props: any[]) {
    if (!props.length) return null;

    const options = typeof props[props.length - 1] === "object" ? props.pop() : {};
    const filter = (module: any) => {
        for (let i = 0, len = props.length; i < len; i++)
            if (module[props[i]] === undefined) return false;
        return true;
    };

    return getModule(filter, typeof options === "boolean" ? { default: options } : options);
}

/**
 * Find a module by its displayName property. Usually useful for finding React Components
 * @returns Module if found, else null
 */
export function getByDisplayName(displayName: string, options?: FilterOptions) {
    return getModule(m => m.displayName === displayName, options);
}

/**
 * Find a module by its default.name property. Usually useful for finding React Components
 * @returns Module if found, else null
 */
export function getByName(defaultName: string, options?: FilterOptions) {
    return getModule(m => m?.default?.name === defaultName, options);
}

/**
 * Find a Store by its name. 
 * @returns Module if found, else null
 */
export function getByStoreName(storeName: string, options?: FilterOptions) {
    return getModule(m => m.getName?.() === storeName, options);
}

/**
 * Get a module by its numeric id. Unless you know what you're doing, you
 * should not use this.
 */
export const getById = __r;

/**
 * Same as getModule, but retrieves all matches instead of the first
 * @returns Array of modules
 */
export function getAll(filter: (module: any) => boolean, options?: FilterOptions): any[] {
    const { exports = true, default: defaultExport = true } = options ?? {};

    const ret = [] as any[];
    for (const key in modules) {
        const id = Number(key);

        let mod;
        try {
            mod = __r(id);
        } catch {
            // Some modules throw error, ignore
        }

        if (!mod) continue;

        try {
            if (filter(mod)) {
                const module = modules[Number(id)].publicModule;
                ret.push(exports ? module.exports : module);
            }

            if (mod.default && filter(mod.default)) {
                const module = modules[Number(id)].publicModule;
                return defaultExport ? module.exports.default :
                    exports ? module.exports : module;
            }
        } catch (e: any) {
            (logger ?? console).error("Error during getModule", e?.stack ?? e);
        }
    }

    return ret;
}

/**
 * Same as getByProps, but retrieves all matches instead of the first
 * @returns Array of modules
 */
export function getAllByProps<T extends string>(...props: T[]): PropIntellisense<T>[];
export function getAllByProps<T extends string>(...options: [...props: T[], options: FilterOptions]): PropIntellisense<T>[];
export function getAllByProps<T extends string>(...options: [...props: T[], defaultExport: boolean]): PropIntellisense<T>[];
export function getAllByProps(...props: any[]) {
    if (!props.length) return [];

    const options = typeof props[props.length - 1] === "object" ? props.pop() : {};
    const filter = (module: any) => {
        for (let i = 0, len = props.length; i < len; i++)
            if (module[props[i]] === undefined) return false;
        return true;
    };

    return getAll(filter, typeof options === "boolean" ? { default: options } : options);
}

/**
 * Find all modules with properties containing the specified keyword 
 * @param keyword They keyword
 * @param skipConstants Whether constants (names that are FULL_CAPS) should be skipped. Defaults to true
 * @returns Array of names that match. You can then access moduleSearchResults.SomeName to view the
 *          corresponding module 
 */
export function searchByKeyword(keyword: string, skipConstants = true) {
    keyword = keyword.toLowerCase();
    const matches = [] as string[];
    window.moduleSearchResults = {};

    function check(obj: any) {
        if (!obj) return;
        for (const name of Object.getOwnPropertyNames(obj)) {
            if (name.toLowerCase().includes(keyword) && (!skipConstants || name.toUpperCase() !== name)) {
                matches.push(name);
                window.moduleSearchResults[name] = obj;
            }
        }
    }

    for (const id in modules) {
        try {
            __r(Number(id));
            const mod = modules[id]?.publicModule;
            if (mod) {
                check(mod);
                check(mod.exports);
                check(mod.exports?.default);
            }
        } catch {
            //
        }
    }

    return matches;
}

export const UserStore = getByStoreName("UserStore");
export const GuildStore = getByStoreName("GuildStore");
export const ThemeStore = getByStoreName("ThemeStore");
export const ChannelStore = getByStoreName("ChannelStore");
export const MessageStore = getByStoreName("MessageStore");
export const GuildMemberStore = getByStoreName("GuildMemberStore");
export const SelectedChannelStore = getByStoreName("SelectedChannelStore");

export const ModalActions = getByProps("closeModal");
export const MessageActions = getByProps("sendMessage", "receiveMessage");
export const FluxDispatcher = getByProps("subscribe", "isDispatching");
export const FetchUserActions = getByProps("fetchProfile");
export const ContextMenuActions = getByProps("openContextMenu");
export const SnowflakeUtils = getByProps("fromTimestamp", "extractTimestamp");
export const Locale = getByProps("Messages");
export const AMOLEDThemeManager = getByProps("setAMOLEDThemeEnabled");

export const Clipboard = getByProps("getString", "setString") as {
    getString(): Promise<string>,
    setString(str: string): Promise<void>;
};

export const Dialog = getByProps("show", "openLazy", "confirm", "close") as {
    show(options: {
        title?: string,
        body?: string,
        confirmText?: string,
        cancelText?: string,
        confirmColor?: string,
        isDismissable?: boolean,
        onConfirm?: () => any,
        onCancel?: () => any,
        [k: PropertyKey]: any;
    }),
    close(),
    [k: PropertyKey]: any;
};

export const Toasts = getModule(m => (
    m.open !== undefined && m.close !== undefined && !m.openLazy && !m.startDrag && !m.init && !m.openReplay && !m.openChannelCallPopout
)) as {
    open(options: {
        content?: string,
        source?: ImageSourcePropType,
        [k: PropertyKey]: any;
    }),
    close(),
    [k: PropertyKey]: any;
};

export const RestAPI = getByProps("getAPIBaseURL", "get");
export const Flux = getByProps("connectStores");
export const React = getByProps("createElement") as typeof import("react");
export const ReactNative = getByProps("Text", "Image") as typeof import("react-native");
export const Constants = getByProps("Fonts") as import("./constants").default;
export const URLOpener = getByProps("openURL", "handleSupportedURL");
export const Forms = getByProps("FormSection");
export const Scenes = getByName("getScreens", { default: false });
export const ThemeManager = getByProps("updateTheme", "overrideTheme");

// Abandon all hope, ye who enter here
type Style = ViewStyle & ImageStyle & TextStyle;
type Styles = Partial<{ [key in keyof Style]: readonly [Style[key], Style[key]] | Style[key] }>;
type FlattenValue<T> = { [key in keyof T]: T[key] extends ReadonlyArray<infer E> ? E : T[key] };

export const Styles = getByProps("createThemedStyleSheet") as {
    ThemeColorMap: Record<string, [string, string]>;
    createThemedStyleSheet: <T extends { [key: string]: Styles; }>(styles: T)
        => { [key in keyof T]: FlattenValue<T[key]>; };
    getThemedStylesheet: <T extends { [key: string]: Styles; }>(styles: T)
        => Record<"mergedDarkStyles" | "mergedLightStyles", { [key in keyof T]: FlattenValue<T[key]>; }>;
};
