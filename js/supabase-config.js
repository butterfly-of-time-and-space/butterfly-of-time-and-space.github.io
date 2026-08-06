/* ═══════════════════════════════════════════════════════════════
   Supabase 配置文件
   ═══════════════════════════════════════════════════════════════
   使用方法：
   1. 注册 https://supabase.com 账号
   2. 创建新项目（New Project）
   3. 在 SQL Editor 里执行 supabase-setup.sql
   4. 在 Settings → API 页面找到：
      - Project URL
      - Project API Keys → anon public
   5. 把下面的两个值替换成你自己的
   ═══════════════════════════════════════════════════════════════ */

window.SUPABASE_CONFIG = {
  url: 'https://yopeojdztzkztjkjicvt.supabase.co',
  anonKey: 'sb_publishable_umo7yum5WHwMBxYceJP8rQ_2M6Lenwf'
};

// ── 初始化 Supabase 客户端 ──────────────────────────────────
window.supabaseClient = null;

function initSupabase() {
  if (window.supabaseClient) return window.supabaseClient;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[Supabase] supabase-js 未加载，请检查 CDN 引用');
    return null;
  }
  var cfg = window.SUPABASE_CONFIG;
  if (!cfg.url || cfg.url.indexOf('YOUR_') === 0) {
    console.warn('[Supabase] 未配置 URL 和密钥，云端分享功能不可用');
    return null;
  }
  try {
    // 禁用 realtime WebSocket，避免连接超时产生未捕获的 Promise 拒绝
    window.supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
      realtime: { params: { eventsPerSecond: 0 } }
    });
    console.log('[Supabase] 客户端初始化成功');
    return window.supabaseClient;
  } catch (e) {
    console.error('[Supabase] 初始化失败:', e);
    return null;
  }
}

window.initSupabase = initSupabase;
