import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ReferralPage() {
  const { user, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = trpc.s2b2c.getMyReferralCode.useQuery(undefined, { enabled: !!user });
  const myCredits = trpc.s2b2c.getMyCredits.useQuery(undefined, { enabled: !!user });
  const myRewards = trpc.s2b2c.getMyRewards.useQuery(undefined, { enabled: !!user });
  const myTree = trpc.s2b2c.getMyReferralTree.useQuery(undefined, { enabled: !!user });

  const referralLink = referralCode.data
    ? `${window.location.origin}/?ref=${referralCode.data.code}`
    : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("推荐链接已复制！");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`🛒 我在 Daiizen 发现了超棒的全球好货！用我的专属链接注册，首单完成后我们都有奖励！${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`🛒 Daiizen - 全球好货，USDD 稳定币支付！用我的链接注册有奖励：${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>登录后查看推荐奖励</CardTitle>
            <CardDescription>邀请好友注册购物，最多享受3层推荐奖励</CardDescription>
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

  const l1Count = myTree.data?.l1?.length ?? 0;
  const l2Count = myTree.data?.l2?.length ?? 0;
  const l3Count = myTree.data?.l3?.length ?? 0;
  const totalReferrals = l1Count + l2Count + l3Count;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">推荐奖励中心</h1>
          <p className="text-muted-foreground">邀请好友注册并完成首单，最多享受 3 层推荐奖励（L1: 5% / L2: 2% / L3: 1%）</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{parseFloat(myCredits.data?.balanceUsdd ?? "0").toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">可用余额 (USDD)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{parseFloat(myCredits.data?.totalEarnedUsdd ?? "0").toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">累计奖励 (USDD)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalReferrals}</div>
              <div className="text-sm text-muted-foreground">推荐总人数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{myRewards.data?.filter(r => r.status === "pending").length ?? 0}</div>
              <div className="text-sm text-muted-foreground">待确认奖励</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>我的专属推荐链接</CardTitle>
            <CardDescription>分享给好友，好友完成首单后您即可获得奖励</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {referralCode.isLoading ? (
              <div className="h-10 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {referralLink}
                  </div>
                  <Button onClick={copyLink} variant="outline" className="shrink-0">
                    {copied ? "✓ 已复制" : "复制"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">推荐码：</span>
                  <Badge variant="secondary" className="font-mono text-base px-3 py-1">
                    {referralCode.data?.code}
                  </Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={shareToWhatsApp} size="sm" variant="outline" className="gap-2">
                    <span>📱</span> WhatsApp
                  </Button>
                  <Button onClick={shareToTelegram} size="sm" variant="outline" className="gap-2">
                    <span>✈️</span> Telegram
                  </Button>
                  <Button
                    onClick={() => {
                      const text = `🛒 Daiizen 全球好货，USDD 支付！用我的链接注册有奖励：${referralLink}`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <span>🐦</span> Twitter/X
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reward Rules */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>奖励规则</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { level: "L1 直接推荐", rate: "5%", desc: "您直接邀请的好友完成首单", color: "bg-primary/10 border-primary/30" },
                { level: "L2 二级推荐", rate: "2%", desc: "您的好友邀请的人完成首单", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
                { level: "L3 三级推荐", rate: "1%", desc: "三级关系人完成首单（最深3层）", color: "bg-muted border-border" },
              ].map((r, i) => (
                <div key={i} className={`p-4 rounded-xl border ${r.color}`}>
                  <div className="font-semibold mb-1">{r.level}</div>
                  <div className="text-3xl font-bold mb-1">{r.rate}</div>
                  <div className="text-sm text-muted-foreground">{r.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * 奖励仅在被推荐人完成首次购物时触发，仅限3层，无多级传导。奖励以平台积分（USDD）发放，可用于抵扣购物或申请提现。
            </p>
          </CardContent>
        </Card>

        {/* Tabs: Tree + Rewards */}
        <Tabs defaultValue="tree">
          <TabsList className="mb-4">
            <TabsTrigger value="tree">推荐树 ({totalReferrals})</TabsTrigger>
            <TabsTrigger value="rewards">奖励记录 ({myRewards.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="tree">
            <div className="space-y-4">
              {/* L1 */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-primary">L1</Badge>
                  直接推荐 ({l1Count} 人)
                </h3>
                {l1Count === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">暂无直接推荐，分享您的链接开始邀请！</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {myTree.data?.l1.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <div className="font-medium">{r.user?.name ?? "用户"}</div>
                          <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                        </div>
                        <Badge variant={r.relation.firstPurchaseDone ? "default" : "secondary"}>
                          {r.relation.firstPurchaseDone ? "已购物" : "未购物"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* L2 */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="secondary">L2</Badge>
                  二级推荐 ({l2Count} 人)
                </h3>
                {l2Count === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">暂无二级推荐</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {myTree.data?.l2.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <div className="font-medium">{r.user?.name ?? "用户"}</div>
                          <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                        </div>
                        <Badge variant={r.relation.firstPurchaseDone ? "default" : "secondary"}>
                          {r.relation.firstPurchaseDone ? "已购物" : "未购物"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* L3 */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">L3</Badge>
                  三级推荐 ({l3Count} 人)
                </h3>
                {l3Count === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">暂无三级推荐</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {myTree.data?.l3.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <div className="font-medium">{r.user?.name ?? "用户"}</div>
                          <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                        </div>
                        <Badge variant={r.relation.firstPurchaseDone ? "default" : "secondary"}>
                          {r.relation.firstPurchaseDone ? "已购物" : "未购物"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rewards">
            {!myRewards.data || myRewards.data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-3">💰</div>
                <p>暂无奖励记录</p>
                <p className="text-sm">邀请好友完成首单后，奖励将在此显示</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myRewards.data.map((reward, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-card border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">L{reward.level}</Badge>
                        <span className="text-sm font-medium">
                          来自 {reward.referredUserId} 号用户首单
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        订单金额：{parseFloat(reward.orderAmountUsdd).toFixed(2)} USDD ×
                        {(parseFloat(reward.rewardRate) * 100).toFixed(0)}% =
                        <span className="font-medium text-primary ml-1">
                          +{parseFloat(reward.rewardAmountUsdd).toFixed(2)} USDD
                        </span>
                      </div>
                    </div>
                    <Badge variant={
                      reward.status === "confirmed" || reward.status === "paid" ? "default" :
                      reward.status === "pending" ? "secondary" : "destructive"
                    }>
                      {reward.status === "pending" ? "待确认" :
                       reward.status === "confirmed" ? "已确认" :
                       reward.status === "paid" ? "已发放" : "已取消"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
