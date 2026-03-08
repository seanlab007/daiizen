import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STEPS = ["选择类型", "店铺信息", "社媒资料", "缴纳保证金", "完成"];

export default function InfluencerOnboarding() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    tiktokHandle: "",
    instagramHandle: "",
    youtubeHandle: "",
    xiaohongshuHandle: "",
    followerCount: "",
    country: "",
    contactEmail: "",
  });

  const utils = trpc.useUtils();
  const createStore = trpc.store.applyStore.useMutation({
    onSuccess: async () => {
      // Set store type to influencer
      try {
        await updateProfile.mutateAsync({
          storeType: "influencer",
          tiktokHandle: formData.tiktokHandle || undefined,
          instagramHandle: formData.instagramHandle || undefined,
          youtubeHandle: formData.youtubeHandle || undefined,
          xiaohongshuHandle: formData.xiaohongshuHandle || undefined,
          followerCount: formData.followerCount ? parseInt(formData.followerCount) : undefined,
        });
      } catch {}
      setStep(3); // Go to deposit step
    },
    onError: (err: any) => toast.error(err.message ?? "创建失败"),
  });

  const updateProfile = trpc.s2b2c.updateMyStoreProfile.useMutation();

  const depositConfig = trpc.store.getConfig.useQuery();
  const depositAmount = depositConfig.data?.depositAmount ?? 50;
  const depositRequired = depositConfig.data?.depositRequired ?? true;

  const createDeposit = trpc.store.submitDeposit.useMutation({
    onSuccess: () => {
      setStep(4);
      utils.store.myStore.invalidate();
    },
    onError: (err: any) => toast.error(err.message ?? "保证金提交失败"),
  });

  const myStore = trpc.store.myStore.useQuery(undefined, { enabled: !!user });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>登录后开始入驻</CardTitle>
            <CardDescription>成为 Daiizen 网红卖家，连接全球供应链</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()} rel="noopener noreferrer">
              <Button className="w-full">立即登录 / 注册</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myStore.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>您已有店铺</CardTitle>
            <CardDescription>店铺名称：{myStore.data.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={myStore.data.status === "active" ? "default" : "secondary"}>
              {myStore.data.status === "active" ? "已激活" : myStore.data.status === "pending" ? "审核中" : myStore.data.status}
            </Badge>
            <Link href="/seller">
              <Button className="w-full">进入卖家后台</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">网红卖家入驻</h1>
          <p className="text-muted-foreground">连接全球供应链，零库存开店，AI 选品助力爆款</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-full mx-1 ${i < step ? "bg-primary" : "bg-muted"}`} style={{ width: "40px" }} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Step 0: Choose type */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">选择入驻类型</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="p-6 border-2 border-primary rounded-xl text-left hover:bg-primary/5 transition-colors"
                  >
                    <div className="text-3xl mb-3">🌟</div>
                    <div className="font-bold text-lg mb-1">网红 / KOL 入驻</div>
                    <div className="text-sm text-muted-foreground">有粉丝基础，想通过带货变现。从供应链选品，零库存，AI 助力爆款选品。</div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="secondary">零库存</Badge>
                      <Badge variant="secondary">AI 选品</Badge>
                      <Badge variant="secondary">代发货</Badge>
                    </div>
                  </button>
                  <Link href="/supply-chain-onboarding">
                    <button className="p-6 border-2 border-border rounded-xl text-left hover:bg-muted/50 transition-colors w-full">
                      <div className="text-3xl mb-3">🏭</div>
                      <div className="font-bold text-lg mb-1">供应链 / 品牌入驻</div>
                      <div className="text-sm text-muted-foreground">有货源，想通过网红渠道扩大销量。提供批发目录，由网红代销。</div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <Badge variant="outline">批发目录</Badge>
                        <Badge variant="outline">网红代销</Badge>
                        <Badge variant="outline">一件代发</Badge>
                      </div>
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Step 1: Store info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">填写店铺信息</h2>
                <div>
                  <label className="text-sm font-medium mb-1 block">店铺名称 *</label>
                  <Input
                    placeholder="例如：小红的好物分享"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">店铺英文标识 (slug) *</label>
                  <Input
                    placeholder="例如：xiaohong-shop（只能包含字母、数字、横线）"
                    value={formData.slug}
                    onChange={e => setFormData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">店铺链接：/store/{formData.slug || "your-slug"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">店铺简介</label>
                  <Textarea
                    placeholder="介绍你的店铺风格和主营品类..."
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">联系邮箱</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.contactEmail}
                    onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(0)}>上一步</Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.name || !formData.slug}
                    className="flex-1"
                  >
                    下一步
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Social media */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">填写社媒账号（选填）</h2>
                <p className="text-sm text-muted-foreground">填写您的社交媒体账号，有助于提高店铺可信度和曝光率</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">🎵 TikTok / 抖音</label>
                    <Input placeholder="@username" value={formData.tiktokHandle} onChange={e => setFormData(p => ({ ...p, tiktokHandle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">📸 Instagram</label>
                    <Input placeholder="@username" value={formData.instagramHandle} onChange={e => setFormData(p => ({ ...p, instagramHandle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">▶️ YouTube</label>
                    <Input placeholder="@channel" value={formData.youtubeHandle} onChange={e => setFormData(p => ({ ...p, youtubeHandle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">📕 小红书</label>
                    <Input placeholder="账号名" value={formData.xiaohongshuHandle} onChange={e => setFormData(p => ({ ...p, xiaohongshuHandle: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">粉丝总量（约）</label>
                  <Input
                    type="number"
                    placeholder="例如：50000"
                    value={formData.followerCount}
                    onChange={e => setFormData(p => ({ ...p, followerCount: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
                  <Button
                    onClick={() => {
                      createStore.mutate({
                        name: formData.name,
                        description: formData.description,
                        contactEmail: formData.contactEmail || undefined,
                      });
                    }}
                    disabled={createStore.isPending}
                    className="flex-1"
                  >
                    {createStore.isPending ? "提交中..." : "下一步：缴纳保证金"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Deposit */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">缴纳开店保证金</h2>
                {!depositRequired ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 font-medium">✅ 当前无需缴纳保证金，直接提交审核</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">保证金金额</span>
                        <span className="text-2xl font-bold text-primary">{depositAmount} USDD</span>
                      </div>
                      <p className="text-sm text-muted-foreground">保证金用于保障平台交易安全，正常经营退出时全额退还。</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">支付方式：USDD TRC-20</p>
                      <div className="p-3 bg-muted/50 rounded font-mono text-sm break-all">
                        {depositConfig.data ? "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE" : "TRC20 地址加载中..."}
                      </div>
                      <p className="text-xs text-muted-foreground">请向上方地址转账 {depositAmount} USDD，转账后填写交易哈希</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">交易哈希 (TxHash)</label>
                      <Input
                        id="txhash"
                        placeholder="0x... 或 TRC20 交易哈希"
                      />
                    </div>
                  </>
                )}
                <Button
                  onClick={() => {
                    const txHash = (document.getElementById("txhash") as HTMLInputElement)?.value;
                    createDeposit.mutate({
                      paymentMethod: "usdd_trc20",
                      paymentTxHash: txHash || undefined,
                    });
                  }}
                  disabled={createDeposit.isPending}
                  className="w-full"
                >
                  {createDeposit.isPending ? "提交中..." : depositRequired ? "提交保证金，等待审核" : "提交申请"}
                </Button>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div className="text-center space-y-4 py-4">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold">申请已提交！</h2>
                <p className="text-muted-foreground">
                  您的网红店铺申请已提交，平台将在 1-3 个工作日内完成审核。<br />
                  审核通过后，您即可开始从供应链选品、发布商品。
                </p>
                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/seller">
                    <Button className="w-full">进入卖家后台</Button>
                  </Link>
                  <Link href="/marketplace">
                    <Button variant="outline" className="w-full">浏览商城</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits */}
        {step === 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🛒", title: "零库存开店", desc: "从供应链直接选品，无需囤货，代发货到买家" },
              { icon: "🤖", title: "AI 智能选品", desc: "AI 分析爆款趋势，为你的粉丝群体推荐最合适的商品" },
              { icon: "💰", title: "3级裂变奖励", desc: "邀请好友注册购物，最多享受3层推荐奖励，持续增收" },
            ].map((b, i) => (
              <div key={i} className="p-4 bg-card border rounded-xl text-center">
                <div className="text-3xl mb-2">{b.icon}</div>
                <div className="font-semibold mb-1">{b.title}</div>
                <div className="text-sm text-muted-foreground">{b.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
