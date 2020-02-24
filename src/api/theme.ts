import * as model from "../model";

interface ITransition { timestamp: number, percentage: model.IAnswerType<number> };

class Theme {
    private _realtimeCount: model.IAnswerType<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    private _realtimeResult: model.IAnswerType<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    private _shortTransition: Array<ITransition> = [];
    private _longTransition: Array<ITransition> = [];

    constructor(public readonly id: number, 
        public readonly title: string, 
        public readonly description: string, 
        public readonly choices: model.IAnswerType<string>,
        public readonly keywords: Array<string>, 
        private readonly _formula: (val: number) => number = Theme.defaultFormula) {

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
            let counts: model.IAnswerType<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            let points: model.IAnswerType<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

            for (const doc of docs) {
                counts[doc.answer]++;
                points[doc.answer] += this._formula(now - doc.createdAt);
            }

            const sumOfPoints = points.reduce((prev, cur) => prev + cur);

            this._realtimeCount = counts;
            this._realtimeResult = points.map(point => {
                return (Math.round(point / sumOfPoints * 1000000) / 10000) || 0;
            }) as model.IAnswerType<number>;
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

    private static defaultFormula(val: number) {
        val /= 21600000;
        return (4 * val + 5) / (val ** 2 + 4 * val + 5);
    }
}

const Themes = [
    new Theme(0, "あなたのタイプのOSは何？",
        "一般的なPCにおけるOS（オペレーティングシステム）のうち、" +
        "Windowsが好きな人は「Win」、Macが好きな人は「Mac」、" +
        "Linuxが好きな人は「Lin」に投票してください",
        ["Win", "Mac", "Lin", "", "", "", "", "", "", ""],
        ["Windows", "Mac", "Linux"]),

    new Theme(1, "あなたは死刑制度に、賛成？反対？",
        "現在日本で施行されているような、" +
        "一般的な死刑制度に賛成の人は賛成、反対の人は反対に投票して下さい",
        ["賛成", "反対", "", "", "", "", "", "", "", ""],
        ["死刑"]),

    new Theme(2, "あなたは犬派？、猫派？",
        "日本で一般的に飼われている犬や猫ですが、" +
        "あなたはどちらが好きですか？　" +
        "犬が好きな人は犬派、猫が好きな人は猫派に投票して下さい",
        ["犬派", "猫派", "", "", "", "", "", "", "", ""],
        ["ワンちゃん", "ネコちゃん"]),

    new Theme(3, "日本のカジノ、IR賛成？反対？",
        "現在日本で設置が予定されている公営賭博を目的とした" +
        "カジノについてどう思いますか？" +
        "設置に賛成の人は賛成、反対の人は反対に投票して下さい",
        ["賛成", "反対", "", "", "", "", "", "", "", ""],
        ["カジノ", "IR法案"]),

    new Theme(4, "たけのこの里派？きのこの山派？",
        "お菓子の「たけのこの里」と「きのこの山」どちらが好きですか？" +
        "「たけのこの里」が好きだという人は里、" +
        "「きのこの山」が好きだという人は山に投票してください。",
        ["里", "山", "", "", "", "", "", "", "", ""],
        ["たけのこの里", "きのこの山"]),

    new Theme(5, "タピオカ、好き？嫌い？",
        "あなたはタピオカを好きですか？嫌いですか？　" +
        "好きな人は好き、嫌いな人は嫌いに投票して下さい",
        ["好き", "嫌い", "", "", "", "", "", "", "", ""],
        ["タピオカ"]),

    new Theme(6, "iOS派？Android派？",
        "Apple社のiOSと、Google社のAndroidというスマートフォンの二大OS、" +
        "あなたはどちらが好きですか? " +
        "iOSが好きな人はiOS、Androidが好きな人はAndに投票して下さい",
        ["iOS", "And", "", "", "", "", "", "", "", ""],
        ["iOS", "Android"]),

    new Theme(7, "環境問題どう思う？",
        "人間は自由や利便さといった経済活動を犠牲にしても、" +
        "地球の自然環境保護に努めるべきでしょうか？　" +
        "努めるべきと思う人はYes、そうは思わない人はNoに投票して下さい",
        ["Yes", "No", "", "", "", "", "", "", "", ""],
        ["気候変動"]),

    new Theme(8, "大学入試改革、賛成？反対？",
        "文科省による大学入学者選抜改革と呼ばれる、" +
        "マーク式センター試験から記述重視の共通試験への変更、" +
        "英語民間試験の導入が予定されています。" +
        "この政策について賛成の人は賛成、反対の人は反対に投票して下さい",
        ["賛成", "反対", "", "", "", "", "", "", "", ""],
        ["入試改革"]),

    new Theme(9, "ベーシックインカム、賛成？反対？",
        "政府が全国民に最低限の生活を送るのに必要とされている額の現金を" +
        "定期的に支給するという政策「ベーシックインカム」。" +
        "この政策について賛成の人は賛成、反対の人は反対に投票して下さい",
        ["賛成", "反対", "", "", "", "", "", "", "", ""],
        ["ベーシックインカム", "社会保障"]),

    new Theme(10, "第三次世界大戦、ある？ない？",
        "多国間をまたぐ第二次世界大戦のような戦争が再びあると思う人はある、" +
        "ないと思う人はないに投票して下さい",
        ["ある", "ない", "", "", "", "", "", "", "", ""],
        ["国際関係", "国際連合"])
];

export default Themes
