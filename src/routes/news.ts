import express from "express";
const router = express.Router();

import * as newsAPI from "../api/news";
import createError from "http-errors";

router.get("/", (_req, res, _next) => {
    res.render("index", {
        title: "/news/", docs: [
            {
                uri: "articles",
                description: "Get all articles",
                res: ["latest: Latest articles", "related: Related articles"],
                method: "GET",
                query: ""
            },
            {
                uri: "articles",
                description: "Get articles on a specific theme",
                req: ["themeid: Theme id"],
                res: ["themeid: Theme id", "articles: Articles"],
                method: "GET",
                query: "/0"
            }
        ]
    });
});

router.get("/articles", async (_req, res, _next) => {
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
