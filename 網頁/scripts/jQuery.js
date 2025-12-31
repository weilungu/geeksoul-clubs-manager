// ========== jQuery Modal 動畫效果 ==========
// 此檔案包含使用 jQuery 實現的 Modal 淡入淡出效果

$(document).ready(function() {
  // ========== 報名 Modal (index.html) ==========
  const $modal = $('#registrationModal');

  // 開啟 Modal 並淡入
  window.openModalWithFade = function(modal) {
    // 先設定 display 並重設滾動位置，再開始淡入動畫
    $(modal).css({'display': 'flex', 'opacity': 0}).scrollTop(0);
    $(modal).animate({'opacity': 1}, 300);
    $('body').addClass('modal-open');
  };

  // 關閉 Modal 並淡出
  window.closeModalWithFade = function(modal, callback) {
    $(modal).fadeOut(300, function() {
      $('body').removeClass('modal-open');
      if (callback) callback();
    });
  };

  // 點擊 Modal 外部區域關閉
  $modal.on('click', function(e) {
    if (e.target === this) {
      window.closeModalWithFade(this);
    }
  });

  // 關閉按鈕事件
  $modal.find('.modal-close').on('click', function() {
    window.closeModalWithFade($modal);
  });

  // 取消按鈕事件
  $('#cancelBtn').on('click', function() {
    window.closeModalWithFade($modal);
  });

  // ========== 新增活動 Modal (staff-panel.html) ==========
  const $createEventModal = $('#createEventModal');

  // 開啟新增活動 Modal
  window.openCreateEventModal = function() {
    $createEventModal.css('display', 'flex').hide().fadeIn(300);
    $('body').addClass('modal-open');
  };

  // 關閉新增活動 Modal
  window.closeCreateEventModal = function() {
    $createEventModal.fadeOut(300, function() {
      $('body').removeClass('modal-open');
    });
  };

  // 點擊背景關閉新增活動 Modal
  $createEventModal.on('click', function(e) {
    if (e.target === this) {
      window.closeCreateEventModal();
    }
  });

  // 關閉按鈕事件
  $createEventModal.find('.modal-close').on('click', function() {
    window.closeCreateEventModal();
  });

  // 取消按鈕事件
  $('#cancelCreateEventBtn').on('click', function() {
    window.closeCreateEventModal();
  });

  // 提交新增活動表單（使用 form submit 事件觸發原生驗證）
  $('#createEventForm').on('submit', function(e) {
    // 檢查表單驗證
    if (!this.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      // 觸發瀏覽器原生驗證訊息
      this.reportValidity();
      return;
    }
    
    e.preventDefault();
    // TODO: 實作建立活動邏輯
    alert('活動建立成功！');
    window.closeCreateEventModal();
    // 重置表單
    this.reset();
  });

  // ========== 共用：ESC 鍵關閉 Modal ==========
  $(document).on('keydown', function(e) {
    if (e.key === 'Escape') {
      if ($modal.is(':visible')) {
        window.closeModalWithFade($modal);
      }
      if ($createEventModal.is(':visible')) {
        window.closeCreateEventModal();
      }
    }
  });
});
