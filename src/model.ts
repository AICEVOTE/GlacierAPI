import mongoose from "mongoose";

mongoose.connect(process.env.DB_URI || "", {
    user: process.env.DB_USER || "",
    pass: process.env.DB_PASSWORD || "",
    useNewUrlParser: true,
    useUnifiedTopology: true
});

interface IThemeModel extends mongoose.Document {
    isEnabled: boolean,
    themeID: number,
    title: string,
    description: string,
    imageURI: string,
    genre: number,
    choices: string[],
    keywords: string[],
    formula: string,
    saveInterval: number
}

interface IUserModel extends mongoose.Document {
    name: string,
    userProvider: string,
    userID: string,
    authInfo: {
        AT: string,
        RT: string
    },
    friends: string[],
    imageURI: string,
    numOfFollowers: number,
    sessionID: string,
    sessionIDExpire: number,
    sessionToken: string,
    sessionTokenExpire: number
}

interface IVoteModel extends mongoose.Document {
    themeID: number,
    answer: number,
    userProvider: string,
    userID: string,
    name: string,
    imageURI: string,
    isInfluencer: boolean,
    createdAt: number
}

interface ICommentModel extends mongoose.Document {
    themeID: number,
    message: string,
    userProvider: string,
    userID: string,
    name: string,
    imageURI: string,
    isInfluencer: boolean
    createdAt: number,
}

interface IResultModel extends mongoose.Document {
    themeID: number,
    timestamp: number,
    percentage: number[]
}

interface IFeedbackModel extends mongoose.Document {
    message: string,
    feedbackType: string
}

const ThemeSchema = new mongoose.Schema<IThemeModel>({
    isEnabled: Boolean,
    themeID: Number,
    title: String,
    description: String,
    imageURI: String,
    genre: Number,
    choices: [String],
    keywords: [String],
    formula: String,
    saveInterval: Number
})

const UserSchema = new mongoose.Schema<IUserModel>({
    name: String,
    userProvider: String,
    userID: String,
    authInfo: {
        AT: String,
        RT: String
    },
    friends: [String],
    imageURI: String,
    numOfFollowers: Number,
    sessionID: String,
    sessionIDExpire: Number,
    sessionToken: String,
    sessionTokenExpire: Number
});

const VoteSchema = new mongoose.Schema<IVoteModel>({
    themeID: Number,
    answer: Number,
    userProvider: String,
    userID: String,
    name: String,
    imageURI: String,
    isInfluencer: Boolean,
    createdAt: Number
});

const CommentSchema = new mongoose.Schema<ICommentModel>({
    themeID: Number,
    message: String,
    userProvider: String,
    userID: String,
    name: String,
    createdAt: Number,
    imageURI: String,
    isInfluencer: Boolean
});

const ResultSchema = new mongoose.Schema<IResultModel>({
    themeID: Number,
    timestamp: Number,
    percentage: [Number]
});

const FeedbackSchema = new mongoose.Schema<IFeedbackModel>({
    message: String,
    feedbackType: String
});

export const Theme = mongoose.model<IThemeModel>("Theme", ThemeSchema, "themes");
export const User = mongoose.model<IUserModel>("User", UserSchema, "users");
export const Vote = mongoose.model<IVoteModel>("Vote", VoteSchema, "votes");
export const Comment = mongoose.model<ICommentModel>("Comment", CommentSchema, "comments");
export const Result = mongoose.model<IResultModel>("Result", ResultSchema, "results");
export const Feedback = mongoose.model<IFeedbackModel>("Feedback", FeedbackSchema, "feedbacks");
