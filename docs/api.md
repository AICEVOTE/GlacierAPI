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

PUT /theme/themes/$TID?sessionToken=$TOKEN&isenabled=true&title=$TITLE&description=$DESC&imageuri=$IMG&genre=$GENRE&choices=$CHOICES&drclass=3

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
