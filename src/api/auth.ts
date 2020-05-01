import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as TwitterStrategy } from "passport-twitter";
import Twitter from "twitter";
import { v4 as uuidv4 } from "uuid";
import * as sessionAPI from "./session";

export const twitterAuth = passport.authenticate("twitter");
export const appAuth = passport.authenticate("local");

async function getTwitterFriends(twitterClient: Twitter, twitterID: string): Promise<string[]> {
    const res = await twitterClient.get("friends/ids",
        { user_id: twitterID, stringify_ids: true });
    return res.ids;
}

// Authorize with web twitter authentication
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY || "",
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET || "",
    callbackURL: process.env.TWITTER_CALLBACK || ""
}, async (accessToken, refreshToken, profile, done) => {
    const sessionID = uuidv4();

    try {
        const twitterClient = new Twitter({
            consumer_key: process.env.TWITTER_CONSUMER_KEY || "",
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET || "",
            access_token_key: accessToken,
            access_token_secret: refreshToken
        });
        const friends = await getTwitterFriends(twitterClient, profile.id);
        let imageURI = "";
        if (profile.photos && profile.photos[0]) {
            imageURI = profile.photos[0].value;
        }

        await sessionAPI.saveSession({
            userID: profile.id,
            userProvider: profile.provider,
            name: profile.username || "",
            friends: friends,
            imageURI: imageURI,
            numOfFollowers: profile._json.followers_count
        }, accessToken, refreshToken, sessionID);
    } catch (e) {
        return done(null, false);
    }

    done(null, sessionID);
}));

// Authorize with accessToken & refreshToken
passport.use(new LocalStrategy({
    usernameField: "accessToken",
    passwordField: "refreshToken",
    session: false
}, async (accessToken, refreshToken, done) => {
    const sessionID = uuidv4();

    try {
        const twitterClient = new Twitter({
            consumer_key: process.env.TWITTER_CONSUMER_KEY || "",
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET || "",
            access_token_key: accessToken,
            access_token_secret: refreshToken
        });
        const res = await twitterClient.get("account/verify_credentials", {});
        const friends = await getTwitterFriends(twitterClient, res.id_str);

        await sessionAPI.saveSession({
            name: res.screen_name,
            userProvider: "twitter",
            userID: res.id_str,
            friends: friends,
            imageURI: res.profile_image_url_https,
            numOfFollowers: res.followers_count
        }, accessToken, refreshToken, sessionID);
    } catch (e) {
        return done(null, false);
    }

    done(null, sessionID);
}));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });
