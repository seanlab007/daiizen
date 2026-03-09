import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Users, Share2, Copy, MessageCircle, Send, Twitter,
  Clock, Zap, TrendingDown, ShoppingCart, CheckCircle2,
  ArrowRight, Globe
} from "lucide-react";

// ─── Tier Ladder (mirrors server) ─────────────────────────────────────────────
const TIER_LADDER = [
  { minPeople: 1,     discountPct: 5,  label: "1人团",   badge: "单人享折扣" },
  { minPeople: 2,     discountPct: 8,  label: "2人团" },
  { minPeople: 5,     discountPct: 10, label: "5人团",   badge: "🔥 热门" },
  { minPeople: 10,    discountPct: 12, label: "10人团" },
  { minPeople: 20,    discountPct: 15, label: "20人团",  badge: "💎 优惠" },
  { minPeople: 50,    discountPct: 20, label: "50人团" },
  { minPeople: 100,   discountPct: 25, label: "百人团",  badge: "⭐ 超值" },
  { minPeople: 500,   discountPct: 30, label: "500人团" },
  { minPeople: 1000,  discountPct: 35, label: "千人团",  badge: "🏆 超级团" },
  { minPeople: 5000,  discountPct: 40, label: "5000人团" },
  { minPeople: 10000, discountPct: 50, label: "万人团",  badge: "👑 最高折扣" },
];

function getCardColor(color: string) {
  switch (color) {
    case "black":    return "from-gray-900 via-gray-800 to-gray-900 border-gray-600";
    case "platinum": return "from-slate-300 via-slate-200 to-slate-400 border-slate-400";
    case "gold":     return "from-yellow-600 via-yellow-500 to-yellow-700 border-yellow-400";
    default:         return "from-slate-600 via-slate-500 to-slate-700 border-slate-400";
  }
}

