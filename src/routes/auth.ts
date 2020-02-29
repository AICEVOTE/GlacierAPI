import express from "express";
const router = express.Router();

import * as authAPI from "../api/authapi";
import * as utilAPI from "../api/utilapi";
import createError from "http-errors";

router.get("/", (_req, res, _next) => {
    res.render("index", {
        title: "/auth/", docs: [
            {
                uri: "sessionid",
                description: "Get your sessionID (Logged in session required)",
                req: ["callback: Callback destination URI after authentication"],
                res: ["sessionid: session ID"],
                method: "GET",
                query: "?callback=https://google.co.jp"
            },
            {
                uri: "twitter",
                description: "Authenticate with Twitter",
                method: "GET",
                query: ""
            },
            {
                uri: "twitter/callback",
                description: "Twitter callback URI",
                method: "GET",
                query: ""
            }
        ]
    });
});

router.get("/sessionid", (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user;
    const callbackURI: unknown = req.query?.callback;

    if (!utilAPI.isString(sessionID)) {
        return next(createError(400));
    }
    if (utilAPI.isString(callbackURI)) {
        return res.redirect(callbackURI + "?sessionid=" + sessionID);
    }
    res.json({ sessionID: sessionID });
});

router.get("/twitter", authAPI.authenticate());

router.get("/twitter/callback", (req, res, next) => {
    authAPI.authenticate((err, user, _info) => {
        if (err) { return next(err); }
        if (!user) { return next(createError(400)); }

        req.logIn(user, (err) => {
            if (err) { return next(err); }
            if (!utilAPI.isString(user)) { return next(createError(400)); }
            res.send("<script>window.open('','_self').close();</script>");
        });
    })(req, res, next);
});

export default router;
