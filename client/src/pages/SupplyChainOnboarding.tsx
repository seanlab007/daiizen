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
import { useLanguage } from "@/contexts/LanguageContext";

export default function SupplyChainOnboarding() {
  const { t } = useLanguage();
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

  const STEPS = [
    t("supplychain.step0"),
    t("supplychain.step1"),
    t("supplychain.step2"),
    t("supplychain.step3"),
  ];

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
    onError: (err: any) => toast.error(err.message ?? t("onboarding.submitting")),
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
            <CardDescription>{t("supplychain.login_desc")}</CardDescription>
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
          <h1 className="text-3xl font-bold mb-2">{t("supplychain.title")}</h1>
          <p className="text-muted-foreground">{t("supplychain.subtitle")}</p>
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
                <h2 className="text-xl font-semibold">{t("supplychain.basic_info")}</h2>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("supplychain.company_name")}</label>
                  <Input
                    placeholder={t("supplychain.company_name_placeholder")}
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("supplychain.company_desc")}</label>
                  <Textarea
                    placeholder={t("supplychain.company_desc_placeholder")}
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("supplychain.contact_email")}</label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.contactEmail}
                      onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("supplychain.contact_phone")}</label>
                    <Input
                      placeholder="+1 234..."
                      value={formData.contactPhone}
                      onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("supplychain.country")}</label>
                  <Input
                    placeholder={t("supplychain.country_placeholder")}
                    value={formData.country}
                    onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={() => setStep(1)}
                  disabled={!formData.name}
                  className="w-full"
                >
                  {t("onboarding.next")}
                </Button>
              </div>
            )}

            {/* Step 1: Supply chain details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{t("supplychain.details_title")}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("supplychain.warehouse")}</label>
                    <Input
                      placeholder={t("supplychain.warehouse_placeholder")}
                      value={formData.warehouseCountry}
                      onChange={e => setFormData(p => ({ ...p, warehouseCountry: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("supplychain.shipping_days")}</label>
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
                  <label className="text-sm font-medium mb-1 block">{t("supplychain.moq")}</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder={t("supplychain.moq_placeholder")}
                    value={formData.minOrderQuantity}
                    onChange={e => setFormData(p => ({ ...p, minOrderQuantity: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("supplychain.moq_note")}</p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">{t("supplychain.dropship_title")}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">{t("supplychain.dropship_desc")}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(0)}>{t("onboarding.prev")}</Button>
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
                    {applyStore.isPending ? t("onboarding.submitting") : t("onboarding.next_deposit")}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Deposit */}
            {step === 2 && (
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
                        TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE
                      </div>
                      <p className="text-xs text-muted-foreground">{t("onboarding.deposit_instruction").replace("{amount}", String(depositAmount))}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">{t("onboarding.txhash_label")}</label>
                      <Input id="sc-txhash" placeholder={t("onboarding.txhash_placeholder")} />
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
                  {submitDeposit.isPending ? t("onboarding.submitting") : depositRequired ? t("onboarding.submit_deposit") : t("onboarding.submit_apply")}
                </Button>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center space-y-4 py-4">
                <div className="text-6xl mb-4">🏭</div>
                <h2 className="text-2xl font-bold">{t("onboarding.submitted_title")}</h2>
                <p className="text-muted-foreground">{t("supplychain.submitted_desc")}</p>
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
              { icon: "🌐", title: t("supplychain.benefit1_title"), desc: t("supplychain.benefit1_desc") },
              { icon: "📦", title: t("supplychain.benefit2_title"), desc: t("supplychain.benefit2_desc") },
              { icon: "💹", title: t("supplychain.benefit3_title"), desc: t("supplychain.benefit3_desc") },
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
