### プレゼンタイマーアプリ Backend API リファレンス（Lambda Function URL）

このバックエンドは **API Gateway なし**で、**Lambda Function URL（HTTPS エンドポイント）**に対してリクエストを送ります。

通信は基本的に **JSON を POST** します（`action` で処理を切り替え）。

---

### 基本情報

#### Base URL

- `FUNCTION_URL`（CloudFormation Outputs の `PresentationStoreFunctionUrl`）
    - 例: `https://xxxxxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/`

#### 共通ヘッダ

- `Content-Type: application/json`

#### CORS

- ブラウザから呼べるように CORS を許可します。
- プリフライト（`OPTIONS`）はブラウザが自動で送信します。

---

### 1) OPTIONS /（CORS プリフライト）

#### 概要

ブラウザが自動で投げる確認リクエストです。通常はアプリ側で意識しません。

#### リクエスト例

- Method: `OPTIONS`
- Body: なし

#### レスポンス例

- Status: `204 No Content`
- Headers（例）
    - `Access-Control-Allow-Origin: *`
    - `Access-Control-Allow-Headers: *`
    - `Access-Control-Allow-Methods: GET,POST,OPTIONS`

---

### 2) POST /（発表データの保存）: `action = "put"`

#### 概要

発表データ JSON を丸ごと保存し、共有用の `shareId(UUID)` を発行して返します。

PCで作成した内容を保存して、スマホに `shareId` を渡す用途です。

#### リクエスト（Body）例

```json
{
  "action": "put",
  "presentation": {
    "title": "ハッカソン成果発表",
    "sections": [
      { "title": "導入", "plannedSec": 45, "memo": "課題→結論" },
      { "title": "デモ", "plannedSec": 120, "memo": "操作の順番" }
    ],
    "settings": { "vibration": true }
  }
}
```

#### フィールド

- `action` (string, required): `"put"` 固定
- `presentation` (object, required): 発表データ本体（自由な JSON）
    - DynamoDB に **そのまま 1 レコード**として保存されます
    - DynamoDB の 1 アイテム上限は **最大 400KB** です

#### レスポンス（成功）

- Status: `200 OK`

```json
{
  "ok": true,
  "shareId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### レスポンス（失敗）

- JSONが壊れている
    - Status: `400 Bad Request`
    
    ```json
    { "ok": false, "error": "invalid_json" }
    ```
    
- actionが不正
    - Status: `400 Bad Request`
    
    ```json
    { "ok": false, "error": "unknown_action" }
    ```
    

---

### 3) POST /（発表データの取得）: `action = "get"`

#### 概要

`shareId(UUID)` を指定して、保存済みの発表データを取得します。

スマホが `shareId` を入力して読み込む用途です。

#### リクエスト（Body）例

```json
{
  "action": "get",
  "shareId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### フィールド

- `action` (string, required): `"get"` 固定
- `shareId` (string, required): UUID

#### レスポンス（成功）

- Status: `200 OK`

```json
{
  "ok": true,
  "item": {
    "shareId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-05T10:00:00.000Z",
    "updatedAt": "2026-03-05T10:00:00.000Z",
    "presentation": {
      "title": "ハッカソン成果発表",
      "sections": [
        { "title": "導入", "plannedSec": 45, "memo": "課題→結論" },
        { "title": "デモ", "plannedSec": 120, "memo": "操作の順番" }
      ],
      "settings": { "vibration": true }
    }
  }
}
```

#### レスポンス（失敗）

- shareIdが未指定
    - Status: `400 Bad Request`
    
    ```json
    { "ok": false, "error": "shareId_is_required" }
    ```
    
- 該当データなし
    - Status: `404 Not Found`
    
    ```json
    { "ok": false, "error": "not_found" }
    ```
    

---

### 呼び出しサンプル（フロントエンド）

#### 保存（put）

```tsx
const res = await fetch(FUNCTION_URL, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "put", presentation }),
});
const data = await res.json();
// data.shareId をスマホに渡す
```

#### 取得（get）

```tsx
const res = await fetch(FUNCTION_URL, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "get", shareId }),
});
const data = await res.json();
// data.item.presentation をタイマー画面に流し込む
```

---