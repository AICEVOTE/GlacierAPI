import SocketIO from "socket.io";
import { results } from "./computer";
import * as db from "./model";

export function initialize(io: SocketIO.Server) {
    io.origins("*:*");
    setInterval(async () => {
        const startsAt = Date.now() - 2 * 1000;
        const comments = await db.Comment.find({
            createdAt: { $gt: startsAt }
        }).exec();

        io.emit("comments", {
            from: startsAt, comments
        });

        results.forEach(async result => {
            io.emit("result", result);
        });
    }, 3 * 1000);
}
