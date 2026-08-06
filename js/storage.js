/* ═══════════════════════════════════════════════════════════════
   存档系统 v2.0
   ═══════════════════════════════════════════════════════════════
   功能：
   1. localStorage 自动保存（30 秒定时 + 编辑触发）
   2. 手动保存 → 全量保存（主页面字段 + 角色 + 小说 + IF世界 + 结构化板块）
   3. 导出 JSON 存档文件（下载 .json，含全部数据）
   4. 导入 JSON 存档文件（上传 .json，原封不动还原 + 新旧版本兼容合并）
   5. 版本同步：新功能新增的存储 key 自动纳入导出；
      旧版存档导入时缺失的 key 保留当前 localStorage 数据，不丢数据
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORAGE_KEY = 'chuxiyan_oc_archive';
  var AUTO_SAVE_INTERVAL = 30000; // 自动保存间隔 30 秒
  var autoSaveTimer = null;

  // ── 全部 localStorage 存储 key 清单 ──────────────────────
  // 新增功能时在此追加即可，导出/导入自动兼容
  var ALL_STORAGE_KEYS = {
    archive: 'chuxiyan_oc_archive',     // 主存档（世界观页面 + 各时间线板块结构化数据）
    characters: 'chuxiyan_oc_characters', // 角色数据（按时间线 key 分组）
    novels: 'chuxiyan_oc_novels',       // 小说数据（按时间线 key 分组）
    ifWorlds: 'chuxiyan_oc_ifworlds',   // IF世界列表
    lpp: 'chuxiyan_oc_lpp'              // OC绿泡泡社交数据
  };

  // ── 读取当前页面 data-field 字段 ─────────────────────────
  function collectData() {
    // 先读取已有存档，保留非 data-field 字段（如组织与势力的结构化数据）
    var data = {};
    var archive = loadFromLocal();
    if (archive && archive.data) {
      // archive 是 ocStorage.get 返回的新对象（JSON.parse + resolveAll），可直接使用
      // 不做深拷贝，避免大数据时内存翻倍
      data = archive.data;
    }

    // 收集所有 contenteditable 字段
    var editableFields = document.querySelectorAll('[data-field]');
    editableFields.forEach(function (el) {
      var field = el.getAttribute('data-field');
      if (field) {
        data[field] = el.innerHTML;
      }
    });

    // 收集世界观图片
    var imageDisplay = document.getElementById('world-image-display');
    if (imageDisplay && imageDisplay.style.backgroundImage) {
      var bg = imageDisplay.style.backgroundImage;
      var match = bg.match(/url\(["']?(.*?)["']?\)/);
      if (match) {
        data.worldImage = match[1];
      }
    }

    return data;
  }

  // ── 全量收集：主存档 + 角色 + 小说 + IF世界 ──────────────
  function collectAll() {
    var bundle = {
      version: '2.0',
      savedAt: new Date().toISOString(),
      data: collectData()
    };

    // 遍历所有已知存储 key，逐个读取
    for (var name in ALL_STORAGE_KEYS) {
      if (name === 'archive') continue; // archive 已在 data 中
      var key = ALL_STORAGE_KEYS[name];
      try {
        var data = window.ocStorage.get(key, name === 'ifWorlds' ? [] : {});
        bundle[name] = data;
      } catch (e) {
        bundle[name] = name === 'ifWorlds' ? [] : {};
      }
    }

    return bundle;
  }

  // ── 全量收集（原始模式，不解析 idb: 图片引用）─────────────
  // 用于分享/导出等场景，避免把 IndexedDB 里的大图全部加载到内存
  function collectAllRaw() {
    var bundle = {
      version: '2.0',
      savedAt: new Date().toISOString()
    };

    for (var name in ALL_STORAGE_KEYS) {
      var key = ALL_STORAGE_KEYS[name];
      try {
        var raw = localStorage.getItem(key);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (name === 'archive') {
            bundle.data = parsed.data || {};
            bundle.version = parsed.version || bundle.version;
            bundle.savedAt = parsed.savedAt || bundle.savedAt;
          } else {
            bundle[name] = parsed;
          }
        } else if (name !== 'archive') {
          bundle[name] = name === 'ifWorlds' ? [] : {};
        }
      } catch (e) {
        console.warn('collectAllRaw 读取失败:', key, e);
        if (name !== 'archive') {
          bundle[name] = name === 'ifWorlds' ? [] : {};
        }
      }
    }

    return bundle;
  }

  // ── 将 data-field 数据应用到页面 ─────────────────────────
  function applyData(data) {
    if (!data) return;

    // 应用 contenteditable 字段
    var editableFields = document.querySelectorAll('[data-field]');
    editableFields.forEach(function (el) {
      var field = el.getAttribute('data-field');
      if (field && data[field] !== undefined) {
        el.innerHTML = data[field];
      }
    });

    // 应用世界观图片
    if (data.worldImage) {
      var imageDisplay = document.getElementById('world-image-display');
      var imageFrame = document.getElementById('world-image-frame');
      if (imageDisplay && imageFrame) {
        imageDisplay.style.backgroundImage = 'url("' + data.worldImage + '")';
        imageFrame.classList.add('has-image');
      }
    }
  }

  // ── 全量应用：还原全部数据到 localStorage + 页面 ────────
  // 版本同步核心逻辑：
  //   - 导入存档中有的 key → 覆盖写入 localStorage
  //   - 导入存档中没有的 key（新功能）→ 保留当前 localStorage 数据
  function applyAll(bundle) {
    if (!bundle) return;

    // 1. 还原主存档（data 部分）
    var archiveToStore = {
      version: bundle.version || '2.0',
      savedAt: bundle.savedAt || new Date().toISOString(),
      data: bundle.data || {}
    };
    // 合并策略：导入的 data 覆盖当前 localStorage 中的 data
    // 如果导入的是旧版存档（只有 data 部分），当前的结构化板块数据会被覆盖
    // 这是预期行为——导入=恢复到导出时的状态
    try {
      window.ocStorage.set(STORAGE_KEY, archiveToStore);
    } catch (e) {
      console.error('主存档写入失败:', e);
    }

    // 应用 data-field 到页面
    applyData(archiveToStore.data);

    // 2. 还原其他存储区（characters / novels / ifWorlds）
    // 版本同步：如果存档中有该 key，覆盖；没有，保留当前 localStorage
    for (var name in ALL_STORAGE_KEYS) {
      if (name === 'archive') continue;
      var lsKey = ALL_STORAGE_KEYS[name];

      if (bundle[name] !== undefined && bundle[name] !== null) {
        // 存档中包含此数据区 → 写入 localStorage
        try {
          window.ocStorage.set(lsKey, bundle[name]);
        } catch (e) {
          console.error(name + ' 存储写入失败:', e);
        }
      }
      // else: 存档中没有此 key（可能是旧版存档），保留当前 localStorage 数据
    }

    // 3. 通知 edit.js 重新加载当前页面的数据
    if (window.OCEdit && typeof window.OCEdit.refreshAllFromStorage === 'function') {
      window.OCEdit.refreshAllFromStorage();
    }
  }

  // ── 保存到 localStorage（主存档）────────────────────────
  function saveToLocal() {
    // 只读模式下跳过自动保存，避免把 base64 图片转成 idb: 引用
    if (window.isReadOnlyMode && window.isReadOnlyMode()) return true;
    var archive = {
      version: '2.0',
      savedAt: new Date().toISOString(),
      data: collectData()
    };

    try {
      window.ocStorage.set(STORAGE_KEY, archive);
      return true;
    } catch (e) {
      console.error('保存失败:', e);
      if (window.showToast) {
        window.showToast('保存失败：' + e.message, 'error');
      }
      return false;
    }
  }

  // ── 从 localStorage 读取主存档 ──────────────────────────
  function loadFromLocal() {
    try {
      var archive = window.ocStorage.get(STORAGE_KEY);
      return archive;
    } catch (e) {
      console.error('读取失败:', e);
      return null;
    }
  }

  // ── 手动保存（全量）──────────────────────────────────────
  // 确保所有编辑内容全部保存到 localStorage
  function manualSave() {
    // 1. 触发 OCEdit 的即时保存（角色、板块等内存数据 → localStorage）
    if (window.OCEdit && typeof window.OCEdit.flushAllToStorage === 'function') {
      window.OCEdit.flushAllToStorage();
    }

    // 2. 保存主存档（data-field + 结构化板块数据）
    if (saveToLocal()) {
      if (window.showToast) {
        var now = new Date();
        var timeStr = now.getHours().toString().padStart(2, '0') + ':' +
                      now.getMinutes().toString().padStart(2, '0') + ':' +
                      now.getSeconds().toString().padStart(2, '0');
        window.showToast('存档成功 · ' + timeStr, 'success');
      }
    }
  }

  // ── 手动读取 ──────────────────────────────────────────────
  function manualLoad() {
    var archive = loadFromLocal();
    if (!archive) {
      if (window.showToast) {
        window.showToast('暂无存档', 'error');
      }
      return;
    }

    applyData(archive.data);

    // 通知 edit.js 刷新
    if (window.OCEdit && typeof window.OCEdit.refreshAllFromStorage === 'function') {
      window.OCEdit.refreshAllFromStorage();
    }

    if (window.showToast) {
      var time = new Date(archive.savedAt);
      var timeStr = time.getFullYear() + '-' +
                    (time.getMonth() + 1).toString().padStart(2, '0') + '-' +
                    time.getDate().toString().padStart(2, '0') + ' ' +
                    time.getHours().toString().padStart(2, '0') + ':' +
                    time.getMinutes().toString().padStart(2, '0');
      window.showToast('读档成功 · ' + timeStr, 'success');
    }
  }

  // ── 导出展示版数据（data.js）───────────────────────────
  // 生成 window.__DISPLAY_DATA__ 格式的 JS 文件，供展示版使用
  function exportDisplayData() {
    // 先触发即时保存
    if (window.OCEdit && typeof window.OCEdit.flushAllToStorage === 'function') {
      window.OCEdit.flushAllToStorage();
    }

    var bundle = collectAll();
    var json = JSON.stringify(bundle, null, 2);
    var content = '/* 楚汐言的世界 · 展示数据 */\n' +
                  '/* 由编辑版自动生成 */\n' +
                  'window.__DISPLAY_DATA__ = ' + json + ';\n';

    var blob = new Blob([content], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    var now = new Date();
    var dateStr = now.getFullYear() +
                  (now.getMonth() + 1).toString().padStart(2, '0') +
                  now.getDate().toString().padStart(2, '0') + '_' +
                  now.getHours().toString().padStart(2, '0') +
                  now.getMinutes().toString().padStart(2, '0');
    a.download = 'data_' + dateStr + '.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast('展示数据已导出！请将 data.js 放入 oc-display 文件夹', 'success');
    }
  }

  // ── 导出 JSON 存档文件（全量）──────────────────────────
  function exportArchive() {
    // 先触发即时保存，确保内存数据都写入 localStorage
    if (window.OCEdit && typeof window.OCEdit.flushAllToStorage === 'function') {
      window.OCEdit.flushAllToStorage();
    }

    var bundle = collectAll();
    var json = JSON.stringify(bundle, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    var now = new Date();
    var dateStr = now.getFullYear() +
                  (now.getMonth() + 1).toString().padStart(2, '0') +
                  now.getDate().toString().padStart(2, '0') + '_' +
                  now.getHours().toString().padStart(2, '0') +
                  now.getMinutes().toString().padStart(2, '0');
    a.download = '楚汐言OC存档_' + dateStr + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast('存档已导出（含全部数据）', 'success');
    }
  }

  // ── 导入 JSON 存档文件（全量还原 + 版本兼容）──────────
  function importArchive(file) {
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var bundle = JSON.parse(e.target.result);
        if (!bundle) throw new Error('存档格式不正确');

        // 兼容旧版 v1.0 存档（只有 version + savedAt + data，没有 characters/novels/ifWorlds）
        if (!bundle.data && bundle.version) {
          // 可能是更老的格式，尝试直接当 data 用
          bundle = { version: '1.0', savedAt: bundle.savedAt, data: bundle };
        }
        if (!bundle.data) {
          throw new Error('存档格式不正确');
        }

        // 全量应用（含版本同步合并逻辑）
        applyAll(bundle);

        if (window.showToast) {
          window.showToast('存档导入成功（全部数据已还原）', 'success');
        }
      } catch (err) {
        console.error('导入失败:', err);
        if (window.showToast) {
          window.showToast('导入失败：文件格式不正确', 'error');
        }
      }
    };
    reader.readAsText(file);
  }

  // ── 自动保存（30 秒定时）──────────────────────────────────
  function startAutoSave() {
    // 只读模式下不启动自动保存
    if (window.isReadOnlyMode && window.isReadOnlyMode()) return;
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(function () {
      // 只在有编辑内容时保存
      var data = collectData();
      var hasContent = false;
      for (var key in data) {
        if (data[key]) { hasContent = true; break; }
      }
      if (hasContent) {
        saveToLocal();
      }
    }, AUTO_SAVE_INTERVAL);
  }

  // ── 页面加载时自动恢复 ───────────────────────────────────
  function autoRestore() {
    var archive = loadFromLocal();
    if (archive && archive.data) {
      applyData(archive.data);
    }
  }

  // ── 删除全部存档数据 ─────────────────────────────────────
  // 清除所有 localStorage 中的 OC 数据，并重置页面
  function deleteArchive() {
    // 1. 先停掉自动保存定时器，防止删除后被自动写回
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }

    // 2. 清除所有 localStorage 存储 key
    for (var name in ALL_STORAGE_KEYS) {
      try {
        localStorage.removeItem(ALL_STORAGE_KEYS[name]);
      } catch (e) {
        console.error('清除 ' + name + ' 失败:', e);
      }
    }

    // 2.5 清除 IndexedDB 图片存储
    if (window.OCImageStore) {
      window.OCImageStore.clearAll();
    }

    // 3. 重置页面上所有 data-field 字段（不能只清带 data-placeholder 的）
    var editableFields = document.querySelectorAll('[data-field]');
    editableFields.forEach(function (el) {
      el.innerHTML = '';
    });

    // 4. 清除世界观图片
    var imageDisplay = document.getElementById('world-image-display');
    var imageFrame = document.getElementById('world-image-frame');
    if (imageDisplay) imageDisplay.style.backgroundImage = '';
    if (imageFrame) imageFrame.classList.remove('has-image');

    // 5. 通知 edit.js 刷新（重置内存缓存）
    if (window.OCEdit && typeof window.OCEdit.refreshAllFromStorage === 'function') {
      window.OCEdit.refreshAllFromStorage();
    }

    // 6. 重启自动保存
    startAutoSave();

    if (window.showToast) {
      window.showToast('存档已删除', 'success');
    }
  }

  // ── 暴露 API ─────────────────────────────────────────────
  window.OCStorage = {
    save: manualSave,
    load: manualLoad,
    export: exportArchive,
    import: importArchive,
    delete: deleteArchive,
    publish: exportDisplayData,
    autoSave: startAutoSave,
    autoRestore: autoRestore,
    collectData: collectData,
    collectAll: collectAll,
    applyData: applyData,
    applyAll: applyAll,
    loadFromLocal: loadFromLocal,
    saveToLocal: saveToLocal,
    ALL_STORAGE_KEYS: ALL_STORAGE_KEYS
  };

})();
