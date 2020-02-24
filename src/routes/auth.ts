import express from "express";
const router = express.Router();

import * as authAPI from "../api/authapi";
import * as utilAPI from "../api/utilapi";

router.get("/", (_req, res, _next) => {
    res.render("index", {
        title: "/auth/", docs: [
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

router.get("/twitter", authAPI.authenticate());

router.get('/twitter/callback', (req, res, next) => {
    authAPI.authenticate((err, user, _info) => {
        if (err) { return next(err); }
        if (!user) { return res.json({ success: false, sessionID: "" }); }

        req.logIn(user, (err) => {
            if (err) { return next(err); }
            if (!utilAPI.isString(user)) { return res.json({ success: false, sessionID: "" }); }
            res.json({ success: true, sessionID: user });
        });
    })(req, res, next);
});

export default router;
