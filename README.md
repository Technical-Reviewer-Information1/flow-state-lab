# フローチャートと状態遷移図を動かして理解する

『大学入学共通テスト「情報Ⅰ」対策問題集』（技術評論社, ISBN 978-4-297-15084-6）pp.48-51 連動Webアプリ。

**公開URL**: https://technical-reviewer-information1.github.io/flow-state-lab/

記号の意味をおぼえるだけでは図は読めません。ログイン処理を実際に流し、目覚まし時計のボタンを実際に押して、図のとおりに動くことを確かめます。

## 技術

静的な HTML / CSS / JavaScript のみで動作します。ビルド不要・外部CDN不使用・サーバ通信なし。
GitHub Pages で配信しており、Python や Streamlit は不要です。スマートフォン／タブレット／PC に対応。

```
index.html
css/style.css   全アプリ共通スタイル
css/app.css     このアプリ固有のスタイル
js/app.js       画面制御
```

`app.py` は旧版（Streamlit Community Cloud 用）です。

---
Created by Dit-Lab.(Daiki ITO) / Supported by Tomoaki ATSUMI
