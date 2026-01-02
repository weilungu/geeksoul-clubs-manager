/**
 * staff-panel.js
 * 幹部管理面板模組：處理活動新增與管理功能
 */

// 當前編輯模式：null = 新增模式，數字 = 編輯模式（存放 eventId）
let currentEditingEventId = null;

// 格式化日期時間範圍
function formatDateTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return '';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const year = start.getFullYear();
  const month = start.getMonth() + 1;
  const day = start.getDate();
  const startHour = String(start.getHours()).padStart(2, '0');
  const startMin = String(start.getMinutes()).padStart(2, '0');
  const endHour = String(end.getHours()).padStart(2, '0');
  const endMin = String(end.getMinutes()).padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${startHour}:${startMin} - ${endHour}:${endMin}`;
}

// 切換日期時間輸入框的顯示/隱藏
function toggleDateTimeInputs(hide) {
  const startTimeGroup = document.getElementById('eventStartTime').closest('.form-group');
  const endTimeGroup = document.getElementById('eventEndTime').closest('.form-group');
  const deadlineGroup = document.getElementById('eventDeadline').closest('.form-group');
  
  if (hide) {
    // 隱藏欄位
    startTimeGroup.style.display = 'none';
    endTimeGroup.style.display = 'none';
    deadlineGroup.style.display = 'none';
    
    // 移除 required 屬性並清空值
    document.getElementById('eventStartTime').required = false;
    document.getElementById('eventEndTime').required = false;
    document.getElementById('eventDeadline').required = false;
    document.getElementById('eventStartTime').value = '';
    document.getElementById('eventEndTime').value = '';
    document.getElementById('eventDeadline').value = '';
  } else {
    // 顯示欄位
    startTimeGroup.style.display = 'block';
    endTimeGroup.style.display = 'block';
    deadlineGroup.style.display = 'block';
    
    // 恢復 required 屬性
    document.getElementById('eventStartTime').required = true;
    document.getElementById('eventEndTime').required = true;
    document.getElementById('eventDeadline').required = true;
  }
}

// 切換名額上限輸入框的顯示/隱藏
function toggleQuotaInput(hide) {
  const quotaGroup = document.getElementById('eventQuota').closest('.form-group');
  const quotaInput = document.getElementById('eventQuota');
  
  if (hide) {
    // 隱藏欄位
    quotaGroup.style.display = 'none';
    
    // 移除 required 和 min 屬性並設為 0
    quotaInput.required = false;
    quotaInput.removeAttribute('min');
    quotaInput.value = '0';
  } else {
    // 顯示欄位
    quotaGroup.style.display = 'block';
    
    // 恢復 required 和 min 屬性並清空值
    quotaInput.required = true;
    quotaInput.setAttribute('min', '1');
    quotaInput.value = '';
  }
}

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
  
  // 重置 checkbox 和日期輸入框
  document.getElementById('noDeadline').checked = false;
  toggleDateTimeInputs(false);
  
  // 重置名額上限 checkbox
  document.getElementById('noQuotaLimit').checked = false;
  toggleQuotaInput(false);
  
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
  
  // 檢查是否為無截止時間
  const noDeadline = !event.startTime && !event.endTime && !event.deadline;
  document.getElementById('noDeadline').checked = noDeadline;
  
  document.getElementById('eventStartTime').value = event.startTime || '';
  document.getElementById('eventEndTime').value = event.endTime || '';
  document.getElementById('eventDeadline').value = event.deadline || '';
  
  // 根據 checkbox 狀態設定 disable
  toggleDateTimeInputs(noDeadline);
  
  document.getElementById('eventLocation').value = event.location || '';
  document.getElementById('eventSpeaker').value = event.speaker || '';
  document.getElementById('eventDescription').value = event.description || '';
  
  // 檢查是否為無名額上限（quota 為 0 表示無限制）
  const noQuotaLimit = event.quota === '0' || event.quota === 0;
  document.getElementById('noQuotaLimit').checked = noQuotaLimit;
  document.getElementById('eventQuota').value = noQuotaLimit ? '' : (event.quota || '');
  
  // 根據 checkbox 狀態設定顯示
  toggleQuotaInput(noQuotaLimit);
  
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
async function handleCreateEventSubmit(e) {
  e.preventDefault();
  
  const createEventForm = document.getElementById('createEventForm');
  
  // 檢查是否勾選無截止時間
  const noDeadline = document.getElementById('noDeadline').checked;
  
  // 始終驗證表單（日期欄位已根據 checkbox 設置 required 屬性）
  if (!createEventForm.checkValidity()) {
    createEventForm.reportValidity();
    return;
  }

  // 收集表單資料
  const eventName = document.getElementById('eventName').value.trim();
  const eventStartTime = noDeadline ? '' : document.getElementById('eventStartTime').value;
  const eventEndTime = noDeadline ? '' : document.getElementById('eventEndTime').value;
  const eventDeadline = noDeadline ? '' : document.getElementById('eventDeadline').value;
  const eventLocation = document.getElementById('eventLocation').value.trim();
  const eventSpeaker = document.getElementById('eventSpeaker').value.trim();
  const eventDescription = document.getElementById('eventDescription').value.trim();
  
  // 處理名額上限
  const noQuotaLimit = document.getElementById('noQuotaLimit').checked;
  const eventQuota = noQuotaLimit ? '0' : document.getElementById('eventQuota').value;
  
  const eventPosterInput = document.getElementById('eventPoster').value.trim();
  const eventStatus = document.getElementById('eventStatus').value;
  
  // 格式化日期時間顯示
  const formattedDate = noDeadline ? '持續進行中' : formatDateTimeRange(eventStartTime, eventEndTime);

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

  if (currentEditingEventId === null) {
    // 新增模式：建立新活動物件
    const newEventData = {
      title: eventName,
      date: formattedDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      deadline: eventDeadline,
      location: eventLocation,
      speaker: eventSpeaker,
      quota: eventQuota,
      description: eventDescription || '',
      poster: eventPoster,
      fallbackBg: 'linear-gradient(135deg, #B71C1C, #F57C00)',
      available: eventStatus === '開放報名'
    };
    
    // 呼叫 API 建立活動（會根據 USE_LOCAL_STORAGE 自動切換）
    const result = await createActivityAPI(newEventData);
    
    if (result.success) {
      // 關閉 Modal 並顯示成功訊息
      closeCreateEventModal();
      await loadCreatedEvents();
      showSuccessNotification(`活動「${eventName}」已成功建立！請前往首頁查看新增的活動。`);
    } else {
      alert('建立失敗：' + result.message);
    }
  } else {
    // 編輯模式：更新現有活動
    const updateEventData = {
      id: currentEditingEventId,
      title: eventName,
      date: formattedDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      deadline: eventDeadline,
      location: eventLocation,
      speaker: eventSpeaker,
      quota: eventQuota,
      description: eventDescription || '',
      poster: eventPoster,
      fallbackBg: 'linear-gradient(135deg, #B71C1C, #F57C00)',
      available: eventStatus === '開放報名'
    };
    
    // 呼叫 API 更新活動（會根據 USE_LOCAL_STORAGE 自動切換）
    const result = await updateActivityAPI(updateEventData);
    
    if (result.success) {
      // 重新計算該活動的報名狀態
      recalculateRegistrationStatus(currentEditingEventId, parseInt(eventQuota) || 0);
      
      // 關閉 Modal 並顯示成功訊息
      closeCreateEventModal();
      await loadCreatedEvents();
      showSuccessNotification(`活動「${eventName}」已成功更新！`);
    } else {
      alert('更新失敗：' + result.message);
    }
  }
}

// 重新計算報名狀態（編輯活動名額後觸發）
function recalculateRegistrationStatus(eventId, newQuota) {
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
  const eventRegs = registrations[eventId];
  
  if (!eventRegs || eventRegs.length === 0) return;
  
  // 按報名時間排序（最早在前）
  const sortedRegs = [...eventRegs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // 重新計算狀態
  if (newQuota === 0 || sortedRegs.length <= newQuota) {
    // 無名額限制或未額滿，清除非手動設定的狀態（會自動判定為成功）
    sortedRegs.forEach(reg => {
      // 只清除系統計算的狀態，保留手動設定的 savedStatus
      // 如果有 savedStatus 且不是 waiting（候補），就保留
      // 如果 savedStatus 是 waiting 但現在不需要候補了，就清除
      if (reg.savedStatus === 'waiting') {
        delete reg.savedStatus;
      }
    });
  } else {
    // 額滿，社員優先
    const members = sortedRegs.filter(r => r.isMember === 'yes');
    const nonMembers = sortedRegs.filter(r => r.isMember !== 'yes');
    
    let remainingQuota = newQuota;
    
    // 社員先錄取
    members.forEach(reg => {
      // 只處理沒有手動設定狀態的（或手動設定為 success/waiting 的）
      if (!reg.savedStatus || reg.savedStatus === 'success' || reg.savedStatus === 'waiting') {
        if (remainingQuota > 0) {
          // 如果之前手動設定為 waiting，現在有名額了，清除讓它變成 success
          if (reg.savedStatus === 'waiting') {
            delete reg.savedStatus;
          }
          remainingQuota--;
        } else {
          // 沒名額了，設為候補
          reg.savedStatus = 'waiting';
        }
      } else {
        // 手動設定為請假的，不佔名額，但也不改變狀態
      }
    });
    
    // 剩餘名額給非社員
    nonMembers.forEach(reg => {
      if (!reg.savedStatus || reg.savedStatus === 'success' || reg.savedStatus === 'waiting') {
        if (remainingQuota > 0) {
          if (reg.savedStatus === 'waiting') {
            delete reg.savedStatus;
          }
          remainingQuota--;
        } else {
          reg.savedStatus = 'waiting';
        }
      }
    });
  }
  
  // 更新原始陣列的順序（保持原本的順序）
  const updatedRegs = eventRegs.map(original => {
    const updated = sortedRegs.find(r => r.studentId === original.studentId);
    return updated || original;
  });
  
  registrations[eventId] = updatedRegs;
  localStorage.setItem('geeksoulRegistrations', JSON.stringify(registrations));
}

// 載入已建立的活動
async function loadCreatedEvents() {
  const eventsTableBody = document.querySelector('table tbody');
  if (!eventsTableBody) return;

  // 從 API 或 localStorage 讀取活動（會根據 USE_LOCAL_STORAGE 自動切換）
  const allEvents = await fetchActivities();
  
  // 過濾掉已截止的活動（available 為 false）
  const events = allEvents.filter(event => event.available !== false);
  
  // 從 API 或 localStorage 讀取所有報名記錄
  const registrations = await fetchRegistrations();

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
    
    // 檢查是否無截止時間（持續進行）
    if (!event.deadline || (event.startTime === '' && event.endTime === '' && event.deadline === '')) {
      statusBadge = 'info';
      statusText = '持續進行';
    } else if (event.available) {
      statusBadge = 'success';
      statusText = '開放報名';
    } else {
      statusBadge = 'secondary';
      statusText = '已截止';
    }
    
    // 如果有名額限制且額滿，顯示額滿狀態
    if (event.quota && event.quota !== '0' && event.quota !== 0 && registeredCount >= event.quota) {
      statusBadge = 'warning';
      statusText = '已額滿';
    }

    // 顯示名額（若為 0 或無限制，顯示「無」）
    const quotaDisplay = (event.quota === '0' || event.quota === 0) ? '無' : event.quota;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${event.title}</strong></td>
      <td><span class="badge ${statusBadge}">${statusText}</span></td>
      <td>${registeredCount} / ${quotaDisplay}</td>
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

// 查看報名名單
function viewRegistrations(eventId) {
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const eventRegistrations = registrations[eventId] || [];
  const event = events.find(e => e.id === eventId);
  const quota = event ? parseInt(event.quota) || 0 : 0;
  
  const modal = document.getElementById('registrationsModal');
  const modalTitle = document.getElementById('registrationsModalTitle');
  const tableContainer = document.getElementById('registrationsTableContainer');
  
  if (!modal || !tableContainer) return;
  
  // 設定標題
  if (modalTitle && event) {
    modalTitle.textContent = `報名名單：${event.title}`;
  }
  
  // 如果沒有報名記錄
  if (eventRegistrations.length === 0) {
    tableContainer.innerHTML = `
      <div style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
        目前尚無報名記錄。
      </div>
    `;
  } else {
    // 按報名時間排序（最早在前）
    const sortedRegs = [...eventRegistrations].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // 計算報名狀態（社員優先邏輯）
    if (quota === 0 || sortedRegs.length <= quota) {
      // 無名額限制或未額滿，全部成功
      sortedRegs.forEach(reg => {
        if (!reg.savedStatus) reg.calculatedStatus = 'success';
      });
    } else {
      // 額滿，社員優先
      const members = sortedRegs.filter(r => r.isMember === 'yes');
      const nonMembers = sortedRegs.filter(r => r.isMember !== 'yes');
      
      let remainingQuota = quota;
      members.forEach(reg => {
        if (!reg.savedStatus) {
          reg.calculatedStatus = remainingQuota > 0 ? 'success' : 'waiting';
          if (remainingQuota > 0) remainingQuota--;
        }
      });
      nonMembers.forEach(reg => {
        if (!reg.savedStatus) {
          reg.calculatedStatus = remainingQuota > 0 ? 'success' : 'waiting';
          if (remainingQuota > 0) remainingQuota--;
        }
      });
    }
    
    // 生成報名名單表格
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>序號</th>
            <th>系級</th>
            <th>姓名</th>
            <th>學號</th>
            <th>是否社員</th>
            <th>報名時間</th>
            <th>報名狀態</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    sortedRegs.forEach((reg, index) => {
      // 格式化報名時間
      const timestamp = new Date(reg.timestamp);
      const formattedTime = timestamp.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // 是否社員
      const memberStatus = reg.isMember === 'yes' ? '是' : '否';
      
      // 報名狀態（優先使用已儲存的狀態）
      const status = reg.savedStatus || reg.calculatedStatus || 'success';
      let statusBadge = '';
      if (status === 'success') {
        statusBadge = '<span class="badge success">成功</span>';
      } else if (status === 'leave') {
        statusBadge = '<span class="badge" style="background-color: #F59E0B; color: white;">請假</span>';
      } else if (status === 'waiting') {
        statusBadge = '<span class="badge" style="background-color: #EF4444; color: white;">候補</span>';
      }
      
      tableHTML += `
        <tr>
          <td>${String(index + 1).padStart(3, '0')}</td>
          <td>${reg.department}</td>
          <td>${reg.name}</td>
          <td>${reg.studentId}</td>
          <td>${memberStatus}</td>
          <td>${formattedTime}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });
    
    tableHTML += `
        </tbody>
      </table>
      <div style="margin-top: 1rem; color: var(--color-text-secondary);">
        共 ${eventRegistrations.length} 筆報名記錄
      </div>
    `;
    
    tableContainer.innerHTML = tableHTML;
  }
  
  // 開啟 Modal
  $(modal).css({'display': 'flex', 'opacity': 0}).scrollTop(0);
  $(modal).animate({'opacity': 1}, 300);
  $('body').addClass('modal-open');
}

