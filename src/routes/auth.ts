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

router.get("/twitter/callback", passport.authenticate("twitter"), (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user;

    if (!utilAPI.isString(sessionID)) {
        return next(createError(400));
    }
    res.send("<script>window.open('','_self').close();</script>");
});

export default router;
