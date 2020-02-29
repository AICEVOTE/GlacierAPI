import SocketIO from "socket.io";

import themeLoader from "./api/theme";
import * as voteAPI from "./api/voteapi";
import * as newsAPI from "./api/newsapi";
import * as utilAPI from "./api/utilapi";

export function initialize(io: SocketIO.Server) {
    io.origins("*:*");
    setInterval(() => {
        for (let i = 0; i < themeLoader.themes.length; i++) {
            try {
                io.emit("result", voteAPI.getResult(i));
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
        try {
            if (utilAPI.isNumber(id)) {
                io.to(socketID).emit("result", voteAPI.getResult(id));
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("get transition", (req: { id: unknown }) => {
        try {
            if (utilAPI.isNumber(req.id)) {
                io.to(socketID).emit("transition",
                    voteAPI.getTransition(req.id));
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("get comments", async (req: { id: unknown }) => {
        try {
            if (utilAPI.isNumber(req.id)) {
                io.to(socketID).emit("comments",
                    await voteAPI.getComments(req.id));
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("get votes", async (req: { id: unknown, sessionID: unknown }) => {
        try {
            if (utilAPI.isNumber(req.id) &&
                utilAPI.isString(req.sessionID)) {
                io.to(socketID).emit("votes",
                    await voteAPI.getVotes(req.id, req.sessionID));
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("put vote", async (req: { id: unknown, sessionID: unknown, answer: unknown }) => {
        try {
            if (utilAPI.isNumber(req.id) &&
                utilAPI.isString(req.sessionID) &&
                utilAPI.isNumber(req.answer)) {
                await voteAPI.putVote(req.id, req.sessionID, req.answer);
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on("post comment", async (req: { id: unknown, sessionID: unknown, message: unknown }) => {
        try {
            if (utilAPI.isNumber(req.id) &&
                utilAPI.isString(req.sessionID) &&
                utilAPI.isString(req.message)) {
                await voteAPI.postComment(req.id, req.sessionID, req.message);
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
