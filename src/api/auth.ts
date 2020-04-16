import * as model from "../model";
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as LocalStrategy } from "passport-local";
import Twitter from "twitter";
import { v4 as uuidv4 } from "uuid";

const oneHour = 60 * 60 * 1000
const oneDay = oneHour * 24;
const oneMonth = oneDay * 31;

interface Profile {
    name: string,
    userProvider: string,
    userID: string,
    friends: string[],
    imageURI: string,
    numOfFollowers: number
}

async function saveSession(profile: Profile, sessionID: string) {
    await model.User.updateOne({ userID: profile.userID, userProvider: profile.userProvider }, {
        $set: {
            name: profile.name,
            friends: profile.friends,
            imageURI: profile.imageURI,
            numOfFollowers: profile.numOfFollowers
        }
    }, { upsert: true });

    await new model.Session({
        userProvider: profile.userProvider,
        userID: profile.userID,
        sessionID: sessionID,
        sessionIDExpire: Date.now() + oneMonth,
        sessionToken: uuidv4(),
        sessionTokenExpire: Date.now() + oneHour
    }).save();
}

async function getTwitterFriends(twitterClient: Twitter, twitterID: string): Promise<string[]> {
    const res = await twitterClient.get("friends/ids",
        { user_id: twitterID, stringify_ids: true });
    return res.ids;
}

export async function getSessionToken(sessionID: string): Promise<string> {
    const session = await model.Session.findOne({ sessionID: sessionID }).exec();
    if (!session) { throw new Error("Invalid sessionID"); }

    return session.sessionToken;
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

        await saveSession({
            userID: profile.id,
            userProvider: profile.provider,
            name: profile.username || "",
            friends: friends,
            imageURI: imageURI,
            numOfFollowers: profile._json.followers_count
        }, sessionID);
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
        const res = await twitterClient.get("account/verify_credentials");
        const friends = await getTwitterFriends(twitterClient, res.id_str);

        await saveSession({
            name: res.screen_name,
            userProvider: "twitter",
            userID: res.id_str,
            friends: friends,
            imageURI: res.profile_image_url_https,
            numOfFollowers: res.followers_count
        }, sessionID);
    } catch (e) {
        return done(null, false);
    }

    done(null, sessionID);
}));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });

if (process.env.ROLE == "MASTER") {
    setInterval(async () => {
        try {
            // Refresh session token
            await model.Session.updateMany({ sessionTokenExpire: { $lt: Date.now() } }, {
                $set: {
                    sessionToken: uuidv4(),
                    sessionTokenExpire: Date.now() + oneHour
                }
            });

            // Delete expired session
            await model.Session.deleteMany({ sessionIDExpire: { $lt: Date.now() } });
        } catch (e) {
            console.log(e);
        }
    }, oneHour);
}
