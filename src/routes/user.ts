import express from "express";
const router = express.Router();

import * as userAPI from "../api/user";
import * as utilAPI from "../api/util";
import createError from "http-errors";

router.get("/profiles", async (req, res, next) => {
    const sessionToken: unknown = req.query.sessiontoken;

    if (!utilAPI.isString(sessionToken)) {
        return next(createError(400));
    }

    try {
        res.json(await userAPI.getMyProfile(sessionToken));
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
        res.json(await userAPI.getProfiles(query.map(
            ({ userProvider, userID }: { userProvider: unknown, userID: unknown }) => {
                if (!utilAPI.isString(userProvider) || !utilAPI.isString(userID)) {
                    throw new Error("Invalid request");
                }
                return { userProvider: userProvider, userID: userID }
            })));
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.get("/:userprovider/:userid", async (req, res, next) => {
    const userProvider = req.params.userprovider;
    const userID = req.params.userid;

    try {
        const profiles = await userAPI.getProfiles([{ userProvider: userProvider, userID: userID }]);
        if (profiles.length == 0) {
            next(createError(404));
        }
        res.json(profiles[0]);
    } catch (e) {
        console.log(e);
        next(createError(503));
    }
});

export default router;
