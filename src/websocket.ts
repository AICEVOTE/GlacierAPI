import SocketIO from "socket.io";

import themeLoader from "./api/theme";
import * as indexAPI from "./api/index";
import * as voteAPI from "./api/vote";
import * as newsAPI from "./api/news";
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
    console.log("connected (ID: " + socketID + ")");

    socket.on("disconnect", (reason: unknown) => {
        console.log("disconnected (ID: " +
            socketID + " REASON: " + reason + ")");
    });

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

    socket.on("get transition", ({ themeID }: { themeID: unknown }) => {
        if (utilAPI.isNumber(themeID) && themeLoader.themes[themeID] != undefined) {
            io.to(socketID).emit("transition", {
                themeID: themeID,
                shortTransition: themeLoader.themes[themeID].shortTransition,
                longTransition: themeLoader.themes[themeID].longTransition
            });
        } else {
            console.log("The themeID is invalid");
        }
    });

    socket.on("get comments", async ({ themeID }: { themeID: unknown }) => {
        try {
            if (utilAPI.isNumber(themeID)) {
                io.to(socketID).emit("comments", {
                    themeID: themeID,
                    comments: await voteAPI.getComments(themeID)
                });
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("get votes", async ({ themeID, sessionToken }: { themeID: unknown, sessionToken: unknown }) => {
        try {
            if (utilAPI.isNumber(themeID)) {
                io.to(socketID).emit("votes", {
                    themeID: themeID,
                    votes: utilAPI.isString(sessionToken) ? await voteAPI.getFriendVotes(themeID, sessionToken) : [],
                    votesFromInfluencer: await voteAPI.getInfluencerVotes(themeID)
                });
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("put vote", async ({ themeID, sessionToken, answer }: { themeID: unknown, sessionToken: unknown, answer: unknown }) => {
        try {
            if (utilAPI.isNumber(themeID) &&
                utilAPI.isString(sessionToken) &&
                utilAPI.isNumber(answer)) {
                await voteAPI.putVote(themeID, sessionToken, answer);
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("post comment", async ({ themeID, sessionToken, message }: { themeID: unknown, sessionToken: unknown, message: unknown }) => {
        try {
            if (utilAPI.isNumber(themeID) &&
                utilAPI.isString(sessionToken) &&
                utilAPI.isString(message)) {
                await voteAPI.postComment(themeID, sessionToken, message);
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("feedback send", async (message: unknown) => {
        try {
            if (utilAPI.isString(message)) {
                await indexAPI.saveFeedback(message, "Feedback");
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("apply send", async (message: unknown) => {
        try {
            if (utilAPI.isString(message)) {
                await indexAPI.saveFeedback(message, "Application");
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
