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
async function getHeadline(pageSize: number = 15): Promise<IArticle[]> {
    const articles: INewsAPIArticle[] = (await newsapi.v2.topHeadlines({
        country: "jp",
        category: "general",
        pageSize: pageSize
    })).articles || [];

    return Array.from(new Set(articles.map(article => convertArticle(article))))
        .sort((a, b) => a.publishedAt - b.publishedAt);
}

// Get all articles about the topic
async function getRelated(keywords: string[]): Promise<IArticle[]> {
    return (await Promise.all(keywords.map(
        async keyword => {
            const articles: INewsAPIArticle[] = (await newsapi.v2.everything({
                q: keyword,
                language: "jp",
                sortBy: "relevancy",
                pageSize: 6 / keywords.length
            })).articles || [];

            return articles.map(article => convertArticle(article));
        }
    )))
        .reduce((prev, cur) => prev.concat(cur))
        .sort((a, b) => a.publishedAt - b.publishedAt);
}

async function getAllNews(): Promise<{ latest: IArticle[]; related: IArticle[][]; }> {
    return {
        latest: await getHeadline(),
        related: await Promise.all(themeLoader.themes.map(
            async theme => await getRelated(theme.keywords)
        ))
    };
}

let articles: { latest: IArticle[], related: IArticle[][] };

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

export function getAllArticles(): { latest: IArticle[]; related: IArticle[][]; } {
    return articles;
}

export function getRelatedArticles(themeID: number): IArticle[] {
    if (themeLoader.themes[themeID] == undefined) {
        throw new Error("Invalid themeID");
    }

    return articles.related[themeID];
}
