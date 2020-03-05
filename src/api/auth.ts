import * as model from "../model";
import * as utilAPI from "./util";
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import Twitter from "twitter";
import { v4 as uuidv4 } from "uuid";

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
        const res = await twitterClient.get("friends/ids",
            { user_id: profile.id, stringify_ids: true });

        await model.User.updateOne({ userID: profile.id, userProvider: profile.provider }, {
            $set: {
                name: profile.username,
                authInfo: {
                    AT: accessToken,
                    RT: refreshToken
                },
                friends: res.ids,
                imageURI: profile.photos ? profile.photos[0]?.value || "" : "",
                numOfFollowers: profile._json.followers_count,
                sessionID: sessionID,
                sessionToken: uuidv4(),
                sessionTokenExpire: Date.now() + 15 * 60 * 1000
            }
        }, { upsert: true });
    } catch (e) {
        done(null, false);
        throw e;
    }

    done(null, sessionID);
}));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });

if (process.env.ROLE == "MASTER") {
    setInterval(async () => {
        try {
            await model.User.updateMany({ sessionTokenExpire: { $lt: Date.now() } }, {
                $set: {
                    sessionToken: uuidv4(),
                    sessionTokenExpire: Date.now() + 15 * 60 * 1000
                }
            });
        } catch (e) {
            console.log(e);
        }
    }, 5 * 60 * 1000);
}

export async function getSessionToken(sessionID: string) {
    try {
        const doc = await model.User.findOne({ sessionID: sessionID }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("The sessionID is invalid"); }

        const sessionToken = uuidv4();
        await model.User.updateOne({ sessionID: sessionID }, {
            $set: {
                sessionToken: sessionToken,
                sessionTokenExpire: Date.now() + 15 * 60 * 1000
            }
        });
        return sessionToken;
    } catch (e) {
        throw e;
    }
}
