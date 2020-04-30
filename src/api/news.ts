import themeLoader from "./theme";

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
    publishedAt: number
}

function convertArticle(article: INewsAPIArticle): IArticle {
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
        publishedAt: publishedAt
    }
}

// Get japan headline news
async function getTopHeadlines(pageSize: number): Promise<INewsAPIArticle[]> {
    return (await newsapi.v2.topHeadlines({
        country: "jp",
        category: "general",
        pageSize: pageSize
    })).articles || [];
}

// Get all articles about the keyword
async function getEverything(keyword: string, pageSize: number)
    : Promise<INewsAPIArticle[]> {
    return (await newsapi.v2.everything({
        q: keyword,
        language: "jp",
        sortBy: "relevancy",
        pageSize: pageSize
    })).articles || [];
}

async function getAllNews(): Promise<{
    latest: IArticle[];
    related: { themeID: number; articles: IArticle[]; }[];
}> {
    const headlines = (await getTopHeadlines(15))
        .map(article => convertArticle(article))
        .sort((a, b) => a.publishedAt - b.publishedAt);

    const related = await Promise.all(themeLoader.themes.map(
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

    return { latest: headlines, related: related };
}

let articles: {
    latest: IArticle[];
    related: { themeID: number; articles: IArticle[]; }[];
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

export function getAllArticles(): {
    latest: IArticle[];
    related: { themeID: number; articles: IArticle[]; }[];
} {
    return articles;
}

export function getRelatedArticles(themeID: number): IArticle[] {
    if (!themeLoader.exists(themeID)) {
        throw new Error("Invalid themeID");
    }
    return articles.related.find(articles => articles.themeID == themeID)?.articles || [];
}
