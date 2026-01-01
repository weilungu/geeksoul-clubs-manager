/**
 * admin.js
 * 行政查核模組：處理活動統計與報名名單顯示
 */

// 當前選中的活動 ID
let selectedEventId = null;

// 載入活動統計（包含所有狀態的活動）
function loadEventStatistics() {
  const statsTableBody = document.getElementById('statsTableBody');
  if (!statsTableBody) return;

  // 從 localStorage 讀取所有活動（包含已截止）
  let events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  
  // 取得篩選條件
  const yearFilter = document.getElementById('yearFilter');
  const monthFilter = document.getElementById('monthFilter');
  const selectedYear = yearFilter ? yearFilter.value : '';
  const selectedMonth = monthFilter ? monthFilter.value : '';
  
  // 根據年份和月份篩選活動
  if (selectedYear || selectedMonth) {
    events = events.filter(event => {
      // 嘗試從活動日期字串中提取年份和月份
      const dateStr = event.date || '';
      
      // 嘗試匹配年份（支援格式：2025年、2025/、2025-）
      let yearMatch = true;
      if (selectedYear) {
        yearMatch = dateStr.includes(selectedYear);
      }
      
      // 嘗試匹配月份（支援格式：1月、2月、1/、2/、-01-、-1-）
      let monthMatch = true;
      if (selectedMonth) {
        const monthNum = parseInt(selectedMonth);
        // 匹配 "X月" 格式
        const monthPatternChinese = new RegExp(`${monthNum}月`);
        // 匹配 "YYYY/M/" 或 "YYYY-M-" 格式
        const monthPatternSlash = new RegExp(`\\d{4}[/-]0?${monthNum}[/-]`);
        // 匹配 "M/D" 格式
        const monthPatternStart = new RegExp(`^0?${monthNum}[/-]`);
        
        monthMatch = monthPatternChinese.test(dateStr) || 
                     monthPatternSlash.test(dateStr) || 
                     monthPatternStart.test(dateStr);
      }
      
      return yearMatch && monthMatch;
    });
  }
  
  // 從 localStorage 讀取所有報名記錄
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');

  // 清空表格
  statsTableBody.innerHTML = '';

  // 如果沒有活動，顯示提示訊息
  if (events.length === 0) {
    statsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
          目前尚未建立任何活動。
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
    
    // 判斷狀態
    let statusBadge = '';
    let statusText = '';
    
    if (!event.available) {
      statusBadge = 'secondary';
      statusText = '已截止';
    } else if (registeredCount >= event.quota) {
      statusBadge = 'warning';
      statusText = '已額滿';
    } else {
      statusBadge = 'success';
      statusText = '進行中';
    }

    const row = document.createElement('tr');
    row.dataset.eventId = event.id;
    
    // 如果是當前選中的活動，添加 selected 類
    if (selectedEventId == event.id) {
      row.classList.add('selected');
    }
    
    // 建立下拉選單的選項
    const selectedOpen = event.available ? 'selected' : '';
    const selectedClosed = !event.available ? 'selected' : '';
    
    row.innerHTML = `
      <td>${event.title}</td>
      <td>${event.date}</td>
      <td>${registeredCount}</td>
      <td>${event.quota}</td>
      <td><span class="badge ${statusBadge}">${statusText}</span></td>
      <td>
        <select class="status-select" onchange="updateEventStatus(${event.id}, this.value); event.stopPropagation();" onclick="event.stopPropagation();">
          <option value="open" ${selectedOpen}>開放報名</option>
          <option value="closed" ${selectedClosed}>已截止</option>
        </select>
      </td>
    `;
    
    // 添加點擊事件
    row.addEventListener('click', function() {
      selectEvent(event.id);
    });
    
    statsTableBody.appendChild(row);
  });
}

// 選擇活動
function selectEvent(eventId) {
  // 如果點擊同一個活動，取消選擇
  if (selectedEventId == eventId) {
    selectedEventId = null;
  } else {
    selectedEventId = eventId;
  }
  
  // 更新表格樣式
  const rows = document.querySelectorAll('#statsTableBody tr');
  rows.forEach(row => {
    if (row.dataset.eventId == selectedEventId) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });
  
  // 更新報名名單詳情
  loadRegistrationDetails(selectedEventId);
}

