import mongoose from "mongoose";

mongoose.connect(process.env.URI_DB || "", { useNewUrlParser: true, useUnifiedTopology: true });

export type IAnswerType<T> = [T, T, T, T, T, T, T, T, T, T];

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
    sessionExpire: number
}

interface IResultModel extends mongoose.Document {
    id: number,
    answer: number,
    userID: string,
    name: string,
    imageURI: string,
    isInfluencer: boolean,
    createdAt: number
}

interface ICommentModel extends mongoose.Document {
    id: number,
    message: string,
    name: string,
    createdAt: number,
    imageURI: string,
    isInfluencer: boolean
}

interface ITransitionModel extends mongoose.Document {
    id: number,
    timestamp: number,
    percentage: IAnswerType<number>
}

interface IFeedbackModel extends mongoose.Document {
    message: string,
    feedbackType: string
}

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
    sessionExpire: Number
});

const ResultSchema = new mongoose.Schema<IResultModel>({
    id: Number,
    answer: Number,
    userID: String,
    name: String,
    imageURI: String,
    isInfluencer: Boolean,
    createdAt: Number
});

const CommentSchema = new mongoose.Schema<ICommentModel>({
    id: Number,
    message: String,
    name: String,
    createdAt: Number,
    good: Number,
    imageURI: String,
    isInfluencer: Boolean
});

const TransitionSchema = new mongoose.Schema<ITransitionModel>({
    id: Number,
    timestamp: Number,
    percentage: [Number]
});

const FeedbackSchema = new mongoose.Schema<IFeedbackModel>({
    message: String,
    feedbackType: String
});

export const User = mongoose.model<IUserModel>("User", UserSchema, "users");
export const Result = mongoose.model<IResultModel>("Result", ResultSchema, "results");
export const Comment = mongoose.model<ICommentModel>("Comment", CommentSchema, "comments");
export const Transition = mongoose.model<ITransitionModel>("Transition", TransitionSchema, "transitions");
export const Feedback = mongoose.model<IFeedbackModel>("Feedback", FeedbackSchema, "feedbacks");
