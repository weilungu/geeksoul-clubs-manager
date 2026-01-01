/**
 * staff-panel.js
 * 幹部管理面板模組：處理活動新增與管理功能
 */

// 開啟新增活動 Modal
function openCreateEventModal() {
  const createEventModal = document.getElementById('createEventModal');
  if (!createEventModal) return;
  
  openModalWithFade(createEventModal);
  document.body.classList.add('modal-open');
}

// 關閉新增活動 Modal
function closeCreateEventModal() {
  const createEventModal = document.getElementById('createEventModal');
  const createEventForm = document.getElementById('createEventForm');
  if (!createEventModal) return;

  closeModalWithFade(createEventModal, function() {
    document.body.classList.remove('modal-open');
  });
  
  if (createEventForm) {
    createEventForm.reset();
  }
}

// 處理新增活動表單提交
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
  const eventPoster = document.getElementById('eventPoster').value.trim();
  const eventStatus = document.getElementById('eventStatus').value;

  // 建立活動物件
  const newEvent = {
    id: Date.now(),
    title: eventName,
    date: eventDate,
    location: eventLocation,
    speaker: eventSpeaker,
    quota: eventQuota,
    description: eventDescription || '',
    poster: eventPoster || '',
    fallbackBg: 'linear-gradient(135deg, #B71C1C, #F57C00)',
    available: eventStatus === '開放報名'
  };

  // 從 localStorage 讀取現有活動
  let events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  
  // 新增活動
  events.push(newEvent);
  
  // 儲存回 localStorage
  localStorage.setItem('geeksoulEvents', JSON.stringify(events));

  // 顯示成功訊息
  alert(`活動「${eventName}」已成功建立！\n\n請前往首頁查看新增的活動。`);
  
  // 關閉 Modal
  closeCreateEventModal();
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

  // 將 openCreateEventModal 暴露到全域
  window.openCreateEventModal = openCreateEventModal;
}

// 如果是在 DOMContentLoaded 中執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStaffPanel);
} else {
  initStaffPanel();
}
