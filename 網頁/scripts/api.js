/**
 * api.js
 * Google Apps Script API 連線模組
 */

// ========== 設定 GAS API URL ==========
// 部署後將此處替換為您的 GAS Web App URL
const GAS_API_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// 開發模式：設為 true 時使用 localStorage，設為 false 時使用 GAS API
const USE_LOCAL_STORAGE = true;

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
      mode: 'cors'
    };
    
    if (method === 'POST' && data) {
      options.body = JSON.stringify(data);
      options.headers = {
        'Content-Type': 'application/json'
      };
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
  if (USE_LOCAL_STORAGE) {
    // 開發模式：從 localStorage 讀取
    const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
    return events;
  } else {
    // 正式模式：從 GAS API 讀取
    const result = await callGAS('getActivities', null, 'GET');
    return result.success ? result.data : [];
  }
}

/**
 * 建立新活動
 */
async function createActivityAPI(activityData) {
  if (USE_LOCAL_STORAGE) {
    // 開發模式：儲存到 localStorage
    const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
    const newEvent = {
      ...activityData,
      id: Date.now()
    };
    events.push(newEvent);
    localStorage.setItem('geeksoulEvents', JSON.stringify(events));
    return { success: true, data: { id: newEvent.id }, message: '活動建立成功' };
  } else {
    // 正式模式：呼叫 GAS API
    const result = await callGAS('createActivity', activityData, 'POST');
    return result;
  }
}

/**
 * 更新活動
 */
async function updateActivityAPI(activityData) {
  if (USE_LOCAL_STORAGE) {
    // 開發模式：更新 localStorage
    const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
    const index = events.findIndex(e => e.id === activityData.id);
    if (index !== -1) {
      events[index] = activityData;
      localStorage.setItem('geeksoulEvents', JSON.stringify(events));
      return { success: true, message: '活動更新成功' };
    }
    return { success: false, message: '找不到該活動' };
  } else {
    // 正式模式：呼叫 GAS API
    const result = await callGAS('updateActivity', activityData, 'POST');
    return result;
  }
}

/**
 * 刪除活動（標記為關閉）
 */
async function deleteActivityAPI(activityId) {
  if (USE_LOCAL_STORAGE) {
    // 開發模式：更新 localStorage
    const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
    const index = events.findIndex(e => e.id === activityId);
    if (index !== -1) {
      events[index].available = false;
      localStorage.setItem('geeksoulEvents', JSON.stringify(events));
      return { success: true, message: '活動已關閉' };
    }
    return { success: false, message: '找不到該活動' };
  } else {
    // 正式模式：呼叫 GAS API
    const result = await callGAS('deleteActivity', { id: activityId }, 'POST');
    return result;
  }
}

// ========== 報名相關 API ==========

/**
 * 取得報名記錄
 */
async function fetchRegistrations(activityId = null) {
  if (USE_LOCAL_STORAGE) {
    // 開發模式：從 localStorage 讀取
    const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
    if (activityId) {
      return { [activityId]: registrations[activityId] || [] };
    }
    return registrations;
  } else {
    // 正式模式：從 GAS API 讀取
    let action = 'getRegistrations';
    if (activityId) {
      action += `&activityId=${activityId}`;
    }
    const result = await callGAS(action, null, 'GET');
    return result.success ? result.data : {};
  }
}

/**
 * 提交報名
 */
async function submitRegistration(registrationData) {
  if (USE_LOCAL_STORAGE) {
    // 開發模式：儲存到 localStorage
    const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
    
    // 檢查是否已報名
    if (registrations[registrationData.eventId]) {
      const exists = registrations[registrationData.eventId].find(
        r => r.studentId === registrationData.studentId
      );
      if (exists) {
        return { success: false, message: '您已經報名過此活動' };
      }
    }
    
    if (!registrations[registrationData.eventId]) {
      registrations[registrationData.eventId] = [];
    }
    
    const newRegistration = {
      ...registrationData,
      timestamp: new Date().toISOString()
    };
    
    registrations[registrationData.eventId].push(newRegistration);
    localStorage.setItem('geeksoulRegistrations', JSON.stringify(registrations));
    
    return { success: true, message: '報名成功' };
  } else {
    // 正式模式：呼叫 GAS API
    const result = await callGAS('createRegistration', registrationData, 'POST');
    return result;
  }
}

/**
 * 更新報名狀態
 */
async function updateRegistrationStatus(eventId, studentId, status) {
  if (USE_LOCAL_STORAGE) {
    // 開發模式：更新 localStorage
    const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
    if (registrations[eventId]) {
      const registration = registrations[eventId].find(r => r.studentId === studentId);
      if (registration) {
        registration.savedStatus = status;
        localStorage.setItem('geeksoulRegistrations', JSON.stringify(registrations));
        return { success: true, message: '狀態更新成功' };
      }
    }
    return { success: false, message: '找不到該報名記錄' };
  } else {
    // 正式模式：呼叫 GAS API
    const result = await callGAS('updateRegistration', {
      eventId: eventId,
      studentId: studentId,
      status: status
    }, 'POST');
    return result;
  }
}
