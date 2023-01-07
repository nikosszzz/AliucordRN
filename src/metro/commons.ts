import { ImageSourcePropType, ImageStyle, TextStyle, ViewStyle } from "react-native";
import { filters, getByProps, getByStoreName, getModule, getModuleLazy } from ".";

// these are loaded early
export const UserStore = getByStoreName("UserStore");
export const GuildStore = getByStoreName("GuildStore");
export const ThemeStore = getByStoreName("ThemeStore");
export const ChannelStore = getByStoreName("ChannelStore");
export const MessageStore = getByStoreName("MessageStore");
export const GuildMemberStore = getByStoreName("GuildMemberStore");
export const SelectedChannelStore = getByStoreName("SelectedChannelStore");

// same with this ones
export const FluxDispatcher = getByProps("subscribe", "isDispatching");
export const MessageActions = getByProps("sendMessage", "receiveMessage");
export const FetchUserActions = getByProps("fetchProfile");
export const SnowflakeUtils = getByProps("fromTimestamp", "extractTimestamp");
export const Locale = getByProps("Messages");

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

export const LateLoadedModules = {
    ModalActions: getModuleLazy(filters.byProps("closeModal")),
    ContextMenuActions: getModuleLazy(filters.byProps("closeModal")),
    AMOLEDThemeManager: getModuleLazy(filters.byProps("closeModal")),
    URLOpener: getModuleLazy(filters.byProps("openURL", "handleSupportedURL")),
    Scenes: getModuleLazy(filters.byName("getScreens"), { default: false }),
    ThemeManager: getModuleLazy(filters.byProps("updateTheme", "overrideTheme")),
    Forms: getModuleLazy(filters.byProps("FormText", "FormSection")),
};
