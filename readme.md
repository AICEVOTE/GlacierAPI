# GlacierAPI

AICEVOTE API SERVER

## API reference

### Auth

GET /auth/sessiontoken?sessionid=:sessionid

> sessionTokenを取得
>
> `:sessionid`には認証処理で取得したsessionIDを入れてください

``` bash
curl https://api.aicevote.com/auth/sessiontoken?sessionid=test
```

---

GET /auth/twitter?callback=:callback

> Twitter経由で認証
>
> 認証後に指定したURLにリダイレクトさせたい場合は、
> クエリに`callback`オプションをつけ、
> `:callback`にはリダイレクト先のURLを入れてください。

### Index

GET /themes/:themeid

> テーマ情報を取得
>
> `:themeid`に指定したThemeIDを持つテーマの情報を返します。
>
> `:themeid`を指定せずににアクセスした場合は、全テーマの情報を返します。

``` bash
curl https://api.aicevote.com/themes/13 | jq
```

---

GET /profiles?sessiontoken=:sessiontoken

> 自分のプロフィールを取得
>
> `:sessiontoken`には、有効なsessionTokenを入れてください。

``` bash
curl https://api.aicevote.com/profiles?sessiontoken=test
```

---

GET /profiles/:userprovider/:userid

> ユーザのプロフィールを取得
>
> `:userprovider`には、認証プロバイダ、
> `:userid`にはユーザのIDを入れてください。
> 
> 現在、認証プロバイダには、twitterとlegacyを指定することができます。

``` bash
curl https://api.aicevote.com/profiles/twitter/1143896482774261761 | jq
```

---

POST /profiles

> 複数ユーザのプロフィールを取得
>
> `:userprovider`と`:userid`の配列をJSONとしてPOSTしてください。

``` bash
curl -H "Content-type: application/json" -X POST -d '[{"userProvider":"twitter","userID":"1143896482774261761"}]' https://api.aicevote.com/profiles | jq
```

---

POST /feedback?message=:message

> フィードバックを送信
>
> `:message`にフィードバック内容を入れてください。

``` bash
curl -X POST https://api.aicevote.com/feedback?message=sample | jq
```

---

POST /application?message=:message

> 投票テーマを提案
>
> `:message`に提案する投票テーマの内容を入れてください。

``` bash
curl -X POST https://api.aicevote.com/application?message=sample | jq
```

### News

GET /news/articles/:themeid

> 各テーマに関連する記事を取得
>
> `:themeid`に指定したThemeIDを持つテーマの関連記事を返します。
>
> `:themeid`を指定せずににアクセスした場合は、全テーマの関連記事を返します。

``` bash
curl https://api.aicevote.com/news/articles/13 | jq
```

### Vote

GET /vote/results/:themeid

> 投票結果を取得
>
> `:themeid`に指定したThemeIDを持つテーマの投票結果を返します。
>
> `:themeid`を指定せずににアクセスした場合は、全テーマの結果を返します。

``` bash
curl https://api.aicevote.com/vote/results/13 | jq
```

---

GET /vote/votes/:themeid?sessiontoken=:sessiontoken

> 投票一覧を取得
>
> `:themeid`に指定したThemeIDを持つテーマの投票一覧を返します。
>
> `:themeid`を指定せずににアクセスした場合は、全テーマの投票一覧を返します。
>
> `:sessiontoken`を指定せずにアクセスした場合は、
> インフルエンサーからの投票のみ返します。

``` bash
curl https://api.aicevote.com/vote/votes/13 | jq
```

---

PUT /vote/votes/:themeid?sessiontoken=:sessiontoken&answer=:answer

> 投票
>
> `:themeid`に指定したThemeIDを持つテーマに、
> `:answer`で指定した値を投票します。
>
> `:answer`は必ず0以上の整数です。

``` bash
curl -X PUT https://api.aicevote.com/vote/votes/13?sessiontoken=test&answer=0
```

---

GET /vote/transitions/:themeid

> 投票結果の推移を取得
>
> `:themeid`に指定したThemeIDを持つテーマの推移を返します。
>
> `:themeid`を指定せずににアクセスした場合は、全テーマの推移を返します。

``` bash
curl https://api.aicevote.com/vote/transitions/13 | jq
```

---

GET /vote/comments/:themeid

> コメントを取得
>
> `:themeid`に指定したThemeIDを持つテーマへのコメントを返します。
>
> `:themeid`を指定せずににアクセスした場合は、全てのコメントを返します。

``` bash
curl https://api.aicevote.com/vote/comments/13 | jq
```

---

POST /vote/comments/:themeid?sessiontoken=:sessiontoken&message=:message

> コメントを投稿
>
> `:themeid`に指定したThemeIDを持つテーマに、
> `:message`で指定したコメントを投稿します。


``` bash
curl -X POST https://api.aicevote.com/vote/comments/13?sessiontoken=test&message=helloworld
```

(C) 2020 YUJI
