import mongoose from "mongoose";

mongoose.connect(process.env.DB_URI || "", {
    user: process.env.DB_USER || "",
    pass: process.env.DB_PASSWORD || "",
    useNewUrlParser: true,
    useUnifiedTopology: true
});

interface IThemeModel extends mongoose.Document {
    themeID: number,
    title: string,
    description: string,
    imageURI: string,
    genre: number,
    choices: string[],
    keywords: string[],
    formula: string
}

interface IUserModel extends mongoose.Document {
    name: string,
    userID: string,
    userProvider: string,
    authInfo: {
        AT: string,
        RT: string
    },
    friends: string[],
    imageURI: string,
    numOfFollowers: number,
    sessionID: string,
    sessionToken: string,
    sessionTokenExpire: number
}

interface IResultModel extends mongoose.Document {
    themeID: number,
    answer: number,
    userID: string,
    userProvider: string,
    name: string,
    imageURI: string,
    isInfluencer: boolean,
    createdAt: number
}

interface ICommentModel extends mongoose.Document {
    themeID: number,
    message: string,
    name: string,
    createdAt: number,
    imageURI: string,
    isInfluencer: boolean
}

interface ITransitionModel extends mongoose.Document {
    themeID: number,
    timestamp: number,
    percentage: number[]
}

interface IFeedbackModel extends mongoose.Document {
    message: string,
    feedbackType: string
}

const ThemeSchema = new mongoose.Schema<IThemeModel>({
    themeID: Number,
    title: String,
    description: String,
    imageURI: String,
    genre: Number,
    choices: [String],
    keywords: [String],
    formula: String
})

const UserSchema = new mongoose.Schema<IUserModel>({
    name: String,
    userID: String,
    userProvider: String,
    authInfo: {
        AT: String,
        RT: String
    },
    friends: [String],
    imageURI: String,
    numOfFollowers: Number,
    sessionID: String,
    sessionToken: String,
    sessionTokenExpire: Number
});

const ResultSchema = new mongoose.Schema<IResultModel>({
    themeID: Number,
    answer: Number,
    userID: String,
    userProvider: String,
    name: String,
    imageURI: String,
    isInfluencer: Boolean,
    createdAt: Number
});

const CommentSchema = new mongoose.Schema<ICommentModel>({
    themeID: Number,
    message: String,
    name: String,
    createdAt: Number,
    imageURI: String,
    isInfluencer: Boolean
});

const TransitionSchema = new mongoose.Schema<ITransitionModel>({
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
export const Result = mongoose.model<IResultModel>("Result", ResultSchema, "results");
export const Comment = mongoose.model<ICommentModel>("Comment", CommentSchema, "comments");
export const Transition = mongoose.model<ITransitionModel>("Transition", TransitionSchema, "transitions");
export const Feedback = mongoose.model<IFeedbackModel>("Feedback", FeedbackSchema, "feedbacks");
