-- ═══════════════════════════════════════════════════════════════
-- 楚汐言的世界 · Supabase 建表脚本
-- 在 Supabase 控制台 → SQL Editor → 粘贴执行
-- ═══════════════════════════════════════════════════════════════

-- 1. 创建分享存档表
CREATE TABLE IF NOT EXISTS shares (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT UNIQUE NOT NULL,          -- 分享令牌（随机6位）
  owner_email TEXT NOT NULL,                 -- 创建者邮箱
  title       TEXT NOT NULL DEFAULT '未命名', -- 存档标题
  description TEXT DEFAULT '',               -- 简介
  data        JSONB NOT NULL DEFAULT '{}',   -- 完整网站数据
  is_public   BOOLEAN DEFAULT false,         -- 是否公开到漫游大厅
  views       INTEGER DEFAULT 0,             -- 浏览次数
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS idx_shares_token  ON shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_email  ON shares(owner_email);
CREATE INDEX IF NOT EXISTS idx_shares_public ON shares(is_public) WHERE is_public = true;

-- 3. 开启 RLS（行级安全）
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- 4. 安全策略
-- 所有人可读（通过 token 或公开列表访问）
CREATE POLICY "Anyone can read" ON shares
  FOR SELECT USING (true);

-- 所有人可创建（匿名上传分享）
CREATE POLICY "Anyone can create" ON shares
  FOR INSERT WITH CHECK (true);

-- 所有人可更新（前端通过 token 验证控制）
CREATE POLICY "Anyone can update" ON shares
  FOR UPDATE USING (true);

-- 所有人可删除（前端通过 token + email 验证控制）
CREATE POLICY "Anyone can delete" ON shares
  FOR DELETE USING (true);

-- 5. 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shares_updated_at
  BEFORE UPDATE ON shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 执行完毕后，去 Settings → API 页面记下：
--   1. Project URL  （类似 https://xxxxx.supabase.co）
--   2. anon public key （一长串 eyJ... 开头的字符串）
-- 这两个值填到 js/supabase-config.js 里
-- ═══════════════════════════════════════════════════════════════
