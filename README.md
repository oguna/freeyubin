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

## 辞書ファイルの生成方法

1. [郵便局のウェブサイト](https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html)から、最新の郵便番号データをダウンロードして下さい。
   「都道府県一覧」の「全国一括」をクリックすると、「ken_all.zip」を入手できます。
2. 「ken_all.zip」中の「KEN_ALL.CSV」ファイルをプロジェクト直下に展開します。
3. 「KEN_ALL.CSV」をメモ帳などのテキストエディタで開き、文字エンコーディングをUTF-8で保存します。
4. `node .\bin\freeyubin-tool.mjs` で、CMigemo形式に変換します。
5. `node .\bin\freeyubin-dict.mjs a.txt freeyubin-dict` で、省メモリMigemo形式に変換します。

`freeyubin-dict` が、生成した辞書ファイルです。

## 使い方

### Node.js

```shell
> node bin/freeyubin-cli.mjs 5650871
大阪府 吹田市 山田丘
```

### ウェブ

```js
const url = 'freeyubin-dict'
fetch(url)
.then(e => e.arraybuffer())
.then(e => {
    const dict = new freeyubin.CompactDictionary(e)
    const iter = dict.search('5650871')
    const address = iter.next().value
    console.log(address)
})
```

## ライセンス

三条項BSDライセンス