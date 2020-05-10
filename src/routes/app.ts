import express from "express";
import createError from "http-errors";
import * as authAPI from "../api/auth";
import * as firebaseAPI from "../api/firebase";
import * as utilAPI from "../api/util";
const router = express.Router();


router.post("/auth", authAPI.appAuth, (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user;

    if (!utilAPI.isString(sessionID)) {
        return next(createError(401));
    }

    res.json({ sessionID });
});

router.post("/receiver", async (req, res, next) => {
    const query = req.body;
    const deviceToken: unknown = query.deviceToken;
    const users: unknown = query.users;
    const themeIDs: unknown = query.themeIDs;
    if (!utilAPI.isString(deviceToken)
        || !utilAPI.isUserlist(users)
        || !utilAPI.isArray(themeIDs)) {
        next(createError(400));
        return;
    }

    await firebaseAPI.updateListener(deviceToken, users, themeIDs);
    res.status(200).send("");
});

export default router;
