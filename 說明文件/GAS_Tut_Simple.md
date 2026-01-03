# Google Apps Script 簡單郵件寄送指南

只需兩個核心步驟：部署取得 URL → 寄送郵件。

---

## 📋 快速開始

### 步驟 1️⃣ : 複製程式碼

打開這個文件：[google-apps-script-simple.js](../../網頁/scripts/google-apps-script-simple.js)

全選所有程式碼（Ctrl+A）→ 複製（Ctrl+C）

### 步驟 2️⃣ : 貼到 Google Apps Script

1. 直接進入 [script.google.com](https://script.google.com) 或在任意 Google Sheet/Doc 選「擴充功能 → Apps Script」
2. 清空現有程式碼
3. 貼入複製的程式碼（Ctrl+V）

### 步驟 3️⃣ : 部署取得 Web App URL

1. 在 Apps Script 點「部署」→「新部署」→ 類型選「Web 應用程式」
2. 執行身份：選你的帳號；存取權限：選「任何人」
3. 複製部署 URL（例：`https://script.google.com/macros/s/XXXX/usercontent`）
4. 在前端加入：
```html
<script>
  window.gasDeploymentUrl = 'https://script.google.com/macros/s/XXXX/usercontent';
</script>
```
  5. （可選）若要限制來源，在程式碼裡設定 `ALLOWED_ORIGIN = 'https://your-domain.com'`

---

## 🚀 使用方式

### 寄送單封郵件

在編輯器中執行（選擇函數 → 按播放鈕）：

```javascript
sendConfirmationEmail('報名者@gmail.com', '王小明', '極客魂社團 Python 工作坊', '2026-01-20');
```

### 寄送錄取通知

```javascript
sendAcceptanceEmail('報名者@gmail.com', '王小明', '極客魂社團 Python 工作坊');
```

### 一次寄送多封郵件

```javascript
batchSendEmails([
  { email: 'student1@gmail.com', name: '王小明', activityTitle: 'Python 工作坊', date: '2026-01-20' },
  { email: 'student2@gmail.com', name: '李小紅', activityTitle: 'Python 工作坊', date: '2026-01-20' }
]);
```

### 測試郵件

```javascript
testEmail();  // 會寄送到你設定的測試 Email
```

### 前端調用需要部署 URL 嗎？
- 手動在 Apps Script 執行：不需要 URL。
- 前端要呼叫：需要部署 Web App 並在前端設定 URL（本範例已包含 `doPost` 端點）。

部署 Web App 的最小步驟：
1. 在 Apps Script 點「部署」→「新部署」→ 類型選「Web 應用程式」。
2. 執行身份選你的帳號；存取權限選「任何人」。
3. 取得部署 URL，例如：`https://script.google.com/macros/s/XXXX/usercontent`。
4. 前端設定（若需要）：
```html
<script>
  window.gasDeploymentUrl = 'https://script.google.com/macros/s/XXXX/usercontent';
</script>
```

---

## ⚠️ 常見問題

| 問題 | 解決方式 |
|------|--------|
| 郵件無法寄送 | 檢查權限授權，或允許 Gmail 的「不安全應用程式存取」[點這裡](https://myaccount.google.com/security) |
| 前端呼叫 403 / origin not allowed | 在程式碼設定 `ALLOWED_ORIGIN` 與前端 `origin` 一致，或留空代表不限制 |
| 想自訂郵件內容 | 編輯程式碼中的 `subject` 和 `body` 變數 |

---

**就這麼簡單！** 🎉
