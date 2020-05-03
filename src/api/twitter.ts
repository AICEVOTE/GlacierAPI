import Twitter from "twitter";
import type { Profile } from "./session";

export function connect(accessToken: string, refreshToken: string): Twitter {
    return new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY || "",
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET || "",
        access_token_key: accessToken,
        access_token_secret: refreshToken
    });
}

export async function getTwitterFriends(twitterClient: Twitter, twitterID: string): Promise<string[]> {
    const res = await twitterClient.get("friends/ids",
        { user_id: twitterID, stringify_ids: true });
    return res.ids;
}

export async function getProfile(twitterClient: Twitter): Promise<Profile> {
    const res = await twitterClient.get("account/verify_credentials", {});
    const friends = await getTwitterFriends(twitterClient, res.id_str);

    return {
        userProvider: "twitter",
        userID: res.id_str,
        name: res.screen_name,
        friends,
        imageURI: res.profile_image_url_https,
        numOfFollowers: res.followers_count
    };
}
