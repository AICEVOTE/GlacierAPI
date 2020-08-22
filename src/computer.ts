import * as themeAPI from "./api/theme";
import * as db from "./model";
import { ThemeModel, VoteModel } from "./model";

export interface Transition { timestamp: number, percentage: number[] };

function getMeltingRate(DRClass: number): number {
    switch (DRClass) {
        case 1: return 2400 * 1000;
        case 2: return 7200 * 1000;
        case 3: return 21600 * 1000;
        case 4: return 64800 * 1000;
        case 5: default: return 194400 * 1000;
    }
}

function getResultInterval(DRClass: number): number {
    switch (DRClass) {
        case 1: return 400 * 1000;
        case 2: return 20 * 60 * 1000;
        case 3: return 60 * 60 * 1000;
        case 4: return 3 * 60 * 60 * 1000;
        case 5: default: return 9 * 60 * 60 * 1000;
    }
}

function evalFormula(elapsed: number, meltingRate: number): number {
    const val = elapsed / meltingRate;
    return (4 * val + 5) / (val * val + 4 * val + 5);
}

function calcResult(now: number, meltingRate: number, numOfChoices: number, votes: VoteModel[]): number[] {
    let points = Array<number>(numOfChoices).fill(0);

    votes
        .filter(vote => vote.createdAt <= now
            && (vote.expiredAt === undefined || vote.expiredAt > now))
        .forEach(vote => {
            points[vote.answer] += evalFormula(now - vote.createdAt, meltingRate);
        });

    const sum = points.reduce((pre, cur) => pre + cur);
    return points.map(point => Math.round(point / sum * 1000000) / 10000);
}

function calcTransition(now: number, theme: ThemeModel, votes: VoteModel[]): {
    shortTransition: Transition[];
    longTransition: Transition[];
} {
    const resultInterval = getResultInterval(theme.DRClass),
        meltingRate = getMeltingRate(theme.DRClass),
        numOfChoices = theme.choices.length,
        curVotes = votes.filter(vote => vote.themeID === theme.themeID),
        array60 = [...Array(60).keys()],
        callback = (i: number) => {
            const timestamp = now - i * resultInterval;
            return {
                timestamp, percentage: calcResult(
                    timestamp, meltingRate, numOfChoices, curVotes)
            };
        };

    return {
        shortTransition: array60.map(callback),
        longTransition: array60.map(i => i * 24).map(callback)
    };
}

async function updateAllResults(themes: db.ThemeModel[], votes: db.VoteModel[]): Promise<{
    themeID: number;
    percentage: number[];
}[]> {
    const now = Date.now();
    return themes.map(theme => {
        const meltingRate = getMeltingRate(theme.DRClass),
            curVotes = votes.filter(vote => vote.themeID === theme.themeID),
            numOfChoices = theme.choices.length;

        return {
            themeID: theme.themeID,
            percentage: calcResult(now, meltingRate, numOfChoices, curVotes)
        };
    });
}

async function updateAllTransitions(themes: db.ThemeModel[], votes: db.VoteModel[]): Promise<{
    themeID: number;
    shortTransition: Transition[];
    longTransition: Transition[];
}[]> {
    const now = Date.now();
    return themes.map(theme => ({
        themeID: theme.themeID,
        ...calcTransition(now, theme, votes)
    }));
}

export let results: {
    themeID: number;
    percentage: number[];
}[] = [];

export let transitions: {
    themeID: number;
    shortTransition: Transition[];
    longTransition: Transition[];
}[] = [];

setTimeout(async () => {
    let themes: db.ThemeModel[] = await themeAPI.getAllThemes();
    let votes: db.VoteModel[] = await db.Vote.find({
        themeID: { $in: themes.map(({ themeID }) => themeID) }
    }).exec();
    results = await updateAllResults(themes, votes);
    transitions = await updateAllTransitions(themes, votes);

    setInterval(async () => {
        votes = await db.Vote.find({
            themeID: { $in: themes.map(({ themeID }) => themeID) }
        }).exec()
        results = await updateAllResults(themes, votes);
    }, 3 * 1000);

    setInterval(async () => {
        themes = await themeAPI.getAllThemes();
        transitions = await updateAllTransitions(themes, votes);
    }, 3 * 60 * 1000);
}, 0);
