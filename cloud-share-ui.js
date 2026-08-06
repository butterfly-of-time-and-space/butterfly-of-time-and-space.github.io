/* ═══════════════════════════════════════════════════════════════
   云端分享 UI 模块 · cloud-share-ui.js
   ═══════════════════════════════════════════════════════════════
   处理用户交互：
   1. 点击「云端分享」按钮 → 弹出分享弹窗
   2. 填写标题/简介 → 选择公开/私密 → 生成链接
   3. 复制链接 / 直接打开预览
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 创建分享弹窗 ────────────────────────────────────────────
  function createShareDialog() {
    var existing = document.getElementById('cloud-share-dialog');
    if (existing) return existing;

    var dialog = document.createElement('div');
    dialog.id = 'cloud-share-dialog';
    dialog.className = 'cs-dialog-overlay';
    dialog.style.display = 'none';
    dialog.innerHTML = [
      '<div class="cs-dialog">',
      '  <div class="cs-dialog-header">',
      '    <h2 class="cs-dialog-title">云端分享</h2>',
      '    <button class="cs-dialog-close" id="cs-close">×</button>',
      '  </div>',
      '  <div class="cs-dialog-body" id="cs-body">',
      '    <!-- 动态内容 -->',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(dialog);

    // 关闭按钮
    document.getElementById('cs-close').addEventListener('click', function () {
      dialog.style.display = 'none';
    });

    // 点击遮罩关闭
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.style.display = 'none';
    });

    return dialog;
  }

  // ── 显示表单 ────────────────────────────────────────────────
  function showForm() {
    var dialog = createShareDialog();
    var body = document.getElementById('cs-body');
    var email = window.OCCloudShare ? window.OCCloudShare.getUserEmail() : '';

    body.innerHTML = [
      '<div class="cs-form">',
      '  <div class="cs-field">',
      '    <label class="cs-label">邮箱</label>',
      '    <input type="email" id="cs-email" class="cs-input" placeholder="你的邮箱" value="' + escapeAttr(email) + '" />',
      '    <p class="cs-hint">用于管理你的存档（可在「我的存档」中查看/下架）</p>',
      '  </div>',
      '  <div class="cs-field">',
      '    <label class="cs-label">存档标题</label>',
      '    <input type="text" id="cs-title" class="cs-input" placeholder="给这个存档起个名字" value="楚汐言的世界" />',
      '  </div>',
      '  <div class="cs-field">',
      '    <label class="cs-label">简介（可选）</label>',
      '    <textarea id="cs-desc" class="cs-textarea" placeholder="一句话介绍你的世界…" rows="2"></textarea>',
      '  </div>',
      '  <div class="cs-field cs-field-row">',
      '    <label class="cs-checkbox-label">',
      '      <input type="checkbox" id="cs-public" /> ',
      '      <span>公开到漫游大厅</span>',
      '    </label>',
      '  </div>',
      '  <div class="cs-field cs-field-row">',
      '    <label class="cs-label">水印保护</label>',
      '    <select id="cs-watermark" class="cs-select">',
      '      <option value="light" selected>浅水印（右下角标记）</option>',
      '      <option value="deep">深水印（平铺覆盖）</option>',
      '      <option value="off">不加水印</option>',
      '    </select>',
      '  </div>',
      '  <button class="cs-submit-btn" id="cs-submit">生成分享链接</button>',
      '</div>'
    ].join('');

    dialog.style.display = 'flex';

    // 提交
    document.getElementById('cs-submit').addEventListener('click', handleSubmit);
  }

  // ── 处理提交 ────────────────────────────────────────────────
  async function handleSubmit() {
    var email = document.getElementById('cs-email').value.trim();
    var title = document.getElementById('cs-title').value.trim() || '楚汐言的世界';
    var desc = document.getElementById('cs-desc').value.trim();
    var isPublic = document.getElementById('cs-public').checked;
    var watermark = document.getElementById('cs-watermark').value;

    if (!email || email.indexOf('@') < 0) {
      if (window.showToast) window.showToast('请输入有效邮箱', 'error');
      return;
    }

    // 保存邮箱
    window.OCCloudShare.setUserEmail(email);

    // 设置水印
    if (window.OCWatermark) {
      window.OCWatermark.setMode(watermark);
    }

    // 显示加载中（图片上传可能需要较长时间）
    var body = document.getElementById('cs-body');
    body.innerHTML = '<div class="cs-loading"><div class="cs-spinner"></div><p>正在压缩图片并上传…</p><p class="cs-loading-hint" style="font-size:12px;color:#888;margin-top:8px;">图片较多时可能需要几十秒，请耐心等待</p></div>';

    try {
      var result = await window.OCCloudShare.generateLink({
        title: title,
        description: desc,
        isPublic: isPublic,
        email: email
      });

      // 显示成功
      showSuccess(result, isPublic, watermark);

    } catch (e) {
      body.innerHTML = [
        '<div class="cs-error">',
        '  <div class="cs-error-icon">⚠️</div>',
        '  <p>分享失败</p>',
        '  <p class="cs-error-msg">' + escapeHtml(e.message || '未知错误') + '</p>',
        '  <button class="cs-submit-btn" onclick="window.OCCloudShareUI.showForm()">重试</button>',
        '</div>'
      ].join('');
    }
  }

  // ── 显示成功 ────────────────────────────────────────────────
  function showSuccess(result, isPublic, watermark) {
    var body = document.getElementById('cs-body');
    body.innerHTML = [
      '<div class="cs-success">',
      '  <div class="cs-success-icon">✅</div>',
      '  <h3>分享链接已生成！</h3>',
      '  <div class="cs-link-box">',
      '    <input type="text" class="cs-link-input" id="cs-link" value="' + escapeAttr(result.url) + '" readonly />',
      '    <button class="cs-copy-btn" id="cs-copy">复制</button>',
      '  </div>',
      '  <div class="cs-success-info">',
      '    <p>标题：' + escapeHtml(result.title) + '</p>',
      '    <p>状态：' + (isPublic ? '🌍 公开（漫游大厅可见）' : '🔒 私密（仅链接可访问）') + '</p>',
      '    <p>水印：' + (watermark === 'off' ? '未启用' : (watermark === 'light' ? '浅水印' : '深水印')) + '</p>',
      '  </div>',
      '  <div class="cs-success-actions">',
      '    <button class="cs-action-btn cs-action-preview" onclick="window.open(\'' + escapeAttr(result.url) + '\', \'_blank\')">预览</button>',
      '    <button class="cs-action-btn cs-action-close" id="cs-done">完成</button>',
      '  </div>',
      '</div>'
    ].join('');

    // 复制按钮
    var copyBtn = document.getElementById('cs-copy');
    var linkInput = document.getElementById('cs-link');
    if (copyBtn && linkInput) {
      copyBtn.addEventListener('click', function () {
        linkInput.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        if (navigator.clipboard) navigator.clipboard.writeText(result.url);
        if (window.showToast) window.showToast('链接已复制', 'success');
      });
    }

    // 完成按钮
    var doneBtn = document.getElementById('cs-done');
    if (doneBtn) {
      doneBtn.addEventListener('click', function () {
        document.getElementById('cloud-share-dialog').style.display = 'none';
      });
    }
  }

  // ── 工具：HTML 转义 ─────────────────────────────────────────
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
  }

  // ── 暴露 API ────────────────────────────────────────────────
  window.OCCloudShareUI = { showForm: showForm };

  console.log('[CloudShareUI] 云端分享 UI 模块加载完成');
})();
