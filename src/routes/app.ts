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
    const deviceToken = query.deviceToken;
    const users = query.users;
    if (!utilAPI.isString(deviceToken) || !utilAPI.isArray(users)) {
        next(createError(400));
        return;
    }

    try {
        await firebaseAPI.updateListener(deviceToken,
            users.map(({ userProvider, userID }: { userProvider: unknown, userID: unknown }) => {
                if (!utilAPI.isString(userProvider) || !utilAPI.isString(userID)) {
                    throw new Error("Invalid request");
                }
                return { userProvider, userID };
            }))
        res.status(200).send("");
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

export default router;
