// Navigation active state management
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || 
        (currentPage === '' && linkPage === 'index.html') ||
        (currentPage === 'index.html' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ========== 活動卡片圖片自動處理 ==========
  // 根據 data-poster 和 data-fallback-bg 自動設定卡片圖片
  const allActivityItems = document.querySelectorAll('.activity-item');
  allActivityItems.forEach((card) => {
    const poster = card.dataset.poster;
    const fallbackBg = card.dataset.fallbackBg;
    const imageContainer = card.querySelector('.activity-image');
    const title = card.dataset.title || '活動';

    if (poster && imageContainer) {
      // 有海報圖片，使用 img 標籤
      imageContainer.innerHTML = `<img src="${poster}" alt="${title} 海報">`;
    } else if (fallbackBg && imageContainer) {
      // 無海報圖片，使用漸層背景
      imageContainer.style.background = fallbackBg;
    }
  });

  // ========== 動態分類活動（可報名 / 已額滿） ==========
  const availableContainer = document.getElementById('availableActivities');
  const fullContainer = document.getElementById('fullActivities');
  const fullActivitiesTitle = document.getElementById('fullActivitiesTitle');

  function categorizeActivities() {
    const activities = availableContainer.querySelectorAll('.activity-item');
    let hasFullActivities = false;

    activities.forEach((card) => {
      const isAvailable = card.dataset.available === 'true';
      if (!isAvailable) {
        // 將額滿活動移至「已額滿活動」區塊
        fullContainer.appendChild(card);
        hasFullActivities = true;
      }
    });

    // 若有額滿活動，顯示標題
    if (hasFullActivities) {
      fullActivitiesTitle.style.display = 'block';
    }
  }

  // 執行活動分類
  categorizeActivities();

  // ========== 報名表單 Modal Management ==========
  const modal = document.getElementById('registrationModal');
  const modalClose = document.querySelector('#registrationModal .modal-close');
  const cancelBtn = document.getElementById('cancelBtn');
  const submitBtn = document.getElementById('submitBtn');
  const modalActivityTitle = document.getElementById('modalActivityTitle');
  const modalPoster = document.getElementById('modalPoster');
  const modalActivityInfo = document.getElementById('modalActivityInfo');
  const activityCards = document.querySelectorAll('.activity-item.clickable');

  /**
   * 動態生成活動資訊區塊
   * @param {Object} activity - 活動資料物件
   * @param {boolean} isAvailable - 是否還有名額
   */
  function renderActivityInfo(activity, isAvailable) {
    // 定義資訊項目配置
    const infoItems = [
      { icon: '📅', label: '活動時間', value: activity.date },
      { icon: '📍', label: '活動地點', value: activity.location },
      { icon: '👤', label: '講師', value: activity.speaker },
      { 
        icon: '📊', 
        label: '剩餘名額', 
        value: isAvailable ? `${activity.quota} 個名額` : '已額滿',
        style: isAvailable ? '' : 'color: var(--color-error);'
      }
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

  // Store current activity info
  let currentActivity = null;

  // Open registration modal when clicking on activity card
  activityCards.forEach((card) => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      
      const isAvailable = this.dataset.available === 'true';

      // Get activity information from data attributes
      currentActivity = {
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

      // Update registration modal title
      modalActivityTitle.textContent = isAvailable ? `報名：${currentActivity.title}` : `活動詳情：${currentActivity.title}`;

      // 動態渲染活動資訊區塊
      renderActivityInfo(currentActivity, isAvailable);

      // Update poster
      if (currentActivity.poster) {
        modalPoster.innerHTML = `<img src="${currentActivity.poster}" alt="${currentActivity.title} 海報">`;
      } else {
        modalPoster.innerHTML = `<div class="poster-placeholder" style="background: ${currentActivity.fallbackBg};"><span>🖼️ ${currentActivity.title}</span></div>`;
      }

      // Clear form fields
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

      // Lock background scroll
      document.body.classList.add('modal-open');

      // Show registration modal with jQuery fade-in effect
      openModalWithFade(modal);
    });
  });

  // Close registration modal functions with jQuery fade-out effect
  function closeModal() {
    closeModalWithFade(modal, function() {
      document.body.classList.remove('modal-open');
    });
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // ========== 社員身份選擇邏輯 ==========
  const memberYes = document.getElementById('memberYes');
  const memberNo = document.getElementById('memberNo');
  const lineNameInput = document.getElementById('lineName');
  const lineNameRequired = document.getElementById('lineNameRequired');
  const lineNameHint = document.getElementById('lineNameHint');

  function handleMemberChange() {
    if (memberYes.checked) {
      // 社員：啟用 Line 暱稱欄位並設為必填
      lineNameInput.disabled = false;
      lineNameInput.required = true;
      lineNameRequired.style.display = 'inline';
      lineNameHint.textContent = '請輸入您在社團 Line 群組中顯示的暱稱';
    } else if (memberNo.checked) {
      // 非社員：停用 Line 暱稱欄位
      lineNameInput.disabled = true;
      lineNameInput.required = false;
      lineNameInput.value = '';
      lineNameRequired.style.display = 'none';
      lineNameHint.textContent = '非社員無需填寫此欄位';
    }
  }

  memberYes.addEventListener('change', handleMemberChange);
  memberNo.addEventListener('change', handleMemberChange);

  // ========== 表單驗證 ==========
  const departmentInput = document.getElementById('department');
  const nameInput = document.getElementById('name');
  const studentIdInput = document.getElementById('studentId');
  const emailInput = document.getElementById('email');
  const agreementCheckbox = document.getElementById('agreement');

  // 設定自訂驗證訊息
  departmentInput.addEventListener('invalid', function() {
    if (!this.value.trim()) {
      this.setCustomValidity('請填寫系所');
    }
  });
  departmentInput.addEventListener('input', function() {
    this.setCustomValidity('');
  });

  nameInput.addEventListener('invalid', function() {
    if (!this.value.trim()) {
      this.setCustomValidity('請填寫姓名');
    }
  });
  nameInput.addEventListener('input', function() {
    this.setCustomValidity('');
  });

  studentIdInput.addEventListener('invalid', function() {
    if (!this.value.trim()) {
      this.setCustomValidity('請填寫學號');
    } else {
      this.setCustomValidity('學號格式錯誤： 需為 4 開頭的 9 位數字');
    }
  });
  studentIdInput.addEventListener('input', function() {
    this.setCustomValidity('');
    // 驗證學號格式：4開頭，共9位數字
    const studentIdPattern = /^4\d{8}$/;
    if (this.value && !studentIdPattern.test(this.value)) {
      this.setCustomValidity('學號格式錯誤： 需為 4 開頭的 9 位數字');
    }
  });

  emailInput.addEventListener('invalid', function() {
    if (!this.value.trim()) {
      this.setCustomValidity('請填寫 Email 帳號');
    } else {
      this.setCustomValidity('請輸入有效的 Email 格式');
    }
  });
  emailInput.addEventListener('input', function() {
    this.setCustomValidity('');
  });

  agreementCheckbox.addEventListener('invalid', function() {
    this.setCustomValidity('請勾選同意提供資料');
  });
  agreementCheckbox.addEventListener('change', function() {
    this.setCustomValidity('');
  });

  // Submit form
  submitBtn.addEventListener('click', function() {
    // 檢查所有欄位是否有效
    const inputs = [departmentInput, nameInput, studentIdInput, emailInput, agreementCheckbox];
    for (const input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    // Success message
    alert(`感謝報名！\n\n活動：${currentActivity.title}\n姓名：${name}\nGmail：${email}\n\n系統已寄送確認信至您的 Gmail。`);
    
    closeModal();
  });

  // Allow Enter key to submit
  document.getElementById('email').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });
});

