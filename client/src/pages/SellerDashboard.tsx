import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { Store, Package, DollarSign, TrendingUp, Plus, Link2, Trash2, Edit, ExternalLink, AlertCircle, CheckCircle, Clock } from "lucide-react";

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
  other: "其他平台",
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
  const config = {
    pending: { label: "待审核", variant: "secondary" as const, icon: <Clock className="w-3 h-3" /> },
    active: { label: "营业中", variant: "default" as const, icon: <CheckCircle className="w-3 h-3" /> },
    suspended: { label: "已暂停", variant: "destructive" as const, icon: <AlertCircle className="w-3 h-3" /> },
    rejected: { label: "已拒绝", variant: "destructive" as const, icon: <AlertCircle className="w-3 h-3" /> },
  }[status] ?? { label: status, variant: "secondary" as const, icon: null };

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ─── Apply Store Form ─────────────────────────────────────────────────────────
function ApplyStoreForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", contactEmail: "", contactPhone: "", country: "" });
  const utils = trpc.useUtils();
  const config = trpc.store.getConfig.useQuery();
  const applyMutation = trpc.store.applyStore.useMutation({
    onSuccess: () => {
      toast.success("申请已提交！等待管理员审核");
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
        <h2 className="text-2xl font-bold">开设您的店铺</h2>
        <p className="text-muted-foreground">在 Daiizen 全球市场开店，触达全球买家</p>
      </div>

      {config.data && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-4 h-4" />
              开店须知
            </div>
            <ul className="space-y-1 text-amber-700 dark:text-amber-300 ml-6 list-disc">
              <li>需缴纳保证金 <strong>{config.data.depositAmount} USDD</strong>，保证金可在退店时退还</li>
              <li>平台收取 <strong>{(config.data.commissionRate * 100).toFixed(1)}%</strong> 手续费（每笔成交）</li>
              <li>店铺需经管理员审核后方可营业</li>
              <li>支持导入 TikTok、拼多多、小红书、Amazon、SHEIN 等平台商品链接</li>
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div>
          <Label>店铺名称 *</Label>
          <Input
            placeholder="输入您的店铺名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label>店铺简介</Label>
          <Textarea
            placeholder="介绍您的店铺和主营商品..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>联系邮箱</Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <Label>联系电话</Label>
            <Input
              placeholder="+86 138..."
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>所在国家/地区</Label>
          <Input
            placeholder="中国、美国、英国..."
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => applyMutation.mutate(form)}
          disabled={!form.name || applyMutation.isPending}
        >
          {applyMutation.isPending ? "提交中..." : "提交开店申请"}
        </Button>
      </div>
    </div>
  );
}

// ─── Deposit Form ─────────────────────────────────────────────────────────────
function DepositForm() {
  const [txHash, setTxHash] = useState("");
  const config = trpc.store.getConfig.useQuery();
  const deposit = trpc.store.myDeposit.useQuery();
  const utils = trpc.useUtils();
  const submitMutation = trpc.store.submitDeposit.useMutation({
    onSuccess: () => {
      toast.success("保证金记录已提交，等待管理员确认");
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
            <p className="font-medium text-green-800 dark:text-green-200">保证金已确认</p>
            <p className="text-sm text-green-600">金额：{deposit.data.amountUsdd} USDD</p>
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
            <p className="font-medium text-yellow-800 dark:text-yellow-200">保证金待确认</p>
            <p className="text-sm text-yellow-600">已提交 {deposit.data.amountUsdd} USDD，等待管理员确认</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>缴纳店铺保证金</CardTitle>
        <CardDescription>
          缴纳 {config.data?.depositAmount ?? 50} USDD 保证金后，管理员审核通过即可开始营业
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
          <p className="font-medium">USDD TRC-20 收款地址：</p>
          <p className="font-mono text-xs break-all">TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE</p>
          <p className="text-muted-foreground">请转账 {config.data?.depositAmount ?? 50} USDD 到以上地址</p>
        </div>
        <div>
          <Label>交易哈希 (TxHash)</Label>
          <Input
            placeholder="粘贴您的转账交易哈希..."
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => submitMutation.mutate({ paymentMethod: "usdd", paymentTxHash: txHash })}
          disabled={!txHash || submitMutation.isPending}
        >
          {submitMutation.isPending ? "提交中..." : "提交保证金记录"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Product List ─────────────────────────────────────────────────────────────
function ProductList({ storeId }: { storeId: number }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const products = trpc.store.myProducts.useQuery({ page, limit: 12, search: search || undefined });
  const deleteMutation = trpc.store.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("商品已删除");
      utils.store.myProducts.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="搜索商品..."
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
          <p>还没有商品，点击上方按钮添加</p>
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
                    <span className="text-white text-sm font-medium">已下架</span>
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">{parseFloat(product.priceUsdd).toFixed(2)} USDD</span>
                  <span className="text-xs text-muted-foreground">库存 {product.stock}</span>
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
                      if (confirm("确认删除此商品？")) {
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
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-muted-foreground self-center">第 {page} 页</span>
          <Button variant="outline" size="sm" disabled={page * 12 >= (products.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  );
}

// ─── Add Product Dialog ───────────────────────────────────────────────────────
function AddProductDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"manual" | "import">("manual");
  const [form, setForm] = useState({ name: "", description: "", priceUsdd: "", stock: "0", images: "" });
  const [importUrl, setImportUrl] = useState("");
  const utils = trpc.useUtils();

  const addMutation = trpc.store.addProduct.useMutation({
    onSuccess: () => {
      toast.success("商品已添加");
      utils.store.myProducts.invalidate();
      setOpen(false);
      setForm({ name: "", description: "", priceUsdd: "", stock: "0", images: "" });
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const importMutation = trpc.store.importFromLink.useMutation({
    onSuccess: (data) => {
      toast.success(`已从 ${data.extracted.name} 导入商品`);
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
          添加商品
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>添加商品</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="w-4 h-4" />
              手动添加
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Link2 className="w-4 h-4" />
              导入链接
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 pt-2">
            <div>
              <Label>商品名称 *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="商品名称" />
            </div>
            <div>
              <Label>商品描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="商品详情..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>价格 (USDD) *</Label>
                <Input type="number" value={form.priceUsdd} onChange={(e) => setForm({ ...form, priceUsdd: e.target.value })} placeholder="9.99" min="0" step="0.01" />
              </div>
              <div>
                <Label>库存数量</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" min="0" />
              </div>
            </div>
            <div>
              <Label>商品图片 URL（每行一个）</Label>
              <Textarea
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
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
              {addMutation.isPending ? "添加中..." : "添加商品"}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2">
              {["TikTok", "拼多多", "小红书", "Amazon", "SHEIN", "淘宝"].map((p) => (
                <div key={p} className="text-center p-2 bg-muted rounded text-xs font-medium">{p}</div>
              ))}
            </div>
            <div>
              <Label>商品链接 *</Label>
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="粘贴商品链接，如 https://www.tiktok.com/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                支持 TikTok、拼多多、小红书、Amazon、SHEIN、淘宝、京东、Lazada、Shopee 等平台
              </p>
            </div>
            {importMutation.isPending && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                AI 正在解析商品信息...
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => importMutation.mutate({ url: importUrl })}
              disabled={!importUrl || importMutation.isPending}
            >
              {importMutation.isPending ? "解析中..." : "AI 解析并导入"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              AI 将自动提取商品名称、描述、价格等信息，您可在导入后编辑
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Seller Dashboard ────────────────────────────────────────────────────
export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [applied, setApplied] = useState(false);
  const store = trpc.store.myStore.useQuery(undefined, { enabled: !!user });
  const stats = trpc.store.myStoreStats.useQuery(undefined, { enabled: !!user && store.data?.status === "active" });
  const deposit = trpc.store.myDeposit.useQuery(undefined, { enabled: !!user && !!store.data });

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
        <h2 className="text-xl font-semibold">请先登录</h2>
        <p className="text-muted-foreground">登录后即可开设您的店铺</p>
        <Button asChild><Link href="/">返回首页</Link></Button>
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
        {storeData.status === "active" && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/store/${storeData.slug}`}>查看店铺主页</Link>
          </Button>
        )}
      </div>

      {/* Pending notices */}
      {storeData.status === "pending" && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2 font-medium text-yellow-800 dark:text-yellow-200">
              <Clock className="w-4 h-4" />
              店铺审核中
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              您的开店申请正在审核中。请先缴纳保证金，管理员确认后将尽快审核您的申请。
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
              申请已被拒绝
            </div>
            {storeData.adminNote && (
              <p className="text-sm text-red-600 mt-1">原因：{storeData.adminNote}</p>
            )}
          </CardContent>
        </Card>
      )}

      {storeData.status === "suspended" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 font-medium text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4" />
              店铺已被暂停
            </div>
            {storeData.adminNote && (
              <p className="text-sm text-red-600 mt-1">原因：{storeData.adminNote}</p>
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
                <Package className="w-4 h-4" /> 在售商品
              </div>
              <p className="text-2xl font-bold">{stats.data.productCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="w-4 h-4" /> 总订单
              </div>
              <p className="text-2xl font-bold">{stats.data.orderCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="w-4 h-4" /> 总收益
              </div>
              <p className="text-2xl font-bold">{stats.data.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">USDD</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="w-4 h-4" /> 平台手续费
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
              <TabsTrigger value="products">商品管理</TabsTrigger>
              <TabsTrigger value="settings">店铺设置</TabsTrigger>
              <TabsTrigger value="deposit">保证金</TabsTrigger>
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
      toast.success("店铺信息已更新");
      utils.store.myStore.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>店铺基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>店铺名称</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>店铺简介</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div>
          <Label>店铺 Logo URL</Label>
          <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <Label>店铺横幅 URL</Label>
          <Input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>联系邮箱</Label>
            <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>
          <div>
            <Label>联系电话</Label>
            <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>所在国家/地区</Label>
          <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <Button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "保存中..." : "保存更改"}
        </Button>
      </CardContent>
    </Card>
  );
}