// 關閉報名名單 Modal
function closeRegistrationsModal() {
  const modal = document.getElementById('registrationsModal');
  if (!modal) return;
  
  $(modal).fadeOut(300, function() {
    $('body').removeClass('modal-open');
  });
}

// 初始化幹部面板
function initStaffPanel() {
  const createEventModal = document.getElementById('createEventModal');
  if (!createEventModal) return;

  const modalClose = createEventModal.querySelector('.modal-close');
  const cancelCreateEventBtn = document.getElementById('cancelCreateEventBtn');
  const createEventForm = document.getElementById('createEventForm');
  const noDeadlineCheckbox = document.getElementById('noDeadline');
  const noQuotaLimitCheckbox = document.getElementById('noQuotaLimit');

  // 綁定關閉按鈕
  if (modalClose) modalClose.addEventListener('click', closeCreateEventModal);
  if (cancelCreateEventBtn) cancelCreateEventBtn.addEventListener('click', closeCreateEventModal);

  // 綁定表單提交
  if (createEventForm) {
    createEventForm.addEventListener('submit', handleCreateEventSubmit);
  }
  
  // 綁定「無截止時間」checkbox
  if (noDeadlineCheckbox) {
    noDeadlineCheckbox.addEventListener('change', function() {
      toggleDateTimeInputs(this.checked);
    });
  }
  
  // 綁定「無名額上限」checkbox
  if (noQuotaLimitCheckbox) {
    noQuotaLimitCheckbox.addEventListener('change', function() {
      toggleQuotaInput(this.checked);
    });
  }

  // 將函式暴露到全域
  window.openCreateEventModal = openCreateEventModal;
  window.editEvent = editEvent;
  window.viewRegistrations = viewRegistrations;
  window.closeRegistrationsModal = closeRegistrationsModal;
  
  // 載入已建立的活動列表
  loadCreatedEvents();
}

// 如果是在 DOMContentLoaded 中執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStaffPanel);
} else {
  initStaffPanel();
}
