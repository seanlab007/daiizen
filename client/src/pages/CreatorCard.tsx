import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CreditCard, Star, Users, Sparkles, Plus, Trash2,
  CheckCircle2, XCircle, Loader2, Instagram, Youtube,
  Twitter, Globe, TrendingUp, ShoppingBag, ArrowRight
} from "lucide-react";

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "youtube",   label: "YouTube",   icon: Youtube },
  { value: "twitter",   label: "Twitter/X", icon: Twitter },
  { value: "tiktok",    label: "TikTok",    icon: TrendingUp },
  { value: "weibo",     label: "微博",       icon: Globe },
  { value: "douyin",    label: "抖音",       icon: TrendingUp },
  { value: "other",     label: "其他",       icon: Globe },
];

const CARD_TIERS = [
  { color: "silver",   minFollowers: 10_000,    limit: 500,   label: "Silver",   gradient: "from-slate-600 via-slate-500 to-slate-700" },
  { color: "gold",     minFollowers: 100_000,   limit: 2000,  label: "Gold",     gradient: "from-yellow-600 via-yellow-500 to-yellow-700" },
  { color: "platinum", minFollowers: 500_000,   limit: 5000,  label: "Platinum", gradient: "from-slate-300 via-slate-200 to-slate-400" },
  { color: "black",    minFollowers: 2_000_000, limit: 10000, label: "Black",    gradient: "from-gray-900 via-gray-800 to-gray-900" },
];

function CardVisual({ card }: { card: any }) {
  const tier = CARD_TIERS.find(t => t.color === card.cardColor) ?? CARD_TIERS[0];
  const isLight = card.cardColor === "platinum";
  const textColor = isLight ? "text-gray-900" : "text-white";

  return (
    <div className={`relative w-full max-w-sm mx-auto aspect-[1.6/1] rounded-2xl bg-gradient-to-br ${tier.gradient} p-6 shadow-2xl border border-white/10 overflow-hidden`}>
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      {/* Stars */}
      <div className="absolute top-4 right-4 flex gap-1">
        {[...Array(tier.color === "black" ? 5 : tier.color === "platinum" ? 4 : tier.color === "gold" ? 3 : 2)].map((_, i) => (
          <Star key={i} className={`h-3 w-3 fill-current ${isLight ? "text-yellow-600" : "text-yellow-400"}`} />
        ))}
      </div>
      {/* Card number */}
      <div className={`absolute bottom-14 left-6 font-mono text-sm tracking-widest ${textColor} opacity-80`}>
        {card.cardNumber}
      </div>
      {/* Card holder */}
      <div className={`absolute bottom-6 left-6 ${textColor}`}>
        <div className="text-xs opacity-60 uppercase tracking-wider">Creator Card</div>
        <div className="font-semibold">{tier.label} Tier</div>
      </div>
      {/* Credit limit */}
      <div className={`absolute bottom-6 right-6 text-right ${textColor}`}>
        <div className="text-xs opacity-60 uppercase tracking-wider">Credit Limit</div>
        <div className="font-bold text-lg">${card.creditLimit.toLocaleString()}</div>
      </div>
      {/* Logo */}
      <div className={`text-xl font-black ${textColor} opacity-90`}>DAIIZEN</div>
      <div className={`text-xs ${textColor} opacity-60`}>Creator Program</div>
    </div>
  );
}

