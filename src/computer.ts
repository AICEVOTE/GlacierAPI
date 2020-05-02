import * as themeAPI from "./api/theme";
import * as voteAPI from "./api/vote";
import { ThemeModel, VoteModel } from "./model";

interface Transition { timestamp: number, percentage: number[] };

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

function calcResult(now: number, theme: ThemeModel, votes: VoteModel[]): number[] {
    const meltingRate = getMeltingRate(theme.DRClass);
    let points = Array<number>(theme.choices.length).fill(0);

    for (const vote of votes) {
        if (vote.themeID == theme.themeID
            && vote.createdAt <= now
            && (vote.expiredAt == 0 || vote.expiredAt > now)) {
            points[vote.answer] += evalFormula(now - vote.createdAt, meltingRate);
        }
    }

    const sum = points.reduce((pre, cur) => pre + cur);
    return points.map(point => (Math.round(point / sum * 1000000) / 10000) || 0);
}

function calcTransition(now: number, theme: ThemeModel, votes: VoteModel[]): {
    shortTransition: Transition[];
    longTransition: Transition[];
} {
    const resultInterval = getResultInterval(theme.DRClass);
    let shortTransition: Transition[] = [],
        longTransition: Transition[] = [];

    for (let i = 0; i < 60; i++) {
        let timestamp = now - i * resultInterval;
        let result = calcResult(timestamp, theme, votes);
        shortTransition.push({ timestamp, percentage: result });

        timestamp = now - i * resultInterval * 24;
        result = calcResult(timestamp, theme, votes);
        longTransition.push({ timestamp, percentage: result });
    }

    return { shortTransition, longTransition };
}

async function updateAllTransitions(): Promise<{
    themeID: number;
    shortTransition: Transition[];
    longTransition: Transition[];
}[]> {
    const now = Date.now();
    const votes = await voteAPI.getVotes();
    const themes = await themeAPI.getAllThemes();
    return themes.map(theme => {
        const transition = calcTransition(now, theme, votes);
        return {
            themeID: theme.themeID,
            shortTransition: transition.shortTransition,
            longTransition: transition.longTransition
        };
    });
}

export let transitions: {
    themeID: number;
    shortTransition: Transition[];
    longTransition: Transition[];
}[];

setInterval(async () => {
    try {
        transitions = await updateAllTransitions();
    } catch (e) {
        console.log(e);
    }
}, 2 * 1000);
