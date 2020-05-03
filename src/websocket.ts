import SocketIO from "socket.io";
import * as voteAPI from "./api/vote";
import { transitions } from "./computer";
import * as db from "./model";

export function initialize(io: SocketIO.Server) {
    io.origins("*:*");
    setInterval(async () => {
        try {
            const startsAt = Date.now() - 2 * 1000;
            const comments = await db.Comment.find({
                createdAt: { $gt: startsAt }
            }).exec();

            io.emit("comments", {
                from: startsAt, comments
            });
        } catch (e) {
            console.log(e);
        }

        transitions.forEach(async transition => {
            io.emit("result", {
                themeID: transition.themeID,
                results: transition.shortTransition[0].percentage,
                counts: await voteAPI.getVoteCounts(transition.themeID),
            });
        });
    }, 2 * 1000);
}
