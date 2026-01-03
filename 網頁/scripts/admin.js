/**
 * admin.js
 * 行政查核模組：處理活動統計與報名名單顯示
 */

// 當前選中的活動 ID
let selectedEventId = null;

// 載入活動統計（包含所有狀態的活動）
async function loadEventStatistics() {
  const statsTableBody = document.getElementById('statsTableBody');
  if (!statsTableBody) return;

  // 從 API 或 localStorage 讀取所有活動（包含已截止）
  let events = await fetchActivities();
  
  // 取得篩選條件
  const yearFilter = document.getElementById('yearFilter');
  const monthFilter = document.getElementById('monthFilter');
  const ongoingFilter = document.getElementById('ongoingFilter');
  const selectedYear = yearFilter ? yearFilter.value : '';
  const selectedMonth = monthFilter ? monthFilter.value : '';
  const onlyOngoing = selectedYear === '__ongoing__' || selectedMonth === '__ongoing__';
  
  // 根據年份和月份篩選活動
  if (selectedYear || selectedMonth) {
    events = events.filter(event => {
      // 如果選中特殊值，只顯示無截止時間的活動
      if (onlyOngoing) {
        // deadline 為空字串或不存在表示持續進行
        return !event.deadline || event.deadline === '';
      }
      
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
  
  // 從 API 或 localStorage 讀取所有報名記錄
  const registrations = await fetchRegistrations();

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
    
    // 計算實際「成功」報名的人數（使用統一的計算函式）
    const quota = parseInt(event.quota) || 0;
    let successCount = 0;
    
    if (eventRegistrations.length > 0) {
      // 按報名時間排序
      const sortedRegs = [...eventRegistrations].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // 使用統一的狀態計算函式
      calculateRegistrationStatuses(sortedRegs, quota);
      
      // 統計成功報名人數
      successCount = sortedRegs.filter(r => r.status === 'success').length;
    }
    
    // 判斷狀態（根據成功報名人數）
    let statusBadge = '';
    let statusText = '';
    
    if (!event.available) {
      statusBadge = 'secondary';
      statusText = '已截止';
    } else if (successCount >= quota && quota > 0) {
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
    
    // 顯示名額上限（若為 0 顯示「無」）
    const quotaDisplay = (event.quota === '0' || event.quota === 0) ? '無' : event.quota;
    
    row.innerHTML = `
      <td>${event.title}</td>
      <td>${event.date}</td>
      <td>${registeredCount}</td>
      <td>${quotaDisplay}</td>
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

// 統一的報名狀態計算函式
function calculateRegistrationStatuses(regs, quota) {
  if (quota === 0) {
    // 無名額限制，全部成功
    regs.forEach(reg => {
      reg.status = reg.savedStatus || 'success';
    });
    return;
  }
  
  // 建立優先順序列表：
  // 1. 手動設定為「成功」的人（社員優先，再按報名時間）
  // 2. 沒有手動設定的人（社員優先，再按報名時間）
  // 3. 手動設定為「候補」的人不進入成功候選
  // 4. 手動設定為「請假」的人不佔用名額，保持請假狀態
  
  // 分類所有報名記錄
  const manualSuccess = regs.filter(r => r.savedStatus === 'success');
  const manualLeave = regs.filter(r => r.savedStatus === 'leave');
  const manualWaiting = regs.filter(r => r.savedStatus === 'waiting');
  const unassigned = regs.filter(r => !r.savedStatus);
  
  // 建立成功候選名單（手動成功 + 未分配），按社員優先排序
  const successCandidates = [
    ...manualSuccess.filter(r => r.isMember === 'yes'),
    ...manualSuccess.filter(r => r.isMember !== 'yes'),
    ...unassigned.filter(r => r.isMember === 'yes'),
    ...unassigned.filter(r => r.isMember !== 'yes')
  ];
  
  // 分配名額
  let remainingQuota = quota;
  
  // 處理成功候選名單
  successCandidates.forEach(reg => {
    if (remainingQuota > 0) {
      reg.status = 'success';
      remainingQuota--;
    } else {
      reg.status = 'waiting';
    }
  });
  
  // 處理請假的人（不佔用名額，保持請假狀態）
  manualLeave.forEach(reg => {
    reg.status = 'leave';
  });
  
  // 處理手動設定為候補的人
  manualWaiting.forEach(reg => {
    reg.status = 'waiting';
  });
}

// 載入報名名單詳情
async function loadRegistrationDetails(eventId = null) {
  const detailsTableBody = document.getElementById('detailsTableBody');
  if (!detailsTableBody) return;

  // 從 API 或 localStorage 讀取所有活動和報名記錄
  const events = await fetchActivities();
  const registrations = await fetchRegistrations();

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
    
    // 使用統一的狀態計算函式
    calculateRegistrationStatuses(regs, quota);
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
    
    // 報名狀態下拉選單
    const currentStatus = reg.savedStatus || reg.status; // 優先使用已儲存的狀態
    const statusSelect = `
      <select class="registration-status-select" 
              data-event-id="${reg.eventId}" 
              data-student-id="${reg.studentId}"
              onchange="handleUpdateRegistrationStatus(this)">
        <option value="success" ${currentStatus === 'success' ? 'selected' : ''}>成功</option>
        <option value="leave" ${currentStatus === 'leave' ? 'selected' : ''}>請假</option>
        <option value="waiting" ${currentStatus === 'waiting' ? 'selected' : ''}>候補</option>
      </select>
    `;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${String(reg.originalOrder).padStart(3, '0')}</td>
      <td>${reg.department}</td>
      <td>${reg.name}</td>
      <td>${reg.studentId}</td>
      <td>${memberStatus}</td>
      <td>${formattedTime}</td>
      <td>${statusSelect}</td>
    `;
    
    detailsTableBody.appendChild(row);
  });
  
  // 初始化所有下拉選單的樣式
  updateAllStatusSelectStyles();
}

// 更新所有狀態下拉選單的樣式
function updateAllStatusSelectStyles() {
  document.querySelectorAll('.registration-status-select').forEach(select => {
    updateStatusSelectStyle(select);
  });
}

// 更新單個狀態下拉選單的樣式
function updateStatusSelectStyle(select) {
  const value = select.value;
  // 移除所有狀態樣式
  select.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500', 'text-white');
  
  // 根據狀態添加對應樣式
  if (value === 'success') {
    select.classList.add('bg-green-500', 'text-white');
  } else if (value === 'leave') {
    select.classList.add('bg-yellow-500', 'text-white');
  } else if (value === 'waiting') {
    select.classList.add('bg-red-500', 'text-white');
  }
}

// 更新報名狀態（處理函數）
async function handleUpdateRegistrationStatus(selectElement) {
  const eventId = selectElement.dataset.eventId;
  const studentId = selectElement.dataset.studentId;
  const newStatus = selectElement.value;
  
  // 更新下拉選單樣式
  updateStatusSelectStyle(selectElement);
  
  // 呼叫 API 更新狀態（會根據 USE_LOCAL_STORAGE 自動切換）
  const result = await updateRegistrationStatus(eventId, studentId, newStatus);
  
  if (result.success) {
    // 重新載入報名名單和活動統計
    await loadRegistrationDetails(eventId);
    await loadEventStatistics();
  } else {
    alert('更新失敗：' + result.message);
  }
}

// 匯出 Excel
function exportCSV() {
  // 取得當前選擇的活動（如果有）
  const selectedEvent = selectedEventId;
  
  const events = JSON.parse(localStorage.getItem('geeksoulEvents') || '[]');
  const registrations = JSON.parse(localStorage.getItem('geeksoulRegistrations') || '{}');
  
  // 收集要匯出的報名記錄
  let allRegistrations = [];
  let eventTitle = '所有活動';
  
  if (selectedEvent) {
    const eventRegs = registrations[selectedEvent] || [];
    const event = events.find(e => e.id == selectedEvent);
    eventTitle = event ? event.title : '未知活動';
    const quota = event ? parseInt(event.quota) || 0 : 0;
    
    // 計算報名狀態
    const sortedRegs = [...eventRegs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    calculateRegistrationStatuses(sortedRegs, quota);
    
    allRegistrations = sortedRegs.map((reg, index) => ({ 
      ...reg, 
      eventTitle: eventTitle,
      order: index + 1 
    }));
  } else {
    // 匯出所有活動
    Object.keys(registrations).forEach(id => {
      const eventRegs = registrations[id] || [];
      const event = events.find(e => e.id == id);
      const quota = event ? parseInt(event.quota) || 0 : 0;
      const title = event ? event.title : '未知活動';
      
      // 計算報名狀態
      const sortedRegs = [...eventRegs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      calculateRegistrationStatuses(sortedRegs, quota);
      
      sortedRegs.forEach((reg, index) => {
        allRegistrations.push({ 
          ...reg, 
          eventTitle: title,
          order: index + 1 
        });
      });
    });
  }
  
  if (allRegistrations.length === 0) {
    alert('沒有可匯出的報名記錄。');
    return;
  }
  
  // 準備 Excel 資料
  const excelData = allRegistrations.map(reg => {
    const timestamp = new Date(reg.timestamp);
    const formattedTime = timestamp.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const memberStatus = reg.isMember === 'yes' ? '是' : '否';
    const status = reg.savedStatus || reg.status;
    const statusText = status === 'success' ? '成功' : 
                       status === 'waiting' ? '候補' : 
                       status === 'leave' ? '請假' : status;
    
    return {
      '序號': String(reg.order).padStart(3, '0'),
      '活動名稱': reg.eventTitle,
      '系級': reg.department,
      '姓名': reg.name,
      '學號': reg.studentId,
      '是否社員': memberStatus,
      'Line暱稱': reg.lineName || '',
      'Email': reg.email,
      '報名時間': formattedTime,
      '報名狀態': statusText
    };
  });
  
  // 創建工作簿和工作表
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // 設定欄位寬度
  const colWidths = [
    { wch: 6 },  // 序號
    { wch: 30 }, // 活動名稱
    { wch: 15 }, // 系級
    { wch: 10 }, // 姓名
    { wch: 12 }, // 學號
    { wch: 10 }, // 是否社員
    { wch: 15 }, // Line暱稱
    { wch: 25 }, // Email
    { wch: 20 }, // 報名時間
    { wch: 10 }  // 報名狀態
  ];
  ws['!cols'] = colWidths;
  
  // 添加工作表到工作簿
  XLSX.utils.book_append_sheet(wb, ws, '報名名單');
  
  // 生成檔案名稱
  const date = new Date().toISOString().slice(0, 10);
  const filename = `報名名單_${eventTitle}_${date}.xlsx`;
  
  // 下載 Excel 檔案
  XLSX.writeFile(wb, filename);
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
  const ongoingFilter = document.getElementById('ongoingFilter');
  
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
  
  // 綁定持續進行 checkbox
  if (ongoingFilter) {
    // 儲存原始的年份和月份值
    let savedYear = '2026';
    let savedMonth = '';
    
    ongoingFilter.addEventListener('change', function() {
      // 勾選持續進行時，設定選單為特殊值
      if (this.checked) {
        // 儲存當前的篩選值
        savedYear = yearFilter ? yearFilter.value : '';
        savedMonth = monthFilter ? monthFilter.value : '';
        
        if (yearFilter) {
          yearFilter.disabled = true;
          yearFilter.value = '__ongoing__';
        }
        if (monthFilter) {
          monthFilter.disabled = true;
          monthFilter.value = '__ongoing__';
        }
      } else {
        // 恢復原本的篩選值
        if (yearFilter) {
          yearFilter.disabled = false;
          yearFilter.value = savedYear === '__ongoing__' ? '2026' : savedYear;
        }
        if (monthFilter) {
          monthFilter.disabled = false;
          monthFilter.value = savedMonth === '__ongoing__' ? '' : savedMonth;
        }
      }
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
