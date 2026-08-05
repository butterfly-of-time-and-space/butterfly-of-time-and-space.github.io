/* ═══════════════════════════════════════════════════════════════
   图片存储系统 (IndexedDB) v3 — 按需加载版
   ═══════════════════════════════════════════════════════════════
   功能：
   1. 用 IndexedDB 存储原图 base64（不压缩画质）
   2. localStorage 只存 idb: 引用（短字符串），不再撑爆容量
   3. init() 只打开 DB + 记录 key 列表，不预加载图片到内存
   4. get() 先查内存缓存，未命中则返回占位图 + 后台异步加载
   5. 提供 ocStorage.get/set 包装函数

   v3 改进：
   - init() 不再遍历所有图片值，只打开 DB + getAllKeys
   - 启动速度极快，不再因图片多而卡死
   - 图片按需从 IndexedDB 异步加载到缓存
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var DB_NAME = 'oc_images';
  var STORE = 'images';
  var db = null;
  var ready = false;
  var readyCallbacks = [];
  var allKeys = [];

  // 正在异步加载中的 key 集合（避免重复加载）
  var loadingKeys = {};

  // 占位图：图片未加载到缓存时显示
  var PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzJhMWQzZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzgwODBjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaKgOacr+Wksei0rTwvdGV4dD48L3N2Zz4=';

  // ── 初始化：打开 IndexedDB，只获取 key 列表，不加载图片值 ──
  function init(callback) {
    if (ready) { if (callback) callback(); return; }
    if (callback) readyCallbacks.push(callback);
    if (readyCallbacks.length > 1) return; // 已在初始化中

    try {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function (e) {
        var database = e.target.result;
        if (!database.objectStoreNames.contains(STORE)) {
          database.createObjectStore(STORE);
        }
      };
      req.onsuccess = function (e) {
        db = e.target.result;

        // 只获取 key 列表，不加载值
        try {
          var tx = db.transaction(STORE, 'readonly');
          var store = tx.objectStore(STORE);
          var keysReq = store.getAllKeys();

          keysReq.onsuccess = function () {
            allKeys = keysReq.result || [];
            console.log('[ImageStore] DB 已就绪，共 ' + allKeys.length + ' 张图片（按需加载）');

            ready = true;
            readyCallbacks.forEach(function (cb) { cb(); });
            readyCallbacks = [];
          };

          keysReq.onerror = function () {
            console.warn('[ImageStore] getAllKeys 失败，继续启动');
            ready = true;
            readyCallbacks.forEach(function (cb) { cb(); });
            readyCallbacks = [];
          };
        } catch (txErr) {
          console.warn('[ImageStore] 事务创建失败:', txErr);
          ready = true;
          readyCallbacks.forEach(function (cb) { cb(); });
          readyCallbacks = [];
        }
      };
      req.onerror = function () {
        // IndexedDB 不可用（隐私模式等），降级运行
        console.warn('[ImageStore] IndexedDB 不可用，降级模式');
        ready = true;
        readyCallbacks.forEach(function (cb) { cb(); });
        readyCallbacks = [];
      };
    } catch (e) {
      console.warn('[ImageStore] 初始化异常:', e);
      ready = true;
      readyCallbacks.forEach(function (cb) { cb(); });
      readyCallbacks = [];
    }
  }

  // ── 异步从 IndexedDB 加载单个图片到缓存 ──────────────────
  function asyncLoad(key) {
    if (loadingKeys[key]) return; // 已在加载中
    if (!db) return;

    loadingKeys[key] = true;
    try {
      var tx = db.transaction(STORE, 'readonly');
      var store = tx.objectStore(STORE);
      var req = store.get(key);

      req.onsuccess = function (e) {
        var val = e.target.result;
        if (typeof val === 'string') {
          OCImageStore._cache[key] = val;
        }
        delete loadingKeys[key];
        // 通知页面刷新（如果有回调）
        if (OCImageStore.onImageLoaded) {
          OCImageStore.onImageLoaded(key);
        }
      };

      req.onerror = function () {
        delete loadingKeys[key];
      };
    } catch (e) {
      delete loadingKeys[key];
    }
  }

  // ── 内存缓存 ─────────────────────────────────────────────
  var OCImageStore = {
    _cache: {},

    init: init,

    isReady: function () { return ready; },
    hasDB: function () { return !!db; },

    // 保存图片，返回 idb: 引用
    save: function (base64) {
      var key = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
      this._cache[key] = base64;
      if (allKeys.indexOf(key) === -1) allKeys.push(key);
      if (db) {
        try {
          var tx = db.transaction(STORE, 'readwrite');
          var store = tx.objectStore(STORE);
          store.put(base64, key);
        } catch (e) {}
      }
      return 'idb:' + key;
    },

    // 读取图片（同步，从内存缓存）
    // 如果图片不在缓存中，返回占位图并触发后台异步加载
    get: function (ref) {
      if (!ref || typeof ref !== 'string') return ref;
      if (ref.indexOf('idb:') !== 0) return ref;
      var key = ref.substring(4);
      var cached = this._cache[key];
      if (cached) return cached;

      // 不在缓存中：触发异步加载（下次 get 时可能已在缓存）
      if (allKeys.indexOf(key) !== -1) {
        asyncLoad(key);
      }

      // 本次返回占位图
      return PLACEHOLDER_SVG;
    },

    // 判断是否为 base64 图片字符串
    _isBase64Image: function (str) {
      if (!str || typeof str !== 'string') return false;
      return str.indexOf('data:image/') === 0 && str.length > 500;
    },

    // 深度遍历对象，将 base64 图片替换为 idb: 引用
    extractAll: function (obj) {
      if (!db) return obj;
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        if (this._isBase64Image(obj)) {
          return this.save(obj);
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(function (item) { return OCImageStore.extractAll(item); });
      }
      if (typeof obj === 'object') {
        var result = {};
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            result[key] = this.extractAll(obj[key]);
          }
        }
        return result;
      }
      return obj;
    },

    // 深度遍历对象，将 idb: 引用替换为 base64（原地修改）
    resolveAll: function (obj) {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        return this.get(obj);
      }
      if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
          obj[i] = this.resolveAll(obj[i]);
        }
        return obj;
      }
      if (typeof obj === 'object') {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            obj[key] = this.resolveAll(obj[key]);
          }
        }
        return obj;
      }
      return obj;
    },

    // 清空全部图片（删除存档时调用）
    clearAll: function () {
      this._cache = {};
      allKeys = [];
      loadingKeys = {};
      if (db) {
        try {
          var tx = db.transaction(STORE, 'readwrite');
          var store = tx.objectStore(STORE);
          store.clear();
        } catch (e) {}
      }
    }
  };

  // ── localStorage 包装函数 ───────────────────────────────
  var ocStorage = {
    // 读取并解析 JSON，自动还原图片引用
    get: function (key, defaultValue) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return defaultValue;
        var data = JSON.parse(raw);
        if (window.OCImageStore) {
          return OCImageStore.resolveAll(data);
        }
        return data;
      } catch (e) {
        console.error('ocStorage.get 失败:', key, e);
        return defaultValue;
      }
    },

    // 序列化并写入，自动提取图片到 IndexedDB
    set: function (key, data) {
      var toStore = data;
      if (window.OCImageStore && OCImageStore.hasDB()) {
        try {
          toStore = OCImageStore.extractAll(data);
        } catch (e) {
          console.error('ocStorage.set extractAll 失败:', key, e);
          toStore = data;
        }
      }
      try {
        localStorage.setItem(key, JSON.stringify(toStore));
      } catch (e) {
        console.error('ocStorage.set 写入失败:', key, e);
        throw e;
      }
    }
  };

  window.OCImageStore = OCImageStore;
  window.ocStorage = ocStorage;
})();
