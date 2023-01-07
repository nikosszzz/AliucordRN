import * as swcHelpers from "@swc/helpers";
import * as Aliucord from "./Aliucord";

export * from "./Aliucord";
export * as api from "./api";
export * as entities from "./entities";
export * as metro from "./metro";
export * as native from "./native";
export * as utils from "./utils";

window.swcHelpers = swcHelpers;
window.Aliucord = Aliucord;

// setImmediate is necessary here as otherwise this function is called before
// the bundle returned, meaning global.aliucord won't be ready.
setImmediate(Aliucord.load);

// const origLogHook = globalThis.nativeLoggingHook;

// globalThis.nativeLoggingHook = (...args) => {
//     if (socket?.readyState === WebSocket.OPEN) {
//         socket.send(JSON.stringify({ level: args[1], message: args[0] }));
//     }
//     return origLogHook(...args);
// };

// const socket = new WebSocket("ws://localhost:3000");

// socket.addEventListener("open", () => console.info("Connected with debug websocket"));
// socket.addEventListener("error", e => console.error((e as ErrorEvent).message));
// socket.addEventListener("message", async message => {
//     try {
//         const { data } = message;
//         if (data.includes("await")) {
//             console.log(await (0, eval)(makeAsyncEval(data)));
//         } else {
//             console.log((0, eval)(data));
//         }
//     } catch (e) {
//         console.error(e as Error | string);
//     }
// });

// declare const modules: Record<string | number, any>;

// const callbacks: ((id: number) => void)[] = [];

// const onModuleInitialization = (id: number) => {
//     callbacks.forEach(cb => cb(id));
// };

// for (const key in modules) {
//     const mod = modules[key];
//     if (!mod) continue;

//     if (!mod.isInitialized && mod.factory) {
//         mod.originalFactory = mod.factory;
//         mod.factory = (...args: any) => {
//             const module = mod.originalFactory(...args);

//             onModuleInitialization(Number(key));
//             return module;
//         };
//     }
// }

// // returns null if module is inavlid/not initialized
// function getById(id: any): any | null {
//     const module = modules[id];
//     if (!module || !module.isInitialized) return null;

//     let mod;
//     try {
//         mod = window.__r(id);
//     } catch {
//         // ignore
//     }

//     if (!mod) return null;

//     return module;
// }

// export function waitFor(filter: (module: any) => boolean, callback: (mod: any) => void, options?: any) {
//     const { exports = true, default: defaultExport = true } = options ?? {};

//     for (const key in modules) {
//         const mod = getById(key);
//         if (!mod) continue;

//         if (filter(mod)) {
//             callback(exports ? mod : mod.publicModule);
//             return;
//         }

//         if (mod.default && filter(mod.default)) {
//             callback(defaultExport ? mod.default : exports ? mod : mod.publicModule);
//             return;
//         }
//     }

//     const lookup = (id: number) => {
//         const module = window.__r(id);
//         if (!module) return;

//         if (filter(module)) {
//             callback?.(module);
//             callbacks.splice(callbacks.indexOf(lookup), 1);
//         } else if (module.default && filter(module.default)) {
//             callback?.(module.default);
//             callbacks.splice(callbacks.indexOf(lookup), 1);
//         }
//     };

//     callbacks.push(lookup);
// }

// export function getIdByFactoryStrings(filter: ((strings: string[]) => boolean)) {
//     for (const key in modules) {
//         const module = modules[key];
//         if (!module || (!module.originalFactory && !module.factory)) continue;

//         const strings = AliuHermes.findStrings(module.originalFactory || module.factory);
//         if (filter(strings)) return key;
//     }
// }

// export function getByFactoryStrings(filter: ((strings: string[]) => boolean)) {
//     const id = getIdByFactoryStrings(filter);
//     if (!id) {
//         throw new Error("Module not found");
//     }
//     return window.__r(id);
// }
