import themeLoader from "./theme";
import * as utilAPI from "./util";

const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(process.env.NEWSAPI_KEY || "");

interface INewsAPIArticle {
    source?: { id?: string, name?: string; },
    author?: string,
    title?: string,
    description?: string,
    url?: string,
    urlToImage?: string,
    publishedAt?: string,
    content?: string
}
interface IArticle {
    source: string,
    author: string,
    title: string,
    description: string,
    uri: string,
    uriToImage: string,
    publishedAt: string
}

function convertArticle(article: INewsAPIArticle): IArticle {
    return {
        source: article.source?.name || "",
        author: article.author || "",
        title: article.title || "",
        description: article.description || "",
        uri: article.url || "",
        uriToImage: article.urlToImage || "",
        publishedAt: article.publishedAt || ""
    }
}

async function getEverything(query: string, pageSize: number = 6) {
    try {
        const articles: INewsAPIArticle[] = (await newsapi.v2.everything({
            q: query,
            language: "jp",
            sortBy: "relevancy",
            pageSize: pageSize
        })).articles || [];

        return articles.map((article) => {
            return convertArticle(article);
        });
    } catch (e) {
        throw e;
    }
}

async function getHeadline(pageSize: number = 15) {
    try {
        const articles: INewsAPIArticle[] = (await newsapi.v2.topHeadlines({
            country: "jp",
            category: "general",
            pageSize: pageSize
        })).articles || [];

        return Array.from(new Set(articles.map((article) => {
            return convertArticle(article);
        })));
    } catch (e) {
        throw e;
    }
}

async function updateAll() {
    return {
        latest: await getHeadline(),
        related: await Promise.all(themeLoader.themes.map(async (Theme) => {
            return (await Promise.all(Theme.keywords.map(async (keyword) => {
                return await getEverything(keyword, 6 / Theme.keywords.length);
            }))).reduce((prev, cur) => prev.concat(cur));
        }))
    };
}

let articles: { latest: IArticle[], related: IArticle[][] };

updateAll().then((_articles) => { articles = _articles; });
setInterval(async () => {
    articles = await updateAll();
}, 8 * 60 * 60 * 1000);

export function getAllArticles() {
    return articles;
}

export function getRelatedArticles(id: number) {
    if (themeLoader.themes[id] == undefined) {
        throw new utilAPI.GlacierAPIError("The id is invalid");
    }

    return {
        id: id,
        articles: articles.related[id]
    };
}
