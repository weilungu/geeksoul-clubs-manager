/**
 * registration.js
 * 報名表單模組：處理活動報名 Modal 的開啟、關閉與提交
 */

let currentActivity = null;

/**
 * 動態生成活動資訊區塊
 * @param {Object} activity - 活動資料物件
 * @param {boolean} isAvailable - 是否還有名額
 */
function renderActivityInfo(activity, isAvailable) {
  const modalActivityInfo = document.getElementById('modalActivityInfo');
  if (!modalActivityInfo) return;

  // 定義資訊項目配置
  const infoItems = [
    { icon: '📅', label: '活動時間', value: activity.date },
    { icon: '📍', label: '活動地點', value: activity.location },
    { icon: '👤', label: '講師', value: activity.speaker }
  ];

  // 生成 info-item HTML
  const itemsHTML = infoItems.map(item => `
    <div class="info-item">
      <span class="info-icon">${item.icon}</span>
      <span class="info-label">${item.label}：</span>
      <span class="info-value"${item.style ? ` style="${item.style}"` : ''}>${item.value}</span>
    </div>
  `).join('');

  // 生成描述區塊
  const descriptionHTML = activity.description 
    ? `<div class="info-description">${activity.description}</div>` 
    : '';

  // 組合並渲染
  modalActivityInfo.innerHTML = itemsHTML + descriptionHTML;
}

// 清空報名表單欄位
function clearRegistrationForm() {
  document.getElementById('memberYes').checked = true;
  document.getElementById('memberNo').checked = false;
  document.getElementById('department').value = '';
  document.getElementById('name').value = '';
  document.getElementById('studentId').value = '';
  document.getElementById('lineName').value = '';
  document.getElementById('lineName').disabled = false;
  document.getElementById('lineName').required = true;
  document.getElementById('lineNameRequired').style.display = 'inline';
  document.getElementById('lineNameHint').textContent = '請輸入您在社團 Line 群組中顯示的暱稱';
  document.getElementById('email').value = '';
  document.getElementById('agreement').checked = false;
}

// 為活動卡片綁定點擊事件
function bindActivityCardEvents() {
  const modal = document.getElementById('registrationModal');
  const submitBtn = document.getElementById('submitBtn');
  const modalActivityTitle = document.getElementById('modalActivityTitle');
  const modalPoster = document.getElementById('modalPoster');

  if (!modal) return;

  const activityCards = document.querySelectorAll('.activity-item.clickable');
  
  activityCards.forEach((card) => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      
      const isAvailable = this.dataset.available === 'true';

      // 收集活動資訊
      currentActivity = {
        id: this.dataset.id,
        title: this.dataset.title,
        date: this.dataset.date,
        location: this.dataset.location,
        speaker: this.dataset.speaker,
        quota: this.dataset.quota,
        description: this.dataset.description || '',
        poster: this.dataset.poster || null,
        fallbackBg: this.dataset.fallbackBg || 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        available: isAvailable
      };

      // 更新 Modal 標題
      modalActivityTitle.textContent = isAvailable ? `報名：${currentActivity.title}` : `活動詳情：${currentActivity.title}`;

      // 渲染活動資訊
      renderActivityInfo(currentActivity, isAvailable);

      // 更新海報
      if (currentActivity.poster) {
        modalPoster.innerHTML = `<img src="${currentActivity.poster}" alt="${currentActivity.title} 海報">`;
      } else {
        modalPoster.innerHTML = `<div class="poster-placeholder" style="background: ${currentActivity.fallbackBg};"><span>🖼️ ${currentActivity.title}</span></div>`;
      }

      // 清空表單
      clearRegistrationForm();

      // 控制提交按鈕和表單狀態
      const formInputs = document.querySelectorAll('#registrationModal input');
      if (isAvailable) {
        submitBtn.disabled = false;
        submitBtn.textContent = '提交報名';
        formInputs.forEach(input => input.disabled = false);
      } else {
        submitBtn.disabled = true;
        submitBtn.textContent = '已額滿，無法報名';
        formInputs.forEach(input => input.disabled = true);
      }

      // 鎖定背景滾動並開啟 Modal
      document.body.classList.add('modal-open');
      openModalWithFade(modal);
    });
  });
}

// 關閉報名 Modal
function closeRegistrationModal() {
  const modal = document.getElementById('registrationModal');
  if (!modal) return;

  closeModalWithFade(modal, function() {
    document.body.classList.remove('modal-open');
  });
}

// 處理報名表單提交
function handleRegistrationSubmit() {
  const submitBtn = document.getElementById('submitBtn');
  const departmentInput = document.getElementById('department');
  const nameInput = document.getElementById('name');
  const studentIdInput = document.getElementById('studentId');
  const emailInput = document.getElementById('email');
  const agreementCheckbox = document.getElementById('agreement');

  if (!submitBtn) return;

  submitBtn.addEventListener('click', function() {
    // 檢查所有欄位是否有效
    const inputs = [departmentInput, nameInput, studentIdInput, emailInput, agreementCheckbox];
    for (const input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
    }

    const department = departmentInput.value.trim();
    const name = nameInput.value.trim();
    const studentId = studentIdInput.value.trim();
    const email = emailInput.value.trim();
    const isMember = document.querySelector('input[name="isMember"]:checked')?.value;
    const lineNickname = document.getElementById('lineNickname')?.value.trim();

    // 儲存報名資料到 localStorage
    const registrationData = {
      eventId: currentActivity.id,
      eventTitle: currentActivity.title,
      department: department,
      name: name,
      studentId: studentId,
      email: email,
      isMember: isMember,
      lineNickname: lineNickname || '',
      timestamp: new Date().toISOString()
    };

    // 從 localStorage 讀取現有報名記錄
    let registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
    
    // 確保該活動的報名陣列存在
    if (!registrations[currentActivity.id]) {
      registrations[currentActivity.id] = [];
    }
    
    // 新增報名記錄
    registrations[currentActivity.id].push(registrationData);
    
    // 儲存回 localStorage
    localStorage.setItem('geeksoulRegistrations', JSON.stringify(registrations));

    // 成功訊息
    alert(`感謝報名！\n\n活動：${currentActivity.title}\n姓名：${name}\nGmail：${email}\n\n系統已寄送確認信至您的 Gmail。`);
    
    closeRegistrationModal();
  });

  // 允許 Enter 鍵提交
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });
}

// 初始化報名模組
function initRegistration() {
  const modal = document.getElementById('registrationModal');
  if (!modal) return;

  const modalClose = modal.querySelector('.modal-close');
  const cancelBtn = document.getElementById('cancelBtn');

  // 綁定關閉按鈕
  if (modalClose) modalClose.addEventListener('click', closeRegistrationModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeRegistrationModal);

  // 綁定活動卡片點擊事件
  bindActivityCardEvents();

  // 處理表單提交
  handleRegistrationSubmit();
}

// 如果是在 DOMContentLoaded 中執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegistration);
} else {
  initRegistration();
}
