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
import { useLanguage } from "@/contexts/LanguageContext";

export default function InfluencerOnboarding() {
  const { t } = useLanguage();
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

  const STEPS = [
    t("influencer.step0"),
    t("influencer.step1"),
    t("influencer.step2"),
    t("influencer.step3"),
    t("influencer.step4"),
  ];

  const utils = trpc.useUtils();
  const createStore = trpc.store.applyStore.useMutation({
    onSuccess: async () => {
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
      setStep(3);
    },
    onError: (err: any) => toast.error(err.message ?? t("onboarding.submitting")),
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
    onError: (err: any) => toast.error(err.message ?? t("onboarding.submitting")),
  });

  const myStore = trpc.store.myStore.useQuery(undefined, { enabled: !!user });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("onboarding.login_title")}</CardTitle>
            <CardDescription>{t("influencer.login_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={getLoginUrl()} rel="noopener noreferrer">
              <Button className="w-full">{t("onboarding.login_btn")}</Button>
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
            <CardTitle>{t("onboarding.already_store")}</CardTitle>
            <CardDescription>{t("onboarding.store_name_label")} {myStore.data.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={myStore.data.status === "active" ? "default" : "secondary"}>
              {myStore.data.status === "active" ? t("onboarding.active") : myStore.data.status === "pending" ? t("onboarding.pending") : myStore.data.status}
            </Badge>
            <Link href="/seller">
              <Button className="w-full">{t("onboarding.go_seller")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("influencer.title")}</h1>
          <p className="text-muted-foreground">{t("influencer.subtitle")}</p>
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
                <h2 className="text-xl font-semibold">{t("influencer.choose_type")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="p-6 border-2 border-primary rounded-xl text-left hover:bg-primary/5 transition-colors"
                  >
                    <div className="text-3xl mb-3">🌟</div>
                    <div className="font-bold text-lg mb-1">{t("influencer.kol_title")}</div>
                    <div className="text-sm text-muted-foreground">{t("influencer.kol_desc")}</div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="secondary">{t("influencer.kol_badge1")}</Badge>
                      <Badge variant="secondary">{t("influencer.kol_badge2")}</Badge>
                      <Badge variant="secondary">{t("influencer.kol_badge3")}</Badge>
                    </div>
                  </button>
                  <Link href="/supply-chain-onboarding">
                    <button className="p-6 border-2 border-border rounded-xl text-left hover:bg-muted/50 transition-colors w-full">
                      <div className="text-3xl mb-3">🏭</div>
                      <div className="font-bold text-lg mb-1">{t("influencer.sc_title")}</div>
                      <div className="text-sm text-muted-foreground">{t("influencer.sc_desc")}</div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <Badge variant="outline">{t("influencer.sc_badge1")}</Badge>
                        <Badge variant="outline">{t("influencer.sc_badge2")}</Badge>
                        <Badge variant="outline">{t("influencer.sc_badge3")}</Badge>
                      </div>
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Step 1: Store info */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{t("influencer.store_info")}</h2>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("influencer.store_name")}</label>
                  <Input
                    placeholder={t("influencer.store_name_placeholder")}
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("influencer.store_slug")}</label>
                  <Input
                    placeholder={t("influencer.store_slug_placeholder")}
                    value={formData.slug}
                    onChange={e => setFormData(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("influencer.store_url_preview")}{formData.slug || "your-slug"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("influencer.store_desc_label")}</label>
                  <Textarea
                    placeholder={t("influencer.store_desc_placeholder")}
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("influencer.contact_email")}</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.contactEmail}
                    onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(0)}>{t("onboarding.prev")}</Button>
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.name || !formData.slug}
                    className="flex-1"
                  >
                    {t("onboarding.next")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Social media */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{t("influencer.social_title")}</h2>
                <p className="text-sm text-muted-foreground">{t("influencer.social_desc")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("influencer.tiktok")}</label>
                    <Input placeholder="@username" value={formData.tiktokHandle} onChange={e => setFormData(p => ({ ...p, tiktokHandle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("influencer.instagram")}</label>
                    <Input placeholder="@username" value={formData.instagramHandle} onChange={e => setFormData(p => ({ ...p, instagramHandle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("influencer.youtube")}</label>
                    <Input placeholder="@channel" value={formData.youtubeHandle} onChange={e => setFormData(p => ({ ...p, youtubeHandle: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("influencer.xiaohongshu")}</label>
                    <Input placeholder="@username" value={formData.xiaohongshuHandle} onChange={e => setFormData(p => ({ ...p, xiaohongshuHandle: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("influencer.followers")}</label>
                  <Input
                    type="number"
                    placeholder={t("influencer.followers_placeholder")}
                    value={formData.followerCount}
                    onChange={e => setFormData(p => ({ ...p, followerCount: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>{t("onboarding.prev")}</Button>
                  <Button
                    onClick={() => {
                      createStore.mutate({
                        name: formData.name,
                        description: formData.description,
                        contactEmail: formData.contactEmail || undefined,
                        country: formData.country || undefined,
                      });
                    }}
                    disabled={createStore.isPending}
                    className="flex-1"
                  >
                    {createStore.isPending ? t("onboarding.submitting") : t("onboarding.next_deposit")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Deposit */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{t("onboarding.deposit_title")}</h2>
                {!depositRequired ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 font-medium">{t("onboarding.no_deposit")}</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{t("onboarding.deposit_amount")}</span>
                        <span className="text-2xl font-bold text-primary">{depositAmount} USDD</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("onboarding.deposit_note")}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t("onboarding.payment_method")}</p>
                      <div className="p-3 bg-muted/50 rounded font-mono text-sm break-all">
                        {depositConfig.data ? "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE" : "Loading..."}
                      </div>
                      <p className="text-xs text-muted-foreground">{t("onboarding.deposit_instruction").replace("{amount}", String(depositAmount))}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t("onboarding.txhash_label")}</label>
                      <Input
                        id="txhash"
                        placeholder={t("onboarding.txhash_placeholder")}
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
                  {createDeposit.isPending ? t("onboarding.submitting") : depositRequired ? t("onboarding.submit_deposit") : t("onboarding.submit_apply")}
                </Button>
              </div>
            )}

            {/* Step 4: Done */}
            {step === 4 && (
              <div className="text-center space-y-4 py-4">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold">{t("onboarding.submitted_title")}</h2>
                <p className="text-muted-foreground">{t("influencer.submitted_desc")}</p>
                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/seller">
                    <Button className="w-full">{t("onboarding.go_seller")}</Button>
                  </Link>
                  <Link href="/marketplace">
                    <Button variant="outline" className="w-full">{t("onboarding.browse")}</Button>
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
              { icon: "🛒", title: t("influencer.benefit1_title"), desc: t("influencer.benefit1_desc") },
              { icon: "🤖", title: t("influencer.benefit2_title"), desc: t("influencer.benefit2_desc") },
              { icon: "💰", title: t("influencer.benefit3_title"), desc: t("influencer.benefit3_desc") },
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
