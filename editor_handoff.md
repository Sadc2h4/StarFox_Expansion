# LYLAT Page Editor 引き継ぎ書

作成日: 2026-05-27

## 対象ファイル

- `editor.html`
- `index.html`
- `planets/*.html`
- `planet.css`
- `resource/LA_image/*`（旧 LA_image/、Comms_visual/ も resource/ 配下へ移動済み）
- `UIイメージ/Map_Buckground2.png`

## 今回の対応概要

既存の `index.html` 用マップ編集エディタ `editor.html` を拡張し、以下に対応した。

1. 画面最上部に編集モード切替タブを追加
   - `index.html編集`
   - `planets編集`

2. 初期表示を変更
   - `editor.html` を開いた直後はマップ背景のみ表示
   - 旧仕様のようにサンプル配置を最初から表示しない
   - タブ選択後に該当エディタUIを展開

3. `index.html` 読込時の現在配置反映
   - `index.htmlを開く` で選択したHTMLを `DOMParser` で解析
   - `.map-planet`, `.map-indicator`, `.gw-orbit-ring` を読み取り、エディタ上に再描画
   - 現在の座標、サイズ、画像、色、速度、リンク先などを反映

4. ポインタの遷移先指定
   - `遷移先ページ` プルダウンを追加
   - `planets/corneria.html` など既知の子ページを選択可能
   - `リンク直接指定` も残している

5. 領域リング機能を拡張
   - 複数画像指定に対応
   - 入力形式は複数行または `|` 区切り
   - 回転方向を `標準` / `逆回転` から選択可能
   - 速度、半径、揺れ、サイズを編集可能
   - 保存時は `animation-direction` をインラインスタイルへ出力

6. `planets` 子ページ編集画面を追加
   - `planets編集` タブから利用
   - `planetsフォルダを開く` でフォルダ内HTMLをプルダウン化
   - `HTMLを開く` で個別ファイル選択も可能
   - 編集対象:
     - `<title>`
     - ヘッダータグ
     - ステータス
     - 左右サイド文字
     - ヒーロー情報
     - 惑星画像、画像サイズ、グロー
     - ホバータグ
     - スキャン表
     - 環境指数バー
     - 本文 lore セクション

## 主要実装箇所

`editor.html` 内の主な関数:

- `setMode(mode)`
  - タブ切替と表示モード変更

- `parseIndexItems(html)`
  - `index.html` のマップ要素を解析して `state.items` に変換

- `parsePlanetElement(el)`
  - `.map-planet` の解析

- `parseIndicatorElement(el)`
  - `.map-indicator` の解析

- `parseOrbitElement(ring, no)`
  - `.gw-orbit-ring` の解析

- `generateMapBlock()`
  - `index.html` に保存するマップ要素ブロックを生成

- `generateOrbitHtml(item)`
  - 領域リングHTMLを生成
  - 複数画像と `animation-direction` を反映

- `parsePlanetPage(html)`
  - `planets/*.html` の編集対象項目をフォームへ取り出す

- `buildPlanetPage()`
  - 子ページフォームの内容をHTMLへ反映

- `replaceScanRows(doc)`
  - スキャン表と環境指数バーを更新

- `replaceLore(doc)`
  - lore本文を `## 見出し` 形式からHTMLへ再構築

## 使い方

### index.html を編集する場合

1. `editor.html` をブラウザで開く
2. 上部の `index.html編集` タブを押す
3. `index.htmlを開く` を押し、ルート直下の `index.html` を選択
4. マップ上に現在の配置が表示される
5. ポインタをドラッグ、または右側フォームで編集
6. `index.htmlへ保存` を押す

### planets 子ページを編集する場合

1. `editor.html` をブラウザで開く
2. 上部の `planets編集` タブを押す
3. `planetsフォルダを開く` を押し、`planets` フォルダを選択
4. 子ページプルダウンから対象HTMLを選ぶ
5. `選択ページを読込` を押す
6. フォームを編集
7. `選択ページへ保存` を押す

個別ファイルだけ編集したい場合は `HTMLを開く` から対象HTMLを直接選択できる。

## ブラウザ要件

直接ファイル読込・保存には File System Access API を使用している。

想定ブラウザ:

- Google Chrome
- Microsoft Edge

Firefox や Safari では直接保存が使えない可能性がある。その場合は出力ダイアログのHTMLを手動反映する必要がある。

## 現時点の確認状況

実施済み:

- `editor.html` 内 JavaScript の構文チェック
- HTML内の重複IDチェック
- JavaScriptから参照しているDOM IDの欠落チェック

未実施:

- Playwright によるブラウザ自動表示確認
- 実ブラウザでの保存操作確認
- `planets/*.html` 全ページを保存し直した場合の差分確認

Playwright は作業環境にインストールされていなかったため、スクリーンショット確認は未実施。

## 注意点

- `index.html` の保存は `PLANET BUTTONS & MAP ELEMENTS` コメントから `</div><!-- /map-wrapper -->` の直前までを差し替える。
- `index.html` 側のマップ構造が大きく変わると、`replaceMapBlock()` や `parseIndexItems()` の調整が必要。
- `planets` 子ページ編集は、既存HTMLの構造を保ったまま主要テキストだけ更新する設計。
- lore本文では `<br>` や `<span class="badge ...">` などのHTML断片をそのまま扱えるが、完全なWYSIWYGではない。
- スキャン表は `KEY = VALUE` の1行1項目として編集する。
- スキャン表の `dv ok/warn/bad` のような状態クラスは現状保存時に維持せず、通常の `dv` として再生成する。

## 今後の改善候補

- 子ページ編集フォームに色テーマ編集を追加
  - `--primary`
  - `--accent`
  - `--border`
  - 背景色

- スキャン表の状態クラスを編集可能にする
  - normal
  - ok
  - warn
  - bad

- lore本文をセクション単位で追加・削除・並べ替えできるUIにする

- `LA_image` 内の画像を自動スキャンして画像プルダウンを生成する

- `planets` フォルダを開いた時点で、`index.html` 側の遷移先プルダウンにも最新ページ一覧を反映する

- 実ブラウザ確認後、必要ならレイアウト幅やフォーム項目の表示密度を調整する

## 作業再開時の推奨確認手順

1. Chrome または Edge で `editor.html` を開く
2. `index.html編集` タブで `index.html` を読み込む
3. 現在の `index.html` と同じ配置が表示されるか確認
4. 1要素だけ位置を少し動かして保存
5. `index.html` をブラウザで開き、表示崩れがないか確認
6. `planets編集` タブで `planets` フォルダを開く
7. 代表として `corneria.html` を読み込む
8. 1項目だけ変更して保存
9. 該当HTMLをブラウザで開き、表示崩れがないか確認

