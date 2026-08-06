/* ═══════════════════════════════════════════════════════════════
   水印保护模块 · watermark.js
   ═══════════════════════════════════════════════════════════════
   功能：
   1. 浅水印：右下角半透明文字（轻量边角标记）
   2. 深水印：平铺重复文字（高覆盖度保护）
   3. 自动应用到分享页面中的所有图片
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  window.OCWatermark = {
    apply: null,
    applyToAll: null,
    setMode: null,
    setText: null
  };

  var MODE = 'light';   // 'light' | 'deep' | 'off'
  var TEXT = '楚汐言的世界'; // 默认水印文字

  // ── 设置水印模式 ────────────────────────────────────────────
  function setMode(mode) {
    MODE = mode;
  }

  // ── 设置水印文字 ────────────────────────────────────────────
  function setText(text) {
    TEXT = text || '楚汐言的世界';
  }

  // ── 给单张图片加水印 ────────────────────────────────────────
  function apply(imgElement) {
    if (MODE === 'off' || !imgElement || !imgElement.src) return;

    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      var w = imgElement.naturalWidth || imgElement.width || 300;
      var h = imgElement.naturalHeight || imgElement.height || 200;
      canvas.width = w;
      canvas.height = h;

      // 画原图
      ctx.drawImage(imgElement, 0, 0, w, h);

      if (MODE === 'light') {
        drawLightWatermark(ctx, w, h);
      } else if (MODE === 'deep') {
        drawDeepWatermark(ctx, w, h);
      }

      // 替换 src
      imgElement.src = canvas.toDataURL('image/png');
      imgElement.setAttribute('data-watermarked', 'true');

    } catch (e) {
      // 跨域图片可能无法操作 canvas，静默跳过
      console.warn('[Watermark] 跳过图片（可能跨域）:', e.message);
    }
  }

  // ── 浅水印：右下角半透明文字 ─────────────────────────────────
  function drawLightWatermark(ctx, w, h) {
    var fontSize = Math.max(12, Math.min(w, h) * 0.04);
    ctx.font = fontSize + 'px "Noto Serif SC", serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.fillText(TEXT, w - 10, h - 8);
    ctx.shadowBlur = 0;
  }

  // ── 深水印：平铺重复文字 ─────────────────────────────────────
  function drawDeepWatermark(ctx, w, h) {
    var fontSize = Math.max(14, Math.min(w, h) * 0.05);
    ctx.font = fontSize + 'px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var spacing = fontSize * 4;
    ctx.save();
    ctx.rotate(-Math.PI / 6); // 倾斜 30 度

    // 计算旋转后需要覆盖的范围
    var diag = Math.sqrt(w * w + h * h);
    var startX = -diag / 2;
    var endX = diag / 2;
    var startY = -diag / 2;
    var endY = diag / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';

    for (var y = startY; y < endY; y += spacing) {
      for (var x = startX; x < endX; x += spacing) {
        ctx.fillText(TEXT, x, y);
      }
    }

    ctx.restore();
  }

  // ── 给页面上所有图片加水印 ──────────────────────────────────
  function applyToAll() {
    if (MODE === 'off') return;

    var images = document.querySelectorAll('img:not([data-watermarked])');
    for (var i = 0; i < images.length; i++) {
      var img = images[i];

      // 跳过小图标（小于 80px）
      if (img.width < 80 && img.height < 80) continue;

      // 跳过已经处理过的
      if (img.getAttribute('data-watermarked')) continue;

      // 等图片加载完再处理
      if (img.complete && img.naturalWidth > 0) {
        apply(img);
      } else {
        (function (image) {
          image.addEventListener('load', function () {
            if (image.width >= 80 || image.height >= 80) {
              apply(image);
            }
          });
        })(img);
      }
    }
  }

  // ── 暴露 API ────────────────────────────────────────────────
  window.OCWatermark.apply = apply;
  window.OCWatermark.applyToAll = applyToAll;
  window.OCWatermark.setMode = setMode;
  window.OCWatermark.setText = setText;
  window.OCWatermark.getMode = function () { return MODE; };

  console.log('[Watermark] 水印保护模块加载完成');
})();
