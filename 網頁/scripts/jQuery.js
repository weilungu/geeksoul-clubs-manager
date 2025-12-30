// ========== jQuery Modal 動畫效果 ==========
// 此檔案包含使用 jQuery 實現的 Modal 淡入淡出效果

$(document).ready(function() {
  const $modal = $('#registrationModal');

  // 開啟 Modal 並淡入
  window.openModalWithFade = function(modal) {
    $(modal).css('display', 'flex').hide().fadeIn(300);
  };

  // 關閉 Modal 並淡出
  window.closeModalWithFade = function(modal, callback) {
    $(modal).fadeOut(300, function() {
      if (callback) callback();
    });
  };

  // 點擊 Modal 外部區域關閉
  $modal.on('click', function(e) {
    if (e.target === this) {
      window.closeModalWithFade(this, function() {
        document.body.classList.remove('modal-open');
      });
    }
  });
});
