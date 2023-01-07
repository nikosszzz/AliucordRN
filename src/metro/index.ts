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
export const callbacks: ((id: number) => void)[] = [];

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

            onModuleInitialization(Number(key));
            return module;
        };
    }
}

// returns null if module is invalid/not initialized
function getModuleById(id: any): any | null {
    const module = modules[id];
    if (!module || !module.isInitialized) return null;

    let mod;
    try {
        mod = __r(id);
    } catch {
        // ignore
    }

    if (!mod) return null;

    return mod;
}

export function waitFor(filter: (module: any) => boolean, callback: (mod: any) => void, options?: any) {
    options = {
        ...{ exports: true, default: true },
        ...(options ?? {})
    };

    const { exports, default: defaultExport } = options;

    for (const key in modules) {
        const mod = getModuleById(key);
        if (!mod) continue;

        if (filter(mod)) {
            callback(exports ? mod : mod.publicModule);
            return;
        }

        if (mod.default && filter(mod.default)) {
            callback(defaultExport ? mod.default : exports ? mod : mod.publicModule);
            return;
        }
    }

    const lookup = (id: number) => {
        const module = __r(id);
        if (!module) return;

        if (filter(module)) {
            callback(module);
            callbacks.splice(callbacks.indexOf(lookup), 1);
        } else if (module.default && filter(module.default)) {
            callback(module.default);
            callbacks.splice(callbacks.indexOf(lookup), 1);
        }
    };

    callbacks.push(lookup);
}

/**
 * Get a module right after it was initialized.
 * @param filter Module filter
 * @param options Options.
 * @returns Promise that resolves to the module when it gets loaded.
 */
export function getModuleLazy(filter: (module: any) => boolean, options?: any): Promise<any> {
    options = {
        ...{ exports: true, default: true },
        ...(options ?? {})
    };

    return new Promise(resolve => {
        waitFor(filter, resolve, options);
    });
}

/**
 * Find the id of a module from its factory strings, useful for loading modules without waiting for Discord.
 * Make sure the factory string check are unique, otherwise it will return the first one it finds.
 * @param filter Strings filter
 * @returns Module id if found, else null
 */
export function getIdByFactoryStrings(filter: ((strings: string[]) => boolean)): number | null {
    for (const key in modules) {
        const module = modules[key];
        if (!module || (!module.originalFactory && !module.factory)) continue;

        const strings = AliuHermes.findStrings(module.originalFactory || module.factory);
        if (filter(strings))
            return Number(key);
    }

    return null;
}

/**
 * Find a module from its factory strings, useful for loading modules without waiting for Discord.
 * Make sure the string check are unique, otherwise it will return the first one it finds.
 * @param filter Strings filter
 * @returns Initialized module if found, else null
 */
export function getByFactoryStrings(filter: ((strings: string[]) => boolean)) {
    const id = getIdByFactoryStrings(filter);

    return id ? window.__r(id) : null;
}

export const filters = {
    byStoreName: (storeName: string) => (m: any) => m.getName?.() === storeName,
    byDisplayName: (displayName: string) => (m: any) => m.displayName === displayName,
    byName: (defaultName: string) => (m: any) => m?.default?.name === defaultName,
    byProps: (...props: string[]) => (m: any) => {
        for (let i = 0, len = props.length; i < len; i++)
            if (m[props[i]] === undefined) return false;
        return true;
    }
};

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

        if (!modules[id] || !modules[id].isInitialized) continue;
        const mod = __r(id);
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
