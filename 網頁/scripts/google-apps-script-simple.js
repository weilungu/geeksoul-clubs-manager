/**
 * 極客魂社團 - 簡單郵件寄送系統
 * 只需兩步：部署取得 URL → 執行寄送
 */

// 可選：限制來源，避免任意請求呼叫你的 Web App
// 留空字串代表不檢查來源；若要限制，填入你的網域（如：https://your-domain.com）
const ALLOWED_ORIGIN = '';

/**
 * 寄送確認郵件給報名者
 * 
 * 使用方式：
 * sendConfirmationEmail('報名者@gmail.com', '王小明', '極客魂社團 Python 工作坊', '2026-01-20');
 */
function sendConfirmationEmail(email, name, activityTitle, activityDate) {
  const subject = `[極客魂社團] 報名確認 - ${activityTitle}`;
  
  const body = `親愛的 ${name}：

感謝你報名「${activityTitle}」活動！

活動時間：${activityDate}
報名者：${name}
Email：${email}

你的報名已成功提交，我們將進一步聯絡你。

極客魂社團`;

  try {
    GmailApp.sendEmail(email, subject, body);
    console.log(`✓ 已寄送郵件至 ${email}`);
    return { success: true, message: '郵件已寄送' };
  } catch (error) {
    console.log(`✗ 寄送失敗：${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * 寄送錄取通知
 * 
 * 使用方式：
 * sendAcceptanceEmail('報名者@gmail.com', '王小明', '極客魂社團 Python 工作坊');
 */
function sendAcceptanceEmail(email, name, activityTitle) {
  const subject = `[極客魂社團] 🎉 恭喜！你已錄取 - ${activityTitle}`;
  
  const body = `親愛的 ${name}：

恭喜！你已成功錄取「${activityTitle}」活動！

請準時參加。如有任何問題，歡迎聯絡我們。

極客魂社團`;

  try {
    GmailApp.sendEmail(email, subject, body);
    console.log(`✓ 已寄送錄取通知至 ${email}`);
    return { success: true };
  } catch (error) {
    console.log(`✗ 寄送失敗：${error.message}`);
    return { success: false };
  }
}

/**
 * 批量寄送郵件
 * 
 * 使用方式：
 * batchSendEmails([
 *   { email: 'student1@gmail.com', name: '王小明', activityTitle: 'Python 工作坊', date: '2026-01-20' },
 *   { email: 'student2@gmail.com', name: '李小紅', activityTitle: 'Python 工作坊', date: '2026-01-20' }
 * ]);
 */
function batchSendEmails(recipients) {
  const results = [];
  
  recipients.forEach(recipient => {
    const result = sendConfirmationEmail(
      recipient.email,
      recipient.name,
      recipient.activityTitle,
      recipient.date
    );
    results.push({
      email: recipient.email,
      success: result.success
    });
  });
  
  console.log(`✓ 完成：${results.filter(r => r.success).length}/${results.length}`);
  return results;
}

// ============================================================
// Web App 端點：讓前端可呼叫寄送（需部署 Web App）
// ============================================================

/**
 * 部署為 Web App 後的入口
 * 前端呼叫方式（範例）：
 * fetch(window.gasDeploymentUrl, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
 *   body: new URLSearchParams({
 *     action: 'sendConfirmation',
 *     data: JSON.stringify({
 *       email: 'user@gmail.com',
 *       name: '王小明',
 *       activityTitle: 'Python 工作坊',
 *       activityDate: '2026-01-20'
 *     })
 *   })
 * });
 */
function doPost(e) {
  try {
    // 簡易來源檢查
    if (ALLOWED_ORIGIN && e?.parameter?.origin && e.parameter.origin !== ALLOWED_ORIGIN) {
      return buildResponse({ success: false, message: 'Origin not allowed' }, 403);
    }

    const action = e?.parameter?.action;
    const payload = e?.parameter?.data ? JSON.parse(e.parameter.data) : {};
    let result = { success: false, message: 'Unknown action' };

    switch (action) {
      case 'sendConfirmation':
        result = sendConfirmationEmail(
          payload.email,
          payload.name,
          payload.activityTitle,
          payload.activityDate
        );
        break;
      case 'sendAcceptance':
        result = sendAcceptanceEmail(
          payload.email,
          payload.name,
          payload.activityTitle
        );
        break;
      default:
        result = { success: false, message: `Unsupported action: ${action}` };
    }

    return buildResponse(result, 200);
  } catch (error) {
    return buildResponse({ success: false, message: error.message }, 500);
  }
}

function buildResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 測試函數 - 按執行鈕測試
 */
function testEmail() {
  const result = sendConfirmationEmail(
    'your-email@gmail.com',  // 改成你的測試 Email
    '測試用戶',
    '測試活動',
    '2026-01-20'
  );
  console.log(result);
}
