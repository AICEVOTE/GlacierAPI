# API Guide

## / (root directory)

GET /

GET /articles

POST /feedback?message=$MSG

POST /application?message=$MSG

## /app

GET /app/auth

``` json
{
    "accessToken": "xxx",
    "refreshToken": "yyy",
}
```

POST /app/receiver

``` json
{
    "deviceToken": "xxx",
    "users": [
        {
            "userProvider": "twitter",
            "userID": "yyy"
        }
    ],
    "themeIDs": [0, 1,]
}
```

## /auth

GET /auth/sessiontoken?sessionid=$SID

GET /auth/twitter

GET /auth/twitter/callback

## /theme

GET /theme/themes

> If you want to search a theme, You can use regular expression
>
> GET /theme/themes?q=$REGEX

GET /theme/themes/$TID

PUT /theme/themes/$TID

``` json
{
    "sessionToken": "xxx",
    "isEnabled": true,
    "title": "yyy",
    "description": "zzz",
    "imageURI": "example.com/test.png",
    "genre": 0,
    "choices": ["A", "B"],
    "DRClass": 3,
    "isPersonalMatters": false
}
```

## /user

GET /user/profiles?sessiontoken=$TOKEN

POST /user/profiles

``` json
[
    {
        "userProvider": "twitter",
        "userID": "yyy"
    }
]
```

GET /user/influencers

## /vote

GET /vote/results/$TID

GET /vote/votes/$TID

PUT /vote/votes/$TID?sessiontoken=$TOKEN&answer=$ANS

GET /vote/transitions/$TID

GET /vote/comments/$TID

POST /vote/comments/$TID?sessiontoken=$TOKEN&message=$MSG
