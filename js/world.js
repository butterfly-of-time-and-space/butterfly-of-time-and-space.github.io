/* ═══════════════════════════════════════════════════════════════
   世界观页面逻辑
   ═══════════════════════════════════════════════════════════════
   功能：
   1. 点击图片区上传图片（转为 base64 显示为背景）
   2. 可编辑区域处理（contenteditable）
   3. 继续浏览按钮 → 切换到编辑页面
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 图片上传处理 ──────────────────────────────────────────
  function initImageUpload() {
    var frame = document.getElementById('world-image-frame');
    var input = document.getElementById('world-image-input');
    var display = document.getElementById('world-image-display');

    if (!frame || !input) return;

    // 点击图片区域触发文件选择
    frame.addEventListener('click', function () {
      input.click();
    });

    // 文件选择后处理
    input.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        if (window.showToast) {
          window.showToast('请选择图片文件', 'error');
        }
        return;
      }

      // 读取文件为 base64（不压缩，原画质）
      var reader = new FileReader();
      reader.onload = function (event) {
        var base64 = event.target.result;
        display.style.backgroundImage = 'url("' + base64 + '")';
        frame.classList.add('has-image');

        if (window.showToast) {
          window.showToast('图片已设置', 'success');
        }

        // 自动保存
        if (window.OCStorage) {
          window.OCStorage.save();
        }
      };
      reader.readAsDataURL(file);

      // 清空 input，允许重复选择同一文件
      input.value = '';
    });
  }


  // ── 可编辑区域处理 ────────────────────────────────────────
  function initEditableFields() {
    var fields = document.querySelectorAll('[contenteditable="true"]');

    fields.forEach(function (el) {
      // 编辑时防抖保存
      var saveTimer = null;
      el.addEventListener('input', function () {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function () {
          if (window.OCStorage) {
            window.OCStorage.save();
          }
        }, 1000);
      });

      // 粘贴时清除格式（只保留纯文本）
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        // 使用 execCommand 插入纯文本（保留换行）
        document.execCommand('insertText', false, text);
      });
    });
  }


  // ── 继续浏览按钮 ──────────────────────────────────────────
  function initContinueButton() {
    var btn = document.getElementById('btn-continue');
    if (!btn) return;

    btn.addEventListener('click', function () {
      // 先保存当前内容
      if (window.OCStorage) {
        window.OCStorage.save();
      }
      // 通知主控制器切换到编辑页面
      if (window.OCWorld && window.OCWorld.onContinue) {
        window.OCWorld.onContinue();
      }
    });
  }


  // ── 返回按钮 ──────────────────────────────────────────────
  function initBackButton() {
    var btn = document.getElementById('btn-back-world');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (window.OCWorld && window.OCWorld.onBack) {
        window.OCWorld.onBack();
      }
    });
  }


  // ── 初始化 ────────────────────────────────────────────────
  function init() {
    initImageUpload();
    initEditableFields();
    initContinueButton();
    initBackButton();
  }


  // ── 暴露 API ─────────────────────────────────────────────
  window.OCWorld = {
    init: init,
    onContinue: null,  // 由 main.js 设置
    onBack: null       // 由 main.js 设置
  };

})();
