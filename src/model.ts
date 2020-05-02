import mongoose from "mongoose";

mongoose.connect(process.env.MONGO_URI || "", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

export interface ThemeModel extends mongoose.Document {
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
};

export interface UserModel extends mongoose.Document {
    name: string,
    userProvider: string,
    userID: string,
    friends: string[],
    imageURI: string,
    numOfFollowers: number
};

export interface SessionModel extends mongoose.Document {
    userProvider: string,
    userID: string,
    accessToken: string,
    refreshToken: string,
    sessionID: string,
    sessionIDExpire: number,
    sessionToken: string,
    sessionTokenExpire: number
};

export interface VoteModel extends mongoose.Document {
    themeID: number,
    answer: number,
    userProvider: string,
    userID: string,
    createdAt: number,
    expiredAt: number
};

export interface CommentModel extends mongoose.Document {
    themeID: number,
    message: string,
    userProvider: string,
    userID: string,
    createdAt: number,
};

export interface ResultModel extends mongoose.Document {
    themeID: number,
    timestamp: number,
    percentage: number[]
};

export interface FeedbackModel extends mongoose.Document {
    message: string,
    feedbackType: string
};

const ThemeSchema = new mongoose.Schema<ThemeModel>({
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
});

const UserSchema = new mongoose.Schema<UserModel>({
    name: String,
    userProvider: String,
    userID: String,
    friends: [String],
    imageURI: String,
    numOfFollowers: Number
});

const SessionSchema = new mongoose.Schema<SessionModel>({
    userProvider: String,
    userID: String,
    accessToken: String,
    refreshToken: String,
    sessionID: String,
    sessionIDExpire: Number,
    sessionToken: String,
    sessionTokenExpire: Number
});

const VoteSchema = new mongoose.Schema<VoteModel>({
    themeID: Number,
    answer: Number,
    userProvider: String,
    userID: String,
    createdAt: Number,
    expiredAt: Number
});

const CommentSchema = new mongoose.Schema<CommentModel>({
    themeID: Number,
    message: String,
    userProvider: String,
    userID: String,
    createdAt: Number,
});

const ResultSchema = new mongoose.Schema<ResultModel>({
    themeID: Number,
    timestamp: Number,
    percentage: [Number]
});

const FeedbackSchema = new mongoose.Schema<FeedbackModel>({
    message: String,
    feedbackType: String
});

export const Theme = mongoose.model<ThemeModel>("Theme", ThemeSchema, "themes");
export const User = mongoose.model<UserModel>("User", UserSchema, "users");
export const Session = mongoose.model<SessionModel>("Session", SessionSchema, "sessions");
export const Vote = mongoose.model<VoteModel>("Vote", VoteSchema, "votes");
export const Comment = mongoose.model<CommentModel>("Comment", CommentSchema, "comments");
export const Result = mongoose.model<ResultModel>("Result", ResultSchema, "results");
export const Feedback = mongoose.model<FeedbackModel>("Feedback", FeedbackSchema, "feedbacks");
