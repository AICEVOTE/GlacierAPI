import express from "express";
import createError from "http-errors";
import * as feedbackAPI from "../api/feedback";
import * as newsAPI from "../api/news";
import * as utilAPI from "../api/util";
const router = express.Router();


/* GET home page. */
router.get("/", function (_req, res, _next) {
    res.render("index", { title: "Glacier API" });
});

router.get("/articles", (_req, res, _next) => {
    res.json(newsAPI.articles);
});

router.post("/feedback", async (req, res, next) => {
    const message: unknown = req.query.message;
    if (!utilAPI.isString(message)) {
        return next(createError(400));
    }

    res.status(201).json({
        message: await feedbackAPI.saveFeedback(message, "Feedback")
    });
});

router.post("/application", async (req, res, next) => {
    const message: unknown = req.query.message;
    if (!utilAPI.isString(message)) {
        return next(createError(400));
    }

    res.status(201).json({
        message: await feedbackAPI.saveFeedback(message, "Application")
    });
});

router.get("/418", (_req, _res, next) => {
    next(createError(418));
});

export default router;
