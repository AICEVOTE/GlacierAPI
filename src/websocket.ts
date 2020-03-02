import SocketIO from "socket.io";

import themeLoader from "./api/theme";
import * as voteAPI from "./api/vote";
import * as newsAPI from "./api/news";
import * as utilAPI from "./api/util";

export function initialize(io: SocketIO.Server) {
    io.origins("*:*");
    setInterval(() => {
        for (let i = 0; i < themeLoader.themes.length; i++) {
            try {
                io.emit("result", {
                    id: i,
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
    console.log("connected (ID: " + socketID + ")");

    socket.on("disconnect", (reason: unknown) => {
        console.log("disconnected (ID: " +
            socketID + " REASON: " + reason + ")");
    });

    socket.on("get result", ({ id }: { id: unknown }) => {
        if (utilAPI.isNumber(id) && themeLoader.themes[id] != undefined) {
            io.to(socketID).emit("result", {
                id: id,
                results: themeLoader.themes[id].realtimeResult,
                counts: themeLoader.themes[id].realtimeCount
            });
        } else {
            console.log("The id is invalid");
        }
    });

    socket.on("get transition", ({ id }: { id: unknown }) => {
        if (utilAPI.isNumber(id) && themeLoader.themes[id] != undefined) {
            io.to(socketID).emit("transition", {
                id: id,
                shortTransition: themeLoader.themes[id].shortTransition,
                longTransition: themeLoader.themes[id].longTransition
            });
        } else {
            console.log("The id is invalid");
        }
    });

    socket.on("get comments", async ({ id }: { id: unknown }) => {
        try {
            if (utilAPI.isNumber(id)) {
                io.to(socketID).emit("comments", {
                    id: id,
                    comments: await voteAPI.getComments(id)
                });
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("get votes", async ({ id, sessionID }: { id: unknown, sessionID: unknown }) => {
        try {
            if (utilAPI.isNumber(id)) {
                io.to(socketID).emit("votes", {
                    id: id,
                    votes: utilAPI.isString(sessionID) ? await voteAPI.getFriendVotes(id, sessionID) : [],
                    votesFromInfluencer: await voteAPI.getInfluencerVotes(id)
                });
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("put vote", async ({ id, sessionID, answer }: { id: unknown, sessionID: unknown, answer: unknown }) => {
        try {
            if (utilAPI.isNumber(id) &&
                utilAPI.isString(sessionID) &&
                utilAPI.isNumber(answer)) {
                await voteAPI.putVote(id, sessionID, answer);
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("post comment", async ({ id, sessionID, message }: { id: unknown, sessionID: unknown, message: unknown }) => {
        try {
            if (utilAPI.isNumber(id) &&
                utilAPI.isString(sessionID) &&
                utilAPI.isString(message)) {
                await voteAPI.postComment(id, sessionID, message);
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("feedback send", async (message: unknown) => {
        try {
            if (utilAPI.isString(message)) {
                await utilAPI.saveFeedback(message, "Feedback");
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("apply send", async (message: unknown) => {
        try {
            if (utilAPI.isString(message)) {
                await utilAPI.saveFeedback(message, "Application");
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("get news", () => {
        try {
            io.to(socketID).emit("news", newsAPI.getAllArticles());
        } catch (e) {
            console.log(e);
        }
    });
}
