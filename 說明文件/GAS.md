# Google Apps Script 整合指南
## 將 localStorage 遷移至 Google Sheet 資料庫

---

## 📋 目錄

1. [整體架構說明](#整體架構說明)
2. [Google Sheet 資料結構設計](#google-sheet-資料結構設計)
3. [Google Apps Script 實作](#google-apps-script-實作)
4. [前端程式碼修改](#前端程式碼修改)
5. [部署與測試流程](#部署與測試流程)
6. [常見問題與除錯](#常見問題與除錯)

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
| C - 活動日期 | 舉辦日期時間 | 2026年1月15日 19:00 - 21:00 |
| D - 活動地點 | 舉辦地點 | 資訊大樓 101 教室 |
| E - 講師 | 主講人 | 技術長 David |
| F - 名額上限 | 報名人數上限 | 50 |
| G - 活動說明 | 詳細描述 | 本次活動將介紹... |
| H - 海報連結 | Google Drive 海報 URL | https://drive.google.com/... |
| I - 漸層背景 | 備用背景色 | linear-gradient(135deg, #B71C1C, #F57C00) |
| J - 報名狀態 | 是否開放報名 | TRUE / FALSE |
| K - 建立時間 | 建立時間戳記 | 2026-01-02 10:30:00 |

**第一列（標題列）範例：**
```
ID | 活動名稱 | 活動日期 | 活動地點 | 講師 | 名額上限 | 活動說明 | 海報連結 | 漸層背景 | 報名狀態 | 建立時間
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

```javascript
/**
 * 極客魂社團活動報名系統 - Google Apps Script API
 * 提供 RESTful API 供前端呼叫
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
      'ID', '活動名稱', '活動日期', '活動地點', '講師', 
      '名額上限', '活動說明', '海報連結', '漸層背景', 
      '報名狀態', '建立時間'
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
        return createResponse(false, '無效的 action 參數');
    }
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  try {
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
        return createResponse(false, '無效的 action 參數');
    }
  } catch (error) {
    return createResponse(false, error.toString());
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
      location: row[3],
      speaker: row[4],
      quota: row[5],
      description: row[6],
      poster: row[7],
      fallbackBg: row[8],
      available: row[9],
      createdAt: row[10]
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
      sheet.getRange(i + 1, 2, 1, 9).setValues([[
        data.title,
        data.date,
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
      // 將報名狀態設為 false
      sheet.getRange(i + 1, 10).setValue(false);
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
  
  // 發送確認信（可選）
  sendConfirmationEmail(data);
  
  return createResponse(true, { registrationId: registrationId }, '報名成功');
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
function sendConfirmationEmail(data) {
  try {
    const subject = `【極客魂社團】活動報名確認 - ${data.eventTitle}`;
    const body = `
親愛的 ${data.name} 同學，您好：

感謝您報名參加「${data.eventTitle}」！

📋 報名資訊確認：
- 姓名：${data.name}
- 學號：${data.studentId}
- 系級：${data.department}
- 社員身份：${data.isMember === 'yes' ? '是' : '否'}
- 報名時間：${new Date().toLocaleString('zh-TW')}

✅ 您的報名已成功送出，系統將依照報名順序與社員優先原則進行名額分配。

如有任何問題，歡迎聯繫社團幹部。

---
極客魂社團 敬上
    `;
    
    MailApp.sendEmail(data.email, subject, body);
  } catch (error) {
    Logger.log('Email 發送失敗：' + error);
  }
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

3. **取得部署 URL**
   - 複製「網頁應用程式 URL」
   - 格式：`https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

4. **更新前端 API URL**
   - 開啟 `網頁/scripts/api.js`
   - 將 `GAS_API_URL` 替換為您的部署 URL

5. **在 HTML 中引入 api.js**
   ```html
   <script src="../scripts/api.js"></script>
   ```

---

### 步驟 6：測試流程

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
**A：** GAS Web App 已自動處理 CORS，確認：
- 部署時「存取權」設為「所有人」
- API URL 正確無誤

### Q2：資料寫入失敗？
**A：** 檢查：
- Sheet 名稱是否正確（Activities / Registrations）
- 欄位順序是否對應
- 資料型別是否正確

### Q3：Email 寄送失敗？
**A：** 
- 首次執行需授權 Gmail 權限
- 每日寄信上限：100 封

### Q4：如何更新已部署的 GAS？
**A：**
1. 修改程式碼後儲存
2. **部署 > 管理部署**
3. 點選版本旁的 ✏️ 編輯
4. 選擇「新版本」
5. 儲存

### Q5：如何備份資料？
**A：**
- Google Sheet 本身即為資料庫
- 定期 **檔案 > 建立副本** 備份

---

## 📝 遷移檢查清單

- [ ] Google Sheet 建立完成
- [ ] 兩個工作表（Activities / Registrations）已建立
- [ ] 標題列正確設定
- [ ] GAS Code.gs 程式碼已貼上
- [ ] 部署為 Web 應用程式
- [ ] 取得部署 URL
- [ ] 建立 api.js 檔案
- [ ] 更新 API URL
- [ ] 修改 activities.js
- [ ] 修改 registration.js
- [ ] 修改 staff-panel.js
- [ ] 修改 admin.js
- [ ] HTML 引入 api.js
- [ ] 測試建立活動
- [ ] 測試報名功能
- [ ] 測試查看名單
- [ ] 測試 Email 通知

---

## 🎯 下一步優化建議

1. **增加快取機制**：減少 API 呼叫次數
2. **錯誤處理優化**：更友善的錯誤提示
3. **Loading 動畫**：API 請求時顯示載入中
4. **離線支援**：使用 Service Worker
5. **權限管理**：幹部登入驗證

---

**完成日期：** 2026/01/02  
**版本：** v1.0  
**維護者：** 極客魂社團技術組
