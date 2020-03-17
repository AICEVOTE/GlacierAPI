import SocketIO from "socket.io";

import themeLoader from "./api/theme";
import * as utilAPI from "./api/util";

export function initialize(io: SocketIO.Server) {
    io.origins("*:*");
    setInterval(() => {
        for (let i = 0; i < themeLoader.themes.length; i++) {
            try {
                io.emit("result", {
                    themeID: i,
                    results: themeLoader.themes[i].realtimeResult,
                    counts: themeLoader.themes[i].realtimeCount,
                });
            } catch (e) {
                console.log(e);
            }
        }
    }, 2 * 1000);
}

export function onConnection(io: SocketIO.Server, socket: SocketIO.Socket) {
    const socketID = socket.id;
    socket.on("get result", ({ themeID }: { themeID: unknown }) => {
        if (utilAPI.isNumber(themeID) && themeLoader.themes[themeID] != undefined) {
            io.to(socketID).emit("result", {
                themeID: themeID,
                results: themeLoader.themes[themeID].realtimeResult,
                counts: themeLoader.themes[themeID].realtimeCount
            });
        } else {
            console.log("The themeID is invalid");
        }
    });
}
