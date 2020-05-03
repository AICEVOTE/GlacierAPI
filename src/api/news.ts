import * as themeAPI from "./theme";

const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(process.env.NEWSAPI_KEY || "");

interface NewsAPArticle {
    source?: { id?: string, name?: string; },
    author?: string,
    title?: string,
    description?: string,
    url?: string,
    urlToImage?: string,
    publishedAt?: string,
    content?: string
}
interface Article {
    source: string,
    author: string,
    title: string,
    description: string,
    uri: string,
    uriToImage: string,
    publishedAt: number
}

function convertArticle(article: NewsAPArticle): Article {
    let publishedAt = NaN;
    if (article.publishedAt) {
        publishedAt = Date.parse(article.publishedAt);
    }

    return {
        source: article.source?.name || "",
        author: article.author || "",
        title: article.title || "",
        description: article.description || "",
        uri: article.url || "",
        uriToImage: article.urlToImage || "",
        publishedAt
    }
}

// Get japan headline news
async function getTopHeadlines(pageSize: number): Promise<NewsAPArticle[]> {
    return (await newsapi.v2.topHeadlines({
        country: "jp",
        category: "general",
        pageSize
    })).articles || [];
}

// Get all articles about the keyword
async function getEverything(keyword: string, pageSize: number): Promise<NewsAPArticle[]> {
    return (await newsapi.v2.everything({
        q: keyword,
        language: "jp",
        sortBy: "relevancy",
        pageSize
    })).articles || [];
}

async function getAllNews(): Promise<{
    latest: Article[];
    related: {
        themeID: number;
        articles: Article[];
    }[];
}> {
    const headlines = (await getTopHeadlines(15))
        .map(article => convertArticle(article))
        .sort((a, b) => a.publishedAt - b.publishedAt);

    const themes = await themeAPI.getAllThemes();
    const related = await Promise.all(themes.map(
        async theme => ({
            themeID: theme.themeID,
            articles: (await Promise.all(theme.keywords.map(
                keyword => getEverything(keyword, 6 / theme.keywords.length)
            )))
                .reduce((prev, cur) => prev.concat(cur))
                .map(article => convertArticle(article))
                .sort((a, b) => a.publishedAt - b.publishedAt)
        })
    ));

    return { latest: headlines, related };
}

export let articles: {
    latest: Article[];
    related: {
        themeID: number;
        articles: Article[];
    }[];
};

getAllNews()
    .then(_articles => articles = _articles)
    .catch(e => console.log(e));

setInterval(async () => {
    try {
        articles = await getAllNews();
    } catch (e) {
        console.log(e);
    }
}, 8 * 60 * 60 * 1000);
