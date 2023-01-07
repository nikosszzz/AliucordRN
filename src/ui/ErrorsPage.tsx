import { plugins } from "../api";
import { Constants, LateLoadedModules, React, ReactNative, Styles } from "../metro/commons";
import { getAssetId } from "../utils";

const { Image, ScrollView, View, Text, FlatList } = ReactNative;

interface PluginLogs {
    plugin: {
        version: string;
        name: string;
    };
    errors: Record<string, string>;
}[];

const styles = Styles.createThemedStyleSheet({
    container: {
        flex: 1,
        padding: 5
    },
    list: {
        padding: 10,
    },
    card: {
        borderRadius: 5,
        margin: 10,
        backgroundColor: Styles.ThemeColorMap.BACKGROUND_TERTIARY,
    },
    header: {
        flexDirection: "row",
        flexWrap: "wrap"
    },
    bodyCard: {
        backgroundColor: Styles.ThemeColorMap.BACKGROUND_SECONDARY,
    },
    bodyText: {
        color: Styles.ThemeColorMap.TEXT_NORMAL,
        padding: 16,
    },
    text: {
        fontFamily: Constants.Fonts.PRIMARY_SEMIBOLD,
        color: Styles.ThemeColorMap.TEXT_NORMAL,
        fontSize: 16,
        lineHeight: 22
    },
    link: {
        marginLeft: 5,
        fontFamily: Constants.Fonts.PRIMARY_SEMIBOLD,
        fontSize: 16,
        lineHeight: 22,
        color: Styles.ThemeColorMap.TEXT_LINK
    },
    noErrors: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginTop: "10%"
    },
    noErrorsText: {
        marginTop: 10,
        color: Styles.ThemeColorMap.TEXT_NORMAL,
        fontFamily: Constants.Fonts.PRIMARY_SEMIBOLD,
        textAlign: "center"
    },
});

let Forms;

function ErrorCard({ log }: { log: PluginLogs; }) {
    return (
        <View style={styles.card}>
            <Forms.FormRow
                label={(
                    <View style={styles.header}>
                        <Text style={styles.text}>
                            {log.plugin.name} (v{log.plugin.version}) had an error.
                        </Text>
                    </View>)
                } />
            <View style={styles.bodyCard}>
                <Forms.FormText style={styles.bodyText}>{log.errors}</Forms.FormText>
            </View>
        </View>
    );
}

export default async function ErrorsPage() {
    Forms = await LateLoadedModules.Forms;
    const errors = [
        ...Object.values(plugins).map(p => {
            let logs!: PluginLogs;
            if (Object.keys(p.errors).length) logs = { plugin: { name: p.manifest.name, version: p.manifest.version }, errors: p.errors };

            return logs;
        })
    ].filter(value => value !== undefined);
    return (<>
        <ScrollView style={styles.container}>
            {errors.length ?
                <FlatList
                    data={errors}
                    renderItem={({ item }) => <ErrorCard
                        key={item.plugin.name}
                        log={item}
                    />}
                    keyExtractor={log => log.plugin.name}
                    style={styles.list}
                />
                :
                <View style={styles.noErrors}>
                    <Image source={getAssetId("img_connection_empty_dark")} />
                    <Text style={styles.noErrorsText}>
                        There are no errors.
                    </Text>
                </View>
            }
        </ScrollView>
    </>);
}