// 載入報名名單詳情
function loadRegistrationDetails(eventId = null) {
  const detailsTableBody = document.getElementById('detailsTableBody');
  if (!detailsTableBody) return;

  // 從 localStorage 讀取所有活動和報名記錄
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');

  // 清空表格
  detailsTableBody.innerHTML = '';

  // 收集要顯示的報名記錄
  let allRegistrations = [];
  
  if (eventId) {
    // 只顯示特定活動的報名記錄
    const eventRegs = registrations[eventId] || [];
    const event = events.find(e => e.id === eventId);
    const quota = event ? parseInt(event.quota) || 0 : 0;
    allRegistrations = eventRegs.map(reg => ({ ...reg, eventId: eventId, eventQuota: quota }));
  } else {
    // 顯示所有活動的報名記錄
    Object.keys(registrations).forEach(id => {
      const eventRegs = registrations[id] || [];
      const event = events.find(e => e.id === id);
      const quota = event ? parseInt(event.quota) || 0 : 0;
      eventRegs.forEach(reg => {
        allRegistrations.push({ ...reg, eventId: id, eventQuota: quota });
      });
    });
  }

  // 按報名時間排序（最早在前，用於決定序號）
  allRegistrations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // 如果沒有報名記錄，顯示提示訊息
  if (!eventId) {
    detailsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
          請先選擇一個活動以查看報名名單。
        </td>
      </tr>
    `;
    return;
  }
  
  if (allRegistrations.length === 0) {
    detailsTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
          此活動目前尚無報名記錄。
        </td>
      </tr>
    `;
    return;
  }

  // 計算報名狀態（社員優先邏輯）
  // 依活動分組計算
  const eventGroups = {};
  allRegistrations.forEach((reg, index) => {
    reg.originalOrder = index + 1; // 原始報名順序（時間順序）
    if (!eventGroups[reg.eventId]) {
      eventGroups[reg.eventId] = [];
    }
    eventGroups[reg.eventId].push(reg);
  });

  // 對每個活動計算報名狀態
  Object.keys(eventGroups).forEach(evtId => {
    const regs = eventGroups[evtId];
    const quota = regs[0]?.eventQuota || 0;
    
    if (quota === 0 || regs.length <= quota) {
      // 無名額限制或未額滿，全部成功
      regs.forEach(reg => {
        reg.status = 'success';
      });
    } else {
      // 額滿，社員優先
      // 先把社員和非社員分開，各自按報名時間排序
      const members = regs.filter(r => r.isMember === 'yes');
      const nonMembers = regs.filter(r => r.isMember !== 'yes');
      
      // 社員先錄取
      let remainingQuota = quota;
      members.forEach(reg => {
        if (remainingQuota > 0) {
          reg.status = 'success';
          remainingQuota--;
        } else {
          reg.status = 'waiting';
        }
      });
      
      // 剩餘名額給非社員
      nonMembers.forEach(reg => {
        if (remainingQuota > 0) {
          reg.status = 'success';
          remainingQuota--;
        } else {
          reg.status = 'waiting';
        }
      });
    }
  });

  // 渲染每筆報名記錄
  allRegistrations.forEach((reg) => {
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
    
    // 報名狀態
    let statusBadge = '';
    if (reg.status === 'success') {
      statusBadge = '<span class="badge success">成功</span>';
    } else {
      statusBadge = '<span class="badge" style="background-color: var(--color-warning); color: white;">候補</span>';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${String(reg.originalOrder).padStart(3, '0')}</td>
      <td>${reg.department}</td>
      <td>${reg.name}</td>
      <td>${reg.studentId}</td>
      <td>${memberStatus}</td>
      <td>${formattedTime}</td>
      <td>${statusBadge}</td>
    `;
    
    detailsTableBody.appendChild(row);
  });
}

// 匯出 CSV
function exportCSV() {
  const activitySelect = document.getElementById('activitySelect');
  const selectedEventId = activitySelect ? activitySelect.value : null;
  
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
  
  // 收集要匯出的報名記錄
  let allRegistrations = [];
  
  if (selectedEventId) {
    const eventRegs = registrations[selectedEventId] || [];
    const event = events.find(e => e.id == selectedEventId);
    allRegistrations = eventRegs.map(reg => ({ ...reg, eventTitle: event ? event.title : '' }));
  } else {
    Object.keys(registrations).forEach(id => {
      const eventRegs = registrations[id] || [];
      const event = events.find(e => e.id == id);
      eventRegs.forEach(reg => {
        allRegistrations.push({ ...reg, eventTitle: event ? event.title : '' });
      });
    });
  }
  
  if (allRegistrations.length === 0) {
    alert('沒有可匯出的報名記錄。');
    return;
  }
  
  // 生成 CSV 內容
  const headers = ['序號', '活動名稱', '姓名', '學號', '系所', '社員身分', 'Email', '報名時間'];
  const rows = allRegistrations.map((reg, index) => {
    const timestamp = new Date(reg.timestamp);
    const formattedTime = timestamp.toLocaleString('zh-TW');
    const memberStatus = reg.isMember === 'yes' ? '社員' : '非社員';
    return [
      index + 1,
      reg.eventTitle,
      reg.name,
      reg.studentId,
      reg.department,
      memberStatus,
      reg.email,
      formattedTime
    ].map(cell => `"${cell}"`).join(',');
  });
  
  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  
  // 下載 CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `報名名單_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
}

// 列印功能
function printRegistrations() {
  window.print();
}

// 更新活動狀態
function updateEventStatus(eventId, newStatus) {
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const eventIndex = events.findIndex(e => e.id === eventId);
  
  if (eventIndex === -1) {
    alert('找不到該活動。');
    return;
  }
  
  // 更新活動狀態
  const newAvailable = newStatus === 'open';
  events[eventIndex].available = newAvailable;
  localStorage.setItem('geeksoulEvents', JSON.stringify(events));
  
  // 重新載入統計表格
  loadEventStatistics();
}

// 初始化行政查核模組
function initAdmin() {
  // 載入活動統計
  loadEventStatistics();
  
  // 載入報名名單詳情（預設顯示全部）
  loadRegistrationDetails();
  
  // 綁定日期篩選事件
  const yearFilter = document.getElementById('yearFilter');
  const monthFilter = document.getElementById('monthFilter');
  
  if (yearFilter && monthFilter) {
    // 初始狀態：若年份為「全部」，禁用月份選單
    if (yearFilter.value === '') {
      monthFilter.disabled = true;
      monthFilter.value = '';
    }
    
    yearFilter.addEventListener('change', function() {
      // 若年份為「全部」，禁用月份選單並重置為「全部」
      if (this.value === '') {
        monthFilter.disabled = true;
        monthFilter.value = '';
      } else {
        monthFilter.disabled = false;
      }
      loadEventStatistics();
    });
    
    monthFilter.addEventListener('change', function() {
      loadEventStatistics();
    });
  }
  
  // 綁定匯出和列印按鈕
  const exportBtn = document.getElementById('exportCSVBtn');
  const printBtn = document.getElementById('printBtn');
  
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);
  if (printBtn) printBtn.addEventListener('click', printRegistrations);
}

// 如果是在 DOMContentLoaded 中執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
