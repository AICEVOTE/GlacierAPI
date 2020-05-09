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
    try {
        const twitterClient = twitterAPI.connect(accessToken, refreshToken);
        const friends = await twitterAPI.getTwitterFriends(twitterClient, profile.id);
        let imageURI = "";
        if (profile.photos && profile.photos[0]) {
            imageURI = profile.photos[0].value;
        }

        const sessionID = await sessionAPI.createSession(
            {
                userProvider: profile.provider,
                userID: profile.id,
                name: profile.username || "",
                friends, imageURI,
                numOfFollowers: profile._json.followers_count
            });

        done(null, sessionID);
    } catch (e) {
        return done(null, false);
    }
}));

// Authorize with accessToken & refreshToken
passport.use(new LocalStrategy({
    usernameField: "accessToken",
    passwordField: "refreshToken",
    session: false
}, async (accessToken, refreshToken, done) => {
    try {
        const twitterClient = twitterAPI.connect(accessToken, refreshToken);
        const profile = await twitterAPI.getProfile(twitterClient);
        const sessionID = await sessionAPI.createSession(profile);
        done(null, sessionID);
    } catch (e) {
        return done(null, false);
    }
}));

passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((user, done) => { done(null, user); });

type ReqHandler = RequestHandler<ParamsDictionary, any, any, Query>;
export const twitterAuth: ReqHandler = passport.authenticate("twitter");
export const appAuth: ReqHandler = passport.authenticate("local");
