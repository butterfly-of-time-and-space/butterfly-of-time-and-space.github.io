/* ═══════════════════════════════════════════════════════════════
   只读模式模块 · readonly-mode.js
   ═══════════════════════════════════════════════════════════════
   当 URL 包含 ?share=xxx 时自动启用：
   1. 从 Supabase 加载分享数据
   2. 写入 localStorage
   3. 禁用所有编辑功能（contenteditable、按钮、输入框）
   4. 隐藏编辑入口
   5. 显示"只读模式"提示条
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var IS_READONLY = false;

  // ── 检测 URL 参数 ───────────────────────────────────────────
  function getShareToken() {
    var params = new URLSearchParams(window.location.search);
    return params.get('share');
  }

  // ── 应用数据到 localStorage ─────────────────────────────────
  function applyShareData(shareData) {
    if (!shareData || !shareData.data) {
      console.error('[ReadOnly] 分享数据为空');
      return false;
    }

    var d = shareData.data;

    // 主存档
    if (d.data || d.version) {
      var archive = {
        version: d.version || '2.0',
        savedAt: d.savedAt || new Date().toISOString(),
        data: d.data || {}
      };
      localStorage.setItem('chuxiyan_oc_archive', JSON.stringify(archive));
    }

    // 角色数据
    if (d.characters) {
      localStorage.setItem('chuxiyan_oc_characters', JSON.stringify(d.characters));
    }

    // 小说数据
    if (d.novels) {
      localStorage.setItem('chuxiyan_oc_novels', JSON.stringify(d.novels));
    }

    // IF 线数据
    if (d.ifWorlds) {
      localStorage.setItem('chuxiyan_oc_ifworlds', JSON.stringify(d.ifWorlds));
    }

    return true;
  }

  // ── 禁用所有编辑功能 ────────────────────────────────────────
  function lockEditing() {
    // 1. 移除所有 contenteditable
    var editables = document.querySelectorAll('[contenteditable]');
    for (var i = 0; i < editables.length; i++) {
      editables[i].removeAttribute('contenteditable');
    }

    // 2. 禁用所有 input / textarea
    var inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    for (var j = 0; j < inputs.length; j++) {
      inputs[j].setAttribute('disabled', 'disabled');
      inputs[j].setAttribute('readonly', 'readonly');
      inputs[j].style.pointerEvents = 'none';
    }

    // 3. 隐藏文件上传
    var fileInputs = document.querySelectorAll('input[type="file"]');
    for (var k = 0; k < fileInputs.length; k++) {
      fileInputs[k].style.display = 'none';
    }
  }

  // ── 插入只读 CSS ────────────────────────────────────────────
  function injectReadOnlyCSS() {
    var style = document.createElement('style');
    style.id = 'readonly-lock';
    style.textContent = [
      /* 禁用文本选择 */
      '[contenteditable], [contenteditable="false"] {',
      '  -webkit-user-select: none !important;',
      '  user-select: none !important;',
      '  caret-color: transparent !important;',
      '  cursor: default !important;',
      '}',
      '',
      /* 禁用输入框 */
      'input:not([type="hidden"]), textarea, select {',
      '  pointer-events: none !important;',
      '  -webkit-user-select: none !important;',
      '  user-select: none !important;',
      '}',
      'input[type="file"] { display: none !important; }',
      '',
      /* 隐藏编辑按钮 */
      '#btn-save-archive, #btn-load-archive, #btn-export, #btn-import,',
      '#btn-delete-archive, #btn-publish-display,',
      '#btn-share, #btn-share-full, #btn-cloud-share,',
      '.btn-save-archive, .btn-load-archive, .btn-export, .btn-import,',
      '.btn-delete-archive, .btn-publish-display,',
      '[class*="btn-add"], [class*="btn-delete"], [class*="btn-edit"],',
      '[class*="btn-upload"], [class*="btn-remove"],',
      '[class*="gallery-add"], [class*="gallery-delete"],',
      '[class*="lpp-send"], [class*="lpp-post"],',
      '.edit-btn, .delete-btn, .add-btn, .top-bar-btn-save,',
      '#btn-refresh-weapons, #btn-save-weapon-detail, #btn-save-weapon-skill-edit,',
      'button[title*="删除"], button[title*="编辑"], button[title*="添加"],',
      'button[title*="上传"], button[title*="发布"], button[title*="存档"],',
      'button[title*="导出"], button[title*="导入"], button[title*="保存"] {',
      '  display: none !important;',
      '}',
      '',
      /* 隐藏音乐播放器在只读模式下（可选） */
      '/* .music-player-fab { display: none !important; } */',
      '',
      /* 只读提示条 */
      '.readonly-banner {',
      '  position: fixed;',
      '  top: 0;',
      '  left: 0;',
      '  right: 0;',
      '  z-index: 99998;',
      '  background: linear-gradient(90deg, rgba(26,13,46,0.95), rgba(42,29,61,0.95));',
      '  color: var(--gold-bright, #e8c87a);',
      '  font-size: 13px;',
      '  padding: 8px 20px;',
      '  text-align: center;',
      '  font-family: "Noto Serif SC", serif;',
      '  letter-spacing: 1px;',
      '  border-bottom: 1px solid rgba(232,200,122,0.3);',
      '  backdrop-filter: blur(8px);',
      '  pointer-events: none;',
      '}',
      '.readonly-banner .banner-title {',
      '  color: var(--gold-bright, #e8c87a);',
      '  font-weight: 600;',
      '  margin-right: 12px;',
      '}',
      '.readonly-banner .banner-sub {',
      '  color: rgba(232,200,122,0.6);',
      '  font-size: 12px;',
      '}',
      '',
      /* 页面内容下移，避免被提示条遮挡 */
      'body.readonly-mode .screen.active {',
      '  padding-top: 36px;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── 显示只读提示条 ──────────────────────────────────────────
  function showBanner(title, sub) {
    var banner = document.createElement('div');
    banner.className = 'readonly-banner';
    banner.innerHTML =
      '<span class="banner-title">只读模式</span>' +
      '<span class="banner-sub">' + (title || '正在浏览分享内容') + (sub ? ' · ' + sub : '') + '</span>';
    document.body.appendChild(banner);
    document.body.classList.add('readonly-mode');
  }

  // ── 延迟锁定（等动态元素渲染完）──────────────────────────────
  function delayedLock() {
    setTimeout(lockEditing, 300);
    setTimeout(lockEditing, 1000);
    setTimeout(lockEditing, 2000);
  }

  // ── 初始化只读模式 ──────────────────────────────────────────
  async function init() {
    var token = getShareToken();
    if (!token) return; // 不是分享链接，不启用只读

    IS_READONLY = true;

    // 提前注入 CSS（在数据加载完成前就隐藏编辑按钮）
    injectReadOnlyCSS();
    showBanner('正在加载数据…');

    console.log('[ReadOnly] 检测到分享链接，token:', token);

    try {
      // 加载分享数据
      if (!window.OCCloudShare) {
        throw new Error('云端分享模块未加载');
      }

      var shareData = await window.OCCloudShare.loadData(token);
      console.log('[ReadOnly] 数据加载成功:', shareData.title);

      // 应用数据
      applyShareData(shareData);

      // 增加浏览次数
      window.OCCloudShare.incrementViews(token);

      // 更新提示条
      var banner = document.querySelector('.readonly-banner .banner-sub');
      if (banner) {
        banner.textContent = shareData.title || '正在浏览分享内容';
      }

      // 延迟锁定编辑
      delayedLock();

    } catch (e) {
      console.error('[ReadOnly] 加载失败:', e);
      var errBanner = document.querySelector('.readonly-banner .banner-sub');
      if (errBanner) {
        errBanner.textContent = '数据加载失败：' + (e.message || '未知错误');
        errBanner.style.color = '#ff6b6b';
      }
    }
  }

  // ── 暴露状态查询 ────────────────────────────────────────────
  window.isReadOnlyMode = function () { return IS_READONLY; };

  // ── DOM 就绪后启动 ──────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[ReadOnly] 只读模式模块加载完成');
})();
