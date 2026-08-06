/* ═══════════════════════════════════════════════════════════════
   个人主页模块 · my-shares.js
   ═══════════════════════════════════════════════════════════════
   功能：
   1. 邮箱验证（首次使用需设置）
   2. 列出我的所有分享存档
   3. 复制链接 / 更新内容 / 切换公开 / 下架删除
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 渲染个人主页 ────────────────────────────────────────────
  function render() {
    var page = document.getElementById('my-shares-page');
    if (!page) return;

    var email = window.OCCloudShare ? window.OCCloudShare.getUserEmail() : '';

    if (!email) {
      renderEmailSetup(page);
      return;
    }

    renderSharesList(page, email);
  }

  // ── 邮箱设置界面 ────────────────────────────────────────────
  function renderEmailSetup(page) {
    var content = page.querySelector('.my-shares-content') || page;
    content.innerHTML = [
      '<div class="email-setup-box">',
      '  <div class="email-setup-icon">🦋</div>',
      '  <h2 class="email-setup-title">设置你的邮箱</h2>',
      '  <p class="email-setup-desc">用于管理你的分享存档，每个邮箱对应一个"创作者身份"。</p>',
      '  <input type="email" id="email-setup-input" class="email-setup-input" placeholder="输入你的邮箱地址" />',
      '  <button id="email-setup-confirm" class="email-setup-btn">确认</button>',
      '</div>'
    ].join('');

    var btn = document.getElementById('email-setup-confirm');
    var input = document.getElementById('email-setup-input');
    if (btn && input) {
      btn.addEventListener('click', function () {
        var val = input.value.trim();
        if (!val || val.indexOf('@') < 0) {
          if (window.showToast) window.showToast('请输入有效的邮箱地址', 'error');
          return;
        }
        window.OCCloudShare.setUserEmail(val);
        if (window.showToast) window.showToast('邮箱设置成功', 'success');
        render();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') btn.click();
      });
    }
  }

  // ── 渲染存档列表 ────────────────────────────────────────────
  async function renderSharesList(page, email) {
    var content = page.querySelector('.my-shares-content') || page;

    // 显示加载中
    content.innerHTML = [
      '<div class="shares-header">',
      '  <div class="shares-header-info">',
      '    <span class="shares-header-email">' + email + '</span>',
      '    <button id="btn-change-email" class="shares-header-btn">更换邮箱</button>',
      '  </div>',
      '</div>',
      '<div class="shares-loading">正在加载…</div>'
    ].join('');

    // 更换邮箱按钮
    var changeBtn = document.getElementById('btn-change-email');
    if (changeBtn) {
      changeBtn.addEventListener('click', function () {
        localStorage.removeItem('oc_user_email');
        render();
      });
    }

    try {
      var shares = await window.OCCloudShare.listMyShares(email);

      if (shares.length === 0) {
        content.innerHTML = [
          '<div class="shares-header">',
          '  <div class="shares-header-info">',
          '    <span class="shares-header-email">' + email + '</span>',
          '    <button id="btn-change-email" class="shares-header-btn">更换邮箱</button>',
          '  </div>',
          '</div>',
          '<div class="shares-empty">',
          '  <div class="shares-empty-icon">📜</div>',
          '  <p>还没有分享过存档</p>',
          '  <p class="shares-empty-sub">在编辑页面点击「云端分享」即可创建</p>',
          '</div>'
        ].join('');
        bindChangeEmail();
        return;
      }

      // 渲染列表
      var html = [
        '<div class="shares-header">',
        '  <div class="shares-header-info">',
        '    <span class="shares-header-email">' + email + '</span>',
        '    <button id="btn-change-email" class="shares-header-btn">更换邮箱</button>',
        '  </div>',
        '  <div class="shares-header-count">共 ' + shares.length + ' 个存档</div>',
        '</div>',
        '<div class="shares-list">'
      ];

      for (var i = 0; i < shares.length; i++) {
        var s = shares[i];
        var updated = new Date(s.updated_at || s.created_at).toLocaleString('zh-CN');
        var isPub = s.is_public;
        var url = window.location.origin + window.location.pathname + '?share=' + s.share_token;

        html.push([
          '<div class="share-card" data-token="' + s.share_token + '">',
          '  <div class="share-card-header">',
          '    <h3 class="share-card-title">' + escapeHtml(s.title) + '</h3>',
          '    <span class="share-card-badge ' + (isPub ? 'badge-public' : 'badge-private') + '">' + (isPub ? '公开' : '私密') + '</span>',
          '  </div>',
          s.description ? '<p class="share-card-desc">' + escapeHtml(s.description) + '</p>' : '',
          '  <div class="share-card-meta">',
          '    <span>浏览 ' + (s.views || 0) + ' 次</span>',
          '    <span>更新于 ' + updated + '</span>',
          '  </div>',
          '  <div class="share-card-actions">',
          '    <button class="share-action-btn btn-copy" data-url="' + url + '">复制链接</button>',
          '    <button class="share-action-btn btn-toggle" data-token="' + s.share_token + '" data-public="' + isPub + '">' + (isPub ? '设为私密' : '设为公开') + '</button>',
          '    <button class="share-action-btn btn-delete" data-token="' + s.share_token + '">下架删除</button>',
          '  </div>',
          '</div>'
        ].join(''));
      }

      html.push('</div>');
      content.innerHTML = html.join('');

      bindChangeEmail();
      bindCardActions();

    } catch (e) {
      content.innerHTML = [
        '<div class="shares-header">',
        '  <div class="shares-header-info">',
        '    <span class="shares-header-email">' + email + '</span>',
        '    <button id="btn-change-email" class="shares-header-btn">更换邮箱</button>',
        '  </div>',
        '</div>',
        '<div class="shares-error">加载失败：' + escapeHtml(e.message || '未知错误') + '</div>'
      ].join('');
      bindChangeEmail();
    }
  }

  // ── 绑定"更换邮箱"按钮 ──────────────────────────────────────
  function bindChangeEmail() {
    var btn = document.getElementById('btn-change-email');
    if (btn) {
      btn.addEventListener('click', function () {
        localStorage.removeItem('oc_user_email');
        render();
      });
    }
  }

  // ── 绑定卡片操作按钮 ────────────────────────────────────────
  function bindCardActions() {
    // 复制链接
    var copyBtns = document.querySelectorAll('.btn-copy');
    for (var i = 0; i < copyBtns.length; i++) {
      copyBtns[i].addEventListener('click', function () {
        var url = this.getAttribute('data-url');
        copyToClipboard(url);
        if (window.showToast) window.showToast('链接已复制到剪贴板', 'success');
      });
    }

    // 切换公开/私密
    var toggleBtns = document.querySelectorAll('.btn-toggle');
    for (var j = 0; j < toggleBtns.length; j++) {
      toggleBtns[j].addEventListener('click', async function () {
        var token = this.getAttribute('data-token');
        var isPub = this.getAttribute('data-public') === 'true';
        try {
          this.textContent = '处理中…';
          this.disabled = true;
          await window.OCCloudShare.updateShare(token, { isPublic: !isPub });
          if (window.showToast) window.showToast(!isPub ? '已设为公开' : '已设为私密', 'success');
          render();
        } catch (e) {
          if (window.showToast) window.showToast('操作失败：' + (e.message || ''), 'error');
          this.textContent = isPub ? '设为私密' : '设为公开';
          this.disabled = false;
        }
      });
    }

    // 下架删除
    var deleteBtns = document.querySelectorAll('.btn-delete');
    for (var k = 0; k < deleteBtns.length; k++) {
      deleteBtns[k].addEventListener('click', async function () {
        var token = this.getAttribute('data-token');
        if (!confirm('确定要下架并删除这个存档吗？此操作不可撤销。')) return;
        try {
          this.textContent = '删除中…';
          this.disabled = true;
          await window.OCCloudShare.deleteShare(token);
          if (window.showToast) window.showToast('存档已删除', 'success');
          render();
        } catch (e) {
          if (window.showToast) window.showToast('删除失败：' + (e.message || ''), 'error');
          this.textContent = '下架删除';
          this.disabled = false;
        }
      });
    }
  }

  // ── 工具：复制到剪贴板 ──────────────────────────────────────
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(textarea);
    }
  }

  // ── 工具：HTML 转义 ─────────────────────────────────────────
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── 暴露 API ────────────────────────────────────────────────
  window.OCMyShares = { render: render };

  console.log('[MyShares] 个人主页模块加载完成');
})();
