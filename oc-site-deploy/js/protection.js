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
    var wm = document.createElement('div');
    wm.id = 'watermark-layer';
    wm.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100vw',
      'height: 100vh',
      'pointer-events: none',
      'z-index: 99997',
      'opacity: 0.035',
      'background-image: url("data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'200\\'%3E%3Ctext x=\\'20\\' y=\\'40\\' font-family=\\'serif\\' font-size=\\'16\\' fill=\\'%23c8b8e8\\' transform=\\'rotate(-25 20 40)\\'%3E楚汐言的OC世界 · 禁止截图%3C/text%3E%3Ctext x=\\'20\\' y=\\'120\\' font-family=\\'serif\\' font-size=\\'16\\' fill=\\'%23c8b8e8\\' transform=\\'rotate(-25 20 120)\\'%3E楚汐言的OC世界 · 禁止截图%3C/text%3E%3C/svg%3E")',
      'background-repeat: repeat'
    ].join(';');
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
