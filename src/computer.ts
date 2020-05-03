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
    return (4.0 * val + 5.0) / (val * val + 4.0 * val + 5.0);
}

function calcResult(now: number, meltingRate: number, numOfChoices: number, votes: VoteModel[]): number[] {
    let points = Array<number>(numOfChoices).fill(0);

    votes
        .filter(vote => vote.createdAt <= now
            && (vote.expiredAt == undefined || vote.expiredAt > now))
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
        curVotes = votes.filter(vote => vote.themeID == theme.themeID);
    let shortTransition: Transition[] = [],
        longTransition: Transition[] = [];

    for (let i = 0; i < 60; i++) {
        let timestamp = now - i * resultInterval;
        let result = calcResult(timestamp, meltingRate, numOfChoices, curVotes);
        shortTransition.push({ timestamp, percentage: result });

        timestamp = now - i * resultInterval * 24;
        result = calcResult(timestamp, meltingRate, numOfChoices, curVotes);
        longTransition.push({ timestamp, percentage: result });
    }

    return { shortTransition, longTransition };
}

async function updateAllResults(): Promise<{
    themeID: number;
    result: number[];
}[]> {
    const now = Date.now();
    const themes = await themeAPI.getAllThemes();
    const votes = await db.Vote.find({
        themeID: { $in: themes.map(({ themeID }) => themeID) },
        expiredAt: { $exists: false }
    }).exec();

    return themes.map(theme => {
        const meltingRate = getMeltingRate(theme.DRClass),
            curVotes = votes.filter(vote => vote.themeID == theme.themeID),
            numOfChoices = theme.choices.length;

        return {
            themeID: theme.themeID,
            result: calcResult(now, meltingRate, numOfChoices, curVotes)
        };
    });
}

async function updateAllTransitions(): Promise<{
    themeID: number;
    shortTransition: Transition[];
    longTransition: Transition[];
}[]> {
    const now = Date.now();
    const themes = await themeAPI.getAllThemes();
    const votes = await db.Vote.find({
        themeID: { $in: themes.map(({ themeID }) => themeID) }
    }).exec();

    return themes.map(theme => ({
        themeID: theme.themeID,
        ...calcTransition(now, theme, votes)
    }));
}

export let results: {
    themeID: number;
    result: number[];
}[] = [];

export let transitions: {
    themeID: number;
    shortTransition: Transition[];
    longTransition: Transition[];
}[] = [];

updateAllResults()
    .then(_results => results = _results);

updateAllTransitions()
    .then(_transitions => transitions = _transitions);

setInterval(async () => {
    results = await updateAllResults();
}, 3 * 1000);

setInterval(async () => {
    transitions = await updateAllTransitions();
}, 120 * 1000);
