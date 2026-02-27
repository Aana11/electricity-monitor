const nodemailer = require('nodemailer');

// 创建邮件发送器 - 使用与 daily-check.sh 相同的配置
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '653723921@qq.com',
    pass: 'pqsdeedfhlbjbdbh'
  }
});

// 发送邮件函数
function sendEmail(to, subject, html) {
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: '"宿舍管理系统" <653723921@qq.com>',
      to: to,
      subject: subject,
      html: html
    }, (err, info) => {
      if (err) {
        console.error('邮件发送失败:', err);
        resolve({ success: false, error: err.message });
      } else {
        console.log('邮件发送成功:', info.messageId);
        resolve({ success: true, messageId: info.messageId });
      }
    });
  });
}

// 发送测试邮件
async function sendTestEmail(to) {
  const subject = '🎉 邮件通知测试成功';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 测试成功</h1>
      </div>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">您好！</p>
        <p style="color: #666;">这是来自宿舍管理系统的测试邮件。</p>
        <p style="color: #666;">如果您收到这封邮件，说明邮件通知功能已经配置成功！</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复。</p>
        </div>
      </div>
    </div>
  `;
  
  return sendEmail(to, subject, html);
}

// 发送投票结果通知
async function sendVoteResultNotification(userEmail, voteTitle, result) {
  const subject = `🗳️ 投票结果: ${voteTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🗳️ 投票结果</h1>
      </div>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">您好！</p>
        <p style="color: #666;">投票 "<strong>${voteTitle}</strong>" 已结束。</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>最终结果：</strong>${result}</p>
        </div>
        <p style="color: #999; font-size: 12px;">请登录系统查看详细投票信息。</p>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, subject, html);
}

// 发送抽签结果通知
async function sendLotteryResultNotification(userEmail, lotteryTitle, result) {
  const subject = `🎲 抽签结果: ${lotteryTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎲 抽签结果</h1>
      </div>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">您好！</p>
        <p style="color: #666;">抽签 "<strong>${lotteryTitle}</strong>" 已完成！</p>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>分配结果：</strong></p>
          ${result.map(r => `<p style="margin: 5px 0;">• ${r.item} → ${r.user}</p>`).join('')}
        </div>
        <p style="color: #999; font-size: 12px;">请登录系统查看详细信息。</p>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, subject, html);
}

// 发送凭证失效通知
async function sendCredentialExpiredNotification(to, realName, account) {
  const subject = '⚠️ 您的学校账号密码已失效';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ 账号凭证失效提醒</h1>
      </div>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">您好，${realName}！</p>
        <p style="color: #666;">您的学校账号 <strong>${account}</strong> 密码已失效，可能是由于：</p>
        <ul style="color: #666; line-height: 1.8;">
          <li>您在学校网站修改了密码</li>
          <li>学校统一重置了密码</li>
          <li>密码已过期需要更新</li>
        </ul>
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
          <p style="margin: 0; color: #333;"><strong>请尽快重新登录更新密码，否则系统将无法获取您的电费数据。</strong></p>
        </div>
        <a href="https://xn--sqry19b.work/electricity/login" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 10px 0;">立即登录更新</a>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    </div>
  `;
  
  return sendEmail(to, subject, html);
}

module.exports = {
  sendEmail,
  sendTestEmail,
  sendVoteResultNotification,
  sendLotteryResultNotification,
  sendCredentialExpiredNotification
};
