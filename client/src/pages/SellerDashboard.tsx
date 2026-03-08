import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import { Store, Package, DollarSign, TrendingUp, Plus, Link2, Trash2, ExternalLink, AlertCircle, CheckCircle, Clock, Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  pinduoduo: "拼多多",
  xiaohongshu: "小红书",
  amazon: "Amazon",
  shein: "SHEIN",
  taobao: "淘宝/天猫",
  jd: "京东",
  lazada: "Lazada",
  shopee: "Shopee",
  other: "Other",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  pinduoduo: "bg-orange-500 text-white",
  xiaohongshu: "bg-red-500 text-white",
  amazon: "bg-yellow-500 text-black",
  shein: "bg-pink-500 text-white",
  taobao: "bg-orange-600 text-white",
  jd: "bg-red-600 text-white",
  lazada: "bg-blue-600 text-white",
  shopee: "bg-orange-400 text-white",
  other: "bg-gray-500 text-white",
};

function StoreStatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const config = {
    pending: { key: "seller.status.pending", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
    active: { key: "seller.status.active", variant: "default" as const, icon: <CheckCircle className="w-3 h-3" /> },
    suspended: { key: "seller.status.suspended", variant: "destructive" as const, icon: <AlertCircle className="w-3 h-3" /> },
    rejected: { key: "seller.status.rejected", variant: "destructive" as const, icon: <AlertCircle className="w-3 h-3" /> },
  }[status] ?? { key: status, variant: "secondary" as const, icon: null };

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {t(config.key)}
    </Badge>
  );
}

