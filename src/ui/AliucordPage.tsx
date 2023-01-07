import { useSettings } from "../api/Settings";
import { getByFactoryStrings } from "../metro";
import { LateLoadedModules, React, ReactNative } from "../metro/commons";
import { ALIUCORD_GITHUB, ALIUCORD_INVITE, ALIUCORD_PATREON } from "../utils/constants";
import { getAssetId } from "../utils/getAssetId";

const { ScrollView } = ReactNative;

export default async function AliucordPage() {
    const { FormSection, FormSwitch, FormRow } = await LateLoadedModules.Forms;

    const settings = useSettings(window.Aliucord.settings);

    const openURL = (url: string) => {
        const { openURL } = getByFactoryStrings(x => x.includes("handleMessageLinking"));
        openURL(url);
    };

    return (<>
        <ScrollView>
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
                    leading={<FormRow.Icon source={getAssetId("img_account_sync_github_white")} />}
                    trailing={FormRow.Arrow}
                    onPress={() => openURL(ALIUCORD_GITHUB)}
                />
                <FormRow
                    label="Support Server"
                    leading={<FormRow.Icon source={getAssetId("img_help_icon")} />}
                    trailing={FormRow.Arrow}
                    onPress={() => openURL(ALIUCORD_INVITE)}
                />
                <FormRow
                    label="Support Us"
                    leading={<FormRow.Icon source={getAssetId("ic_premium_perk_heart_24px")} />}
                    trailing={FormRow.Arrow}
                    onPress={() => openURL(ALIUCORD_PATREON)}
                />
            </FormSection>
        </ScrollView>
    </>);
}
