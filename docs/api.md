# API Guide

**Caution! This document may be out of date**

## / (root directory)

GET /

GET /articles

POST /feedback?message=$MSG

POST /application?message=$MSG

## /app

GET /app/auth

POST /app/receiver

## /auth

GET /auth/sessiontoken?sessionid=$SID

GET /auth/twitter

GET /auth/twitter/callback

## /theme

GET /theme/themes

GET /theme/themes/$TID

PUT /theme/themes/$TID?sessionToken=$TOKEN&isenabled=true&title=$TITLE&description=$DESC&imageuri=$IMG&genre=$GENRE&choices=$CHOICES&DRClass=3

## /user

GET /user/profiles?sessiontoken=$TOKEN

POST /user/profiles

## /vote

GET /vote/results/$TID

GET /vote/votes/$TID

PUT /vote/votes/$TID?sessiontoken=$TOKEN&answer=$ANS

GET /vote/transitions/$TID

GET /vote/comments/$TID

POST /vote/comments/$TID?sessiontoken=$TOKEN&message=$MSG