// ─── Group Buy Detail Page (via share token) ──────────────────────────────────
function GroupBuyDetail({ shareToken }: { shareToken: string }) {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: group, refetch } = trpc.groupBuy.getByToken.useQuery({
    shareToken,
    origin: typeof window !== "undefined" ? window.location.origin : undefined,
  });

  const joinMutation = trpc.groupBuy.join.useMutation({
    onSuccess: (result) => {
      toast.success(`🎉 成功加入拼团！当前折扣 ${result.discountPct}%，锁定价格 ${result.lockedPrice} USDD`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setJoining(false),
  });

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(key);
      toast.success("链接已复制！");
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载拼团信息...</p>
        </div>
      </div>
    );
  }

  const timeLeft = Math.max(0, new Date(group.expiresAt).getTime() - Date.now());
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minutesLeft = Math.floor((timeLeft % 3600000) / 60000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 text-center text-sm font-medium">
        🔥 拼团特惠 — 人越多，折扣越大！最高享 50% 折扣
      </div>

      <div className="container max-w-4xl py-8 space-y-6">
        {/* Product Card */}
        <Card className="overflow-hidden border-orange-500/30 bg-card/80 backdrop-blur">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative aspect-square md:aspect-auto min-h-64 bg-muted">
              {group.imageUrl ? (
                <img src={group.imageUrl} alt={group.productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              {group.groupType === "flash" && (
                <Badge className="absolute top-3 left-3 bg-red-500 text-white animate-pulse">
                  ⚡ 闪购
                </Badge>
              )}
              {group.groupType === "万人团" && (
                <Badge className="absolute top-3 left-3 bg-purple-600 text-white">
                  👑 万人团
                </Badge>
              )}
            </div>

            {/* Info */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">拼团商品</p>
                <h1 className="text-2xl font-bold">{group.productName}</h1>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-orange-500">
                    {group.currentPrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-muted-foreground">USDD</span>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    -{group.currentTier.discountPct}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-through">
                  原价 {group.originalPrice.toFixed(2)} USDD
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1 text-orange-400">
                    <Users className="h-4 w-4" />
                    已有 <strong>{group.displayCount.toLocaleString()}</strong> 人参团
                  </span>
                  <span className="text-muted-foreground">目标 {group.targetCount.toLocaleString()} 人</span>
                </div>
                <Progress value={group.progress} className="h-3 bg-orange-950" />
                {group.nextTier && (
                  <p className="text-xs text-orange-300">
                    再来 <strong>{group.nextTier.minPeople - group.displayCount}</strong> 人，折扣升至{" "}
                    <strong>{group.nextTier.discountPct}%</strong>！
                  </p>
                )}
              </div>

              {/* Timer */}
              {!group.isExpired && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <Clock className="h-4 w-4" />
                  剩余时间：<strong>{hoursLeft}小时 {minutesLeft}分钟</strong>
                </div>
              )}
              {group.isExpired && (
                <Badge variant="destructive">拼团已结束</Badge>
              )}

              {/* Join Button */}
              {!group.isExpired && group.status === "open" && (
                user ? (
                  <Button
                    size="lg"
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg h-14"
                    onClick={() => { setJoining(true); joinMutation.mutate({ shareToken, quantity: 1 }); }}
                    disabled={joining}
                  >
                    {joining ? "加入中..." : `立即参团 — ${group.currentPrice.toFixed(2)} USDD`}
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button size="lg" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-lg h-14">
                      登录后参团
                    </Button>
                  </Link>
                )
              )}
              {group.status === "completed" && (
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  拼团成功！订单处理中
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Share Links */}
        <Card className="border-orange-500/20 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <Share2 className="h-5 w-5" />
              邀请好友，折扣更大！
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="flex flex-col h-16 gap-1 border-green-500/30 hover:bg-green-500/10"
              onClick={() => window.open(group.shareLinks.whatsapp, "_blank")}
            >
              <MessageCircle className="h-5 w-5 text-green-400" />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-16 gap-1 border-blue-500/30 hover:bg-blue-500/10"
              onClick={() => window.open(group.shareLinks.telegram, "_blank")}
            >
              <Send className="h-5 w-5 text-blue-400" />
              <span className="text-xs">Telegram</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-16 gap-1 border-sky-500/30 hover:bg-sky-500/10"
              onClick={() => window.open(group.shareLinks.twitter, "_blank")}
            >
              <Twitter className="h-5 w-5 text-sky-400" />
              <span className="text-xs">Twitter/X</span>
            </Button>
            <Button
              variant="outline"
              className={`flex flex-col h-16 gap-1 border-orange-500/30 hover:bg-orange-500/10 ${copied === "link" ? "bg-orange-500/20" : ""}`}
              onClick={() => handleCopy("link", group.shareLinks.copy)}
            >
              {copied === "link" ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5 text-orange-400" />}
              <span className="text-xs">{copied === "link" ? "已复制" : "复制链接"}</span>
            </Button>
          </CardContent>
        </Card>

        {/* Tier Ladder */}
        <Card className="border-orange-500/20 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-400" />
              折扣阶梯 — 人越多越便宜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {TIER_LADDER.map((tier) => {
                const isActive = group.displayCount >= tier.minPeople;
                const isCurrent = tier.discountPct === group.currentTier.discountPct;
                return (
                  <div
                    key={tier.minPeople}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isCurrent
                        ? "border-orange-500 bg-orange-500/20 scale-105"
                        : isActive
                        ? "border-green-500/40 bg-green-500/10"
                        : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground">{tier.label}</div>
                    <div className={`text-xl font-bold ${isCurrent ? "text-orange-400" : isActive ? "text-green-400" : "text-foreground"}`}>
                      -{tier.discountPct}%
                    </div>
                    {tier.badge && (
                      <div className="text-xs mt-1 text-orange-300">{tier.badge}</div>
                    )}
                    {isCurrent && (
                      <Badge className="mt-1 text-xs bg-orange-500 text-white">当前</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Back to product */}
        {group.productSlug && (
          <div className="text-center">
            <Link href={`/products/${group.productSlug}`}>
              <Button variant="outline" className="gap-2">
                查看商品详情 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Group Buy List Page ───────────────────────────────────────────────────────
function GroupBuyList() {
  const { data: groups = [], isLoading } = trpc.groupBuy.list.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-red-950 to-background">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-700 to-red-700 text-white py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="h-8 w-8" />
            <Zap className="h-6 w-6 text-yellow-300" />
          </div>
          <h1 className="text-4xl font-black mb-3">拼团特惠</h1>
          <p className="text-orange-100 text-lg">人越多，折扣越大 — 最高享 50% 折扣</p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-orange-200">
            <span>✓ 11档折扣阶梯</span>
            <span>✓ 实时人数更新</span>
            <span>✓ 多平台分享</span>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">暂无进行中的拼团</p>
            <p className="text-sm mt-2">在商品详情页发起拼团，邀请好友一起享折扣！</p>
            <Link href="/marketplace">
              <Button className="mt-4 bg-orange-600 hover:bg-orange-500">浏览商品</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group: any) => {
              const timeLeft = Math.max(0, new Date(group.expiresAt).getTime() - Date.now());
              const hoursLeft = Math.floor(timeLeft / 3600000);
              const imgUrl = (() => {
                try {
                  const imgs = typeof group.imageUrl === "string" ? JSON.parse(group.imageUrl) : group.imageUrl;
                  return Array.isArray(imgs) ? imgs[0] : (typeof imgs === "string" ? imgs : null);
                } catch { return typeof group.imageUrl === "string" ? group.imageUrl : null; }
              })();

              return (
                <Link key={group.id} href={`/group-buy/${group.shareToken}`}>
                  <Card className="overflow-hidden border-orange-500/20 bg-card/80 hover:border-orange-500/50 transition-all hover:scale-[1.02] cursor-pointer h-full">
                    <div className="aspect-video bg-muted relative">
                      {imgUrl ? (
                        <img src={imgUrl} alt={group.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-orange-600 text-white">
                        -{group.currentTier?.discountPct ?? 5}%
                      </Badge>
                      {group.groupType === "flash" && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white animate-pulse">⚡ 闪购</Badge>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold line-clamp-2">{group.productName}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-orange-400">
                          {group.currentPrice?.toFixed(2)} USDD
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {group.originalPrice?.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {group.displayCount?.toLocaleString()} 人
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {hoursLeft}h 剩余
                          </span>
                        </div>
                        <Progress value={group.progress ?? 0} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function GroupBuy() {
  const params = useParams<{ shareToken?: string }>();
  const shareToken = params?.shareToken;

  if (shareToken) {
    return <GroupBuyDetail shareToken={shareToken} />;
  }
  return <GroupBuyList />;
}
