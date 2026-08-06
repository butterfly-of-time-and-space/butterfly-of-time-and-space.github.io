/* ═══════════════════════════════════════════════════════════════
   云端分享模块 · cloud-share.js
   ═══════════════════════════════════════════════════════════════
   功能：
   1. 一键分享 → 上传数据到 Supabase → 生成链接
   2. 通过链接加载数据 → 进入只读模式
   3. 更新/删除已分享的存档
   4. 列出"我的存档"
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  window.OCCloudShare = {
    generateLink: null,
    loadData: null,
    updateShare: null,
    deleteShare: null,
    listMyShares: null,
    incrementViews: null
  };

  var TABLE = 'shares';

  // ── 生成 6 位随机 token ────────────────────────────────────
  function generateToken() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var token = '';
    for (var i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // ── 生成唯一 token（查重）────────────────────────────────────
  async function generateUniqueToken() {
    var sb = initSupabase();
    if (!sb) return generateToken(); // 无后端时直接返回（仅本地测试用）
    for (var i = 0; i < 10; i++) {
      var token = generateToken();
      var result = await sb.from(TABLE).select('id').eq('share_token', token).limit(1);
      if (!result.data || result.data.length === 0) return token;
    }
    return generateToken() + Date.now().toString(36); // 兜底
  }

  // ── 收集当前所有数据（含图片解析）──────────────────────────
  function collectAllData() {
    var bundle = {
      version: '2.0',
      savedAt: new Date().toISOString(),
      data: {},
      characters: {},
      novels: [],
      ifWorlds: []
    };

    // 主存档
    try {
      var raw = localStorage.getItem('chuxiyan_oc_archive');
      if (raw) {
        var parsed = JSON.parse(raw);
        bundle.data = parsed.data || {};
        bundle.version = parsed.version || bundle.version;
        bundle.savedAt = parsed.savedAt || bundle.savedAt;
      }
    } catch (e) { /* ignore */ }

    // 角色数据
    try {
      var chars = localStorage.getItem('chuxiyan_oc_characters');
      bundle.characters = chars ? JSON.parse(chars) : {};
    } catch (e) { bundle.characters = {}; }

    // 小说数据
    try {
      var novels = localStorage.getItem('chuxiyan_oc_novels');
      bundle.novels = novels ? JSON.parse(novels) : [];
    } catch (e) { bundle.novels = []; }

    // IF 线数据
    try {
      var ifw = localStorage.getItem('chuxiyan_oc_ifworlds');
      bundle.ifWorlds = ifw ? JSON.parse(ifw) : [];
    } catch (e) { bundle.ifWorlds = []; }

    return bundle;
  }

  // ── 解析 idb: 图片引用为 base64 ────────────────────────────
  function resolveImages(data) {
    if (!window.OCImageStore || !window.OCImageStore.get) return data;
    function walk(obj) {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        if (obj.indexOf('idb:') === 0) {
          var base64 = window.OCImageStore.get(obj);
          return base64 || '';
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(walk);
      }
      if (typeof obj === 'object') {
        var result = {};
        for (var k in obj) {
          if (obj.hasOwnProperty(k)) result[k] = walk(obj[k]);
        }
        return result;
      }
      return obj;
    }
    return walk(data);
  }

  // ── 获取当前用户邮箱 ────────────────────────────────────────
  function getUserEmail() {
    return localStorage.getItem('oc_user_email') || '';
  }

  function setUserEmail(email) {
    localStorage.setItem('oc_user_email', email);
  }

  // ════════════════════════════════════════════════════════════
  //  核心功能
  // ════════════════════════════════════════════════════════════

  // ── 1. 生成分享链接 ─────────────────────────────────────────
  async function generateLink(options) {
    var sb = initSupabase();
    if (!sb) {
      throw new Error('Supabase 未配置，请先填写 js/supabase-config.js');
    }

    options = options || {};
    var title = options.title || '楚汐言的世界';
    var description = options.description || '';
    var isPublic = options.isPublic || false;
    var email = options.email || getUserEmail();

    if (!email) {
      throw new Error('请先设置邮箱');
    }

    // 收集数据
    var rawData = collectAllData();

    // 检查是否有内容
    var hasContent = false;
    for (var k in rawData) {
      var v = rawData[k];
      if (v && (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0)) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) {
      throw new Error('当前没有可分享的内容');
    }

    // 解析图片
    var resolvedData = resolveImages(rawData);

    // JSON 序列化
    var jsonStr;
    try {
      jsonStr = JSON.stringify(resolvedData);
    } catch (e) {
      throw new Error('数据序列化失败：' + (e.message || ''));
    }

    // 大小检查（Supabase 免费版单行限制 ~1MB，超出提示）
    if (jsonStr.length > 900000) {
      throw new Error('数据过大（' + Math.round(jsonStr.length / 1024) + 'KB），请减少图片内容');
    }

    // 生成唯一 token
    var token = await generateUniqueToken();

    // 上传到 Supabase
    var insertData = {
      share_token: token,
      owner_email: email,
      title: title,
      description: description,
      data: resolvedData,
      is_public: isPublic,
      views: 0
    };

    var result = await sb.from(TABLE).insert(insertData).select('id,share_token,created_at');

    if (result.error) {
      throw new Error('上传失败：' + (result.error.message || '未知错误'));
    }

    // 生成链接
    var baseUrl = window.location.origin + window.location.pathname;
    var shareUrl = baseUrl + (baseUrl.indexOf('?') >= 0 ? '&' : '?') + 'share=' + token;

    return {
      token: token,
      url: shareUrl,
      title: title,
      createdAt: new Date().toISOString()
    };
  }

  // ── 2. 通过 token 加载分享数据 ──────────────────────────────
  async function loadData(token) {
    var sb = initSupabase();
    if (!sb) {
      throw new Error('Supabase 未配置');
    }

    var result = await sb.from(TABLE)
      .select('data,title,description,owner_email,views,created_at,updated_at,is_public')
      .eq('share_token', token)
      .limit(1);

    if (result.error) {
      throw new Error('加载失败：' + (result.error.message || ''));
    }

    if (!result.data || result.data.length === 0) {
      throw new Error('分享不存在或已下架');
    }

    return result.data[0];
  }

  // ── 3. 更新分享 ─────────────────────────────────────────────
  async function updateShare(token, options) {
    var sb = initSupabase();
    if (!sb) throw new Error('Supabase 未配置');

    var updateData = {};
    if (options.title !== undefined) updateData.title = options.title;
    if (options.description !== undefined) updateData.description = options.description;
    if (options.isPublic !== undefined) updateData.is_public = options.isPublic;
    if (options.data !== undefined) updateData.data = options.data;

    var result = await sb.from(TABLE).update(updateData).eq('share_token', token).select('id');

    if (result.error) {
      throw new Error('更新失败：' + (result.error.message || ''));
    }

    return true;
  }

  // ── 4. 删除分享（下架）──────────────────────────────────────
  async function deleteShare(token) {
    var sb = initSupabase();
    if (!sb) throw new Error('Supabase 未配置');

    var result = await sb.from(TABLE).delete().eq('share_token', token);

    if (result.error) {
      throw new Error('删除失败：' + (result.error.message || ''));
    }

    return true;
  }

  // ── 5. 列出我的存档 ─────────────────────────────────────────
  async function listMyShares(email) {
    var sb = initSupabase();
    if (!sb) throw new Error('Supabase 未配置');

    var result = await sb.from(TABLE)
      .select('share_token,title,description,is_public,views,created_at,updated_at')
      .eq('owner_email', email)
      .order('updated_at', { ascending: false });

    if (result.error) {
      throw new Error('查询失败：' + (result.error.message || ''));
    }

    return result.data || [];
  }

  // ── 6. 增加浏览次数 ─────────────────────────────────────────
  async function incrementViews(token) {
    var sb = initSupabase();
    if (!sb) return;

    try {
      // 先读当前 views
      var readResult = await sb.from(TABLE).select('views').eq('share_token', token).limit(1);
      if (readResult.data && readResult.data.length > 0) {
        var newViews = (readResult.data[0].views || 0) + 1;
        await sb.from(TABLE).update({ views: newViews }).eq('share_token', token);
      }
    } catch (e) {
      console.warn('[CloudShare] 增加浏览次数失败:', e);
    }
  }

  // ── 7. 获取公开存档列表（漫游大厅）──────────────────────────
  async function listPublicShares() {
    var sb = initSupabase();
    if (!sb) throw new Error('Supabase 未配置');

    var result = await sb.from(TABLE)
      .select('share_token,title,description,views,created_at,updated_at')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (result.error) {
      throw new Error('查询失败：' + (result.error.message || ''));
    }

    return result.data || [];
  }

  // ── 暴露 API ────────────────────────────────────────────────
  window.OCCloudShare.generateLink = generateLink;
  window.OCCloudShare.loadData = loadData;
  window.OCCloudShare.updateShare = updateShare;
  window.OCCloudShare.deleteShare = deleteShare;
  window.OCCloudShare.listMyShares = listMyShares;
  window.OCCloudShare.listPublicShares = listPublicShares;
  window.OCCloudShare.incrementViews = incrementViews;
  window.OCCloudShare.getUserEmail = getUserEmail;
  window.OCCloudShare.setUserEmail = setUserEmail;

  console.log('[CloudShare] 云端分享模块加载完成');
})();
