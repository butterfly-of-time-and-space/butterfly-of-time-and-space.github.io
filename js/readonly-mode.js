/* ═══════════════════════════════════════════════════════════════
   只读模式模块 · readonly-mode.js
   ═══════════════════════════════════════════════════════════════
   版本：v3.0 · 2026-08-06 23:38
   策略变更：不走 IndexedDB，base64 直接写 localStorage（手机兼容）
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var IS_READONLY = false;

  // ── 检测 URL 参数 ───────────────────────────────────────────
  function getShareToken() {
    var params = new URLSearchParams(window.location.search);
    return params.get('share');
  }

  // ── 页面可见诊断（不用开 Console 就能看到状态）──────────────
  function diag(msg) {
    console.log('[ReadOnly] ' + msg);
    var el = document.getElementById('readonly-diag');
    if (!el) {
      el = document.createElement('div');
      el.id = 'readonly-diag';
      el.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;z-index:99999;background:rgba(0,0,0,0.85);color:#0f0;font-size:11px;font-family:monospace;padding:8px 12px;border-radius:6px;max-height:200px;overflow-y:auto;pointer-events:auto;';
      document.body.appendChild(el);
    }
    var time = new Date().toLocaleTimeString();
    el.innerHTML += '[' + time + '] ' + msg + '<br>';
    el.scrollTop = el.scrollHeight;
  }

  // ── 统计图片数量和大小 ─────────────────────────────────────
  function countImages(obj) {
    var stats = { count: 0, totalSize: 0 };
    function walk(o) {
      if (o === null || o === undefined) return;
      if (typeof o === 'string') {
        if (o.indexOf('data:image/') === 0) {
          stats.count++;
          stats.totalSize += o.length;
        }
        return;
      }
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (typeof o === 'object') {
        for (var k in o) if (o.hasOwnProperty(k)) walk(o[k]);
      }
    }
    walk(obj);
    return stats;
  }

  // ── 应用数据到 localStorage（base64 直接写，不走 IndexedDB）──
  async function applyShareData(shareData) {
    if (!shareData || !shareData.data) {
      diag('❌ 分享数据为空');
      return false;
    }

    var d = shareData.data;

    // 统计图片
    var stats = countImages(d);
    diag('📦 数据包含 ' + stats.count + ' 张图片（约 ' + Math.round(stats.totalSize / 1024) + 'KB）');

    // 计算总大小
    var totalSize = JSON.stringify(d).length;
    diag('📏 数据总大小：' + Math.round(totalSize / 1024) + 'KB');

    // 直接写 localStorage（base64 不转 idb: 引用）
    // 压缩后的图片（800px/JPEG 0.7）每张几十 KB，总共几 MB 能装下
    try {
      // 主存档
      if (d.data || d.version) {
        var archive = {
          version: d.version || '2.0',
          savedAt: d.savedAt || new Date().toISOString(),
          data: d.data || {}
        };
        localStorage.setItem('chuxiyan_oc_archive', JSON.stringify(archive));
        diag('✅ 主存档已写入');
      }

      // 角色数据
      if (d.characters) {
        localStorage.setItem('chuxiyan_oc_characters', JSON.stringify(d.characters));
        diag('✅ 角色数据已写入（' + (Array.isArray(d.characters) ? d.characters.length : '?') + ' 个角色）');
      }

      // 小说数据
      if (d.novels) {
        localStorage.setItem('chuxiyan_oc_novels', JSON.stringify(d.novels));
        diag('✅ 小说数据已写入');
      }

      // IF 线数据
      if (d.ifWorlds) {
        localStorage.setItem('chuxiyan_oc_ifworlds', JSON.stringify(d.ifWorlds));
        diag('✅ IF线数据已写入');
      }

      diag('🎉 所有数据写入完成');
      return true;

    } catch (e) {
      diag('❌ localStorage 写入失败：' + e.message);
      diag('💡 可能原因：数据太大（' + Math.round(totalSize / 1024) + 'KB > localStorage 上限）');

      // 降级：尝试只写不含图片的文本数据
      try {
        diag('🔄 尝试降级：只写文本数据（不含图片）...');
        var stripped = stripImages(d);
        if (stripped.data || stripped.version) {
          var archive2 = {
            version: stripped.version || '2.0',
            savedAt: stripped.savedAt || new Date().toISOString(),
            data: stripped.data || {}
          };
          localStorage.setItem('chuxiyan_oc_archive', JSON.stringify(archive2));
        }
        if (stripped.characters) {
          localStorage.setItem('chuxiyan_oc_characters', JSON.stringify(stripped.characters));
        }
        if (stripped.novels) {
          localStorage.setItem('chuxiyan_oc_novels', JSON.stringify(stripped.novels));
        }
        if (stripped.ifWorlds) {
          localStorage.setItem('chuxiyan_oc_ifworlds', JSON.stringify(stripped.ifWorlds));
        }
        diag('✅ 降级写入完成（图片被移除，文本保留）');
        return true;
      } catch (e2) {
        diag('❌ 降级也失败：' + e2.message);
        return false;
      }
    }
  }

  // ── 移除所有图片字段（降级用）──────────────────────────────
  function stripImages(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      if (obj.indexOf('data:image/') === 0 && obj.length > 500) {
        return ''; // 移除图片
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(stripImages);
    }
    if (typeof obj === 'object') {
      var result = {};
      for (var k in obj) {
        if (obj.hasOwnProperty(k)) result[k] = stripImages(obj[k]);
      }
      return result;
    }
    return obj;
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

    diag('🚀 只读模式启动 v3.0');
    diag('🔗 token: ' + token.substring(0, 8) + '...');

    try {
      // 加载分享数据
      if (!window.OCCloudShare) {
        throw new Error('云端分享模块未加载');
      }

      diag('⏳ 正在从云端下载数据...');
      var shareData = await window.OCCloudShare.loadData(token);
      diag('✅ 数据下载完成：' + shareData.title);

      // 应用数据
      var success = await applyShareData(shareData);
      if (!success) {
        diag('❌ 数据应用失败');
        return;
      }

      // 验证：从 localStorage 读回数据，检查图片是否可读
      try {
        var verify = window.ocStorage ? window.ocStorage.get('chuxiyan_oc_archive') : JSON.parse(localStorage.getItem('chuxiyan_oc_archive') || '{}');
        if (verify && verify.data) {
          var verifyStats = countImages(verify);
          diag('🔍 验证：读回 ' + verifyStats.count + ' 张图片（' + Math.round(verifyStats.totalSize / 1024) + 'KB）');
        }
      } catch (ve) {
        diag('⚠️ 验证读取异常：' + ve.message);
      }

      // 数据写入后强制重新渲染
      diag('🔄 触发页面重新渲染...');
      if (window.OCStorage && typeof window.OCStorage.autoRestore === 'function') {
        try { window.OCStorage.autoRestore(); diag('✅ autoRestore 已调用'); } catch (e) { diag('❌ autoRestore 失败：' + e.message); }
      } else {
        diag('⚠️ OCStorage.autoRestore 不存在');
      }
      if (window.OCEdit && typeof window.OCEdit.refreshAllFromStorage === 'function') {
        try { window.OCEdit.refreshAllFromStorage(); diag('✅ refreshAllFromStorage 已调用'); } catch (e) { diag('❌ refreshAll 失败：' + e.message); }
      } else {
        diag('⚠️ OCEdit.refreshAllFromStorage 不存在');
      }

      // 延迟刷新（等图片异步加载）
      setTimeout(function () {
        if (window.OCStorage && typeof window.OCStorage.autoRestore === 'function') {
          try { window.OCStorage.autoRestore(); } catch (e) {}
        }
        if (window.OCEdit && typeof window.OCEdit.refreshAllFromStorage === 'function') {
          try { window.OCEdit.refreshAllFromStorage(); } catch (e) {}
        }
        diag('🔄 500ms 后再次刷新');
      }, 500);
      setTimeout(function () {
        if (window.OCStorage && typeof window.OCStorage.autoRestore === 'function') {
          try { window.OCStorage.autoRestore(); } catch (e) {}
        }
        if (window.OCEdit && typeof window.OCEdit.refreshAllFromStorage === 'function') {
          try { window.OCEdit.refreshAllFromStorage(); } catch (e) {}
        }
        diag('🔄 1500ms 后第三次刷新');
        // 3秒后隐藏诊断面板
        setTimeout(function () {
          var el = document.getElementById('readonly-diag');
          if (el) el.style.opacity = '0.5';
        }, 1500);
      }, 1500);

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
      diag('❌ 加载失败：' + (e.message || '未知错误'));
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

  console.log('[ReadOnly] 只读模式模块加载完成 v3.0 · 直写 localStorage · 手机适配版');
})();
