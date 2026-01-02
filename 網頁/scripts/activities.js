/**
 * activities.js
 * 活動管理模組：負責活動的載入、顯示與圖片處理
 */

// 從 API 或 localStorage 載入動態活動
async function loadDynamicActivities() {
  const availableContainer = document.getElementById('availableActivities');
  if (!availableContainer) return;

  // 從 API 取得活動資料（會根據 USE_LOCAL_STORAGE 自動切換）
  const events = await fetchActivities();
  const now = new Date();
  
  // 過濾掉已截止的活動（available 為 false）和超過截止時間的活動
  const availableEvents = events.filter(event => {
    if (event.available === false) return false;
    
    // 檢查是否超過截止時間
    if (event.deadline) {
      const deadline = new Date(event.deadline);
      if (now > deadline) return false;
    }
    
    return true;
  });
  
  // 如果沒有可報名的活動，顯示提示訊息
  if (availableEvents.length === 0) {
    availableContainer.innerHTML = `
      <div class="no-activities-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--color-text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
        <p style="font-size: 1.1rem; font-weight: 500;">目前無活動可報名</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">請稍後再來查看，或關注社團公告！</p>
      </div>
    `;
    return;
  }
  
  availableEvents.forEach(event => {
    const activityCard = document.createElement('div');
    activityCard.className = 'activity-item clickable w-full max-w-full mx-auto';
    activityCard.dataset.id = event.id;
    activityCard.dataset.available = event.available;
    activityCard.dataset.title = event.title;
    activityCard.dataset.date = event.date;
    activityCard.dataset.location = event.location;
    activityCard.dataset.speaker = event.speaker;
    activityCard.dataset.quota = event.quota;
    activityCard.dataset.description = event.description;
    activityCard.dataset.poster = event.poster;
    activityCard.dataset.fallbackBg = event.fallbackBg;

    activityCard.innerHTML = `
      <div class="activity-image"></div>
      <div class="activity-content">
        <h3>${event.title}</h3>
        <div class="activity-info">
          📅 ${event.date}<br>
          📍 ${event.location}<br>
          👤 講師：${event.speaker}
        </div>
      </div>
    `;

    availableContainer.appendChild(activityCard);
  });
}

// 根據 data-poster 和 data-fallback-bg 自動設定卡片圖片
function setupActivityImages() {
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
}

// 初始化活動模組
function initActivities() {
  loadDynamicActivities();
  setupActivityImages();
}

// 如果是在 DOMContentLoaded 中執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initActivities);
} else {
  initActivities();
}
