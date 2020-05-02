import express from "express";
import createError from "http-errors";
import * as userAPI from "../api/user";
import * as utilAPI from "../api/util";
const router = express.Router();


router.get("/profiles", async (req, res, next) => {
    const sessionToken: unknown = req.query.sessiontoken;

    if (!utilAPI.isString(sessionToken)) {
        return next(createError(400));
    }

    try {
        const me = await userAPI.getMe(sessionToken);
        res.json(await userAPI.getProfile(me.userProvider, me.userID));
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.post("/profiles", async (req, res, next) => {
    const query = req.body;
    if (!utilAPI.isArray(query)) {
        next(createError(400));
        return;
    }

    try {
        const users = query.map(
            ({ userProvider, userID }: { userProvider: unknown, userID: unknown }) => {
                if (!utilAPI.isString(userProvider) || !utilAPI.isString(userID)) {
                    throw new Error("Invalid request");
                }
                return { userProvider: userProvider, userID: userID }
            }),
            profiles = (await Promise
                .all(users.map(user => userAPI.getProfile(user.userProvider, user.userID))))
                .filter(<T>(x: T): x is Exclude<T, undefined> => x != undefined);

        res.json(profiles);
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

export default router;
