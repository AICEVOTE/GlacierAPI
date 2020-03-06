import express from "express";
const router = express.Router();

import * as authAPI from "../api/auth";
import * as utilAPI from "../api/util";
import passport from "passport";
import createError from "http-errors";

router.get("/", (_req, res, _next) => {
    res.render("index", {
        title: "/auth/", docs: [
            {
                uri: "sessiontoken",
                description: "Get your session token (Logged in session required)",
                res: ["sessionToken: session token"],
                method: "GET",
                query: ""
            },
            {
                uri: "twitter",
                description: "Authenticate with Twitter",
                method: "GET",
                query: ""
            },
            {
                uri: "twitter/callback",
                description: "Twitter callback URI"
            }
        ]
    });
});

router.get("/sessiontoken", async (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user;

    if (!utilAPI.isString(sessionID)) {
        return next(createError(400));
    }
    try {
        res.json({ sessionToken: await authAPI.getSessionToken(sessionID) });
    } catch (e) {
        return next(createError(400));
    }
});

router.get("/twitter", passport.authenticate("twitter"));

router.get("/twitter/callback", passport.authenticate("twitter"), async (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user;

    if (!utilAPI.isString(sessionID)) {
        next(createError(400));
    } else if (!req.session || !utilAPI.isString(req.session.callbackURI) ||
        !utilAPI.isBoolean(req.session.isAuthorizedApp)) {
        res.send("<script>window.open('','_self').close();</script>");
    } else {
        const sessionToken = await authAPI.getSessionToken(sessionID, req.session.isAuthorizedApp);
        res.redirect(req.session.callbackURI + "?sessiontoken=" + sessionToken);
    }
});

router.get("/app", async (req, res, next) => {
    const callbackURI: unknown = req.query.callback;
    const APIKey: unknown = req.query.apikey;

    if (!req.session) {
        next(createError(503));
    } else if (!utilAPI.isString(callbackURI)) {
        next(createError(400));
    } else if (utilAPI.isString(APIKey) && APIKey != process.env.GLACIERAPI_KEY) {
        next(createError(403));
    } else {
        req.session.callbackURI = callbackURI;
        req.session.isAuthorizedApp = utilAPI.isString(APIKey);
        res.redirect("./twitter");
    }
});

export default router;
