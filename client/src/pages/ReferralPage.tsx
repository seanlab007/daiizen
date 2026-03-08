import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ReferralPage() {
  const { t } = useLanguage();
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
      toast.success(t("referral.copied_toast"));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`🛒 I found amazing global products on Daiizen! Use my referral link to register and we both get rewards! ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`🛒 Daiizen - Global marketplace, pay with USDD stablecoin! Register with my link for rewards: ${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("referral.login_title")}</CardTitle>
            <CardDescription>{t("referral.login_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()} rel="noopener noreferrer">
              <Button className="w-full">{t("referral.login_btn")}</Button>
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
          <h1 className="text-3xl font-bold mb-2">{t("referral.title")}</h1>
          <p className="text-muted-foreground">{t("referral.subtitle")}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{parseFloat(myCredits.data?.balanceUsdd ?? "0").toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">{t("referral.balance")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{parseFloat(myCredits.data?.totalEarnedUsdd ?? "0").toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">{t("referral.total_earned")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{totalReferrals}</div>
              <div className="text-sm text-muted-foreground">{t("referral.total_referrals")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{myRewards.data?.filter(r => r.status === "pending").length ?? 0}</div>
              <div className="text-sm text-muted-foreground">{t("referral.pending_rewards")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("referral.my_link")}</CardTitle>
            <CardDescription>{t("referral.link_desc")}</CardDescription>
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
                    {copied ? t("referral.copied") : t("referral.copy")}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("referral.code")}</span>
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
                      const text = `🛒 Daiizen Global Marketplace - pay with USDD! Register with my link for rewards: ${referralLink}`;
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
            <CardTitle>{t("referral.rules_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { level: t("referral.l1"), rate: "5%", desc: t("referral.l1_desc"), color: "bg-primary/10 border-primary/30" },
                { level: t("referral.l2"), rate: "2%", desc: t("referral.l2_desc"), color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
                { level: t("referral.l3"), rate: "1%", desc: t("referral.l3_desc"), color: "bg-muted border-border" },
              ].map((r, i) => (
                <div key={i} className={`p-4 rounded-xl border ${r.color}`}>
                  <div className="font-semibold mb-1">{r.level}</div>
                  <div className="text-3xl font-bold mb-1">{r.rate}</div>
                  <div className="text-sm text-muted-foreground">{r.desc}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">{t("referral.rules_note")}</p>
          </CardContent>
        </Card>

        {/* Tabs: Tree + Rewards */}
        <Tabs defaultValue="tree">
          <TabsList className="mb-4">
            <TabsTrigger value="tree">{t("referral.tree_tab")} ({totalReferrals})</TabsTrigger>
            <TabsTrigger value="rewards">{t("referral.rewards_tab")} ({myRewards.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="tree">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-primary">L1</Badge>
                  {t("referral.direct")} ({l1Count})
                </h3>
                {l1Count === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">{t("referral.no_direct")}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {myTree.data?.l1.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <div className="font-medium">{r.user?.name ?? t("referral.user")}</div>
                          <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                        </div>
                        <Badge variant={r.relation.firstPurchaseDone ? "default" : "secondary"}>
                          {r.relation.firstPurchaseDone ? t("referral.purchased") : t("referral.not_purchased")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="secondary">L2</Badge>
                  {t("referral.second")} ({l2Count})
                </h3>
                {l2Count === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">{t("referral.no_second")}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {myTree.data?.l2.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <div className="font-medium">{r.user?.name ?? t("referral.user")}</div>
                          <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                        </div>
                        <Badge variant={r.relation.firstPurchaseDone ? "default" : "secondary"}>
                          {r.relation.firstPurchaseDone ? t("referral.purchased") : t("referral.not_purchased")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">L3</Badge>
                  {t("referral.third")} ({l3Count})
                </h3>
                {l3Count === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">{t("referral.no_third")}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {myTree.data?.l3.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div>
                          <div className="font-medium">{r.user?.name ?? t("referral.user")}</div>
                          <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                        </div>
                        <Badge variant={r.relation.firstPurchaseDone ? "default" : "secondary"}>
                          {r.relation.firstPurchaseDone ? t("referral.purchased") : t("referral.not_purchased")}
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
                <p>{t("referral.no_rewards")}</p>
                <p className="text-sm">{t("referral.no_rewards_desc")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myRewards.data.map((reward, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-card border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">L{reward.level}</Badge>
                        <span className="text-sm font-medium">
                          {t("referral.from_user").replace("{id}", String(reward.referredUserId))}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {parseFloat(reward.orderAmountUsdd).toFixed(2)} USDD ×
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
                      {reward.status === "pending" ? t("referral.status.pending") :
                       reward.status === "confirmed" ? t("referral.status.confirmed") :
                       reward.status === "paid" ? t("referral.status.paid") : t("referral.status.cancelled")}
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
