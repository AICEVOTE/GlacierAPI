export function isString(obj: unknown | null | undefined): obj is string {
    if (obj == null || obj == undefined) { return false; }
    return typeof obj == "string";
}

export function isNumber(obj: unknown | null | undefined): obj is number {
    if (obj == null || obj == undefined) { return false; }
    return typeof obj == "number";
}

export function isArray(obj: unknown | null | undefined): obj is any[] {
    if (obj == null || obj == undefined) { return false; }
    return Object.prototype.toString.call(obj) == "[object Array]";
}

export function isUserlist(obj: unknown | null | undefined): obj is {
    userProvider: string;
    userID: string;
}[] {
    if (!isArray(obj)) {
        return false;
    }
    return obj
        .every(({ userProvider, userID }
            : { userProvider: unknown, userID: unknown }) =>
            isString(userProvider) && isString(userID));
}
