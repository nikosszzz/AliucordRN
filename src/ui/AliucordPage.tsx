import { useSettings } from "../api/Settings";
import { React } from "../metro";
import { URLOpener } from "../metro/index";
import { ALIUCORD_GITHUB, ALIUCORD_INVITE, ALIUCORD_PATREON } from "../utils/constants";
import { getAssetId } from "../utils/getAssetId";
import { Forms, General } from "./components";

const { FormSection, FormSwitch, FormRow, FormIcon } = Forms;

export default function AliucordPage() {
    const settings = useSettings(window.Aliucord.settings);

    return (<>
        <General.ScrollView>
            <FormSection title="Settings" /* Nice prop name discord */ android_noDivider={true}>
                <FormRow
                    label="Automatically disable plugins on crash"
                    trailing={<FormSwitch value={settings.get("disablePluginsOnCrash", true)} onValueChange={v => settings.set("disablePluginsOnCrash", v)} />}
                />
                <FormRow
                    label="Automatically update Aliucord"
                    trailing={<FormSwitch value={settings.get("autoUpdateAliucord", false)} onValueChange={v => settings.set("autoUpdateAliucord", v)} />}
                />
                <FormRow
                    label="Automatically update Plugins"
                    trailing={<FormSwitch value={settings.get("autoUpdatePlugins", false)} onValueChange={v => settings.set("autoUpdatePlugins", v)} />}
                />
            </FormSection>
            <FormSection title="Socials">
                <FormRow
                    label="Source Code"
                    leading={<FormIcon source={getAssetId("img_account_sync_github_white")} />}
                    trailing={FormRow.Arrow}
                    onPress={() => URLOpener.openURL(ALIUCORD_GITHUB)}
                />
                <FormRow
                    label="Support Server"
                    leading={<FormIcon source={getAssetId("img_help_icon")} />}
                    trailing={FormRow.Arrow}
                    onPress={() => URLOpener.openURL(ALIUCORD_INVITE)}
                />
                <FormRow
                    label="Support Us"
                    leading={<FormIcon source={getAssetId("ic_premium_perk_heart_24px")} />}
                    trailing={FormRow.Arrow}
                    onPress={() => URLOpener.openURL(ALIUCORD_PATREON)}
                />
            </FormSection>
        </General.ScrollView>
    </>);
}
