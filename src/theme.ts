import * as db from "./model";

interface Transition { timestamp: number, percentage: number[] };

class Theme {
    private _counts: number[] = [];
    private _results: number[] = [];
    private _shortTransition: Transition[] = [];
    private _longTransition: Transition[] = [];
    private _lastTransitionUpdate = Date.now();

    constructor(readonly themeID: number,
        private readonly numberOfChoices: number,
        private readonly _formula: (val: number) => number,
        private readonly _saveInterval: number) {
        this.load(process.env.ROLE == "MASTER").then(() => {
            setInterval(() => { this.update(process.env.ROLE == "MASTER"); }, 2000);
        })
    }

    get realtimeCount() { return this._counts; }
    get realtimeResult() { return this._results; }
    get shortTransition() { return this._shortTransition; }
    get longTransition() { return this._longTransition; }

    private async interpolate(): Promise<void> {
        const lastResult = await db.Result
            .findOne({ themeID: this.themeID })
            .sort({ timestamp: -1 }).exec();

        if (!lastResult) {
            const now = Date.now();
            await this.saveResult(now);
            this._lastTransitionUpdate = now;
            return;
        }

        for (let now = lastResult.timestamp + this._saveInterval;
            now < Date.now(); now += this._saveInterval) {
            await this.saveResult(now);
            this._lastTransitionUpdate = now;
        }
    }

    private async load(isMaster: boolean): Promise<void> {
        const now = Date.now();
        if (isMaster) { await this.interpolate(); }

        const newResult = await this.updateResult(now);
        this._results = newResult.results;
        this._counts = newResult.counts;

        const newTransition = await this.updateTransition(now);
        this._shortTransition = newTransition.shortTransition;
        this._longTransition = newTransition.longTransition;
    }

    private async update(isMaster: boolean): Promise<void> {
        const newResult = await this.updateResult(Date.now());
        this._results = newResult.results;
        this._counts = newResult.counts;

        const now = this._lastTransitionUpdate + this._saveInterval;
        if (now < Date.now()) {
            if (isMaster) { await this.saveResult(now); }

            const newTransition = await this.updateTransition(now);
            this._shortTransition = newTransition.shortTransition;
            this._longTransition = newTransition.longTransition;
            this._lastTransitionUpdate = now;
        }
    }

    private async updateResult(now: number): Promise<{
        counts: number[];
        results: number[];
    }> {
        const docs = await db.Vote.find({
            themeID: this.themeID,
            createdAt: { $lte: now },
            expiredAt: { $exists: false }
        }).exec();

        let counts = Array<number>(this.numberOfChoices).fill(0);
        let points = Array<number>(this.numberOfChoices).fill(0);

        for (const doc of docs) {
            counts[doc.answer]++;
            points[doc.answer] += this._formula(now - doc.createdAt);
        }

        const sumOfPoints = points.reduce((prev, cur) => prev + cur);

        return {
            counts: counts,
            results: points.map(point =>
                (Math.round(point / sumOfPoints * 1000000) / 10000) || 0)
        };
    }

    private async saveResult(now: number): Promise<void> {
        await new db.Result({
            themeID: this.themeID,
            timestamp: now,
            percentage: (await this.updateResult(now)).results
        }).save();
    }

    private async updateTransition(now: number): Promise<{
        shortTransition: Transition[],
        longTransition: Transition[]
    }> {
        const docs = await db.Result.find({
            themeID: this.themeID,
            timestamp: { $lte: now }
        }).sort({ timestamp: -1 }).limit(1440).exec();

        return {
            shortTransition: docs.slice(0, Math.min(60, docs.length)),
            longTransition: docs.filter((_val, index) => index % 24 == 0)
        };
    }
}

class ThemeLoader {
    private _isLoaded = false;
    private _themes: Theme[] = [];
    constructor() {
        try {
            db.Theme.find().exec().then(themes => {
                this._themes = themes
                    .filter(theme => theme.isEnabled)
                    .map(theme =>
                        new Theme(theme.themeID, theme.choices.length,
                            eval(theme.formula), theme.saveInterval)
                    );
            })
        } catch (e) {
            console.log(e);
        }
        this._isLoaded = true;
    }
    get themes(): Theme[] {
        if (!this._isLoaded) { throw new Error("themes aren't loaded"); }
        return this._themes;
    }
    theme(themeID: number): Theme {
        if (!this._isLoaded) { throw new Error("themes aren't loaded"); }

        const theme = this._themes.find(theme => theme.themeID == themeID);
        if (theme == undefined) { throw new Error("Invalid themeID"); }
        return theme;
    }
}

export type { Theme };
export const themeLoader = new ThemeLoader();
