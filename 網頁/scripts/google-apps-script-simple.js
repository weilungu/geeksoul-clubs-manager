/**
 * 極客魂社團 - 簡單郵件寄送系統
 * 只需兩步：部署取得 URL → 執行寄送
 */

// 可選：限制來源，避免任意請求呼叫你的 Web App
// 留空字串代表不檢查來源；若要限制，填入你的網域（如：https://your-domain.com）
const ALLOWED_ORIGIN = '';

/**
 * 寄送郵件通知
 * 
 * 使用方式：
 * sendEmail('報名者@gmail.com', '王小明', '極客魂社團 Python 工作坊', '2026-01-15', '資訊大樓 A101', '411345678', '是（社員）');
 */
function sendEmail(email, name, activityTitle, activityDate, activityLocation, studentId, isMember) {
  const subject = `[極客魂社團] 報名確認 - ${activityTitle}`;
  
  const htmlBody = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Microsoft JhengHei", sans-serif; background-color: #FAFAFA; line-height: 1.6; }
    table { border-collapse: collapse; }
    .email-wrapper { width: 100%; background-color: #FAFAFA; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); margin-bottom: 20px; }
    .email-header { background: linear-gradient(135deg, #B71C1C 0%, #F57C00 100%); padding: 30px 40px; text-align: center; color: #FFFFFF; }
    .email-header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .email-header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.95; }
    .email-body { padding: 40px; color: #212121; }
    .greeting { font-size: 18px; font-weight: 500; margin-bottom: 20px; color: #212121; }
    .intro-text { font-size: 15px; color: #616161; margin-bottom: 30px; }
    .info-box { background-color: #FFF3E0; border-left: 4px solid #F57C00; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-box-title { font-size: 16px; font-weight: 600; color: #F57C00; margin-bottom: 15px; }
    .info-item { display: flex; padding: 8px 0; border-bottom: 1px solid #FFE0B2; }
    .info-item:last-child { border-bottom: none; }
    .info-label { font-weight: 500; color: #616161; min-width: 100px; }
    .info-value { color: #212121; flex: 1; }
    .status-section { background-color: #E8F5E9; border-left: 4px solid #2E7D32; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .status-title { font-size: 16px; font-weight: 600; color: #2E7D32; margin-bottom: 10px; }
    .status-text { font-size: 14px; color: #616161; line-height: 1.6; }
    .acceptance-box { background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); border-left: 4px solid #2E7D32; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .acceptance-icon { font-size: 48px; margin-bottom: 15px; }
    .acceptance-title { font-size: 24px; font-weight: 600; color: #2E7D32; margin-bottom: 10px; }
    .acceptance-text { font-size: 15px; color: #616161; }
    .warning-box { background-color: #FFF3E0; border-left: 4px solid #EF6C00; padding: 25px; margin: 20px 0; border-radius: 8px; }
    .warning-title { font-size: 18px; font-weight: 600; color: #EF6C00; margin-bottom: 15px; }
    .divider { height: 1px; background-color: #E0E0E0; margin: 30px 0; }
    .email-footer { background-color: #FAFAFA; padding: 30px 40px; text-align: center; font-size: 13px; color: #616161; border-top: 1px solid #E0E0E0; }
    .email-footer p { margin: 5px 0; }
    .email-footer a { color: #F57C00; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- ========== 郵件範本 1：報名確認信 ========== -->
    <div class="email-container">
      <div class="email-header">
        <h1>《極客魂社團》線上表單系統</h1>
        <p>社團活動報名、名額管理與行政支援系統</p>
      </div>
      <div class="email-body">
        <div class="greeting">親愛的 ${name}：</div>
        <div class="intro-text">感謝您報名《極客魂社團》的「${activityTitle}」活動！</div>
        <div class="info-box">
          <div class="info-box-title">📋 報名資訊確認</div>
          <div class="info-item"><div class="info-label">活動名稱：</div><div class="info-value">${activityTitle}</div></div>
          <div class="info-item"><div class="info-label">活動時間：</div><div class="info-value">${activityDate || '待定'}</div></div>
          <div class="info-item"><div class="info-label">活動地點：</div><div class="info-value">${activityLocation || '待定'}</div></div>
          <div class="info-item"><div class="info-label">報名者姓名：</div><div class="info-value">${name}</div></div>
          <div class="info-item"><div class="info-label">學號：</div><div class="info-value">${studentId || '未提供'}</div></div>
          <div class="info-item"><div class="info-label">Email：</div><div class="info-value">${email}</div></div>
          <div class="info-item"><div class="info-label">是否為社員：</div><div class="info-value">${isMember || '未提供'}</div></div>
        </div>
        <div class="status-section">
          <div class="status-title">✅ 報名狀態</div>
          <div class="status-text">您的報名已成功提交。系統將在報名截止後進行審核，並以 Email 通知您最終的錄取或候補結果。</div>
        </div>
        <div class="divider"></div>
        <p style="font-size: 14px; color: #616161;">如有任何問題，歡迎聯絡社團幹部。<br>感謝您的參與！</p>
      </div>
      <div class="email-footer">
        <p>此為系統自動發送的郵件，請勿直接回覆。</p>
        <p>© 2026 極客魂社團</p>
      </div>
    </div>
    
    <!-- ========== 郵件範本 2：錄取通知 ========== -->
    <div class="email-container">
      <div class="email-header">
        <h1>《極客魂社團》線上表單系統</h1>
        <p>社團活動報名、名額管理與行政支援系統</p>
      </div>
      <div class="email-body">
        <div class="greeting">親愛的 ${name}：</div>
        <div class="intro-text">感謝您報名「${activityTitle}」活動！</div>
        <div class="acceptance-box">
          <div class="acceptance-icon">🎉</div>
          <div class="acceptance-title">恭喜！您已成功錄取</div>
          <div class="acceptance-text">請準時參加活動</div>
        </div>
        <div class="info-box">
          <div class="info-box-title">📋 活動詳情</div>
          <div class="info-item"><div class="info-label">活動名稱：</div><div class="info-value">${activityTitle}</div></div>
          <div class="info-item"><div class="info-label">活動時間：</div><div class="info-value">${activityDate || '待定'}</div></div>
          <div class="info-item"><div class="info-label">活動地點：</div><div class="info-value">${activityLocation || '待定'}</div></div>
        </div>
        <div class="status-section">
          <div class="status-title">✅ 注意事項</div>
          <div class="status-text">• 請提前 10 分鐘到場<br>• 請自備筆記型電腦<br>• 如有臨時狀況無法參加，請盡早通知社團幹部</div>
        </div>
        <div class="divider"></div>
        <p style="font-size: 14px; color: #616161;">如有任何問題，歡迎聯絡社團幹部。<br>期待與您的見面！</p>
      </div>
      <div class="email-footer">
        <p>此為系統自動發送的郵件，請勿直接回覆。</p>
        <p>© 2026 極客魂社團</p>
      </div>
    </div>
    
    <!-- ========== 郵件範本 3：候補通知 ========== -->
    <div class="email-container">
      <div class="email-header">
        <h1>《極客魂社團》線上表單系統</h1>
        <p>社團活動報名、名額管理與行政支援系統</p>
      </div>
      <div class="email-body">
        <div class="greeting">親愛的 ${name}：</div>
        <div class="intro-text">感謝您報名「${activityTitle}」活動！</div>
        <div class="warning-box">
          <div class="warning-title">您目前在候補名單中</div>
          <div class="status-text">由於報名人數眾多，您目前在候補名單中。如有人取消報名，我們將主動通知您。</div>
        </div>
        <div class="info-box">
          <div class="info-box-title">📋 活動詳情</div>
          <div class="info-item"><div class="info-label">活動名稱：</div><div class="info-value">${activityTitle}</div></div>
          <div class="info-item"><div class="info-label">活動時間：</div><div class="info-value">${activityDate || '待定'}</div></div>
          <div class="info-item"><div class="info-label">候補狀態：</div><div class="info-value">候補中（我們會主動通知您）</div></div>
        </div>
        <div class="divider"></div>
        <p style="font-size: 14px; color: #616161;">如有任何問題，歡迎聯絡社團幹部。<br>敬請期待下一場活動！</p>
      </div>
      <div class="email-footer">
        <p>此為系統自動發送的郵件，請勿直接回覆。</p>
        <p>© 2026 極客魂社團</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const plainBody = `親愛的 ${name}：\n\n感謝你報名「${activityTitle}」活動！\n\n活動時間：${activityDate}\n活動地點：${activityLocation}\n報名者：${name}\nEmail：${email}\n\n你的報名已成功提交，我們將進一步聯絡你。\n\n極客魂社團`;

  try {
    GmailApp.sendEmail(email, subject, plainBody, { htmlBody: htmlBody });
    console.log(`✓ 已寄送郵件至 ${email}`);
    return { success: true, message: '郵件已寄送' };
  } catch (error) {
    console.log(`✗ 寄送失敗：${error.message}`);
    return { success: false, message: error.message };
  }
}

/**
 * 批量寄送郵件
 * 
 * 使用方式：
 * batchSendEmails([
 *   { email: 'student1@gmail.com', name: '王小明', activityTitle: 'Python 工作坊', activityDate: '2026-01-20', activityLocation: '資訊大樓 A101', studentId: '411345678', isMember: '是' },
 *   { email: 'student2@gmail.com', name: '李小紅', activityTitle: 'Python 工作坊', activityDate: '2026-01-20', activityLocation: '資訊大樓 A101', studentId: '411345679', isMember: '否' }
 * ]);
 */
function batchSendEmails(recipients) {
  const results = [];
  
  recipients.forEach(recipient => {
    const result = sendEmail(
      recipient.email,
      recipient.name,
      recipient.activityTitle,
      recipient.activityDate,
      recipient.activityLocation,
      recipient.studentId,
      recipient.isMember
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
 *     action: 'sendEmail',
 *     data: JSON.stringify({
 *       email: 'user@gmail.com',
 *       name: '王小明',
 *       activityTitle: 'Python 工作坊',
 *       activityDate: '2026-01-20',
 *       activityLocation: '資訊大樓 A101',
 *       studentId: '411345678',
 *       isMember: '是（社員）'
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

    if (action === 'sendEmail') {
      result = sendEmail(
        payload.email,
        payload.name,
        payload.activityTitle,
        payload.activityDate,
        payload.activityLocation,
        payload.studentId,
        payload.isMember
      );
    } else {
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
  const result = sendEmail(
    'your-email@gmail.com',  // 改成你的測試 Email
    '王小明',
    'Python 工作坊',
    '2026 年 1 月 15 日（三）14:00-17:00',
    '資訊大樓 A101',
    '411345678',
    '是（社員）'
  );
  console.log(result);
}