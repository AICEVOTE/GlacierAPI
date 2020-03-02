import * as model from "../model";

interface ITransition { timestamp: number, percentage: number[] };

class Theme {
    private _realtimeCount: number[] = [];
    private _realtimeResult: number[] = [];
    private _shortTransition: ITransition[] = [];
    private _longTransition: ITransition[] = [];

    constructor(public readonly id: number,
        public readonly title: string,
        public readonly description: string,
        public readonly choices: string[],
        public readonly keywords: string[],
        private readonly _formula: (val: number) => number) {

        setInterval(() => this.updateResult(), 2 * 1000);
        setInterval(() => this.updateTransition(), 60 * 60 * 1000);
        this.updateResult().then(() => { this.updateTransition(); });
    }

    get realtimeCount() { return this._realtimeCount; }
    get realtimeResult() { return this._realtimeResult; }
    get shortTransition() { return this._shortTransition; }
    get longTransition() { return this._longTransition; }

    private async updateResult() {
        try {
            const docs = await model.Result.find({ id: this.id }).exec();

            const now = Date.now();
            let counts = Array<number>(this.choices.length).fill(0);
            let points = Array<number>(this.choices.length).fill(0);

            for (const doc of docs) {
                counts[doc.answer]++;
                points[doc.answer] += this._formula(now - doc.createdAt);
            }

            const sumOfPoints = points.reduce((prev, cur) => prev + cur);

            this._realtimeCount = counts;
            this._realtimeResult = points.map(point => {
                return (Math.round(point / sumOfPoints * 1000000) / 10000) || 0;
            });
        } catch (e) {
            throw e;
        }
    }

    private async updateTransition() {
        try {
            await new model.Transition({
                id: this.id,
                timestamp: Date.now(),
                percentage: this._realtimeResult
            }).save();

            const allTransition = (await model.Transition.find({ id: this.id }).
                sort({ timestamp: -1 }).limit(1440).exec()).
                map((doc) => {
                    return {
                        timestamp: doc.timestamp,
                        percentage: doc.percentage
                    }
                });

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
                this._themes = themes.map(theme => {
                    return new Theme(theme.id, theme.title, theme.description,
                        theme.choices, theme.keywords, eval(theme.formula));
                });
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
