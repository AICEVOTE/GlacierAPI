import * as model from "../model";
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import Twitter from "twitter";
import { v4 as uuidv4 } from "uuid";

const oneHour = 60 * 60 * 1000
const oneDay = oneHour * 24;
const oneMonth = oneDay * 31;

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
                friends: res.ids,
                imageURI: profile.photos ? profile.photos[0]?.value || "" : "",
                numOfFollowers: profile._json.followers_count
            }
        }, { upsert: true });

        await new model.Session({
            userProvider: profile.provider,
            userID: profile.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
            sessionID: sessionID,
            sessionIDExpire: Date.now() + oneMonth,
            sessionToken: uuidv4(),
            sessionTokenExpire: Date.now() + oneDay
        }).save();
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
            await model.Session.updateMany({ sessionTokenExpire: { $lt: Date.now() } }, {
                $set: {
                    sessionToken: uuidv4(),
                    sessionTokenExpire: Date.now() + oneDay
                }
            });
        } catch (e) {
            console.log(e);
        }
    }, oneHour);

    setInterval(async () => {
        try {
            await model.Session.deleteMany({ sessionIDExpire: { $lt: Date.now() } });
        } catch (e) {
            console.log(e);
        }
    }, oneDay);
}

export async function getSessionToken(sessionID: string) {
    try {
        const doc = await model.Session.findOne({ sessionID: sessionID }).exec();
        if (!doc) { throw new Error("The sessionID is invalid"); }

        return doc.sessionToken;
    } catch (e) {
        throw e;
    }
}

export const authWithTwitter = passport.authenticate("twitter");
