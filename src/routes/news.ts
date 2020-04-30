import express from "express";
const router = express.Router();

import themeLoader from "../api/theme";
import * as newsAPI from "../api/news";
import createError from "http-errors";

router.get("/articles", (_req, res, _next) => {
    res.json(newsAPI.articles);
});

router.get("/articles/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    if (!themeLoader.exists(themeID)) {
        console.log("Invalid themeID");
        return next(createError(404));
    }
    const articles = newsAPI
        .articles.related
        .find(articles => articles.themeID == themeID)?.articles || []

    res.json({
        themeID: themeID,
        articles: articles
    });
});

export default router;
