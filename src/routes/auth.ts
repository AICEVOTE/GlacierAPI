import express from "express";
const router = express.Router();

import * as authAPI from "../api/auth";
import * as sessionAPI from "../api/session";
import * as utilAPI from "../api/util";
import createError from "http-errors";

router.get("/sessiontoken", async (req, res, next) => {
    const sessionID: unknown = req.query.sessionid;

    if (!utilAPI.isString(sessionID)) {
        return next(createError(400));
    }

    try {
        res.json({
            sessionID: sessionID,
            sessionToken: await sessionAPI.getSessionToken(sessionID)
        });
    } catch (e) {
        console.log(e);
        next(createError(401));
    }
})

router.get("/twitter", (req, _res, next) => {
    const callbackURI: unknown = req.query.callback;

    if (!req.session) {
        return next(createError(503));
    }

    if (!utilAPI.isString(callbackURI)) {
        req.session.callbackURI = undefined;
    } else {
        req.session.callbackURI = callbackURI;
    }

    next();
}, authAPI.twitterAuth);

router.get("/twitter/callback", authAPI.twitterAuth, (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user;

    if (!utilAPI.isString(sessionID) || !req.session) {
        return next(createError(401));
    }

    if (!utilAPI.isString(req.session.callbackURI)) {
        return res.json({ sessionID: sessionID });
    }

    const redirectTo = req.session.callbackURI + "?sessionid=" + sessionID;
    req.session.callbackURI = undefined;
    res.redirect(redirectTo);
});

router.post("/app", authAPI.appAuth, (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user;

    if (!utilAPI.isString(sessionID)) {
        return next(createError(401));
    }

    res.json({ sessionID: sessionID });
});

export default router;
