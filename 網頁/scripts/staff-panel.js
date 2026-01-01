/**
 * staff-panel.js
 * 幹部管理面板模組：處理活動新增與管理功能
 */

// 當前編輯模式：null = 新增模式，數字 = 編輯模式（存放 eventId）
let currentEditingEventId = null;

// 顯示成功通知
function showSuccessNotification(message) {
  const notification = document.getElementById('successNotification');
  const messageSpan = document.getElementById('successMessage');
  
  if (!notification || !messageSpan) return;
  
  // 設定訊息內容
  messageSpan.textContent = message;
  
  // 顯示通知（使用 jQuery 淡入）
  $(notification).hide().fadeIn(300);
  
  // 平滑滾動到通知位置
  $('html, body').animate({
    scrollTop: $(notification).offset().top - 100
  }, 400);
  
  // 3 秒後淡出
  setTimeout(function() {
    $(notification).fadeOut(500);
  }, 3000);
}

// 開啟新增活動 Modal
function openCreateEventModal() {
  const createEventModal = document.getElementById('createEventModal');
  if (!createEventModal) return;
  
  // 設定為新增模式
  currentEditingEventId = null;
  updateModalForMode();
  
  openModalWithFade(createEventModal);
  document.body.classList.add('modal-open');
}

// 開啟編輯活動 Modal
function openEditEventModal(eventId) {
  const createEventModal = document.getElementById('createEventModal');
  if (!createEventModal) return;

  // 從 localStorage 讀取活動資料
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const event = events.find(e => e.id === eventId);
  
  if (!event) {
    alert('找不到該活動資料。');
    return;
  }

  // 設定為編輯模式
  currentEditingEventId = eventId;
  updateModalForMode();
  
  // 填入現有資料
  document.getElementById('eventName').value = event.title || '';
  document.getElementById('eventDate').value = event.date || '';
  document.getElementById('eventLocation').value = event.location || '';
  document.getElementById('eventSpeaker').value = event.speaker || '';
  document.getElementById('eventDescription').value = event.description || '';
  document.getElementById('eventQuota').value = event.quota || '';
  
  // 從 poster URL 還原 Google Drive ID
  if (event.poster) {
    const match = event.poster.match(/id=([A-Za-z0-9_-]+)/);
    document.getElementById('eventPoster').value = match ? match[1] : '';
  } else {
    document.getElementById('eventPoster').value = '';
  }
  
  // 設定報名狀態
  const statusSelect = document.getElementById('eventStatus');
  if (event.available) {
    statusSelect.value = '開放報名';
  } else {
    statusSelect.value = '已截止';
  }

  openModalWithFade(createEventModal);
  document.body.classList.add('modal-open');
}

// 根據模式更新 Modal 標題和按鈕文字
function updateModalForMode() {
  const modalTitle = document.querySelector('#createEventModal .modal-header h2');
  const submitBtn = document.getElementById('submitCreateEventBtn');
  
  if (currentEditingEventId === null) {
    // 新增模式
    if (modalTitle) modalTitle.textContent = '新增活動表單';
    if (submitBtn) submitBtn.textContent = '建立活動';
  } else {
    // 編輯模式
    if (modalTitle) modalTitle.textContent = '編輯活動表單';
    if (submitBtn) submitBtn.textContent = '儲存變更';
  }
}

// 關閉新增活動 Modal
function closeCreateEventModal() {
  const createEventModal = document.getElementById('createEventModal');
  const createEventForm = document.getElementById('createEventForm');
  if (!createEventModal) return;

  // 使用 jQuery 淡出效果
  $(createEventModal).fadeOut(300, function() {
    document.body.classList.remove('modal-open');
    
    // 重置表單
    if (createEventForm) {
      createEventForm.reset();
    }
    
    // 重置編輯模式
    currentEditingEventId = null;
  });
}

