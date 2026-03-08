import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STEPS = ["基本信息", "供应链资料", "缴纳保证金", "完成"];

export default function SupplyChainOnboarding() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    country: "",
    warehouseCountry: "",
    shippingDays: "7",
    minOrderQuantity: "1",
  });

  const utils = trpc.useUtils();

  const applyStore = trpc.store.applyStore.useMutation({
    onSuccess: async () => {
      try {
        await updateProfile.mutateAsync({
          storeType: "supply_chain",
          warehouseCountry: formData.warehouseCountry || undefined,
          shippingDays: formData.shippingDays ? parseInt(formData.shippingDays) : undefined,
          minOrderQuantity: formData.minOrderQuantity ? parseInt(formData.minOrderQuantity) : undefined,
          isDropshipEnabled: true,
        });
      } catch {}
      setStep(2);
    },
    onError: (err: any) => toast.error(err.message ?? "申请失败"),
  });

  const updateProfile = trpc.s2b2c.updateMyStoreProfile.useMutation();

  const depositConfig = trpc.store.getConfig.useQuery();
  const depositAmount = depositConfig.data?.depositAmount ?? 50;
  const depositRequired = depositConfig.data?.depositRequired ?? true;

  const submitDeposit = trpc.store.submitDeposit.useMutation({
    onSuccess: () => {
      setStep(3);
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
            <CardDescription>成为 Daiizen 供应链合作伙伴，连接全球网红渠道</CardDescription>
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
          <h1 className="text-3xl font-bold mb-2">供应链 / 品牌入驻</h1>
          <p className="text-muted-foreground">上传批发商品目录，让全球网红帮您带货，一件代发，轻松扩销</p>
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
                <div className={`h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-muted"}`} style={{ width: "60px" }} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Step 0: Basic info */}
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">填写基本信息</h2>
                <div>
                  <label className="text-sm font-medium mb-1 block">公司 / 品牌名称 *</label>
                  <Input
                    placeholder="例如：义乌好货批发"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">公司简介</label>
                  <Textarea
                    placeholder="介绍您的主营品类、产品优势..."
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">联系邮箱</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.contactEmail}
                      onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">联系电话</label>
                    <Input
                      placeholder="+86 138..."
                      value={formData.contactPhone}
                      onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">公司所在国家/地区</label>
                  <Input
                    placeholder="例如：China"
                    value={formData.country}
                    onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={() => setStep(1)}
                  disabled={!formData.name}
                  className="w-full"
                >
                  下一步
                </Button>
              </div>
            )}

            {/* Step 1: Supply chain details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">供应链详情</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">仓库所在地</label>
                    <Input
                      placeholder="例如：China - Yiwu"
                      value={formData.warehouseCountry}
                      onChange={e => setFormData(p => ({ ...p, warehouseCountry: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">平均发货天数</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="7"
                      value={formData.shippingDays}
                      onChange={e => setFormData(p => ({ ...p, shippingDays: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">最小起订量（件）</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1（代发填1）"
                    value={formData.minOrderQuantity}
                    onChange={e => setFormData(p => ({ ...p, minOrderQuantity: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">如支持一件代发，请填写 1</p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">🤝 代发合作说明</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    入驻后您可上传批发商品目录（含批发底价）。网红选品后以自定义价格销售，
                    订单产生时平台通知您直接发货给买家。平台从每笔销售中抽取手续费，
                    供应链收取批发底价，网红赚取差价利润。
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(0)}>上一步</Button>
                  <Button
                    onClick={() => {
                      applyStore.mutate({
                        name: formData.name,
                        description: formData.description,
                        contactEmail: formData.contactEmail || undefined,
                        contactPhone: formData.contactPhone || undefined,
                        country: formData.country || undefined,
                      });
                    }}
                    disabled={applyStore.isPending}
                    className="flex-1"
                  >
                    {applyStore.isPending ? "提交中..." : "下一步：缴纳保证金"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Deposit */}
            {step === 2 && (
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
                        TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
                      </div>
                      <p className="text-xs text-muted-foreground">请向上方地址转账 {depositAmount} USDD，转账后填写交易哈希</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">交易哈希 (TxHash)</label>
                      <Input id="sc-txhash" placeholder="TRC20 交易哈希" />
                    </div>
                  </>
                )}
                <Button
                  onClick={() => {
                    const txHash = (document.getElementById("sc-txhash") as HTMLInputElement)?.value;
                    submitDeposit.mutate({
                      paymentMethod: "usdd_trc20",
                      paymentTxHash: txHash || undefined,
                    });
                  }}
                  disabled={submitDeposit.isPending}
                  className="w-full"
                >
                  {submitDeposit.isPending ? "提交中..." : depositRequired ? "提交保证金，等待审核" : "提交申请"}
                </Button>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center space-y-4 py-4">
                <div className="text-6xl mb-4">🏭</div>
                <h2 className="text-2xl font-bold">申请已提交！</h2>
                <p className="text-muted-foreground">
                  您的供应链店铺申请已提交，平台将在 1-3 个工作日内完成审核。<br />
                  审核通过后，您即可上传商品批发目录，开始与网红合作。
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
              { icon: "🌐", title: "全球网红渠道", desc: "接入平台网红资源，快速打开海外市场，无需自建销售团队" },
              { icon: "📦", title: "一件代发", desc: "网红卖出即通知发货，无需网红囤货，降低双方库存风险" },
              { icon: "💹", title: "稳定批发收入", desc: "每笔销售收取批发底价，平台负责收款结算，资金安全有保障" },
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