function ApplyForm() {
  const [accounts, setAccounts] = useState([{ platform: "instagram", handle: "", followers: 0, url: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const applyMutation = trpc.creatorCard.applyCard.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setSubmitting(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSubmitting(false);
    },
  });

  const addAccount = () => {
    if (accounts.length >= 5) return toast.error("最多添加5个账号");
    setAccounts([...accounts, { platform: "instagram", handle: "", followers: 0, url: "" }]);
  };

  const removeAccount = (i: number) => setAccounts(accounts.filter((_, idx) => idx !== i));

  const updateAccount = (i: number, field: string, value: string | number) => {
    setAccounts(accounts.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const handleSubmit = () => {
    const valid = accounts.every(a => a.handle && a.followers > 0);
    if (!valid) return toast.error("请填写所有账号的用户名和粉丝数");
    setSubmitting(true);
    applyMutation.mutate({ socialAccounts: accounts });
  };

  if (result) {
    return (
      <Card className={`border-2 ${result.approved ? "border-green-500" : "border-red-500"} bg-card`}>
        <CardContent className="p-8 text-center space-y-4">
          {result.approved ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
              <h2 className="text-2xl font-bold text-green-400">申请通过！</h2>
              <p className="text-muted-foreground">{result.reason}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{result.score}</div>
                  <div className="text-xs text-muted-foreground">AI 评分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{result.cardColor?.toUpperCase()}</div>
                  <div className="text-xs text-muted-foreground">卡片等级</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">${result.creditLimit?.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">信用额度</div>
                </div>
              </div>
              <Button className="mt-4 bg-orange-600 hover:bg-orange-500" onClick={() => window.location.reload()}>
                查看我的卡片
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-400 mx-auto" />
              <h2 className="text-2xl font-bold text-red-400">申请未通过</h2>
              <p className="text-muted-foreground">{result.reason}</p>
              <p className="text-sm text-muted-foreground">需要至少 10,000 粉丝才能申请 Creator Card</p>
              <Button variant="outline" onClick={() => setResult(null)}>重新申请</Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-400" />
          申请 Creator Card
        </CardTitle>
        <CardDescription>填写你的社交媒体账号，AI 将自动评估你的申请</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account, i) => (
          <div key={i} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">账号 {i + 1}</span>
              {i > 0 && (
                <Button variant="ghost" size="sm" onClick={() => removeAccount(i)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">平台</Label>
                <Select value={account.platform} onValueChange={v => updateAccount(i, "platform", v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">用户名 / Handle</Label>
                <Input
                  className="h-9"
                  placeholder="@username"
                  value={account.handle}
                  onChange={e => updateAccount(i, "handle", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">粉丝数</Label>
                <Input
                  className="h-9"
                  type="number"
                  placeholder="10000"
                  value={account.followers || ""}
                  onChange={e => updateAccount(i, "followers", parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs">主页链接（可选）</Label>
                <Input
                  className="h-9"
                  placeholder="https://..."
                  value={account.url}
                  onChange={e => updateAccount(i, "url", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full gap-2 border-dashed" onClick={addAccount}>
          <Plus className="h-4 w-4" />
          添加更多账号（最多5个）
        </Button>

        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <strong>AI 评估说明：</strong>我们的 AI 将根据你的总粉丝数、平台多样性和内容质量潜力来评估申请。所有账号粉丝数合计至少需要 10,000 才能获批。
        </div>

        <Button
          className="w-full bg-orange-600 hover:bg-orange-500 h-12 text-lg font-bold"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />AI 评估中...</>
          ) : (
            <><Sparkles className="h-5 w-5 mr-2" />提交申请</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function MyCard({ card }: { card: any }) {
  const usedPct = Math.min(100, (parseFloat(card.usedAmount) / parseFloat(card.creditLimit)) * 100);
  const available = parseFloat(card.creditLimit) - parseFloat(card.usedAmount);

  return (
    <div className="space-y-6">
      <CardVisual card={card} />

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-green-400">${available.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground mt-1">可用额度</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-orange-400">${parseFloat(card.usedAmount).toFixed(0)}</div>
          <div className="text-xs text-muted-foreground mt-1">已使用</div>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-blue-400">{card.aiScore}</div>
          <div className="text-xs text-muted-foreground mt-1">AI 评分</div>
        </Card>
      </div>

      <Card className="border-orange-500/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>额度使用情况</span>
            <span className="text-muted-foreground">{usedPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>已用 ${parseFloat(card.usedAmount).toFixed(2)}</span>
            <span>总额 ${parseFloat(card.creditLimit).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {card.aiReason && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-blue-300">
              <strong>AI 评语：</strong>{card.aiReason}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">
          使用 Creator Card 购买商品后，通过发布内容来还款
        </p>
        <Link href="/marketplace">
          <Button className="bg-orange-600 hover:bg-orange-500 gap-2">
            <ShoppingBag className="h-4 w-4" />
            去购物
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function CreatorCardPage() {
  const { user } = useAuth();
  const { data: card, isLoading } = trpc.creatorCard.getMyCard.useQuery(undefined, { enabled: !!user });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-purple-950 to-background">
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-700 via-purple-700 to-blue-700 text-white py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-yellow-300" />
          <h1 className="text-4xl font-black mb-3">Creator Card</h1>
          <p className="text-orange-100 text-lg">KOL 专属信用卡 — 先购物，后用内容还款</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-orange-200">
            <span>✓ AI 自动审核</span>
            <span>✓ 最高 $10,000 额度</span>
            <span>✓ 内容还款</span>
            <span>✓ 四档卡片等级</span>
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-8 space-y-8">
        {/* Tier Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CARD_TIERS.map(tier => (
            <div key={tier.color} className={`rounded-xl bg-gradient-to-br ${tier.gradient} p-4 text-center shadow-lg`}>
              <div className={`text-sm font-bold ${tier.color === "platinum" ? "text-gray-800" : "text-white"}`}>
                {tier.label}
              </div>
              <div className={`text-xs mt-1 ${tier.color === "platinum" ? "text-gray-600" : "text-white/70"}`}>
                {tier.minFollowers >= 1_000_000
                  ? `${(tier.minFollowers / 1_000_000).toFixed(1)}M+`
                  : `${(tier.minFollowers / 1000).toFixed(0)}K+`} 粉丝
              </div>
              <div className={`text-lg font-black mt-2 ${tier.color === "platinum" ? "text-gray-900" : "text-yellow-300"}`}>
                ${tier.limit.toLocaleString()}
              </div>
              <div className={`text-xs ${tier.color === "platinum" ? "text-gray-600" : "text-white/60"}`}>额度</div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Main Content */}
        {!user ? (
          <Card className="border-orange-500/20 text-center p-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-orange-400" />
            <h2 className="text-xl font-bold mb-2">登录后申请 Creator Card</h2>
            <p className="text-muted-foreground mb-4">需要登录才能申请或查看你的 Creator Card</p>
            <Link href="/login">
              <Button className="bg-orange-600 hover:bg-orange-500">立即登录</Button>
            </Link>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          </div>
        ) : card ? (
          card.status === "active" ? (
            <MyCard card={card} />
          ) : card.status === "rejected" ? (
            <Card className="border-red-500/30 text-center p-8">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <h2 className="text-xl font-bold mb-2 text-red-400">申请未通过</h2>
              <p className="text-muted-foreground">{card.aiReason}</p>
              <p className="text-sm text-muted-foreground mt-2">增加粉丝数后可重新申请</p>
            </Card>
          ) : (
            <Card className="border-yellow-500/30 text-center p-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-yellow-400 animate-spin" />
              <h2 className="text-xl font-bold mb-2">申请审核中</h2>
              <p className="text-muted-foreground">我们的 AI 正在评估你的申请，请稍候</p>
            </Card>
          )
        ) : (
          <ApplyForm />
        )}

        {/* How it works */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-400" />
              如何运作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "申请卡片", desc: "提交社交媒体账号，AI 自动评估并发卡" },
                { step: "2", title: "先购物", desc: "用 Creator Card 在 Daiizen 购买任意商品" },
                { step: "3", title: "内容还款", desc: "发布商品相关内容，获得 DARK 代币还款" },
              ].map(item => (
                <div key={item.step} className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold text-lg flex items-center justify-center mx-auto">
                    {item.step}
                  </div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