// 處理新增/編輯活動表單提交
function handleCreateEventSubmit(e) {
  e.preventDefault();
  
  const createEventForm = document.getElementById('createEventForm');
  
  // 檢查表單驗證
  if (!createEventForm.checkValidity()) {
    createEventForm.reportValidity();
    return;
  }

  // 收集表單資料
  const eventName = document.getElementById('eventName').value.trim();
  const eventDate = document.getElementById('eventDate').value.trim();
  const eventLocation = document.getElementById('eventLocation').value.trim();
  const eventSpeaker = document.getElementById('eventSpeaker').value.trim();
  const eventDescription = document.getElementById('eventDescription').value.trim();
  const eventQuota = document.getElementById('eventQuota').value;
  const eventPosterInput = document.getElementById('eventPoster').value.trim();
  const eventStatus = document.getElementById('eventStatus').value;

  // 處理 Google Drive ID
  let eventPoster = '';
  if (eventPosterInput) {
    // 驗證 Google Drive ID 格式（一般為 20-50 個字元的英數字元、底線、橫線）
    const driveIdPattern = /^[A-Za-z0-9_-]{20,50}$/;
    if (driveIdPattern.test(eventPosterInput)) {
      // 如果格式正確，轉換為 thumbnail URL
      eventPoster = `https://drive.google.com/thumbnail?id=${eventPosterInput}&sz=w1000`;
    }
    // 如果格式錯誤，eventPoster 保持為空字串，將使用 fallbackBg
  }

  // 從 localStorage 讀取現有活動
  let events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');

  if (currentEditingEventId === null) {
    // 新增模式：建立新活動物件
    const newEvent = {
      id: Date.now(),
      title: eventName,
      date: eventDate,
      location: eventLocation,
      speaker: eventSpeaker,
      quota: eventQuota,
      description: eventDescription || '',
      poster: eventPoster,
      fallbackBg: 'linear-gradient(135deg, #B71C1C, #F57C00)',
      available: eventStatus === '開放報名'
    };
    
    events.push(newEvent);
    localStorage.setItem('geeksoulEvents', JSON.stringify(events));
    
    // 關閉 Modal 並顯示成功訊息
    closeCreateEventModal();
    loadCreatedEvents();
    showSuccessNotification(`活動「${eventName}」已成功建立！請前往首頁查看新增的活動。`);
    return;
  } else {
    // 編輯模式：更新現有活動
    const eventIndex = events.findIndex(e => e.id === currentEditingEventId);
    
    if (eventIndex === -1) {
      alert('找不到該活動，無法更新。');
      return;
    }
    
    // 保留原有的 id 和 fallbackBg
    events[eventIndex] = {
      ...events[eventIndex],
      title: eventName,
      date: eventDate,
      location: eventLocation,
      speaker: eventSpeaker,
      quota: eventQuota,
      description: eventDescription || '',
      poster: eventPoster,
      available: eventStatus === '開放報名'
    };
    
    localStorage.setItem('geeksoulEvents', JSON.stringify(events));
    
    // 關閉 Modal 並顯示成功訊息
    closeCreateEventModal();
    loadCreatedEvents();
    showSuccessNotification(`活動「${eventName}」已成功更新！`);
  }
}

// 載入已建立的活動
function loadCreatedEvents() {
  const eventsTableBody = document.querySelector('table tbody');
  if (!eventsTableBody) return;

  // 從 localStorage 讀取活動
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  
  // 從 localStorage 讀取所有報名記錄
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');

  // 清空表格（移除示例數據）
  eventsTableBody.innerHTML = '';

  // 如果沒有活動，顯示提示訊息
  if (events.length === 0) {
    eventsTableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
          目前尚未建立任何活動。點擊上方「建立新活動」按鈕開始新增。
        </td>
      </tr>
    `;
    return;
  }

  // 渲染每個活動
  events.forEach(event => {
    // 計算該活動的報名人數
    const eventRegistrations = registrations[event.id] || [];
    const registeredCount = eventRegistrations.length;
    
    // 判斷報名狀態
    let statusBadge = '';
    let statusText = '';
    
    if (event.available) {
      statusBadge = 'success';
      statusText = '開放報名';
    } else {
      statusBadge = 'secondary';
      statusText = '已截止';
    }
    
    // 如果額滿，顯示額滿狀態
    if (registeredCount >= event.quota) {
      statusBadge = 'warning';
      statusText = '已額滿';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${event.title}</strong></td>
      <td><span class="badge ${statusBadge}">${statusText}</span></td>
      <td>${registeredCount} / ${event.quota}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem;" onclick="editEvent(${event.id})">編輯</button>
        <button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.9rem; margin-left: 0.5rem;" onclick="viewRegistrations(${event.id})">查看名單</button>
      </td>
    `;
    
    eventsTableBody.appendChild(row);
  });
}

// 編輯活動
function editEvent(eventId) {
  openEditEventModal(eventId);
}

// 查看報名名單（占位功能）
function viewRegistrations(eventId) {
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
  const eventRegistrations = registrations[eventId] || [];
  
  if (eventRegistrations.length === 0) {
    alert('目前尚無報名記錄。');
    return;
  }
  
  // 簡單顯示報名人數
  alert(`目前已有 ${eventRegistrations.length} 人報名此活動。\n\n詳細名單功能開發中...`);
  // TODO: 實作詳細名單顯示
}

// 初始化幹部面板
function initStaffPanel() {
  const createEventModal = document.getElementById('createEventModal');
  if (!createEventModal) return;

  const modalClose = createEventModal.querySelector('.modal-close');
  const cancelCreateEventBtn = document.getElementById('cancelCreateEventBtn');
  const createEventForm = document.getElementById('createEventForm');

  // 綁定關閉按鈕
  if (modalClose) modalClose.addEventListener('click', closeCreateEventModal);
  if (cancelCreateEventBtn) cancelCreateEventBtn.addEventListener('click', closeCreateEventModal);

  // 綁定表單提交
  if (createEventForm) {
    createEventForm.addEventListener('submit', handleCreateEventSubmit);
  }

  // 將函式暴露到全域
  window.openCreateEventModal = openCreateEventModal;
  window.editEvent = editEvent;
  window.viewRegistrations = viewRegistrations;
  
  // 載入已建立的活動列表
  loadCreatedEvents();
}

// 如果是在 DOMContentLoaded 中執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStaffPanel);
} else {
  initStaffPanel();
}
