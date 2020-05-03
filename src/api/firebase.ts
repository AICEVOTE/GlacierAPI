import * as admin from "firebase-admin";
import * as db from "../model";
import * as userAPI from "./user";

admin.initializeApp({
    credential: admin.credential.cert(process.env.FIREBASE_CERT || ""),
    databaseURL: process.env.FIREBASE_DB || ""
});

export async function updateListener(deviceToken: string, users: {
    userProvider: string;
    userID: string;
}[]): Promise<void> {
    await db.FCMListener.updateOne({ deviceToken }, {
        $set: { users }
    }, { upsert: true });
}

export async function sendNotification(userProvider: string, userID: string, message: string): Promise<void> {
    const user = await userAPI.getProfile(userProvider, userID);
    if (!user) { throw new Error("User not found"); }

    const listeners = await db.FCMListener.find({
        users: { $elemMatch: { userProvider, userID } }
    }).exec();

    const tokens = listeners.map(listener => listener.deviceToken);
    if (tokens.length == 0) { return; }

    await admin.messaging().sendMulticast({
        notification: {
            title: `@${user.name} commented`,
            body: message
        }, tokens
    });
}
