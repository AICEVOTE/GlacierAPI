import { v4 as uuidv4 } from "uuid";
import * as db from "../model";
import type { SessionModel } from "../model";

const oneHour = 60 * 60 * 1000;
const oneDay = oneHour * 24;
const oneMonth = oneDay * 31;

export interface Profile {
    userProvider: string, userID: string,
    name: string, friends: string[],
    imageURI: string, numOfFollowers: number
};

export async function getMySession(sessionToken: string): Promise<SessionModel> {
    const session = await db.Session.findOne({ sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionID"); }
    return session;
}

export async function getSessionToken(sessionID: string): Promise<string> {
    const session = await db.Session.findOne({ sessionID }).exec();
    if (!session) { throw new Error("Invalid sessionID"); }

    return session.sessionToken;
}

export async function createSession(profile: Profile): Promise<string> {
    const sessionID = uuidv4();
    const now = Date.now();

    await db.User.updateOne({
        userProvider: profile.userProvider,
        userID: profile.userID
    }, {
        $set: {
            name: profile.name,
            friends: profile.friends,
            imageURI: profile.imageURI,
            numOfFollowers: profile.numOfFollowers
        }
    }, { upsert: true });

    await new db.Session({
        userProvider: profile.userProvider,
        userID: profile.userID,
        sessionID,
        sessionIDExpire: now + oneMonth,
        sessionToken: uuidv4(),
        sessionTokenExpire: now + oneHour
    }).save();

    return sessionID;
}

setInterval(async () => {
    // Refresh session token
    const expiredSessions = await db.Session.find({
        sessionTokenExpire: { $lt: Date.now() }
    }), now = Date.now();

    expiredSessions.forEach(async ({ sessionID }) => {
        await db.Session.updateOne({ sessionID }, {
            $set: {
                sessionToken: uuidv4(),
                sessionTokenExpire: now + oneHour
            }
        });
    });

    // Delete expired session
    await db.Session.deleteMany({ sessionIDExpire: { $lt: Date.now() } });
}, oneHour);
