import type { ParamsDictionary, Query, RequestHandler } from "express-serve-static-core";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as TwitterStrategy } from "passport-twitter";
import * as sessionAPI from "./session";
import * as twitterAPI from "./twitter";

// Authorize with web twitter authentication
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY || "",
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET || "",
    callbackURL: process.env.TWITTER_CALLBACK || ""
}, async (accessToken, refreshToken, profile, done) => {
    let sessionID = "";

    try {
        const twitterClient = twitterAPI.connect(accessToken, refreshToken);
        const friends = await twitterAPI.getTwitterFriends(twitterClient, profile.id);
        let imageURI = "";
        if (profile.photos && profile.photos[0]) {
            imageURI = profile.photos[0].value;
        }

        sessionID = await sessionAPI.createSession(
            {
                userProvider: profile.provider,
                userID: profile.id,
                name: profile.username || "",
                friends, imageURI,
                numOfFollowers: profile._json.followers_count
            });
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
    let sessionID = "";

    try {
        const twitterClient = twitterAPI.connect(accessToken, refreshToken);
        const profile = await twitterAPI.getProfile(twitterClient);
        sessionID = await sessionAPI.createSession(profile);
    } catch (e) {
        return done(null, false);
    }

    done(null, sessionID);
}));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });

type ReqHandler = RequestHandler<ParamsDictionary, any, any, Query>;
export const twitterAuth: ReqHandler = passport.authenticate("twitter");
export const appAuth: ReqHandler = passport.authenticate("local");
