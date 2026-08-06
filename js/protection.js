/* ═══════════════════════════════════════════════════════════════
   防下载 / 截图保护层（精简版）
   ═══════════════════════════════════════════════════════════════
   保留：右键禁用、拖拽禁用、文本选择限制、水印
   移除：debugger 定时器（导致页面卡死）、失焦遮罩（切窗口时遮住页面）、
         键盘快捷键拦截（阻止调试，开发期间不需要）
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 1. 禁用右键菜单 ──────────────────────────────────────
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  // ── 2. 禁用拖拽（图片、链接等）────────────────────────────
  document.addEventListener('dragstart', function (e) {
    e.preventDefault();
    return false;
  });

  // ── 3. 禁用文本选择（但允许 contenteditable 区域）─────────
  document.addEventListener('selectstart', function (e) {
    var target = e.target;
    if (target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA') {
      return;
    }
    e.preventDefault();
    return false;
  });

  // ── 4. 禁用图片拖拽和长按保存（移动端）────────────────────
  document.addEventListener('touchstart', function (e) {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  }, { passive: false });

  // ── 5. 水印覆盖层 ────────────────────────────────────────
  function createWatermark() {
    // SVG data URL —— 抽成变量避免引号嵌套混乱
    // 这里"楚汐言的OC世界 · 禁止截图"做了 URL 编码（UTF-8 百分号编码），
    // 内部全部用单引号，外层 cssText 用 + 拼接，无需任何 JS 字符串转义。
    var wmText = '%E6%99%9C%E6%B1%9F%E8%A8%80%E7%9A%84OC%E4%B8%96%E7%95%8C%C2%B7%E7%A6%81%E6%AD%A2%E6%88%AA%E5%9B%BE';
    var wmSvg = [
      "data:image/svg+xml,",
      "%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='220'%3E",
      "%3Ctext x='20' y='50' font-family='serif' font-size='18' fill='%23c8b8e8' transform='rotate(-25 20 50)'%3E",
      wmText,
      "%3C/text%3E",
      "%3Ctext x='20' y='140' font-family='serif' font-size='18' fill='%23c8b8e8' transform='rotate(-25 20 140)'%3E",
      wmText,
      "%3C/text%3E",
      "%3C/svg%3E"
    ].join('');

    var wm = document.createElement('div');
    wm.id = 'watermark-layer';
    wm.style.cssText =
      'position:fixed;' +
      'top:0;left:0;' +
      'width:100vw;height:100vh;' +
      'pointer-events:none;' +
      'z-index:99997;' +
      'opacity:0.04;' +
      "background-image:url('" + wmSvg + "');" +
      'background-repeat:repeat;';
    document.body.appendChild(wm);
  }

  // 延迟创建水印，不阻塞页面初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWatermark);
  } else {
    createWatermark();
  }

  console.log('%c⚠ 楚汐言的OC世界', 'font-size:24px;color:#e8d0ff;');
  console.log('%c本站内容受保护，禁止下载、截图和复制。', 'font-size:14px;color:#b8a0e8;');

})();
