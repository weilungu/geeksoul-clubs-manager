# Google Apps Script 整合指南
## 將 localStorage 遷移至 Google Sheet 資料庫

---

> **🧪 測試模式說明**  
> 目前系統設定為 **測試模式**，報名表單送出後會 **立即發送確認信**，不需要等到活動前一天。  
> 這樣可以快速測試 Email 功能是否正常運作。

---

## 📋 目錄

1. [整體架構說明](#整體架構說明)
2. [Google Sheet 資料結構設計](#google-sheet-資料結構設計)
3. [Google Apps Script 實作](#google-apps-script-實作)
4. [前端程式碼修改](#前端程式碼修改)
5. [部署與測試流程](#部署與測試流程)
6. [Email 功能測試](#email-功能測試)
7. [常見問題與除錯](#常見問題與除錯)

---

## 🏗️ 整體架構說明

### 現況（使用 localStorage）
```
前端網頁 → localStorage (瀏覽器本地儲存)
- 資料存在用戶瀏覽器
- 無法跨裝置共享
- 無法即時同步
```

### 目標（使用 Google Sheet + GAS）
```
前端網頁 → Google Apps Script API → Google Sheet (雲端資料庫)
- 資料存在 Google 雲端
- 可跨裝置存取
- 即時同步更新
- 支援多人協作
- 自動發送 Email 通知
```

---

## 📊 Google Sheet 資料結構設計

### 步驟 1：建立 Google Sheet

1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新的試算表，命名為：`極客魂社團活動報名系統`
3. 建立兩個工作表（Sheet）：
   - **活動資料表（Activities）**
   - **報名資料表（Registrations）**

---

### Sheet 1：活動資料表（Activities）

| 欄位 | 說明 | 範例 |
|------|------|------|
| A - ID | 活動唯一識別碼 | 1704067200000 |
| B - 活動名稱 | 活動標題 | 極客魂新生入門講座 |
| C - 活動日期 | 格式化顯示日期 | 2026年1月15日 19:00 - 21:00 |
| D - 開始時間 | ISO 格式開始時間 | 2026-01-15T19:00 |
| E - 結束時間 | ISO 格式結束時間 | 2026-01-15T21:00 |
| F - 報名截止 | ISO 格式截止時間 | 2026-01-14T23:59 |
| G - 活動地點 | 舉辦地點 | 資訊大樓 101 教室 |
| H - 講師 | 主講人 | 技術長 David |
| I - 名額上限 | 報名人數上限 | 50 |
| J - 活動說明 | 詳細描述 | 本次活動將介紹... |
| K - 海報連結 | Google Drive 海報 URL | https://drive.google.com/... |
| L - 漸層背景 | 備用背景色 | linear-gradient(135deg, #B71C1C, #F57C00) |
| M - 報名狀態 | 是否開放報名 | TRUE / FALSE |
| N - 建立時間 | 建立時間戳記 | 2026-01-02 10:30:00 |

**第一列（標題列）範例：**
```
ID | 活動名稱 | 活動日期 | 開始時間 | 結束時間 | 報名截止 | 活動地點 | 講師 | 名額上限 | 活動說明 | 海報連結 | 漸層背景 | 報名狀態 | 建立時間
```

---

### Sheet 2：報名資料表（Registrations）

| 欄位 | 說明 | 範例 |
|------|------|------|
| A - 報名ID | 報名唯一識別碼 | 1704067300000 |
| B - 活動ID | 關聯的活動ID | 1704067200000 |
| C - 活動名稱 | 活動標題（冗餘欄位） | 極客魂新生入門講座 |
| D - 系級 | 學生系級 | 資工一A |
| E - 姓名 | 學生姓名 | 王小明 |
| F - 學號 | 學號（唯一） | 411345678 |
| G - Email | 常用信箱 | example@gmail.com |
| H - 是否社員 | yes / no | yes |
| I - Line暱稱 | Line 群組暱稱 | 小明 |
| J - 報名時間 | 報名時間戳記 | 2026-01-02 14:30:00 |
| K - 報名狀態 | success / leave / waiting | success |

**第一列（標題列）範例：**
```
報名ID | 活動ID | 活動名稱 | 系級 | 姓名 | 學號 | Email | 是否社員 | Line暱稱 | 報名時間 | 報名狀態
```

---

## 💻 Google Apps Script 實作

### 步驟 2：開啟 Apps Script 編輯器

1. 在 Google Sheet 中，點選 **擴充功能 > Apps Script**
2. 刪除預設的 `myFunction()`
3. 複製以下程式碼

---

### Code.gs（主程式）

**⚠️ 重要提示：Google Apps Script 會自動處理 CORS，無需手動設定 headers。**

```javascript
/**
 * 極客魂社團活動報名系統 - Google Apps Script API
 * 提供 RESTful API 供前端呼叫
 * 
 * 部署設定重點：
 * - 執行身分：我
 * - 存取權：所有人（這是讓 CORS 正常運作的關鍵）
 */

// ========== 工作表名稱設定 ==========
const SHEET_ACTIVITIES = 'Activities';
const SHEET_REGISTRATIONS = 'Registrations';

// ========== 取得工作表物件 ==========
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  // 如果工作表不存在，自動建立
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

// ========== 初始化工作表標題列 ==========
function initializeSheet(sheet, sheetName) {
  if (sheetName === SHEET_ACTIVITIES) {
    sheet.appendRow([
      'ID', '活動名稱', '活動日期', '開始時間', '結束時間', '報名截止',
      '活動地點', '講師', '名額上限', '活動說明', '海報連結', 
      '漸層背景', '報名狀態', '建立時間'
    ]);
  } else if (sheetName === SHEET_REGISTRATIONS) {
    sheet.appendRow([
      '報名ID', '活動ID', '活動名稱', '系級', '姓名', 
      '學號', 'Email', '是否社員', 'Line暱稱', 
      '報名時間', '報名狀態'
    ]);
  }
  
  // 設定標題列格式
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground('#B71C1C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
}

// ========== 主要 API 端點 ==========
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'getActivities':
        return getActivities();
      case 'getRegistrations':
        return getRegistrations(e.parameter.activityId);
      default:
        return createResponse(false, null, '無效的 action 參數');
    }
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

function doPost(e) {
  const action = e.parameter.action;
  
  try {
    // 從 URL 參數獲取數據（避免 CORS preflight）
    let data = null;
    if (e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    }
    
    switch(action) {
      case 'createActivity':
        return createActivity(data);
      case 'updateActivity':
        return updateActivity(data);
      case 'deleteActivity':
        return deleteActivity(data.id);
      case 'createRegistration':
        return createRegistration(data);
      case 'updateRegistration':
        return updateRegistration(data);
      default:
        return createResponse(false, null, '無效的 action 參數');
    }
  } catch (error) {
    return createResponse(false, null, error.toString());
  }
}

// ========== 建立回應物件 ==========
function createResponse(success, data, message = '') {
  const response = {
    success: success,
    data: data,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== 活動相關 API ==========

/**
 * 取得所有活動
 */
function getActivities() {
  const sheet = getSheet(SHEET_ACTIVITIES);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return createResponse(true, []);
  }
  
  const activities = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    activities.push({
      id: row[0],
      title: row[1],
      date: row[2],
      startTime: row[3],
      endTime: row[4],
      deadline: row[5],
      location: row[6],
      speaker: row[7],
      quota: row[8],
      description: row[9],
      poster: row[10],
      fallbackBg: row[11],
      available: row[12],
      createdAt: row[13]
    });
  }
  
  return createResponse(true, activities);
}

/**
 * 建立新活動
 */
function createActivity(data) {
  const sheet = getSheet(SHEET_ACTIVITIES);
  const id = new Date().getTime();
  const now = new Date().toLocaleString('zh-TW');
  
  sheet.appendRow([
    id,
    data.title,
    data.date,
    data.startTime || '',
    data.endTime || '',
    data.deadline || '',
    data.location,
    data.speaker,
    data.quota,
    data.description || '',
    data.poster || '',
    data.fallbackBg || 'linear-gradient(135deg, #B71C1C, #F57C00)',
    data.available !== false,
    now
  ]);
  
  return createResponse(true, { id: id }, '活動建立成功');
}

/**
 * 更新活動資訊
 */
function updateActivity(data) {
  const sheet = getSheet(SHEET_ACTIVITIES);
  const allData = sheet.getDataRange().getValues();
  
  // 找到對應的列
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == data.id) {
      sheet.getRange(i + 1, 2, 1, 12).setValues([[
        data.title,
        data.date,
        data.startTime || '',
        data.endTime || '',
        data.deadline || '',
        data.location,
        data.speaker,
        data.quota,
        data.description || '',
        data.poster || '',
        data.fallbackBg || 'linear-gradient(135deg, #B71C1C, #F57C00)',
        data.available !== false
      ]]);
      return createResponse(true, null, '活動更新成功');
    }
  }
  
  return createResponse(false, null, '找不到該活動');
}

/**
 * 刪除活動（標記為關閉）
 */
function deleteActivity(id) {
  const sheet = getSheet(SHEET_ACTIVITIES);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == id) {
      // 將報名狀態設為 false（第13欄，索引12）
      sheet.getRange(i + 1, 13).setValue(false);
      return createResponse(true, null, '活動已關閉');
    }
  }
  
  return createResponse(false, null, '找不到該活動');
}

// ========== 報名相關 API ==========

/**
 * 取得報名記錄
 */
function getRegistrations(activityId = null) {
  const sheet = getSheet(SHEET_REGISTRATIONS);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return createResponse(true, {});
  }
  
  const registrations = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const registration = {
      registrationId: row[0],
      eventId: row[1],
      eventTitle: row[2],
      department: row[3],
      name: row[4],
      studentId: row[5],
      email: row[6],
      isMember: row[7],
      lineName: row[8],
      timestamp: row[9],
      savedStatus: row[10]
    };
    
    // 依活動ID分組
    const actId = String(row[1]);
    if (!registrations[actId]) {
      registrations[actId] = [];
    }
    
    // 如果指定特定活動ID，只回傳該活動的報名
    if (activityId && actId != activityId) {
      continue;
    }
    
    registrations[actId].push(registration);
  }
  
  return createResponse(true, registrations);
}

/**
 * 建立報名記錄
 */
function createRegistration(data) {
  const sheet = getSheet(SHEET_REGISTRATIONS);
  const registrationId = new Date().getTime();
  const now = new Date().toLocaleString('zh-TW');
  
  // 檢查是否已報名（同一活動 + 同一學號）
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][1] == data.eventId && allData[i][5] == data.studentId) {
      return createResponse(false, null, '您已經報名過此活動');
    }
  }
  
  // 寫入報名記錄
  sheet.appendRow([
    registrationId,
    data.eventId,
    data.eventTitle,
    data.department,
    data.name,
    data.studentId,
    data.email,
    data.isMember,
    data.lineName || '',
    now,
    'success'
  ]);
  
  // 取得完整的活動資料（用於 Email）
  const activitiesSheet = getSheet(SHEET_ACTIVITIES);
  const activities = activitiesSheet.getDataRange().getValues();
  let activityData = null;
  
  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] == data.eventId) {
      activityData = {
        title: activities[i][1],
        date: activities[i][2],
        startTime: activities[i][3],
        endTime: activities[i][4],
        deadline: activities[i][5],
        location: activities[i][6],
        speaker: activities[i][7],
        description: activities[i][9]
      };
      break;
    }
  }
  
  // 立即發送報名確認信（測試模式）
  Logger.log('📧 準備發送報名確認信...');
  sendConfirmationEmail(data, activityData);
  Logger.log('✅ 報名確認信發送完成');
  
  return createResponse(true, { registrationId: registrationId }, '報名成功！確認信已發送至您的信箱');
}

/**
 * 更新報名狀態
 */
function updateRegistration(data) {
  const sheet = getSheet(SHEET_REGISTRATIONS);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][1] == data.eventId && allData[i][5] == data.studentId) {
      sheet.getRange(i + 1, 11).setValue(data.status);
      return createResponse(true, null, '狀態更新成功');
    }
  }
  
  return createResponse(false, null, '找不到該報名記錄');
}

// ========== Email 通知功能 ==========

/**
 * 發送報名確認信
 * @param {object} data - 報名資料
 * @param {object} activityData - 活動詳細資料（可選）
 */
function sendConfirmationEmail(data, activityData) {
  try {
    // 如果有提供活動資料，使用詳細資訊
    const activityInfo = activityData ? `
📅 活動資訊：
- 活動名稱：${activityData.title}
- 活動日期：${activityData.date}
- 活動時間：${activityData.startTime} - ${activityData.endTime}
- 活動地點：${activityData.location}
- 活動講師：${activityData.speaker}
- 報名截止：${activityData.deadline}
` : '';

    const subject = `【極客魂社團】活動報名確認 - ${data.activityName || data.eventTitle}`;
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Microsoft JhengHei', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #B71C1C, #F57C00);
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 10px;
    }
    .header {
      text-align: center;
      color: #B71C1C;
      margin-bottom: 20px;
    }
    .info-box {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
    }
    .success-icon {
      font-size: 48px;
      text-align: center;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #B71C1C, #F57C00);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="header">
        <h1>🎉 極客魂社團活動報名確認</h1>
      </div>
      
      <div class="success-icon">✅</div>
      
      <p>親愛的 <strong>${data.name}</strong> 同學，您好：</p>
      
      <p>感謝您報名參加「<strong>${data.activityName || data.eventTitle}</strong>」！</p>
      
      ${activityInfo}
      
      <div class="info-box">
        <h3>📋 您的報名資訊</h3>
        <ul>
          <li><strong>姓名：</strong>${data.name}</li>
          <li><strong>學號：</strong>${data.studentId}</li>
          <li><strong>系級：</strong>${data.department}</li>
          <li><strong>Email：</strong>${data.email}</li>
          <li><strong>社員身份：</strong>${data.isMember ? '是' : '否'}</li>
          ${data.lineName ? `<li><strong>Line 暱稱：</strong>${data.lineName}</li>` : ''}
          <li><strong>報名時間：</strong>${new Date().toLocaleString('zh-TW')}</li>
        </ul>
      </div>
      
      <div class="info-box">
        <h3>⚠️ 重要提醒</h3>
        <ul>
          <li>✅ 您的報名已成功送出並記錄在系統中</li>
          <li>📊 名額分配將依照「社員優先」及「報名順序」原則進行</li>
          <li>📧 活動前一天將再次寄送活動提醒通知</li>
          <li>🔔 若活動有任何異動，將透過 Email 通知您</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="https://your-website.com/overview.html" class="button">查看我的報名記錄</a>
      </p>
      
      <div class="footer">
        <p>如有任何問題，歡迎隨時聯繫我們：</p>
        <p>📧 Email: geekspirit.club@example.com</p>
        <p>💬 Line 官方帳號: @geekspirit</p>
        <p>🌐 社團網站: https://your-website.com</p>
        <hr style="margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          本郵件由系統自動發送，請勿直接回覆。<br>
          © 2026 極客魂社團 Geek Spirit Club. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    // 純文字版本（備用）
    const plainBody = `
親愛的 ${data.name} 同學，您好：

感謝您報名參加「${data.activityName || data.eventTitle}」！

${activityInfo}

📋 您的報名資訊：
- 姓名：${data.name}
- 學號：${data.studentId}
- 系級：${data.department}
- Email：${data.email}
- 社員身份：${data.isMember ? '是' : '否'}
${data.lineName ? `- Line 暱稱：${data.lineName}` : ''}
- 報名時間：${new Date().toLocaleString('zh-TW')}

⚠️ 重要提醒：
✅ 您的報名已成功送出並記錄在系統中
📊 名額分配將依照「社員優先」及「報名順序」原則進行
📧 活動前一天將再次寄送活動提醒通知
🔔 若活動有任何異動，將透過 Email 通知您

如有任何問題，歡迎隨時聯繫我們：
📧 Email: geekspirit.club@example.com
💬 Line 官方帳號: @geekspirit
🌐 社團網站: https://your-website.com

---
極客魂社團 Geek Spirit Club 敬上
本郵件由系統自動發送，請勿直接回覆。
    `.trim();
    
    // 發送 HTML 格式郵件
    MailApp.sendEmail({
      to: data.email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: '極客魂社團 Geek Spirit Club'
    });
    
    Logger.log(`✅ 報名確認信已發送至：${data.email}`);
    
  } catch (error) {
    Logger.log(`❌ Email 發送失敗：${error.toString()}`);
    // 不中斷流程，僅記錄錯誤
  }
}

/**
 * 發送活動提醒信（活動前一天）
 * @param {string} email - 收件人 Email
 * @param {string} name - 收件人姓名
 * @param {object} activity - 活動資料
 */
function sendActivityReminderEmail(email, name, activity) {
  try {
    const subject = `【極客魂社團】活動提醒 - ${activity.title}（明天舉行）`;
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Microsoft JhengHei', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #B71C1C, #F57C00);
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 10px;
    }
    .header {
      text-align: center;
      color: #B71C1C;
      margin-bottom: 20px;
    }
    .highlight-box {
      background: #FFF3E0;
      border-left: 4px solid #F57C00;
      padding: 15px;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="header">
        <h1>⏰ 活動提醒通知</h1>
      </div>
      
      <p>親愛的 <strong>${name}</strong> 同學，您好：</p>
      
      <p>您報名的活動「<strong>${activity.title}</strong>」即將在<strong>明天</strong>舉行！</p>
      
      <div class="highlight-box">
        <h3>📅 活動詳細資訊</h3>
        <ul>
          <li><strong>活動名稱：</strong>${activity.title}</li>
          <li><strong>活動日期：</strong>${activity.date}</li>
          <li><strong>活動時間：</strong>${activity.startTime} - ${activity.endTime}</li>
          <li><strong>活動地點：</strong>${activity.location}</li>
          <li><strong>活動講師：</strong>${activity.speaker}</li>
        </ul>
      </div>
      
      <div class="highlight-box">
        <h3>📝 活動說明</h3>
        <p>${activity.description || '請準時參加，期待與您見面！'}</p>
      </div>
      
      <div class="highlight-box">
        <h3>⚠️ 參加注意事項</h3>
        <ul>
          <li>🕐 請提前 10 分鐘到達活動地點</li>
          <li>📱 建議攜帶筆記本與筆進行記錄</li>
          <li>💧 場地提供飲用水，可自備環保杯</li>
          <li>🔕 活動進行中請將手機調整為靜音模式</li>
        </ul>
      </div>
      
      <p style="text-align: center; font-size: 18px; color: #B71C1C; margin: 30px 0;">
        <strong>期待明天與您見面！🎉</strong>
      </p>
      
      <div class="footer">
        <p>如有任何問題，歡迎隨時聯繫我們：</p>
        <p>📧 Email: geekspirit.club@example.com</p>
        <p>💬 Line 官方帳號: @geekspirit</p>
        <hr style="margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          本郵件由系統自動發送，請勿直接回覆。<br>
          © 2026 極客魂社團 Geek Spirit Club. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    const plainBody = `
親愛的 ${name} 同學，您好：

您報名的活動「${activity.title}」即將在明天舉行！

📅 活動詳細資訊：
- 活動名稱：${activity.title}
- 活動日期：${activity.date}
- 活動時間：${activity.startTime} - ${activity.endTime}
- 活動地點：${activity.location}
- 活動講師：${activity.speaker}

📝 活動說明：
${activity.description || '請準時參加，期待與您見面！'}

⚠️ 參加注意事項：
🕐 請提前 10 分鐘到達活動地點
📱 建議攜帶筆記本與筆進行記錄
💧 場地提供飲用水，可自備環保杯
🔕 活動進行中請將手機調整為靜音模式

期待明天與您見面！🎉

如有任何問題，歡迎隨時聯繫我們：
📧 Email: geekspirit.club@example.com
💬 Line 官方帳號: @geekspirit

---
極客魂社團 Geek Spirit Club 敬上
本郵件由系統自動發送，請勿直接回覆。
    `.trim();
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: '極客魂社團 Geek Spirit Club'
    });
    
    Logger.log(`✅ 活動提醒信已發送至：${email}`);
    
  } catch (error) {
    Logger.log(`❌ Email 發送失敗：${error.toString()}`);
  }
}

/**
 * 發送活動取消通知信
 * @param {string} email - 收件人 Email
 * @param {string} name - 收件人姓名
 * @param {object} activity - 活動資料
 * @param {string} reason - 取消原因
 */
function sendActivityCancellationEmail(email, name, activity, reason) {
  try {
    const subject = `【極客魂社團】活動取消通知 - ${activity.title}`;
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Microsoft JhengHei', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #B71C1C, #F57C00);
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 10px;
    }
    .header {
      text-align: center;
      color: #B71C1C;
      margin-bottom: 20px;
    }
    .warning-box {
      background: #FFEBEE;
      border-left: 4px solid #B71C1C;
      padding: 15px;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="header">
        <h1>❌ 活動取消通知</h1>
      </div>
      
      <p>親愛的 <strong>${name}</strong> 同學，您好：</p>
      
      <p>很抱歉通知您，原定舉辦的活動「<strong>${activity.title}</strong>」因故取消。</p>
      
      <div class="warning-box">
        <h3>📅 原定活動資訊</h3>
        <ul>
          <li><strong>活動名稱：</strong>${activity.title}</li>
          <li><strong>活動日期：</strong>${activity.date}</li>
          <li><strong>活動地點：</strong>${activity.location}</li>
          <li><strong>活動講師：</strong>${activity.speaker}</li>
        </ul>
      </div>
      
      <div class="warning-box">
        <h3>📝 取消原因</h3>
        <p>${reason || '活動因特殊原因無法如期舉行，造成您的不便敬請見諒。'}</p>
      </div>
      
      <p>我們深感抱歉，未來將持續舉辦更多精彩活動，歡迎您繼續關注社團動態！</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://your-website.com/index.html" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #B71C1C, #F57C00); color: white; text-decoration: none; border-radius: 5px;">
          查看其他活動
        </a>
      </p>
      
      <div class="footer">
        <p>如有任何問題，歡迎隨時聯繫我們：</p>
        <p>📧 Email: geekspirit.club@example.com</p>
        <p>💬 Line 官方帳號: @geekspirit</p>
        <hr style="margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          本郵件由系統自動發送，請勿直接回覆。<br>
          © 2026 極客魂社團 Geek Spirit Club. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    const plainBody = `
親愛的 ${name} 同學，您好：

很抱歉通知您，原定舉辦的活動「${activity.title}」因故取消。

📅 原定活動資訊：
- 活動名稱：${activity.title}
- 活動日期：${activity.date}
- 活動地點：${activity.location}
- 活動講師：${activity.speaker}

📝 取消原因：
${reason || '活動因特殊原因無法如期舉行，造成您的不便敬請見諒。'}

我們深感抱歉，未來將持續舉辦更多精彩活動，歡迎您繼續關注社團動態！

如有任何問題，歡迎隨時聯繫我們：
📧 Email: geekspirit.club@example.com
💬 Line 官方帳號: @geekspirit

---
極客魂社團 Geek Spirit Club 敬上
本郵件由系統自動發送，請勿直接回覆。
    `.trim();
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: '極客魂社團 Geek Spirit Club'
    });
    
    Logger.log(`✅ 活動取消通知信已發送至：${email}`);
    
  } catch (error) {
    Logger.log(`❌ Email 發送失敗：${error.toString()}`);
  }
}

/**
 * 批量發送活動提醒信（用於觸發器）
 * 每天檢查明天是否有活動，自動發送提醒
 */
function sendTomorrowActivityReminders() {
  const activitiesSheet = getSheet(SHEET_ACTIVITIES);
  const registrationsSheet = getSheet(SHEET_REGISTRATIONS);
  
  const activities = activitiesSheet.getDataRange().getValues();
  const registrations = registrationsSheet.getDataRange().getValues();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 檢查明天有哪些活動
  for (let i = 1; i < activities.length; i++) {
    const activity = {
      id: activities[i][0],
      title: activities[i][1],
      date: activities[i][2],
      startTime: activities[i][3],
      endTime: activities[i][4],
      deadline: activities[i][5],
      location: activities[i][6],
      speaker: activities[i][7],
      quota: activities[i][8],
      description: activities[i][9],
      poster: activities[i][10],
      fallbackBg: activities[i][11],
      available: activities[i][12],
      createdAt: activities[i][13]
    };
    
    // 檢查活動日期是否為明天
    if (activity.startTime && activity.startTime.includes(tomorrowStr)) {
      Logger.log(`📧 發送明天活動提醒：${activity.title}`);
      
      // 找出所有報名此活動的人
      for (let j = 1; j < registrations.length; j++) {
        if (registrations[j][1] == activity.id && registrations[j][10] === 'success') {
          const registration = {
            email: registrations[j][6],
            name: registrations[j][4]
          };
          
          sendActivityReminderEmail(registration.email, registration.name, activity);
          Utilities.sleep(1000); // 避免發送過快，每封信間隔 1 秒
        }
      }
    }
  }
  
  Logger.log('✅ 活動提醒信批量發送完成');
}

/**
 * 批量發送活動取消通知
 * @param {string} activityId - 活動 ID
 * @param {string} reason - 取消原因
 */
function sendCancellationToAllRegistrants(activityId, reason) {
  const activitiesSheet = getSheet(SHEET_ACTIVITIES);
  const registrationsSheet = getSheet(SHEET_REGISTRATIONS);
  
  const activities = activitiesSheet.getDataRange().getValues();
  const registrations = registrationsSheet.getDataRange().getValues();
  
  // 找到活動資料
  let activity = null;
  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] == activityId) {
      activity = {
        id: activities[i][0],
        title: activities[i][1],
        date: activities[i][2],
        startTime: activities[i][3],
        endTime: activities[i][4],
        location: activities[i][6],
        speaker: activities[i][7]
      };
      break;
    }
  }
  
  if (!activity) {
    Logger.log('❌ 找不到活動');
    return;
  }
  
  // 發送通知給所有報名者
  let count = 0;
  for (let j = 1; j < registrations.length; j++) {
    if (registrations[j][1] == activityId && registrations[j][10] === 'success') {
      const registration = {
        email: registrations[j][6],
        name: registrations[j][4]
      };
      
      sendActivityCancellationEmail(registration.email, registration.name, activity, reason);
      count++;
      Utilities.sleep(1000); // 避免發送過快
    }
  }
  
  Logger.log(`✅ 已發送 ${count} 封活動取消通知`);
}
```

---

## 🔄 前端程式碼修改

### 步驟 3：建立 API 連線模組

新增檔案：`網頁/scripts/api.js`

```javascript
/**
 * api.js
 * Google Apps Script API 連線模組
 */

// ========== 設定 GAS API URL ==========
// 部署後將此處替換為您的 GAS Web App URL
const GAS_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

/**
 * 呼叫 GAS API
 * @param {string} action - API 動作名稱
 * @param {object} data - 要傳送的資料
 * @param {string} method - HTTP 方法 (GET/POST)
 */
async function callGAS(action, data = null, method = 'GET') {
  try {
    let url = `${GAS_API_URL}?action=${action}`;
    const options = {
      method: method,
      muteHttpExceptions: true
    };
    
    if (method === 'POST' && data) {
      options.payload = JSON.stringify(data);
      options.contentType = 'application/json';
    }
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    return result;
  } catch (error) {
    console.error('API 呼叫失敗:', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ========== 活動相關 API ==========

/**
 * 取得所有活動
 */
async function fetchActivities() {
  const result = await callGAS('getActivities', null, 'GET');
  return result.success ? result.data : [];
}

/**
 * 建立新活動
 */
async function createActivity(activityData) {
  const result = await callGAS('createActivity', activityData, 'POST');
  return result;
}

/**
 * 更新活動
 */
async function updateActivity(activityData) {
  const result = await callGAS('updateActivity', activityData, 'POST');
  return result;
}

// ========== 報名相關 API ==========

/**
 * 取得報名記錄
 */
async function fetchRegistrations(activityId = null) {
  let action = 'getRegistrations';
  if (activityId) {
    action += `&activityId=${activityId}`;
  }
  const result = await callGAS(action, null, 'GET');
  return result.success ? result.data : {};
}

/**
 * 提交報名
 */
async function submitRegistration(registrationData) {
  const result = await callGAS('createRegistration', registrationData, 'POST');
  return result;
}

/**
 * 更新報名狀態
 */
async function updateRegistrationStatus(eventId, studentId, status) {
  const result = await callGAS('updateRegistration', {
    eventId: eventId,
    studentId: studentId,
    status: status
  }, 'POST');
  return result;
}
```

---

### 步驟 4：修改現有前端程式碼

#### 4.1 修改 `activities.js`

```javascript
// 原本從 localStorage 載入
// const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');

// 改為從 GAS API 載入
async function loadDynamicActivities() {
  const availableContainer = document.getElementById('availableActivities');
  if (!availableContainer) return;

  // 從 API 取得活動資料
  const events = await fetchActivities();
  
  // 過濾已截止的活動
  const availableEvents = events.filter(event => event.available !== false);
  
  if (availableEvents.length === 0) {
    availableContainer.innerHTML = `
      <div class="no-activities-message">
        <div style="font-size: 3rem;">📭</div>
        <p>目前無活動可報名</p>
      </div>
    `;
    return;
  }
  
  // 渲染活動卡片...
  availableEvents.forEach(event => {
    // ... 相同的渲染邏輯
  });
}
```

#### 4.2 修改 `registration.js`

```javascript
// 原本儲存到 localStorage
// localStorage.setItem('geeksoulRegistrations', JSON.stringify(registrations));

// 改為呼叫 GAS API
async function handleRegistrationSubmit() {
  submitBtn.addEventListener('click', async function() {
    // ... 驗證邏輯 ...
    
    const registrationData = {
      eventId: currentActivity.id,
      eventTitle: currentActivity.title,
      department: department,
      name: name,
      studentId: studentId,
      email: email,
      isMember: isMember,
      lineName: lineName || ''
    };
    
    // 呼叫 API 提交報名
    const result = await submitRegistration(registrationData);
    
    if (result.success) {
      // 使用 jQuery 淡出 Modal
      const modal = document.getElementById('registrationModal');
      $(modal).fadeOut(300, function() {
        document.body.classList.remove('modal-open');
        showSuccessToast();
      });
    } else {
      alert('報名失敗：' + result.message);
    }
  });
}
```

#### 4.3 修改 `staff-panel.js`

```javascript
// 建立活動時呼叫 API
async function handleCreateEventSubmit(e) {
  e.preventDefault();
  
  const eventData = {
    title: eventName,
    date: eventDate,
    location: eventLocation,
    speaker: eventSpeaker,
    quota: eventQuota,
    description: eventDescription,
    poster: eventPoster,
    fallbackBg: 'linear-gradient(135deg, #B71C1C, #F57C00)',
    available: eventStatus === '開放報名'
  };
  
  const result = await createActivity(eventData);
  
  if (result.success) {
    closeCreateEventModal();
    await loadCreatedEvents();
    showSuccessNotification(`活動「${eventName}」已成功建立！`);
  } else {
    alert('建立失敗：' + result.message);
  }
}
```

---

## 🚀 部署與測試流程

### 步驟 5：部署 Google Apps Script

1. **儲存專案**
   - 點選 **檔案 > 儲存**
   - 專案名稱：`極客魂社團報名系統API`

2. **部署為 Web 應用程式**
   - 點選 **部署 > 新增部署**
   - 類型：選擇 **網頁應用程式**
   - 說明：`v1.0 初版部署`
   - 執行身分：**我**
   - 存取權：**所有人**
   - 點選 **部署**

3. **授權資料存取權（首次部署必要步驟）**
   
   部署時會出現「網頁應用程式要求您授予資料存取權」的提示，請依照以下步驟完成授權：
   
   **步驟 3.1：選擇帳號**
   - 點選「授權存取權」
   - 選擇您的 Google 帳號
   
   **步驟 3.2：進階設定**
   - 如果出現「Google 尚未驗證這個應用程式」的警告畫面
   - 點選左下角的 **「進階」** 連結
   
   **步驟 3.3：前往專案**
   - 點選 **「前往『極客魂社團報名系統API』(不安全)」**
   - ⚠️ 注意：這是您自己建立的專案，完全安全
   
   **步驟 3.4：授予權限**
   - 查看權限清單：
     - 查看、編輯、建立及刪除您在 Google 試算表中的所有試算表
     - 以您的身分寄送電子郵件
   - 點選 **「允許」**
   
   **步驟 3.5：完成授權**
   - 授權成功後，系統會返回部署畫面
   - 繼續完成部署流程

4. **取得部署 URL**
   - 複製「網頁應用程式 URL」
   - 格式：`https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`   - 💡 提示：務必保存此 URL，後續前端程式會使用
5. **更新前端 API URL**
   - 開啟 `網頁/scripts/api.js`
   - 找到 `GAS_API_URL` 常數
   - 將 URL 替換為您在步驟 4 取得的部署 URL
   
   ```javascript
   // 將 YOUR_DEPLOYMENT_ID 替換為實際的部署 ID
   const GAS_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```

5-1. **切換至 GAS API 模式（重要！⚠️）**
   
   找到 `USE_LOCAL_STORAGE` 標誌並設為 `false`：
   
   ```javascript
   // 開發模式：設為 true 時使用 localStorage，設為 false 時使用 GAS API
   const USE_LOCAL_STORAGE = false;  // ← 改為 false 啟用 GAS API
   ```
   
   **📝 說明：**
   - `USE_LOCAL_STORAGE = true`：開發模式，使用瀏覽器本地儲存
   - `USE_LOCAL_STORAGE = false`：生產模式，使用 Google Sheets 雲端資料庫
   - 切換此標誌後無需修改其他程式碼
   - 建議先在本地測試 API 連線正常後再切換

6. **在 HTML 中引入 api.js（已完成 ✅）**
   
   以下頁面已正確引入 `api.js`：
   
   **✅ index.html（報名頁面）**
   ```html
   <script src="../scripts/api.js"></script>
   <script src="../scripts/jQuery.js"></script>
   <script src="../scripts/activities.js"></script>
   <script src="../scripts/registration.js"></script>
   ```
   
   **✅ staff-panel.html（幹部管理頁面）**
   ```html
   <script src="../scripts/api.js"></script>
   <script src="../scripts/staff-panel.js"></script>
   ```
   
   **✅ admin.html（行政查核頁面）**
   ```html
   <script src="../scripts/api.js"></script>
   <script src="../scripts/admin.js"></script>
   ```
   
   **📝 說明：**
   - `api.js` 必須在其他業務邏輯腳本之前載入
   - `overview.html` 和 `login.html` 為靜態頁面，無需引入
   - 引入順序：api.js → 業務邏輯 js（activities.js, staff-panel.js, admin.js）

---

### 步驟 6：測試流程

#### ⚠️ 測試前檢查清單

在開始測試前，請確認以下事項：

- [ ] **Google Sheet 已建立**：包含 Activities 和 Registrations 兩個工作表
- [ ] **GAS 程式碼已部署**：取得有效的 Web App URL
- [ ] **已完成授權**：允許 Google Sheet 和 Gmail 權限
- [ ] **api.js 中 GAS_API_URL 已更新**：替換為您的部署 URL
- [ ] **USE_LOCAL_STORAGE 已設為 false**：啟用 GAS API 模式
- [ ] **清除瀏覽器快取**：避免載入舊版 JavaScript 檔案

**🔧 切換至 GAS API 模式：**

編輯 `網頁/scripts/api.js`：
```javascript
const USE_LOCAL_STORAGE = false;  // 設為 false 啟用雲端模式
```

**💡 測試建議：**
1. 打開瀏覽器開發者工具（F12）→ Console 頁籤
2. 執行操作時觀察是否有 API 錯誤訊息
3. 在 Network 頁籤確認是否有對 GAS URL 的請求
4. 操作後立即檢查 Google Sheet 是否有新資料

---

#### 測試清單

- [ ] **活動管理**
  - [ ] 建立新活動
  - [ ] 編輯活動資訊
  - [ ] 查看活動列表
  - [ ] 關閉活動報名

- [ ] **報名功能**
  - [ ] 社員報名
  - [ ] 非社員報名
  - [ ] 重複報名檢查
  - [ ] 額滿狀態顯示

- [ ] **名單管理**
  - [ ] 查看報名名單
  - [ ] 更新報名狀態
  - [ ] 匯出 CSV

- [ ] **Email 通知**
  - [ ] 報名確認信
  - [ ] 信件內容正確性

---

### 步驟 7：偵錯工具

#### GAS 內建 Logger
```javascript
Logger.log('除錯訊息：' + JSON.stringify(data));
```

查看 Log：**執行 > 執行紀錄**

#### 前端 Console
```javascript
console.log('API 回應：', result);
```

---

## ❓ 常見問題與除錯

### Q1：API 呼叫失敗，顯示 CORS 錯誤？
**A：** CORS 錯誤的真正解決方案：

**✅ 正確做法：創建新的部署**

Google Apps Script 的 Web App 在部署時會自動處理 CORS，但有時更新部署可能無法正確生效。解決方法：

1. **刪除舊部署，創建新部署**：
   - 前往 **部署 > 管理部署**
   - 點選舊部署旁的 **🗑️ 封存** 按鈕（不是刪除）
   - 點選 **部署 > 新增部署**
   - 類型：選擇 **網頁應用程式**
   - 說明：`v2.0 修正 CORS`
   - 執行身分：**我**
   - 存取權：**所有人**（重要！不是「僅限我自己」）
   - 點選 **部署**
   - **複製新的 Web App URL**

2. **更新前端 api.js 中的 URL**：
   ```javascript
   const GAS_API_URL = '新的部署URL';
   ```

3. **清除瀏覽器快取**：Ctrl + F5

**⚠️ 重要：**
- Google Apps Script 的 Web App 會自動處理 CORS
- **不需要** `doOptions` 函數
- **不需要** `.setHeaders()` 方法（這個方法根本不存在）
- 確保部署設定為「存取權：所有人」是關鍵

**🔍 如何確認部署設定正確：**
- 在瀏覽器直接訪問：`YOUR_GAS_URL?action=getActivities`
- 應該能看到 JSON 回應（不會被 CORS 阻擋）
- 如果看到登入頁面或錯誤，表示「存取權」設定錯誤

### Q2：資料沒有進入 Google Sheet，仍在使用 localStorage？
**A：** 這是最常見的問題！請確認：
1. **檢查 api.js 中的模式標誌：**
   ```javascript
   const USE_LOCAL_STORAGE = false;  // 必須是 false
   ```
2. **確認 GAS_API_URL 已更新**：不是預設的 `YOUR_DEPLOYMENT_ID`
3. **清除瀏覽器快取**：Ctrl+F5 強制重新載入
4. **開啟開發者工具**：
   - F12 → Console 查看是否有 API 錯誤
   - Network 頁籤確認是否有對 GAS URL 的請求
   - 如果看到 `localhost` 或 `file://` 開頭的請求，表示尚未切換

### Q3：資料寫入失敗？
**A：** 檢查：
- Sheet 名稱是否正確（Activities / Registrations）
- 欄位順序是否對應
- 資料型別是否正確

### Q4：Email 寄送失敗？
**A：** 
- 首次執行需授權 Gmail 權限（參考步驟 3：授權資料存取權）
- 每日寄信上限：100 封（免費 Google 帳號）
- 如果仍無法寄送，檢查 `MailApp.sendEmail()` 參數是否正確
- 確認 email 欄位格式正確

### Q5：如何確認是否成功切換至 GAS API？
**A：** 使用以下方法驗證：
1. **開啟瀏覽器開發者工具（F12）**
2. **執行建立活動或報名操作**
3. **查看 Network 頁籤**：
   - ✅ 正確：看到對 `https://script.google.com/macros/s/.../exec` 的請求
   - ❌ 錯誤：沒有任何網路請求（表示仍在用 localStorage）
4. **查看 Google Sheet**：
   - 操作後立即檢查工作表是否有新增資料列
5. **Console 頁籤**：
   - 如果有錯誤會顯示詳細訊息

### Q6：如何更新已部署的 GAS？
**A：**
1. 修改程式碼後儲存
2. **部署 > 管理部署**
3. 點選版本旁的 ✏️ 編輯
4. 選擇「新版本」
5. 儲存
6. ⚠️ 注意：URL 不會改變，前端無需修改

### Q7：如何備份資料？
**A：**
- Google Sheet 本身即為資料庫
- 定期 **檔案 > 建立副本** 備份

---

## 📝 遷移檢查清單

- [ ] Google Sheet 建立完成
- [ ] 兩個工作表（Activities / Registrations）已建立
- [ ] 標題列正確設定
- [ ] 完成授權流程（允許資料存取權）
- [ ] GAS Code.gs 程式碼已貼上
- [ ] 部署為 Web 應用程式
- [ ] 取得部署 URL
- [ ] 建立 api.js 檔案（已完成 ✅）
- [ ] 更新 api.js 中的 GAS_API_URL
- [ ] **將 USE_LOCAL_STORAGE 設為 false（重要！⚠️）**
- [ ] 清除瀏覽器快取（Ctrl+F5）
- [ ] 修改 activities.js（已完成 ✅）
- [ ] 修改 registration.js（已完成 ✅）
- [ ] 修改 staff-panel.js（已完成 ✅）
- [ ] 修改 admin.js（已完成 ✅）
- [ ] HTML 引入 api.js（已完成 ✅）
- [ ] 使用 F12 開發者工具確認 API 請求
- [ ] 測試建立活動（檢查 Activities 工作表）
- [ ] 測試報名功能
- [ ] 測試查看名單
- [ ] 測試 Email 通知
- [ ] 設定自動觸發器（每日活動提醒）

---

## 📧 Email 功能完整說明

### ✉️ Email 功能特色

本系統實作了完整的 Email 通知功能，包含：

1. **📨 報名確認信**
   - 報名成功後立即自動發送
   - 包含完整活動資訊與報名明細
   - 精美 HTML 格式設計（附純文字備用版）
   - 個人化稱呼與社團品牌形象

2. **⏰ 活動提醒信**
   - 活動前一天自動發送
   - 提醒活動時間、地點、注意事項
   - 減少學員忘記參加的情況

3. **❌ 活動取消通知**
   - 活動取消時批量通知所有報名者
   - 說明取消原因，降低抱怨
   - 引導查看其他活動

---

### 🔧 Email 功能使用方式

#### 1. 報名確認信（自動發送）

報名確認信會在學員成功報名時自動發送，無需手動操作。

**觸發時機**：
- 學員完成報名表單提交
- `registerActivity()` 函數成功執行後
- 自動呼叫 `sendConfirmationEmail()`

**內容包含**：
- ✅ 報名成功確認
- 📋 活動詳細資訊（日期、時間、地點、講師）
- 👤 學員報名資料（姓名、學號、系級、社員身份）
- ⚠️ 重要提醒事項
- 🔗 查看報名記錄連結

#### 2. 活動提醒信（自動觸發器）

**設定步驟**：

1. 開啟 Google Apps Script 編輯器
2. 點擊左側的 **「⏰ 觸發條件」**（時鐘圖示）
3. 點擊右下角的 **「+ 新增觸發條件」**

4. 設定觸發條件：
   ```
   選擇要執行的函式：sendTomorrowActivityReminders
   選擇活動來源：時間驅動
   選擇時間型觸發條件類型：每日計時器
   選擇時段：晚上 8 點到 9 點（或您偏好的時間）
   ```

5. 點擊 **「儲存」**

6. 首次執行時會要求授權：
   - 點擊「查看權限」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往《專案名稱》(不安全)」
   - 點擊「允許」

**運作方式**：
- 每天指定時間（例如晚上 8 點）自動執行
- 檢查明天是否有活動
- 自動發送提醒信給所有已報名且狀態為「success」的學員
- 每封信之間間隔 1 秒，避免 Gmail 限制

**手動測試**：
```javascript
// 在 GAS 編輯器中點擊「執行」測試
sendTomorrowActivityReminders();
```

#### 3. 活動取消通知（手動批量發送）

當活動需要取消時，可使用此功能批量通知所有報名者。

**使用方式**：

在 Google Apps Script 編輯器中執行：

```javascript
// 方式 1：在編輯器中直接執行
function testCancelActivity() {
  const activityId = '1767346060698'; // 替換為實際活動 ID
  const reason = '因講師臨時有事，本次活動延期舉辦，新日期將於近日公告。';
  
  sendCancellationToAllRegistrants(activityId, reason);
}
```

**或透過前端呼叫**（需新增 API 端點）：

在 `doPost()` 中新增：

```javascript
case 'sendCancellationEmail':
  return sendCancellationToAllRegistrants(data.activityId, data.reason);
```

然後在前端（admin.js 或 staff-panel.js）呼叫：

```javascript
async function cancelActivityAndNotify(activityId, reason) {
  const response = await api.sendCancellationEmail({
    activityId: activityId,
    reason: reason
  });
  
  if (response.success) {
    alert('✅ 活動取消通知已發送給所有報名者');
  }
}
```

---

### 📊 Email 發送限制與注意事項

#### Gmail 每日發送限制：

| 帳號類型 | 每日限制 |
|---------|---------|
| 免費 Gmail 帳號 | 100 封/天 |
| Google Workspace 帳號 | 1,500 封/天 |

#### 最佳實踐：

1. **避免發送過快**
   - 程式碼中已加入 `Utilities.sleep(1000)`
   - 每封信間隔 1 秒發送

2. **監控發送狀況**
   - 使用 `Logger.log()` 記錄發送結果
   - 在 GAS 編輯器中查看「執行記錄」

3. **錯誤處理**
   - Email 發送失敗不會中斷流程
   - 錯誤會記錄在 Logger 中

4. **測試環境**
   - 先用測試信箱測試
   - 確認無誤後再正式上線

---

### 🎨 Email 樣式自訂

所有 Email 都使用 HTML 格式，可自訂樣式：

**品牌色彩**：
- 主色：`#B71C1C`（深紅色）
- 輔色：`#F57C00`（橘色）
- 漸層：`linear-gradient(135deg, #B71C1C, #F57C00)`

**自訂連結**：
在 Email 函數中搜尋並替換：
- `https://your-website.com` → 實際網站網址
- `geekspirit.club@example.com` → 實際社團 Email
- `@geekspirit` → 實際 Line 官方帳號

---

### 🔍 測試 Email 功能

#### 方式 1：透過前端報名測試

1. 開啟網頁系統
2. 報名任一活動
3. 填寫真實 Email
#### 方式 1：透過前端報名測試（推薦）

**這是最真實的測試方式，完全模擬學員報名流程：**

1. 開啟網頁系統（index.html 或使用 Live Server）
2. 瀏覽活動列表，點擊「立即報名」
3. 填寫報名表單，**Email 欄位填寫您的真實信箱**
4. 點擊「送出報名」
5. **系統會立即發送報名確認信**（不需要等到活動前一天）
6. 檢查信箱（包含垃圾郵件資料夾）
7. 確認收到精美的 HTML 格式確認信

**測試重點**：
- ✅ 表單送出後立即發信（測試模式）
- ✅ Email 包含完整活動資訊
- ✅ HTML 格式顯示正常
- ✅ 所有個人資料正確顯示
- ✅ 社團品牌色彩與 Logo 正確

#### 方式 2：在 GAS 編輯器中直接測試

**適合快速測試 Email 樣式與內容：**

```javascript
// 測試報名確認信
function testConfirmationEmail() {
  const testData = {
    activityName: '極客魂新生入門講座',
    eventTitle: '極客魂新生入門講座', // 備用欄位
    name: '王小明',
    studentId: 'A123456789',
    department: '資訊工程系',
    email: 'your-test-email@gmail.com', // ⚠️ 替換為您的測試信箱
    isMember: true,
    lineName: 'xiaoming_wang'
  };
  
  const testActivity = {
    title: '極客魂新生入門講座',
    date: '2026年1月15日',
    startTime: '2026-01-15T19:00',
    endTime: '2026-01-15T21:00',
    deadline: '2026-01-14T23:59',
    location: '資訊大樓 101 教室',
    speaker: '技術長 David',
    description: '本次活動將介紹社團運作方式與核心技術分享，歡迎對程式設計有興趣的同學參加！'
  };
  
  Logger.log('🧪 開始測試 Email 發送...');
  sendConfirmationEmail(testData, testActivity);
  Logger.log('✅ 測試完成，請檢查信箱');
}
```

**執行步驟**：
1. 複製上面程式碼到 Code.gs 最下方
2. **修改 `your-test-email@gmail.com` 為您的信箱**
3. 點擊上方工具列的「執行」
4. 選擇 `testConfirmationEmail` 函數
5. 首次執行會要求授權（允許發送 Gmail）
6. 執行完成後檢查信箱

點擊「執行」→ 選擇 `testConfirmationEmail` → 檢查信箱

#### 方式 3：查看執行記錄

1. 點擊 GAS 編輯器上方的「執行」
2. 選擇要測試的函數
3. 點擊左側的「執行記錄」查看 Logger 輸出
4. 確認是否有「✅ Email 已發送」訊息

---

### ⚠️ 常見問題排除

#### Q1：為什麼沒收到 Email？

**檢查清單**：
- ✅ 檢查垃圾郵件資料夾
- ✅ 確認 Email 地址正確無誤
- ✅ 檢查 GAS 執行記錄是否有錯誤
- ✅ 確認已授權 Gmail 發送權限
- ✅ 檢查是否超過每日發送限制（100 封）

#### Q2：Email 格式跑版怎麼辦？

**解決方式**：
- Gmail、Outlook、Yahoo 等主流信箱都支援 HTML 格式
- 如果特定信箱不支援，會自動顯示純文字版本
- 可在 `plainBody` 中調整純文字版本內容

#### Q3：如何修改 Email 內容？

直接在 GAS.md 或 Code.gs 中修改對應函數：
- `sendConfirmationEmail()` - 報名確認信
- `sendActivityReminderEmail()` - 活動提醒信
- `sendActivityCancellationEmail()` - 活動取消通知

修改後記得重新部署：
1. 儲存程式碼
2. 部署 → 管理部署 → 編輯 → 新版本 → 部署

#### Q4：如何停用 Email 功能？

**暫時停用**：
在對應函數中將 `MailApp.sendEmail()` 註解掉：

```javascript
// MailApp.sendEmail({...});
Logger.log('Email 發送已停用（測試模式）');
```

**完全移除**：
刪除 Email 相關函數呼叫：

```javascript
// 在 registerActivity() 中註解掉
// sendConfirmationEmail(data, activityData);
```

---

### 📈 Email 效能優化建議

1. **使用範本系統**
   - 將 HTML 樣式抽取為共用範本
   - 減少重複程式碼

2. **非同步發送**
   - 考慮使用佇列系統
   - 大量發送時分批處理

3. **追蹤開信率**
   - 使用追蹤像素（tracking pixel）
   - 分析哪些信件最有效

4. **個人化內容**
   - 根據社員/非社員身份調整內容
   - 推薦相關活動

---

## 🎯 下一步優化建議

1. **增加快取機制**：減少 API 呼叫次數
2. **錯誤處理優化**：更友善的錯誤提示
3. **Loading 動畫**：API 請求時顯示載入中
4. **離線支援**：使用 Service Worker
5. **權限管理**：幹部登入驗證
6. **Email 範本管理**：視覺化編輯器
7. **簡訊通知整合**：重要活動雙重提醒

---

**完成日期：** 2026/01/02  
**版本：** v1.0（含完整 Email 功能）  
**維護者：** 極客魂社團技術組
