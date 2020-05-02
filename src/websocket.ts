import SocketIO from "socket.io";
import * as db from "./model";
import { themeLoader } from "./theme";

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

        for (const theme of themeLoader.themes) {
            io.emit("result", {
                themeID: theme.themeID,
                results: theme.realtimeResult,
                counts: theme.realtimeCount,
            });
        }
    }, 2 * 1000);
}
