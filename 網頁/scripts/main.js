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

  // ========== 報名表單 Modal Management ==========
  const modal = document.getElementById('registrationModal');
  const modalClose = document.querySelector('#registrationModal .modal-close');
  const cancelBtn = document.getElementById('cancelBtn');
  const submitBtn = document.getElementById('submitBtn');
  const modalActivityTitle = document.getElementById('modalActivityTitle');
  const modalPoster = document.getElementById('modalPoster');
  const activityCards = document.querySelectorAll('.activity-item.clickable');

  // Store current activity info
  let currentActivity = null;

  // Open registration modal when clicking on available activity card
  activityCards.forEach((card) => {
    card.addEventListener('click', function(e) {
      e.preventDefault();
      
      const isAvailable = this.dataset.available === 'true';
      if (!isAvailable) return; // 已額滿的活動不顯示 Modal

      // Get activity information from data attributes
      currentActivity = {
        title: this.dataset.title,
        poster: this.dataset.poster || null
      };

      // Update registration modal title
      modalActivityTitle.textContent = `報名：${currentActivity.title}`;

      // Update poster
      if (currentActivity.poster) {
        modalPoster.innerHTML = `<img src="${currentActivity.poster}" alt="${currentActivity.title} 海報">`;
      } else {
        // 從卡片取得漸層背景色
        const cardImage = this.querySelector('.activity-image');
        const bgStyle = cardImage ? cardImage.style.background : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))';
        modalPoster.innerHTML = `<div class="poster-placeholder" style="background: ${bgStyle};"><span>🖼️ ${currentActivity.title}</span></div>`;
      }

      // Clear form fields
      document.getElementById('department').value = '';
      document.getElementById('name').value = '';
      document.getElementById('studentId').value = '';
      document.getElementById('email').value = '';
      document.getElementById('agreement').checked = false;

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
    }
  });
  studentIdInput.addEventListener('input', function() {
    this.setCustomValidity('');
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