// ─── Apply Store Form ─────────────────────────────────────────────────────────
function ApplyStoreForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", description: "", contactEmail: "", contactPhone: "", country: "" });
  const utils = trpc.useUtils();
  const config = trpc.store.getConfig.useQuery();
  const applyMutation = trpc.store.applyStore.useMutation({
    onSuccess: () => {
      toast.success(t("common.success"));
      utils.store.myStore.invalidate();
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Store className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">{t("seller.open_store")}</h2>
        <p className="text-muted-foreground">{t("seller.open_store_desc")}</p>
      </div>

      {config.data && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4" />
              {t("seller.notice_title")}
            </div>
            <ul className="space-y-1 text-amber-700 dark:text-amber-300 ml-6 list-disc">
              <li>{t("seller.deposit_required")} <strong>{config.data.depositAmount} USDD</strong>{t("seller.deposit_refundable")}</li>
              <li>{t("seller.platform_fee")} <strong>{(config.data.commissionRate * 100).toFixed(1)}%</strong> {t("seller.fee_per_order")}</li>
              <li>{t("seller.review_required")}</li>
              <li>{t("seller.import_note")}</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div>
          <Label>{t("seller.store_name")}</Label>
          <Input
            placeholder={t("seller.store_name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label>{t("seller.store_desc")}</Label>
          <Textarea
            placeholder={t("seller.store_desc")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t("seller.contact_email")}</Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("seller.contact_phone")}</Label>
            <Input
              placeholder="+1 234..."
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>{t("seller.country")}</Label>
          <Input
            placeholder="China, USA, UK..."
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => applyMutation.mutate(form)}
          disabled={!form.name || applyMutation.isPending}
        >
          {applyMutation.isPending ? t("common.loading") : t("nav.open_store")}
        </Button>
      </div>
    </div>
  );
}

// ─── Deposit Form ─────────────────────────────────────────────────────────────
function DepositForm() {
  const { t } = useLanguage();
  const [txHash, setTxHash] = useState("");
  const config = trpc.store.getConfig.useQuery();
  const deposit = trpc.store.myDeposit.useQuery();
  const utils = trpc.useUtils();
  const submitMutation = trpc.store.submitDeposit.useMutation({
    onSuccess: () => {
      toast.success(t("common.success"));
      utils.store.myDeposit.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (deposit.data?.status === "confirmed") {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">{t("seller.deposit_confirmed")}</p>
            <p className="text-sm text-green-600">{deposit.data.amountUsdd} USDD</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deposit.data?.status === "pending") {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
        <CardContent className="pt-4 flex items-center gap-3">
          <Clock className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">{t("seller.deposit_pending")}</p>
            <p className="text-sm text-yellow-600">{deposit.data.amountUsdd} USDD</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("seller.pay_deposit")}</CardTitle>
        <CardDescription>
          {config.data?.depositAmount ?? 50} USDD
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p className="font-medium">{t("seller.deposit_address")}</p>
          <p className="font-mono text-xs break-all">TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE</p>
        </div>
        <div>
          <Label>{t("seller.txhash")}</Label>
          <Input
            placeholder="TxHash..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => submitMutation.mutate({ paymentMethod: "usdd", paymentTxHash: txHash })}
          disabled={!txHash || submitMutation.isPending}
        >
          {submitMutation.isPending ? t("common.loading") : t("seller.pay_deposit")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Product List ─────────────────────────────────────────────────────────────
function ProductList({ storeId }: { storeId: number }) {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const products = trpc.store.myProducts.useQuery({ page, limit: 12, search: search || undefined });
  const deleteMutation = trpc.store.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success(t("common.success"));
      utils.store.myProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("common.search") + "..."}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm"
      />
      {products.isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : products.data?.products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("seller.no_products")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.data?.products.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="aspect-square bg-muted relative overflow-hidden">
                {product.images && (product.images as string[]).length > 0 ? (
                  <img
                    src={(product.images as string[])[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                {product.externalPlatform && (
                  <span className={`absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${PLATFORM_COLORS[product.externalPlatform] ?? "bg-gray-500 text-white"}`}>
                    {PLATFORM_LABELS[product.externalPlatform] ?? product.externalPlatform}
                  </span>
                )}
                {product.isActive === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{t("common.na")}</span>
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">{parseFloat(product.priceUsdd).toFixed(2)} USDD</span>
                  <span className="text-xs text-muted-foreground">{product.stock}</span>
                </div>
                <div className="flex gap-1 pt-1">
                  {product.externalUrl && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                      <a href={product.externalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive ml-auto"
                    onClick={() => {
                      if (confirm(t("common.confirm") + "?")) {
                        deleteMutation.mutate({ id: product.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {(products.data?.total ?? 0) > 12 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("seller.prev_page")}</Button>
          <span className="text-sm text-muted-foreground self-center">{page}</span>
          <Button variant="outline" size="sm" disabled={page * 12 >= (products.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>{t("seller.next_page")}</Button>
        </div>
      )}
    </div>
  );
}

// ─── Add Product Dialog ───────────────────────────────────────────────────────
function AddProductDialog({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "import">("manual");
  const [form, setForm] = useState({ name: "", description: "", priceUsdd: "", stock: "0", images: "" });
  const [importUrl, setImportUrl] = useState("");
  const utils = trpc.useUtils();

  const addMutation = trpc.store.addProduct.useMutation({
    onSuccess: () => {
      toast.success(t("common.success"));
      utils.store.myProducts.invalidate();
      setOpen(false);
      setForm({ name: "", description: "", priceUsdd: "", stock: "0", images: "" });
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const importMutation = trpc.store.importFromLink.useMutation({
    onSuccess: (data) => {
      toast.success(t("common.success"));
      utils.store.myProducts.invalidate();
      setOpen(false);
      setImportUrl("");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {t("seller.add_product")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("seller.add_product")}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="w-4 h-4" />
              {t("seller.manual_add")}
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Link2 className="w-4 h-4" />
              {t("seller.import_link")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 pt-2">
            <div>
              <Label>{t("seller.product_name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>{t("seller.product_desc")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("seller.price_usdd")}</Label>
                <Input type="number" value={form.priceUsdd} onChange={(e) => setForm({ ...form, priceUsdd: e.target.value })} placeholder="9.99" min="0" step="0.01" />
              </div>
              <div>
                <Label>{t("seller.stock")}</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" min="0" />
              </div>
            </div>
            <div>
              <Label>{t("seller.image_urls")}</Label>
              <Textarea
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://example.com/image1.jpg"
                rows={2}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => addMutation.mutate({
                name: form.name,
                description: form.description || undefined,
                priceUsdd: parseFloat(form.priceUsdd),
                stock: parseInt(form.stock) || 0,
                images: form.images ? form.images.split("\n").map(s => s.trim()).filter(Boolean) : [],
              })}
              disabled={!form.name || !form.priceUsdd || addMutation.isPending}
            >
              {addMutation.isPending ? t("common.loading") : t("seller.add_product")}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2">
              {["TikTok", "拼多多", "小红书", "Amazon", "SHEIN", "淘宝"].map((p) => (
                <div key={p} className="text-center p-2 bg-muted rounded text-xs font-medium">{p}</div>
              ))}
            </div>
            <div>
              <Label>{t("seller.product_link")}</Label>
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder={t("seller.import_placeholder")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("seller.import_platforms")}
              </p>
            </div>
            {importMutation.isPending && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {t("seller.ai_parsing")}
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => importMutation.mutate({ url: importUrl })}
              disabled={!importUrl || importMutation.isPending}
            >
              {importMutation.isPending ? t("seller.ai_parsing") : t("seller.import_link")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t("seller.ai_note")}
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Seller Dashboard ────────────────────────────────────────────────────
export default function SellerDashboard() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [applied, setApplied] = useState(false);
  const store = trpc.store.myStore.useQuery(undefined, { enabled: !!user });
  const stats = trpc.store.myStoreStats.useQuery(undefined, { enabled: !!user && store.data?.status === "active" });
  const deposit = trpc.store.myDeposit.useQuery(undefined, { enabled: !!user && !!store.data });
  const { data: notifCount, refetch: refetchCount } = trpc.notifications.unreadCount.useQuery(undefined, { enabled: !!user, refetchInterval: 30000 });
  const { data: notifications, refetch: refetchNotifs } = trpc.notifications.list.useQuery(undefined, { enabled: !!user });
  const markReadMutation = trpc.notifications.markRead.useMutation({ onSuccess: () => { refetchCount(); refetchNotifs(); } });
  const [notifOpen, setNotifOpen] = useState(false);

  if (authLoading || store.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16 text-center space-y-4">
        <Store className="w-12 h-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("seller.login_required")}</h2>
        <p className="text-muted-foreground">{t("seller.login_desc")}</p>
        <Button asChild><Link href="/">{t("seller.back_home")}</Link></Button>
      </div>
    );
  }

  // No store yet
  if (!store.data) {
    return (
      <div className="container py-8 max-w-2xl">
        <ApplyStoreForm onSuccess={() => store.refetch()} />
      </div>
    );
  }

  const storeData = store.data;

  return (
    <div className="container py-6 space-y-6">
      {/* Store Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
            {storeData.logoUrl ? (
              <img src={storeData.logoUrl} alt={storeData.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{storeData.name}</h1>
              <StoreStatusBadge status={storeData.status} />
            </div>
            <p className="text-sm text-muted-foreground">/store/{storeData.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <Popover open={notifOpen} onOpenChange={(open) => {
            setNotifOpen(open);
            if (open && notifCount && notifCount.count > 0) {
              markReadMutation.mutate({});
            }
          }}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {notifCount && notifCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {notifCount.count > 9 ? "9+" : notifCount.count}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b font-semibold text-sm">{t("seller.notifications")}</div>
              <div className="max-h-80 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">{t("seller.no_notifications")}</div>
                ) : (
                  notifications.map((n: any) => (
                    <div key={n.id} className={`p-3 border-b last:border-0 text-sm hover:bg-muted/50 cursor-pointer ${n.isRead ? "opacity-60" : ""}`}
                      onClick={() => { if (n.link) window.location.href = n.link; }}>
                      <div className="font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          {storeData.status === "active" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/store/${storeData.slug}`}>{t("seller.view_store")}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Pending notices */}
      {storeData.status === "pending" && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200">
              <Clock className="w-4 h-4" />
              {t("seller.under_review")}
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {t("seller.review_desc")}
            </p>
            {user.role !== "admin" && <DepositForm />}
          </CardContent>
        </Card>
      )}

      {storeData.status === "rejected" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 font-medium text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              {t("seller.rejected")}
            </div>
            {storeData.adminNote && (
              <p className="text-sm text-red-600 mt-1">{storeData.adminNote}</p>
            )}
          </CardContent>
        </Card>
      )}

      {storeData.status === "suspended" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 font-medium text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              {t("seller.suspended")}
            </div>
            {storeData.adminNote && (
              <p className="text-sm text-red-600 mt-1">{storeData.adminNote}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {storeData.status === "active" && stats.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Package className="w-4 h-4" /> {t("seller.products_on_sale")}
              </div>
              <p className="text-2xl font-bold">{stats.data.productCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="w-4 h-4" /> {t("seller.total_orders")}
              </div>
              <p className="text-2xl font-bold">{stats.data.orderCount}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="w-4 h-4" /> {t("seller.total_earnings")}
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.data.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">USDD</p>
              <Link href="/seller/withdrawal" className="text-xs text-primary hover:underline mt-1 block">{t("seller.withdraw_btn")}</Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="w-4 h-4" /> {t("seller.platform_fee_label")}
              </div>
              <p className="text-2xl font-bold">{stats.data.totalCommission.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">USDD</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content tabs */}
      {storeData.status === "active" && (
        <Tabs defaultValue="products">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList>
              <TabsTrigger value="products">{t("seller.products_tab")}</TabsTrigger>
              <TabsTrigger value="settings">{t("seller.settings_tab")}</TabsTrigger>
              <TabsTrigger value="deposit">{t("seller.deposit_tab")}</TabsTrigger>
            </TabsList>
            <AddProductDialog onSuccess={() => {}} />
          </div>

          <TabsContent value="products" className="mt-4">
            <ProductList storeId={storeData.id} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <StoreSettingsForm store={storeData} />
          </TabsContent>

          <TabsContent value="deposit" className="mt-4 max-w-md">
            <DepositForm />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ─── Store Settings Form ──────────────────────────────────────────────────────
function StoreSettingsForm({ store }: { store: any }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: store.name ?? "",
    description: store.description ?? "",
    logoUrl: store.logoUrl ?? "",
    bannerUrl: store.bannerUrl ?? "",
    contactEmail: store.contactEmail ?? "",
    contactPhone: store.contactPhone ?? "",
    country: store.country ?? "",
  });
  const utils = trpc.useUtils();
  const updateMutation = trpc.store.updateStore.useMutation({
    onSuccess: () => {
      toast.success(t("common.saved"));
      utils.store.myStore.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{t("seller.store_info")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{t("seller.store_name_label")}</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>{t("seller.store_desc")}</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div>
          <Label>{t("seller.store_logo")}</Label>
          <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <Label>{t("seller.store_banner")}</Label>
          <Input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t("seller.contact_email")}</Label>
            <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div>
            <Label>{t("seller.contact_phone")}</Label>
            <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>{t("seller.country")}</Label>
          <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <Button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
