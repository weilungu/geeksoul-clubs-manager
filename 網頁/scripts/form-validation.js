/**
 * form-validation.js
 * 表單驗證模組：處理所有表單欄位的驗證邏輯
 */

// 「同姓名」checkbox 邏輯
function initSameAsNameCheckbox() {
  const sameAsNameCheckbox = document.getElementById('sameAsName');
  const nameInput = document.getElementById('name');
  const lineNameInput = document.getElementById('lineName');

  if (!sameAsNameCheckbox || !nameInput || !lineNameInput) return;

  // 當勾選「同姓名」時，自動複製姓名到 Line 暱稱
  sameAsNameCheckbox.addEventListener('change', function() {
    if (this.checked) {
      lineNameInput.value = nameInput.value;
    }
  });

  // 當姓名欄位變更時，如果「同姓名」有勾選，同步更新 Line 暱稱
  nameInput.addEventListener('input', function() {
    if (sameAsNameCheckbox.checked) {
      lineNameInput.value = this.value;
    }
  });

  // 當手動編輯 Line 暱稱時，取消「同姓名」勾選
  lineNameInput.addEventListener('input', function() {
    if (sameAsNameCheckbox.checked && this.value !== nameInput.value) {
      sameAsNameCheckbox.checked = false;
    }
  });
}

// 社員身份選擇邏輯
function initMemberSelection() {
  const memberYes = document.getElementById('memberYes');
  const memberNo = document.getElementById('memberNo');
  const lineNameInput = document.getElementById('lineName');
  const lineNameRequired = document.getElementById('lineNameRequired');
  const lineNameHint = document.getElementById('lineNameHint');

  if (!memberYes || !memberNo || !lineNameInput) return;

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
}

// 設定表單欄位驗證
function initFormValidation() {
  const departmentInput = document.getElementById('department');
  const nameInput = document.getElementById('name');
  const studentIdInput = document.getElementById('studentId');
  const emailInput = document.getElementById('email');
  const agreementCheckbox = document.getElementById('agreement');

  if (!departmentInput || !nameInput || !studentIdInput || !emailInput || !agreementCheckbox) return;

  // 系所驗證
  departmentInput.addEventListener('invalid', function() {
    if (!this.value.trim()) {
      this.setCustomValidity('請填寫系所');
    }
  });
  departmentInput.addEventListener('input', function() {
    this.setCustomValidity('');
  });

  // 姓名驗證
  nameInput.addEventListener('invalid', function() {
    if (!this.value.trim()) {
      this.setCustomValidity('請填寫姓名');
    }
  });
  nameInput.addEventListener('input', function() {
    this.setCustomValidity('');
  });

  // 學號驗證（4開頭，共9位數字）
  studentIdInput.addEventListener('invalid', function() {
    if (!this.value.trim()) {
      this.setCustomValidity('請填寫學號');
    } else {
      this.setCustomValidity('學號格式錯誤：需為4開頭的9位數字');
    }
  });
  studentIdInput.addEventListener('input', function() {
    this.setCustomValidity('');
    const studentIdPattern = /^4\d{8}$/;
    if (this.value && !studentIdPattern.test(this.value)) {
      this.setCustomValidity('學號格式錯誤：需為4開頭的9位數字');
    }
  });

  // Email 驗證
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

  // 同意條款驗證
  agreementCheckbox.addEventListener('invalid', function() {
    this.setCustomValidity('請勾選同意提供資料');
  });
  agreementCheckbox.addEventListener('change', function() {
    this.setCustomValidity('');
  });
}

// 初始化驗證模組
function initValidation() {
  initSameAsNameCheckbox();
  initMemberSelection();
  initFormValidation();
}

// 如果是在 DOMContentLoaded 中執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initValidation);
} else {
  initValidation();
}
