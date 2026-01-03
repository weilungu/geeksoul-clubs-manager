/**
 * api.js
 * localStorage 資料儲存模組
 * 使用瀏覽器本地儲存來管理活動與報名資料
 */


// ========== 活動相關 API ==========

/**
 * 取得所有活動
 */
async function fetchActivities() {
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  return events;
}

/**
 * 建立新活動
 */
async function createActivityAPI(activityData) {
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const newEvent = {
    ...activityData,
    id: Date.now()
  };
  events.push(newEvent);
  localStorage.setItem('geeksoulEvents', JSON.stringify(events));
  return { success: true, data: { id: newEvent.id }, message: '活動建立成功' };
}

/**
 * 更新活動
 */
async function updateActivityAPI(activityData) {
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const index = events.findIndex(e => e.id === activityData.id);
  if (index !== -1) {
    events[index] = activityData;
    localStorage.setItem('geeksoulEvents', JSON.stringify(events));
    return { success: true, message: '活動更新成功' };
  }
  return { success: false, message: '找不到該活動' };
}

/**
 * 刪除活動（標記為關閉）
 */
async function deleteActivityAPI(activityId) {
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const index = events.findIndex(e => e.id === activityId);
  if (index !== -1) {
    events[index].available = false;
    localStorage.setItem('geeksoulEvents', JSON.stringify(events));
    return { success: true, message: '活動已關閉' };
  }
  return { success: false, message: '找不到該活動' };
}


// ========== 報名相關 API ==========

/**
 * 取得報名記錄
 */
async function fetchRegistrations(activityId = null) {
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
  if (activityId) {
    return { [activityId]: registrations[activityId] || [] };
  }
  return registrations;
}

/**
 * 提交報名
 */
async function submitRegistration(registrationData) {
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
}

/**
 * 更新報名狀態
 */
async function updateRegistrationStatus(eventId, studentId, status) {
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
}
