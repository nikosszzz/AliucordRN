import { setTheme } from "../api/Themer";
import { Author, Theme } from "../entities";
import { Constants, FetchUserActions, Profiles, React, Styles, Users } from "../metro";
import { excludedThemes, InvalidTheme, loadedThemes, themeState } from "../themer/themerInit";
import { getAssetId } from "../utils/getAssetId";
import { Forms, General, Search } from "./components";

const { View, Text, FlatList, Image, ScrollView, Pressable } = General;
const { FormIcon, FormRow, FormText, FormRadio } = Forms;

const styles = Styles.createThemedStyleSheet({
    container: {
        flex: 1
    },
    list: {
        padding: 5,
    },
    card: {
        borderRadius: 10,
        margin: 5,
        backgroundColor: Styles.ThemeColorMap.BACKGROUND_TERTIARY,
    },
    header: {
        flexDirection: "row",
        flexWrap: "wrap"
    },
    invalidHeader: {
        flexDirection: "column",
        flexWrap: "wrap"
    },
    divider: {
        width: "100%",
        borderBottomWidth: 1,
        borderColor: Styles.ThemeColorMap.BACKGROUND_MODIFIER_ACCENT
    },
    bodyCard: {
        backgroundColor: Styles.ThemeColorMap.BACKGROUND_SECONDARY,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10
    },
    bodyText: {
        color: Styles.ThemeColorMap.TEXT_NORMAL,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 14
    },
    text: {
        fontFamily: Constants.Fonts.PRIMARY_SEMIBOLD,
        color: Styles.ThemeColorMap.TEXT_NORMAL,
        fontSize: 16
    },
    invalidInfoText: {
        color: Styles.ThemeColorMap.TEXT_MUTED,
        fontSize: 12,
        fontWeight: "400"
    },
    warningText: {
        color: Styles.ThemeColorMap.TEXT_WARNING,
        fontFamily: Constants.Fonts.PRIMARY_NORMAL,
        fontSize: 12,
        paddingTop: 5
    },
    link: {
        marginLeft: 3,
        fontFamily: Constants.Fonts.PRIMARY_SEMIBOLD,
        color: Styles.ThemeColorMap.TEXT_LINK
    },
    noThemes: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginTop: "10%"
    },
    noThemesText: {
        marginTop: 10,
        color: Styles.ThemeColorMap.TEXT_NORMAL,
        fontFamily: Constants.Fonts.PRIMARY_SEMIBOLD,
        textAlign: "center"
    },
    search: {
        margin: 0,
        marginBottom: 0,
        paddingBottom: 5,
        paddingRight: 15,
        paddingLeft: 15,
        backgroundColor: "none",
        borderBottomWidth: 0,
        background: "none"
    }
});

function InvalidCard({ invalidTheme }: { invalidTheme: InvalidTheme; }) {
    return (
        <View style={styles.card}>
            <FormRow
                label={(
                    <View style={styles.invalidHeader}>
                        <Text style={styles.invalidInfoText} adjustsFontSizeToFit={true}>
                            INVALID
                        </Text>
                        <Text style={styles.text} adjustsFontSizeToFit={true}>
                            {invalidTheme.name}
                        </Text>
                    </View>)}
                leading={<FormIcon source={getAssetId("Small")} color='#FF0000' />}
            />
            <View style={styles.divider} />
            {!!invalidTheme.reason && <View style={styles.bodyCard}>
                <FormText style={styles.bodyText} adjustsFontSizeToFit={true}>{invalidTheme.reason}</FormText>
            </View>}
        </View>
    );
}

function ThemeCard({ theme }: { theme: Theme; }) {
    const [isEnabled, setIsEnabled] = React.useState(themeState?.currentTheme === theme.name);
    const hasDuplicate = excludedThemes.duplicatedThemes.includes(theme.name);
    return (
        <View style={styles.card}>
            <FormRow
                label={(
                    <Text style={styles.text} adjustsFontSizeToFit={true}>
                        {theme.name} v{theme.version ?? "0.0.0"} by {theme.authors ?
                            theme.authors.map((a, i) => (
                                a.id ?
                                    <Text
                                        key={a.id}
                                        style={styles.link}
                                        onPress={() => {
                                            if (!Users.getUser(a.id)) {
                                                FetchUserActions.fetchProfile(a.id).then(() => {
                                                    Profiles.showUserProfile({ userId: a.id });
                                                });
                                            } else {
                                                Profiles.showUserProfile({ userId: a.id });
                                            }
                                        }}
                                    >
                                        {a.name}{i !== (theme.authors as Author[]).length - 1 && <Text style={styles.text}>, </Text>}
                                    </Text>
                                    :
                                    <Text>
                                        {a.name}{i !== (theme.authors as Author[]).length - 1 && <Text>, </Text>}
                                    </Text>
                            ))
                            :
                            <Text>
                                Unknown
                            </Text>}
                    </Text>
                )}
                subLabel={hasDuplicate ? (
                    <Text style={styles.warningText} adjustsFontSizeToFit={true}>
                        WARNING: One or more theme with the same name was found and was not loaded.
                    </Text>
                ) : null}
                leading={hasDuplicate ? (
                    <FormIcon source={getAssetId("yellow-alert")} />
                ) : null}
                trailing={(
                    <Pressable onPress={() => {
                        setTheme(themeState?.currentTheme === theme.name ? null : theme);
                        setIsEnabled(!isEnabled);
                    }}>
                        <FormRadio selected={isEnabled} />
                    </Pressable>
                )}
            />
            <View style={styles.bodyCard}>
                <FormText style={styles.bodyText} adjustsFontSizeToFit={true}>
                    {theme.description ?? "No description provided."}
                </FormText>
            </View>
        </View>
    );
}

export default function ThemesPage() {
    const [search, setSearch] = React.useState(String);

    const entities = search ? Object.values(loadedThemes).filter(theme => {
        const { name, description, authors } = theme;

        if (name.toLowerCase().includes(search.toLowerCase())) {
            return true;
        }

        if (description.toLowerCase().includes(search.toLowerCase())) {
            return true;
        }

        if (authors?.find?.(a => (a.name ?? a).toLowerCase().includes(search.toLowerCase()))) {
            return true;
        }

        return false;
    }) : Object.values(loadedThemes);

    return (<>
        <Search
            style={styles.search}
            placeholder='Search themes...'
            onChangeText={v => setSearch(v)}
        />
        <ScrollView style={styles.container}>
            {!!excludedThemes.invalidThemes.length && <FlatList
                data={excludedThemes.invalidThemes}
                renderItem={({ item }) => <InvalidCard
                    key={item.name}
                    invalidTheme={{
                        name: item.name,
                        reason: item.reason
                    }}
                />}
                keyExtractor={theme => theme.name}
                style={styles.list}
            />}
            {!entities.length ?
                search ?
                    <View style={styles.noThemes}>
                        <Image source={getAssetId("img_connection_empty_dark")} />
                        <Text style={styles.noThemesText}>
                            No results were found.
                        </Text>
                    </View>
                    :
                    <View style={styles.noThemes}>
                        <Image source={getAssetId("img_connection_empty_dark")} />
                        <Text style={styles.noThemesText}>
                            {"You don't have any themes installed."}
                        </Text>
                    </View>
                :
                <FlatList
                    data={entities}
                    renderItem={({ item }) => <ThemeCard
                        key={item.name}
                        theme={item}
                    />}
                    keyExtractor={theme => theme.name}
                    style={styles.list}
                />
            }
        </ScrollView>
    </>);
}
