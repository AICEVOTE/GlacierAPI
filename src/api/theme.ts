import * as model from "../model";

interface ITransition { timestamp: number, percentage: number[] };

class Theme {
    private _counts: number[] = [];
    private _results: number[] = [];
    private _shortTransition: ITransition[] = [];
    private _longTransition: ITransition[] = [];
    private _lastTransitionUpdate = Date.now();

    constructor(public readonly themeID: number,
        public readonly title: string,
        public readonly description: string,
        public readonly imageURI: string,
        public readonly genre: number,
        public readonly choices: string[],
        public readonly keywords: string[],
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

    private async interpolate() {
        const lastResult = await model.Result
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

    private async load(isMaster: boolean) {
        const now = Date.now();
        if (isMaster) { await this.interpolate(); }

        const newResult = await this.updateResult(now);
        this._results = newResult.results;
        this._counts = newResult.counts;

        const newTransition = await this.updateTransition(now);
        this._shortTransition = newTransition.shortTransition;
        this._longTransition = newTransition.longTransition;
    }

    private async update(isMaster: boolean) {
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

    private async updateResult(now: number) {
        const docs = await model.Vote.find({
            themeID: this.themeID,
            createdAt: { $lte: now },
            expiredAt: { $exists: false }
        }).exec();

        let counts = Array<number>(this.choices.length).fill(0);
        let points = Array<number>(this.choices.length).fill(0);

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

    private async saveResult(now: number) {
        await new model.Result({
            themeID: this.themeID,
            timestamp: now,
            percentage: (await this.updateResult(now)).results
        }).save();
    }

    private async updateTransition(now: number) {
        const docs = (await model.Result.find({
            themeID: this.themeID,
            timestamp: { $lte: now }
        }).sort({ timestamp: -1 }).limit(1440).exec())
            .map((doc) => ({
                timestamp: doc.timestamp,
                percentage: doc.percentage
            }));

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
            model.Theme.find().exec().then((themes) => {
                this._themes = themes.filter((theme) => theme.isEnabled)
                    .map(theme => new Theme(theme.themeID, theme.title,
                        theme.description, theme.imageURI, theme.genre,
                        theme.choices, theme.keywords,
                        eval(theme.formula), theme.saveInterval)
                    );
            })
        } catch (e) {
            console.log(e);
        }
        this._isLoaded = true;
    }
    get themes() {
        if (!this._isLoaded) {
            console.log("Themes are not loaded");
            return null as any as Theme[];
        }
        return this._themes;
    }
}

const themeLoader = new ThemeLoader();

export default themeLoader
