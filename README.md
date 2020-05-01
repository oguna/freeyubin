# FreeYubin

郵便番号から住所に変換するツールです。

[jsmigemo](https://github.com/oguna/jsmigemo) の成果物の一部から流用し開発しました。

## 実用的？

jsmigemoと同様の辞書構造を用いることでデータサイズの削減を図りましたが、実は全然小さくなっていません。
本ツールで用いている、郵便番号から住所に変換するだけの辞書が **1.37MB** です。
郵便局のウェブサイトで配布しているCSVファイルがZIP圧縮で **1.61MB** です。

よって現段階では全く実用的ではありません。

## 今後の方針

- **辞書ファイルのサイズの削減**
- 読みがなの格納
- CIにより辞書ファイルを自動的に更新
- 住所から郵便番号を検索

## 使い方

### Node.js

```shell
> node bin/freeyubin-cli.js 5650871
大阪府 吹田市 山田丘
```

### ウェブ

```js
let url = 'freeyubin-dict-20200430'
axios.get( url, {responseType: 'arraybuffer'})
.then(response => {
    let dict = new freeyubin.CompactDictionary(response.data)
    let iter = dict.search('5650871')
    let address = iter.next().value
    console.log(address)
})
```

## ライセンス

三条項BSDライセンス