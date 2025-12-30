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

  // ========== Modal Form Management ==========
  const modal = document.getElementById('registrationModal');
  const modalClose = document.querySelector('.modal-close');
  const cancelBtn = document.getElementById('cancelBtn');
  const submitBtn = document.getElementById('submitBtn');
  const registrationButtons = document.querySelectorAll('.activity-item .btn-primary');
  const modalActivityTitle = document.getElementById('modalActivityTitle');

  // Store current activity info
  let currentActivity = null;

  // Open modal when clicking "我要報名" button
  registrationButtons.forEach((btn) => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Get activity information from the card
      const activityItem = this.closest('.activity-item');
      const activityTitle = activityItem.querySelector('.activity-content h3').textContent;
      
      currentActivity = {
        title: activityTitle
      };

      // Update modal title
      modalActivityTitle.textContent = `報名：${activityTitle}`;

      // Clear form fields
      document.getElementById('department').value = '';
      document.getElementById('name').value = '';
      document.getElementById('studentId').value = '';
      document.getElementById('email').value = '';
      document.getElementById('agreement').checked = false;

      // Show modal
      modal.classList.add('active');
    });
  });

  // Close modal functions
  function closeModal() {
    modal.classList.remove('active');
  }

  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Close modal when clicking outside of modal-content
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Submit form
  submitBtn.addEventListener('click', function() {
    const department = document.getElementById('department').value.trim();
    const name = document.getElementById('name').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const email = document.getElementById('email').value.trim();
    const agreement = document.getElementById('agreement').checked;

    // Validation
    if (!department || !name || !studentId || !email || !agreement) {
      alert('請填寫所有必填欄位並同意相關條款');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('請輸入有效的 Email 帳號');
      return;
    }

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

