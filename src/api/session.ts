import { v4 as uuidv4 } from "uuid";
import * as model from "../model";

const oneHour = 60 * 60 * 1000;
const oneDay = oneHour * 24;
const oneMonth = oneDay * 31;

interface Profile {
    name: string,
    userProvider: string,
    userID: string,
    friends: string[],
    imageURI: string,
    numOfFollowers: number
}

export async function getSessionToken(sessionID: string): Promise<string> {
    const session = await model.Session.findOne({ sessionID: sessionID }).exec();
    if (!session) { throw new Error("Invalid sessionID"); }

    return session.sessionToken;
}

export async function saveSession(profile: Profile, accessToken: string, refreshToken: string, sessionID: string) {
    const now = Date.now();

    await model.User.updateOne({ userID: profile.userID, userProvider: profile.userProvider }, {
        $set: {
            name: profile.name,
            friends: profile.friends,
            imageURI: profile.imageURI,
            numOfFollowers: profile.numOfFollowers
        }
    }, { upsert: true });

    await new model.Session({
        userProvider: profile.userProvider,
        userID: profile.userID,
        accessToken: accessToken,
        refreshToken: refreshToken,
        sessionID: sessionID,
        sessionIDExpire: now + oneMonth,
        sessionToken: uuidv4(),
        sessionTokenExpire: now + oneHour
    }).save();
}

if (process.env.ROLE == "MASTER") {
    setInterval(async () => {
        try {
            // Refresh session token
            const expiredSessions = await model.Session.find({
                sessionTokenExpire: { $lt: Date.now() }
            }), now = Date.now();

            for (const session of expiredSessions) {
                await model.Session.update({
                    sessionID: session.sessionID
                }, {
                    $set: {
                        sessionToken: uuidv4(),
                        sessionTokenExpire: now + oneHour
                    }
                });
            }

            // Delete expired session
            await model.Session.deleteMany({ sessionIDExpire: { $lt: Date.now() } });
        } catch (e) {
            console.log(e);
        }
    }, oneHour);
}
