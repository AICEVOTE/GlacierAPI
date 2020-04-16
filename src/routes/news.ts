import express from "express";
const router = express.Router();

import * as newsAPI from "../api/news";
import createError from "http-errors";

router.get("/articles", (_req, res, _next) => {
    res.json(newsAPI.getAllArticles());
});

router.get("/articles/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        res.json({
            themeID: themeID,
            articles: newsAPI.getRelatedArticles(themeID)
        });
    } catch (e) {
        console.log(e);
        next(createError(404));
    }
});

export default router;
