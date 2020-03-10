import * as model from "../model";

interface ITransition { timestamp: number, percentage: number[] };

class Theme {
    private _realtimeCount: number[] = [];
    private _realtimeResult: number[] = [];
    private _shortTransition: ITransition[] = [];
    private _longTransition: ITransition[] = [];
    private _lastSave = Date.now();

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

    get realtimeCount() { return this._realtimeCount; }
    get realtimeResult() { return this._realtimeResult; }
    get shortTransition() { return this._shortTransition; }
    get longTransition() { return this._longTransition; }

    private async load(saveResult: boolean) {
        if (saveResult) {
            const lastResult = await model.Result
                .findOne({ themeID: this.themeID })
                .sort({ timestamp: -1 }).exec();

            if (!lastResult) {
                const now = Date.now();
                await this.updateResult(now);
                await this.updateTransition(now, true);
                this._lastSave = now;
                return;
            }

            let now = lastResult.timestamp + this._saveInterval;
            while (now < Date.now()) {
                await this.updateResult(now);
                await this.updateTransition(now, true);
                this._lastSave = now;
                now += this._saveInterval;
            }
        }
        const now = Date.now();
        await this.updateResult(now);
        await this.updateTransition(now, false);
    }

    private async update(saveResult: boolean) {
        if (this._lastSave + this._saveInterval < Date.now()) {
            const now = this._lastSave + this._saveInterval;
            if (saveResult) { await this.updateResult(now); }
            await this.updateTransition(now, saveResult);
            this._lastSave = now;
        }
        await this.updateResult(Date.now());
    }

    private async updateResult(now: number) {
        try {
            const docs = await model.Vote.find({
                themeID: this.themeID,
                createdAt: { $lt: now }
            }).exec();

            let counts = Array<number>(this.choices.length).fill(0);
            let points = Array<number>(this.choices.length).fill(0);

            for (const doc of docs) {
                counts[doc.answer]++;
                points[doc.answer] += this._formula(now - doc.createdAt);
            }

            const sumOfPoints = points.reduce((prev, cur) => prev + cur);

            this._realtimeCount = counts;
            this._realtimeResult = points.map(point =>
                (Math.round(point / sumOfPoints * 1000000) / 10000) || 0
            );
        } catch (e) {
            throw e;
        }
    }

    private async updateTransition(now: number, saveResult: boolean) {
        try {
            if (saveResult) {
                await new model.Result({
                    themeID: this.themeID,
                    timestamp: now,
                    percentage: this._realtimeResult
                }).save();
            }

            const allTransition = (await model.Result.find({
                themeID: this.themeID,
                timestamp: { $lt: now }
            }).sort({ timestamp: -1 }).limit(1440).exec())
                .map((doc) => ({
                    timestamp: doc.timestamp,
                    percentage: doc.percentage
                }));

            this._shortTransition = allTransition.slice(0, Math.min(60, allTransition.length));
            this._longTransition = allTransition.filter((_val, index) => index % 24 == 0);
        } catch (e) {
            throw e;
        }
    }
}

class ThemeLoader {
    private _isLoaded = false;
    private _themes: Theme[] = [];
    constructor() {
        try {
            model.Theme.find().exec().then((themes) => {
                this._themes = themes.map(theme =>
                    new Theme(theme.themeID, theme.title,
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
