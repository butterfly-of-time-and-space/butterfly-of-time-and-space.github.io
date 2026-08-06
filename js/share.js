/* ═══════════════════════════════════════════════════════════════
   一键分享模块
   把当前数据打包成自包含的分享链接或文件

   内存优化策略（v2）：
   1. countIdbRefs 不再加载图片数据，只计数
   2. JSON.stringify 使用 replacer 在序列化时即时替换 idb: 引用
   3. 模板注入使用 Blob 分片组装，避免创建超大字符串
   4. 重操作之间用 setTimeout 释放控制权，让 GC 有机会运行
   ═══════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  window.OCShare = { generate: null };
  console.log('[Share] 模块开始加载...');

  var TEMPLATE_URL = 'share-template.html';
  var PLACEHOLDER = 'window.__DISPLAY_DATA__ = {};';

  // 占位图：图片未导出时显示（短 SVG，约 200 字节）
  var PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzJhMWQzZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iI2IwYTBjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvuS5puaKgOacr+Wksei0rTwvdGV4dD48L3N2Zz4=';

  // ── 收集当前所有数据（轻量模式，不解析 idb: 图片引用）──────
  function collectData() {
    if (window.OCStorage && window.OCStorage.collectAllRaw) {
      return window.OCStorage.collectAllRaw();
    }
    var bundle = { version: '2.0', savedAt: new Date().toISOString() };
    var keys = {
      archive: 'chuxiyan_oc_archive',
      characters: 'chuxiyan_oc_characters',
      novels: 'chuxiyan_oc_novels',
      ifWorlds: 'chuxiyan_oc_ifworlds',
      lpp: 'chuxiyan_oc_lpp'
    };
    for (var k in keys) {
      try {
        var raw = localStorage.getItem(keys[k]);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (k === 'archive') {
            bundle.data = parsed.data || {};
            bundle.version = parsed.version || bundle.version;
            bundle.savedAt = parsed.savedAt || bundle.savedAt;
          } else {
            bundle[k] = parsed;
          }
        } else if (k !== 'archive') {
          bundle[k] = k === 'ifWorlds' ? [] : {};
        }
      } catch (e) { /* ignore */ }
    }
    return bundle;
  }

  // ── 只计数 idb: 引用，不加载图片数据 ──────────────────────────
  // 旧版会调用 OCImageStore.get() 逐个加载图片 base64 来估算大小，
  // 这会把所有大图字符串同时拉进内存，是 OOM 的主要元凶。
  // 新版只计数，不碰图片缓存。
  function countIdbRefsOnly(obj) {
    var count = 0;
    function walk(o) {
      if (o === null || o === undefined) return;
      if (typeof o === 'string') {
        if (o.indexOf('idb:') === 0) count++;
        return;
      }
      if (Array.isArray(o)) {
        for (var i = 0; i < o.length; i++) walk(o[i]);
        return;
      }
      if (typeof o === 'object') {
        for (var k in o) {
          if (o.hasOwnProperty(k)) walk(o[k]);
        }
      }
    }
    walk(obj);
    return count;
  }

  // ── 估算 IndexedDB 中图片总大小（仅完整分享用，分批加载）──────
  // 逐个加载图片估大小，但加载后立即释放引用，不累积
  function estimateImageSize(obj) {
    var count = 0;
    var size = 0;
    function walk(o) {
      if (o === null || o === undefined) return;
      if (typeof o === 'string') {
        if (o.indexOf('idb:') === 0) {
          count++;
          // 逐个加载，用完即弃
          var base64 = window.OCImageStore ? OCImageStore.get(o) : '';
          if (base64) size += base64.length;
          base64 = null; // 显式释放
        }
        return;
      }
      if (Array.isArray(o)) {
        for (var i = 0; i < o.length; i++) walk(o[i]);
        return;
      }
      if (typeof o === 'object') {
        for (var k in o) {
          if (o.hasOwnProperty(k)) walk(o[k]);
        }
      }
    }
    walk(obj);
    return { count: count, size: size };
  }

  // ── JSON.stringify replacer：序列化时即时替换 idb: 引用 ──────
  // 避免先 stripIdbImages 修改数据（多一轮遍历 + 修改对象），
  // 也避免数据对象和 JSON 字符串同时在内存中
  function makeLightweightReplacer() {
    return function(key, value) {
      if (typeof value === 'string' && value.indexOf('idb:') === 0) {
        return PLACEHOLDER_IMAGE;
      }
      return value;
    };
  }

  function makeFullReplacer() {
    return function(key, value) {
      if (typeof value === 'string' && value.indexOf('idb:') === 0) {
        var base64 = window.OCImageStore ? OCImageStore.get(value) : '';
        return base64 || PLACEHOLDER_IMAGE;
      }
      return value;
    };
  }

  // ── 通过 iframe 回退加载模板（用于 file:// 协议）────────────
  function fetchTemplateViaIframe() {
    return new Promise(function(resolve, reject) {
      var iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
      iframe.src = TEMPLATE_URL;

      var timer = setTimeout(function() {
        cleanup();
        reject(new Error('IFRAME_TIMEOUT'));
      }, 15000);

      function cleanup() {
        clearTimeout(timer);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }

      iframe.onload = function() {
        try {
          var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
          if (!doc || !doc.documentElement) {
            cleanup();
            reject(new Error('IFRAME_NO_DOC'));
            return;
          }
          var html = doc.documentElement.outerHTML;
          cleanup();
          resolve(html);
        } catch (e) {
          cleanup();
          reject(new Error('IFRAME_ACCESS_DENIED'));
        }
      };

      iframe.onerror = function() {
        cleanup();
        reject(new Error('IFRAME_LOAD_ERROR'));
      };

      document.body.appendChild(iframe);
    });
  }

  // ── 获取模板 HTML ────────────────────────────────────────────
  function fetchTemplate() {
    var isFileProtocol = window.location.protocol === 'file:';

    if (isFileProtocol) {
      return fetchTemplateViaIframe();
    }

    return fetch(TEMPLATE_URL + '?_=' + Date.now())
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP_' + r.status);
        return r.text();
      })
      .catch(function(err) {
        console.warn('[Share] fetch 失败，尝试 iframe 回退:', err);
        return fetchTemplateViaIframe();
      });
  }

  // ── 用 Blob 分片组装最终 HTML（避免超大字符串拼接）──────────
  // 旧版：template.replace(PLACEHOLDER, replacement) 会创建一个
  //       template + json 的超大新字符串，内存翻倍。
  // 新版：找到 placeholder 位置，用 Blob [前段, 数据, 后段] 组装，
  //       浏览器内部可以流式处理，不需要同时持有完整字符串。
  function assembleAndDownload(template, jsonStr, filename) {
    var placeholderIdx = template.indexOf(PLACEHOLDER);
    var beforePart, afterPart;

    if (placeholderIdx === -1) {
      // 兼容：用正则找
      var match = template.match(/window\.__DISPLAY_DATA__\s*=\s*\{\}\s*;/);
      if (!match) {
        throw new Error('模板中未找到数据占位符');
      }
      var matchIdx = match.index;
      beforePart = template.substring(0, matchIdx);
      afterPart = template.substring(matchIdx + match[0].length);
    } else {
      beforePart = template.substring(0, placeholderIdx);
      afterPart = template.substring(placeholderIdx + PLACEHOLDER.length);
    }

    // 在 afterPart 中禁用 contenteditable（只处理一次，影响小）
    afterPart = afterPart.replace(/contenteditable\s*=\s*["']true["']/gi, 'contenteditable="false"');

    var dataScript = 'window.__DISPLAY_DATA__ = ' + jsonStr + ';';

    // 用 Blob 分片组装，避免拼接超大字符串
    var blob = new Blob([beforePart, dataScript, afterPart], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 延迟释放 URL（确保下载已触发）
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);

    // 释放大字符串引用
    beforePart = null;
    afterPart = null;
    dataScript = null;
  }

  // ── 下载文件 ─────────────────────────────────────────────────
  function downloadFile(content, filename) {
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }

  // ── 生成日期文件名 ───────────────────────────────────────────
  function makeFilename() {
    var now = new Date();
    var dateStr = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    return '楚汐言的世界_' + dateStr + '.html';
  }

  // ── yield：让出控制权给浏览器，GC 有机会运行 ─────────────────
  function yieldToBrowser() {
    return new Promise(function(resolve) { setTimeout(resolve, 0); });
  }

  // ── 生成轻量分享（默认，不内嵌大图，避免 OOM）──────────────
  function generateShare() {
    try {
      console.log('[Share] generateShare() 被调用');
      if (window.showToast) window.showToast('正在生成分享文件……', 'info');

      // 不调用 flushAllToStorage()：
      // collectAllRaw() 直接读 localStorage 原始数据，不需要先 flush
      // flushAllToStorage 会触发 extractAll 创建新对象树，旧对象（含 base64）仍在内存
      // 两者同时存在会导致内存翻倍 → OOM 崩溃

      var data = collectData();
      console.log('[Share] 数据收集完成, keys:', Object.keys(data));

      // 只计数 idb: 引用，不加载图片
      var imgCount = countIdbRefsOnly(data);
      console.log('[Share] idb: 引用数量:', imgCount);

      // 检查是否有内容
      var hasContent = false;
      for (var k in data) {
        if (data[k] && (Array.isArray(data[k]) ? data[k].length > 0 : Object.keys(data[k]).length > 0)) {
          hasContent = true; break;
        }
      }
      if (!hasContent) {
        console.log('[Share] 数据为空，停止');
        if (window.showToast) window.showToast('当前没有可分享的内容，请先编辑一些内容', 'warning');
        return;
      }

      // 用 replacer 在 stringify 时即时替换 idb: → 占位图
      // 不再调用 stripIdbImages 修改数据对象
      var jsonStr;
      try {
        jsonStr = JSON.stringify(data, makeLightweightReplacer());
      } catch (e) {
        console.error('[Share] JSON.stringify 失败:', e);
        if (window.showToast) window.showToast('分享生成失败：数据序列化失败 (' + (e.message || '未知错误') + ')', 'error');
        return;
      }
      console.log('[Share] JSON 序列化完成, 长度:', jsonStr.length);

      // 数据太大时直接报错（轻量版理论上不应该太大）
      if (jsonStr.length > 20 * 1024 * 1024) {
        if (window.showToast) window.showToast('分享数据过大 (' + Math.round(jsonStr.length / 1024 / 1024) + 'MB)，请减少内容后重试', 'error');
        return;
      }

      // 释放 data 引用，让 GC 可以回收
      data = null;

      // yield 一下，让 GC 有机会清理
      yieldToBrowser().then(function() {
        console.log('[Share] 开始加载模板...');
        return fetchTemplate();
      }).then(function(template) {
        try {
          console.log('[Share] 模板加载成功, 长度:', template.length);

          // 用 Blob 分片组装，避免超大字符串拼接
          assembleAndDownload(template, jsonStr, makeFilename());

          // 释放大字符串
          jsonStr = null;
          template = null;

          // 提示
          if (window.showToast) {
            if (imgCount > 0) {
              window.showToast('已生成轻量分享文件（不含原图），文字内容完整保留', 'info');
            } else {
              window.showToast('分享文件已生成', 'success');
            }
          }
        } catch (thenErr) {
          console.error('[Share] 模板处理异常:', thenErr);
          if (window.showToast) window.showToast('分享生成失败：' + (thenErr.message || '未知错误'), 'error');
        }
      }).catch(function(err) {
        console.error('[Share] 模板加载失败:', err);
        var msg = '分享生成失败：模板加载出错';
        if (window.location.protocol === 'file:') {
          msg = '分享生成失败：当前是通过文件协议打开，请使用「启动网站.bat」启动本地服务器后再分享';
        } else if (err && err.message && err.message.indexOf('HTTP_') === 0) {
          msg = '分享生成失败：服务器返回 ' + err.message.replace('HTTP_', '') + '，请检查网站服务器是否运行';
        } else {
          msg = '分享生成失败：网络或模板文件异常，请刷新后重试（Ctrl+F5）';
        }
        if (window.showToast) window.showToast(msg, 'error');
      });
    } catch (e) {
      console.error('[Share] 生成分享异常:', e);
      if (window.showToast) window.showToast('分享生成失败：' + (e.message || '未知错误'), 'error');
    }
  }

  // ── 生成完整分享（含图片，数据量大时仍可能 OOM）──────────────
  function generateFullShare() {
    if (!window.OCImageStore || !window.OCImageStore.get) {
      if (window.showToast) window.showToast('图片存储不可用，无法导出完整版', 'error');
      return;
    }

    try {
      if (window.showToast) window.showToast('正在生成完整分享文件（含图片）……', 'info');

      // 不调用 flushAllToStorage()，原因同 generateShare
      var data = collectData();

      // 先简单计数
      var imgCount = countIdbRefsOnly(data);
      if (imgCount === 0) {
        if (window.showToast) window.showToast('当前没有需要内嵌的图片，直接生成轻量版', 'info');
        generateShare();
        return;
      }

      // 估算图片总大小（逐个加载，不累积）
      var imgInfo = estimateImageSize(data);

      // 超过 3MB 提示风险
      if (imgInfo.size > 3 * 1024 * 1024) {
        var sizeMB = Math.round(imgInfo.size / 1024 / 1024 * 10) / 10;
        if (!confirm('图片总大小约 ' + sizeMB + 'MB，完整导出可能导致浏览器崩溃或失败。\n是否继续？')) {
          return;
        }
      }

      // 用 replacer 在 stringify 时即时替换 idb: → base64
      // 不再调用 resolveImages 修改数据对象（避免所有图片同时驻留内存）
      var jsonStr;
      try {
        jsonStr = JSON.stringify(data, makeFullReplacer());
      } catch (e) {
        console.error('[Share] 完整版 JSON.stringify 失败:', e);
        if (window.showToast) window.showToast('完整导出失败：数据量过大 (' + (e.message || '未知错误') + ')，建议使用轻量版', 'error');
        return;
      }
      console.log('[Share] 完整版 JSON 序列化完成, 长度:', jsonStr.length);

      // 释放 data
      data = null;

      yieldToBrowser().then(function() {
        return fetchTemplate();
      }).then(function(template) {
        try {
          assembleAndDownload(template, jsonStr, makeFilename());
          jsonStr = null;
          template = null;
          if (window.showToast) window.showToast('完整分享文件已生成（含图片）', 'success');
        } catch (thenErr) {
          console.error('[Share] 完整导出失败:', thenErr);
          if (window.showToast) window.showToast('完整导出失败：' + (thenErr.message || '数据量过大'), 'error');
        }
      }).catch(function(err) {
        console.error('[Share] 模板加载失败:', err);
        var msg = '分享生成失败：模板加载出错';
        if (window.location.protocol === 'file:') {
          msg = '分享生成失败：当前是通过文件协议打开，请使用「启动网站.bat」启动本地服务器后再分享';
        } else if (err && err.message && err.message.indexOf('HTTP_') === 0) {
          msg = '分享生成失败：服务器返回 ' + err.message.replace('HTTP_', '') + '，请检查网站服务器是否运行';
        } else {
          msg = '分享生成失败：网络或模板文件异常，请刷新后重试（Ctrl+F5）';
        }
        if (window.showToast) window.showToast(msg, 'error');
      });
    } catch (e) {
      console.error('[Share] 完整导出异常:', e);
      if (window.showToast) window.showToast('完整导出失败：' + (e.message || '未知错误'), 'error');
    }
  }

  // ── 暴露 API ─────────────────────────────────────────────────
  window.OCShare.generate = generateShare;
  window.OCShare.generateFull = generateFullShare;
  console.log('[Share] 模块加载完成（v2 内存优化版），OCShare.generate / generateFull 已就绪');

})();
