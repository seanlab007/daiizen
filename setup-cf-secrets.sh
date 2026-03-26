#!/bin/bash
# setup-cf-secrets.sh
# 一键配置 daiizen Cloudflare Pages 的敏感环境变量
# 运行前先执行: npx wrangler login
#
# 用法: bash setup-cf-secrets.sh

set -e

PROJECT_NAME="daiizen"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg"
MAOYAN_LINK_SECRET="mx-daiizen-2026-SbAt7002005"

echo "📦 配置 Cloudflare Pages Secrets for project: $PROJECT_NAME"
echo ""

echo "$SUPABASE_SERVICE_ROLE_KEY" | npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name "$PROJECT_NAME"
echo "✅ SUPABASE_SERVICE_ROLE_KEY set"

echo "$MAOYAN_LINK_SECRET" | npx wrangler pages secret put MAOYAN_LINK_SECRET --project-name "$PROJECT_NAME"
echo "✅ MAOYAN_LINK_SECRET set"

echo ""
echo "⚠️  请同步把以下变量配置到 maoyan-vip 的 Cloudflare Pages (或 .env.production):"
echo "    VITE_MAOYAN_LINK_SECRET=$MAOYAN_LINK_SECRET"
echo ""
echo "🎉 daiizen secrets 配置完成！"
