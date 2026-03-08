import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Package, ShoppingBag, BarChart3, Plus, Pencil, Trash2, Sparkles, RefreshCw, CheckCircle, Store, DollarSign, Settings, AlertCircle, Clock, XCircle, CreditCard, Smartphone, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type Section = "dashboard" | "products" | "orders" | "categories" | "rates" | "stores" | "deposits" | "marketplace-config" | "payment-config" | "usdd-deposits" | "usdd-withdrawals";

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-amber-600",
  paid: "text-blue-600",
  shipped: "text-purple-600",
  completed: "text-emerald-600",
  cancelled: "text-red-600",
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams<{ section?: string }>();
  const [, setLocation] = useLocation();
  const section: Section = (params.section as Section) || "dashboard";

  const [showNewProduct, setShowNewProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    slug: "", nameEn: "", nameEs: "", nameTr: "", namePt: "", nameAr: "", nameRu: "",
    descriptionEn: "", priceUsdd: "", stock: 0, isFeatured: false, isActive: true,
  });

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: pendingStores, refetch: refetchStores } = trpc.store.adminListStores.useQuery({ status: "pending", page: 1, limit: 50 }, { enabled: section === "stores" && isAuthenticated && user?.role === "admin" });
  const { data: allStores } = trpc.store.adminListStores.useQuery({ page: 1, limit: 50 }, { enabled: section === "stores" && isAuthenticated && user?.role === "admin" });
  const { data: pendingDeposits, refetch: refetchDeposits } = trpc.store.adminListDeposits.useQuery({ status: "pending", page: 1, limit: 50 }, { enabled: section === "deposits" && isAuthenticated && user?.role === "admin" });
  const { data: pendingUsddDeposits, refetch: refetchUsddDeposits } = trpc.wallet.adminGetPendingDeposits.useQuery(undefined, { enabled: section === "usdd-deposits" && isAuthenticated && user?.role === "admin" });
  const { data: allWithdrawals, refetch: refetchWithdrawals } = trpc.withdrawal.adminGetAll.useQuery({ status: undefined }, { enabled: section === "usdd-withdrawals" && isAuthenticated && user?.role === "admin" });
  const { t } = useLanguage();
  // admin mutations
  const confirmUsddDepositMutation = trpc.wallet.adminConfirmDeposit.useMutation({ onSuccess: () => { refetchUsddDeposits(); toast.success(t("admin.deposit_confirmed")); } });
  const rejectUsddDepositMutation = trpc.wallet.adminRejectDeposit.useMutation({ onSuccess: () => { refetchUsddDeposits(); toast.success(t("admin.deposit_rejected")); } });
  const approveWithdrawalMutation = trpc.withdrawal.adminApprove.useMutation({ onSuccess: () => { refetchWithdrawals(); toast.success(t("admin.withdrawal_approved")); } });
  const rejectWithdrawalMutation = trpc.withdrawal.adminReject.useMutation({ onSuccess: () => { refetchWithdrawals(); toast.success(t("admin.withdrawal_rejected")); } });
  const [markPaidForm, setMarkPaidForm] = useState<{ id: number; txHash: string } | null>(null);
  const markPaidMutation = trpc.withdrawal.adminMarkPaid.useMutation({ onSuccess: () => { refetchWithdrawals(); setMarkPaidForm(null); toast.success(t("admin.marked_paid")); } });
  const { data: marketplaceConfig, refetch: refetchConfig } = trpc.store.getConfig.useQuery(undefined, { enabled: section === "marketplace-config" && isAuthenticated && user?.role === "admin" });
  const [configForm, setConfigForm] = useState({ commissionRate: "", depositAmount: "", depositWalletAddress: "" });
  const [paymentForm, setPaymentForm] = useState({ method: "alipay", accountName: "", accountNumber: "", qrCodeUrl: "", isEnabled: true });
  const { data: paymentMethods, refetch: refetchPaymentMethods } = trpc.payment.adminGetPaymentConfigs.useQuery(undefined, { enabled: section === "payment-config" && isAuthenticated && user?.role === "admin" });
  const setPaymentMethodMutation = trpc.payment.adminUpdatePaymentConfig.useMutation({ onSuccess: () => { refetchPaymentMethods(); toast.success(t("common.saved")); setPaymentForm({ method: "alipay", accountName: "", accountNumber: "", qrCodeUrl: "", isEnabled: true }); } });
  const deletePaymentMethodMutation = trpc.payment.adminUpdatePaymentConfig.useMutation({ onSuccess: () => { refetchPaymentMethods(); toast.success(t("common.success")); } });
  const approveStoreMutation = trpc.store.adminApproveStore.useMutation({ onSuccess: () => { refetchStores(); toast.success(t("admin.store_approved")); } });
  const rejectStoreMutation = trpc.store.adminRejectStore.useMutation({ onSuccess: () => { refetchStores(); toast.success(t("admin.store_rejected")); } });
  const suspendStoreMutation = trpc.store.adminSuspendStore.useMutation({ onSuccess: () => { refetchStores(); toast.success(t("admin.store_suspended")); } });
  const reinstateStoreMutation = trpc.store.adminReinstateStore.useMutation({ onSuccess: () => { refetchStores(); toast.success(t("admin.store_reinstated")); } });
  const confirmDepositMutation = trpc.store.adminConfirmDeposit.useMutation({ onSuccess: () => { refetchDeposits(); toast.success(t("admin.deposit_confirmed")); } });
  const refundDepositMutation = trpc.store.adminRefundDeposit.useMutation({ onSuccess: () => { refetchDeposits(); toast.success(t("admin.deposit_rejected")); } });
  const updateConfigMutation = trpc.store.adminSetConfig.useMutation({ onSuccess: () => { refetchConfig(); toast.success(t("common.saved")); } });
  const { data: products, refetch: refetchProducts } = trpc.products.list.useQuery({ page: 1, limit: 50 }, { enabled: section === "products" });
  const { data: orders, refetch: refetchOrders } = trpc.admin.orders.useQuery(undefined, { enabled: section === "orders" });
  const { data: cats, refetch: refetchCats } = trpc.categories.list.useQuery(undefined, { enabled: section === "categories" });
  const { data: lowStockThresholds = [], refetch: refetchThresholds } = trpc.admin.lowStockThresholds.useQuery(undefined, { enabled: section === "products" });
  const { data: bulkDiscounts = [], refetch: refetchBulkDiscounts } = trpc.admin.bulkDiscounts.useQuery(undefined, { enabled: section === "products" });

  const [thresholdForm, setThresholdForm] = useState<{ productId: number; threshold: number } | null>(null);
  const [bulkDiscountForm, setBulkDiscountForm] = useState<{ id?: number; categoryId: string; minQty: string; discountPct: string; label: string } | null>(null);
  const [stockEditForm, setStockEditForm] = useState<{ productId: number; stock: number } | null>(null);

  const createProductMutation = trpc.admin.createProduct.useMutation({ onSuccess: () => { refetchProducts(); setShowNewProduct(false); toast.success("Product created"); } });
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({ onSuccess: () => { refetchProducts(); toast.success("Product deleted"); } });
  const generateImageMutation = trpc.admin.generateProductImage.useMutation({ onSuccess: () => { refetchProducts(); toast.success("Image generated!"); } });
  const updateStockMutation = trpc.admin.updateProduct.useMutation({ onSuccess: () => { refetchProducts(); setStockEditForm(null); toast.success("Stock updated"); } });
  const updateOrderStatusMutation = trpc.admin.updateOrderStatus.useMutation({ onSuccess: () => refetchOrders() });
  const refreshRatesMutation = trpc.exchangeRates.refresh.useMutation({ onSuccess: () => toast.success("Rates refreshed!") });
  const setThresholdMutation = trpc.admin.setLowStockThreshold.useMutation({ onSuccess: () => { refetchThresholds(); setThresholdForm(null); toast.success("Threshold saved"); } });
  const upsertBulkDiscountMutation = trpc.admin.upsertBulkDiscount.useMutation({ onSuccess: () => { refetchBulkDiscounts(); setBulkDiscountForm(null); toast.success("Discount saved"); } });
  const deleteBulkDiscountMutation = trpc.admin.deleteBulkDiscount.useMutation({ onSuccess: () => { refetchBulkDiscounts(); toast.success("Discount deleted"); } });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen py-8 container text-center py-20">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  const navItems: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "categories", label: "Categories", icon: Package },
    { id: "rates", label: "Exchange Rates", icon: RefreshCw },
    { id: "stores", label: t("admin.stores"), icon: Store },
    { id: "deposits", label: t("admin.deposits"), icon: DollarSign },
    { id: "marketplace-config", label: t("admin.marketplace_config"), icon: Settings },
    { id: "payment-config", label: t("admin.payment_config"), icon: CreditCard },
    { id: "usdd-deposits", label: t("admin.usdd_deposits"), icon: DollarSign },
    { id: "usdd-withdrawals", label: t("admin.usdd_withdrawals"), icon: Banknote },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <h1 className="text-2xl font-serif font-semibold text-foreground mb-6">Admin Panel</h1>

        {/* Nav tabs */}
        <div className="flex gap-1 overflow-x-auto mb-6 border-b border-border/50 pb-0">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setLocation(`/admin/${id}`)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${section === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {section === "dashboard" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: stats?.totalOrders ?? 0, color: "text-blue-600" },
              { label: "Revenue (USDD)", value: Number(stats?.totalRevenue ?? 0).toFixed(2), color: "text-emerald-600" },
              { label: "Active Products", value: stats?.totalProducts ?? 0, color: "text-purple-600" },
              { label: "Pending Orders", value: stats?.pendingOrders ?? 0, color: "text-amber-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border/60 bg-card p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Products */}
        {section === "products" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{products?.total ?? 0} products</p>
              <Button size="sm" className="gap-1.5" onClick={() => setShowNewProduct(!showNewProduct)}>
                <Plus className="w-3.5 h-3.5" /> Add Product
              </Button>
            </div>

            {showNewProduct && (
              <div className="p-5 rounded-xl border border-border/60 bg-card space-y-3">
                <h3 className="text-sm font-semibold">New Product</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Slug *</Label><Input value={productForm.slug} onChange={e => setProductForm({...productForm, slug: e.target.value})} className="h-8 text-sm mt-1" placeholder="my-product" /></div>
                  <div><Label className="text-xs">Price (USDD) *</Label><Input value={productForm.priceUsdd} onChange={e => setProductForm({...productForm, priceUsdd: e.target.value})} className="h-8 text-sm mt-1" placeholder="9.99" /></div>
                </div>
                <div><Label className="text-xs">Name (English) *</Label><Input value={productForm.nameEn} onChange={e => setProductForm({...productForm, nameEn: e.target.value})} className="h-8 text-sm mt-1" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">Spanish</Label><Input value={productForm.nameEs} onChange={e => setProductForm({...productForm, nameEs: e.target.value})} className="h-8 text-sm mt-1" /></div>
                  <div><Label className="text-xs">Turkish</Label><Input value={productForm.nameTr} onChange={e => setProductForm({...productForm, nameTr: e.target.value})} className="h-8 text-sm mt-1" /></div>
                  <div><Label className="text-xs">Portuguese</Label><Input value={productForm.namePt} onChange={e => setProductForm({...productForm, namePt: e.target.value})} className="h-8 text-sm mt-1" /></div>
                </div>
                <div><Label className="text-xs">Description</Label><textarea value={productForm.descriptionEn} onChange={e => setProductForm({...productForm, descriptionEn: e.target.value})} rows={2} className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Stock</Label><Input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})} className="h-8 text-sm mt-1" /></div>
                  <div className="flex items-end gap-3 pb-0.5">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={productForm.isFeatured} onChange={e => setProductForm({...productForm, isFeatured: e.target.checked})} className="rounded" />
                      Featured
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => createProductMutation.mutate(productForm)} disabled={createProductMutation.isPending}>Create</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewProduct(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Stock</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Alert Threshold</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {products?.items.map(product => {
                    const threshold = lowStockThresholds.find(t => t.productId === product.id);
                    const isLow = threshold && product.stock <= threshold.threshold;
                    return (
                    <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-muted/40 overflow-hidden shrink-0">
                            {(product.images as string[])?.[0] ? (
                              <img src={(product.images as string[])[0]} alt="" className="w-full h-full object-cover" />
                            ) : product.aiGeneratedImageUrl ? (
                              <img src={product.aiGeneratedImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                            )}
                          </div>
                          <span className="text-foreground truncate max-w-48">{product.nameEn}</span>
                        </div>
                      </td>
                      <td className="p-3 text-primary font-medium">{Number(product.priceUsdd).toFixed(2)}</td>
                      <td className="p-3">
                        {stockEditForm?.productId === product.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={stockEditForm.stock}
                              onChange={e => setStockEditForm({ ...stockEditForm, stock: parseInt(e.target.value) || 0 })}
                              className="h-6 w-16 text-xs"
                              min={0}
                            />
                            <Button size="sm" className="h-6 text-xs px-2" onClick={() => updateStockMutation.mutate({ id: product.id, stock: stockEditForm.stock })} disabled={updateStockMutation.isPending}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-1" onClick={() => setStockEditForm(null)}>✕</Button>
                          </div>
                        ) : (
                          <button
                            className={`text-xs font-medium hover:underline underline-offset-2 ${isLow ? "text-red-600 font-bold" : "text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setStockEditForm({ productId: product.id, stock: product.stock })}
                            title="Click to edit stock"
                          >
                            {isLow && <AlertCircle className="w-3 h-3 inline mr-1" />}
                            {product.stock}
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        {thresholdForm?.productId === product.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={thresholdForm.threshold}
                              onChange={e => setThresholdForm({ ...thresholdForm, threshold: parseInt(e.target.value) || 0 })}
                              className="h-6 w-16 text-xs"
                            />
                            <Button size="sm" className="h-6 text-xs px-2" onClick={() => setThresholdMutation.mutate({ productId: product.id, threshold: thresholdForm.threshold })}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-1" onClick={() => setThresholdForm(null)}>✕</Button>
                          </div>
                        ) : (
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                            onClick={() => setThresholdForm({ productId: product.id, threshold: threshold?.threshold ?? 10 })}
                          >
                            {threshold ? `Alert at ${threshold.threshold}` : "Set alert"}
                          </button>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => generateImageMutation.mutate({ productId: product.id, productName: product.nameEn, description: product.descriptionEn || "" })}
                            disabled={generateImageMutation.isPending}
                            title="Generate AI image"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => { if (confirm("Delete this product?")) deleteProductMutation.mutate({ id: product.id }); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            {/* Bulk Discounts Management */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Bulk Purchase Discounts</h3>
                <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setBulkDiscountForm({ categoryId: "30001", minQty: "5", discountPct: "5", label: "" })}>
                  <Plus className="w-3 h-3" /> Add Tier
                </Button>
              </div>

              {bulkDiscountForm && (
                <div className="p-4 rounded-xl border border-border/60 bg-card mb-3 space-y-3">
                  <h4 className="text-xs font-semibold">New Discount Tier</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><Label className="text-xs">Category ID</Label><Input value={bulkDiscountForm.categoryId} onChange={e => setBulkDiscountForm({...bulkDiscountForm, categoryId: e.target.value})} className="h-8 text-sm mt-1" placeholder="30001" /></div>
                    <div><Label className="text-xs">Min Qty</Label><Input type="number" value={bulkDiscountForm.minQty} onChange={e => setBulkDiscountForm({...bulkDiscountForm, minQty: e.target.value})} className="h-8 text-sm mt-1" /></div>
                    <div><Label className="text-xs">Discount %</Label><Input type="number" value={bulkDiscountForm.discountPct} onChange={e => setBulkDiscountForm({...bulkDiscountForm, discountPct: e.target.value})} className="h-8 text-sm mt-1" /></div>
                    <div><Label className="text-xs">Label</Label><Input value={bulkDiscountForm.label} onChange={e => setBulkDiscountForm({...bulkDiscountForm, label: e.target.value})} className="h-8 text-sm mt-1" placeholder="Buy 5+: 5% off" /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => upsertBulkDiscountMutation.mutate({ id: bulkDiscountForm.id, categoryId: parseInt(bulkDiscountForm.categoryId) || null, minQty: parseInt(bulkDiscountForm.minQty) || 1, discountPct: bulkDiscountForm.discountPct, label: bulkDiscountForm.label })} disabled={upsertBulkDiscountMutation.isPending}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setBulkDiscountForm(null)}>Cancel</Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Scope</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Min Qty</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Discount</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Label</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {bulkDiscounts.map(d => (
                      <tr key={d.id} className="hover:bg-muted/20">
                        <td className="p-3 text-xs text-muted-foreground">
                          {d.categoryId ? `Category #${d.categoryId}` : d.productId ? `Product #${d.productId}` : "All"}
                        </td>
                        <td className="p-3 text-xs font-medium">{d.minQty}+</td>
                        <td className="p-3 text-xs font-semibold text-orange-600">{d.discountPct}%</td>
                        <td className="p-3 text-xs text-muted-foreground">{d.label || "—"}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setBulkDiscountForm({ id: d.id, categoryId: String(d.categoryId ?? ""), minQty: String(d.minQty), discountPct: String(d.discountPct), label: d.label ?? "" })}><Pencil className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => { if (confirm("Delete this discount tier?")) deleteBulkDiscountMutation.mutate({ id: d.id }); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bulkDiscounts.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-xs text-muted-foreground">No bulk discount tiers configured</td></tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {section === "orders" && (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {orders?.map(order => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-foreground">#{order.orderNumber}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-primary font-medium">{Number(order.totalUsdd).toFixed(2)} USDD</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${STATUS_COLORS[order.status] || "text-muted-foreground"}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {order.status === "paid" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "shipped" })}>
                            Mark Shipped
                          </Button>
                        )}
                        {order.status === "shipped" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: "completed" })}>
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Exchange Rates */}
        {section === "rates" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Live exchange rates for USDD</p>
              <Button size="sm" className="gap-1.5" onClick={() => refreshRatesMutation.mutate()} disabled={refreshRatesMutation.isPending}>
                <RefreshCw className={`w-3.5 h-3.5 ${refreshRatesMutation.isPending ? "animate-spin" : ""}`} />
                Refresh Rates
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Rates are fetched from exchangerate-api.com and stored in the database.</p>
          </div>
        )}

        {/* Store Management */}
        {section === "stores" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">{t("admin.pending_stores")}</h2>
              {pendingStores?.stores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t("admin.no_pending_stores")}</p>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.store")}</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.seller")}</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.applied_at")}</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t("admin.actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {pendingStores?.stores.map((store: any) => (
                        <tr key={store.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{store.name}</p>
                              <p className="text-xs text-muted-foreground">{store.description?.slice(0, 60)}</p>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">{store.ownerName ?? store.ownerId}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(store.createdAt).toLocaleDateString()}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => approveStoreMutation.mutate({ id: store.id })} disabled={approveStoreMutation.isPending}>
                                <CheckCircle className="w-3 h-3" /> {t("admin.approve")}
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => { const note = prompt(t("admin.reject_reason")); trpc.useUtils().store.adminListStores.invalidate(); rejectStoreMutation.mutate({ id: store.id, adminNote: note ?? "" }); }} disabled={approveStoreMutation.isPending}>
                                <XCircle className="w-3 h-3" /> {t("admin.reject")}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3">{t("admin.all_stores")}</h2>
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[450px]">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.store")}</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.status")}</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.product_count")}</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t("admin.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {allStores?.stores.map((store: any) => (
                      <tr key={store.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{store.name}</td>
                        <td className="p-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            store.status === "active" ? "bg-green-100 text-green-700" :
                            store.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>{store.status}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">{store.productCount ?? 0}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            {store.status === "active" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => suspendStoreMutation.mutate({ id: store.id, adminNote: prompt(t("admin.suspend_reason")) ?? "" })} disabled={suspendStoreMutation.isPending}>
                                {t("admin.suspend")}
                              </Button>
                            )}
                            {store.status === "suspended" && (
                              <Button size="sm" className="h-7 text-xs" onClick={() => reinstateStoreMutation.mutate({ id: store.id })} disabled={reinstateStoreMutation.isPending}>
                                {t("admin.reinstate")}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposits */}
        {section === "deposits" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("admin.deposit_management")}</h2>
            {pendingDeposits?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{t("admin.no_pending_deposits")}</p>
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[550px]">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.store")}</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.amount")}</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.tx_hash")}</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("admin.status")}</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t("admin.actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {pendingDeposits?.map((dep: any) => (
                      <tr key={dep.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{dep.storeName ?? dep.storeId}</td>
                        <td className="p-3 text-primary font-medium">{dep.amountUsdd} USDD</td>
                        <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-32">{dep.paymentTxHash ?? "-"}</td>
                        <td className="p-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            dep.status === "confirmed" ? "bg-green-100 text-green-700" :
                            dep.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>{dep.status}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            {dep.status === "pending" && (
                              <>
                                <Button size="sm" className="h-7 text-xs" onClick={() => confirmDepositMutation.mutate({ id: dep.deposit.id })} disabled={confirmDepositMutation.isPending}>
                                  {t("admin.confirm_payment")}
                                </Button>
                                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => refundDepositMutation.mutate({ id: dep.deposit.id })} disabled={refundDepositMutation.isPending}>
                                  {t("admin.reject")}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Marketplace Config */}
        {section === "marketplace-config" && (
          <div className="max-w-md space-y-6">
            <h2 className="text-lg font-semibold">{t("admin.marketplace_config")}</h2>
            <div className="space-y-4 p-5 rounded-xl border border-border/60 bg-card">
              <div>
                <Label className="text-xs">{t("admin.commission_rate")} ({marketplaceConfig ? (marketplaceConfig.commissionRate * 100).toFixed(1) : "-"}%)</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  placeholder="e.g. 0.05 = 5%"
                  value={configForm.commissionRate}
                  onChange={e => setConfigForm({ ...configForm, commissionRate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">{t("admin.deposit_amount")} ({marketplaceConfig?.depositAmount ?? "-"} USDD)</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  placeholder="e.g. 50"
                  value={configForm.depositAmount}
                  onChange={e => setConfigForm({ ...configForm, depositAmount: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">{t("admin.wallet_address")} (USDD TRC-20)</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  placeholder="TRC-20 address"
                  value={configForm.depositWalletAddress}
                  onChange={e => setConfigForm({ ...configForm, depositWalletAddress: e.target.value })}
                />
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  if (configForm.commissionRate) await updateConfigMutation.mutateAsync({ key: "commission_rate", value: configForm.commissionRate });
                  if (configForm.depositAmount) await updateConfigMutation.mutateAsync({ key: "deposit_amount", value: configForm.depositAmount });
                  if (configForm.depositWalletAddress) await updateConfigMutation.mutateAsync({ key: "deposit_wallet_address", value: configForm.depositWalletAddress });
                  if (!configForm.commissionRate && !configForm.depositAmount && !configForm.depositWalletAddress) toast.info(t("admin.enter_config"));
                }}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        )}
        {/* Payment Config */}
        {section === "payment-config" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-lg font-semibold">{t("admin.payment_config")}</h2>
            <p className="text-sm text-muted-foreground">{t("admin.payment_config_desc")}</p>

            {/* Existing methods */}
            {paymentMethods && paymentMethods.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t("admin.configured_methods")}</h3>
                {paymentMethods.map((m: any) => (
                  <div key={m.method} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                        m.method === "alipay" ? "bg-blue-500" : m.method === "wechat" ? "bg-green-500" : m.method === "unionpay" ? "bg-red-500" : "bg-gray-500"
                      }`}>
                        {m.method === "alipay" || m.method === "wechat" ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{m.method === "alipay" ? "Alipay" : m.method === "wechat" ? "WeChat Pay" : m.method === "unionpay" ? "UnionPay" : m.method}</div>
                        <div className="text-xs text-muted-foreground">{m.accountName} · {m.accountNumber}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {m.isActive ? t("common.active") : t("common.inactive")}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => deletePaymentMethodMutation.mutate({ method: m.method, accountName: m.accountName, accountNumber: m.accountNumber, isEnabled: false })}>
                        {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit method */}
            <div className="p-5 rounded-xl border border-border/60 bg-card space-y-4">
              <h3 className="text-sm font-medium">{t("admin.add_payment_method")}</h3>
              <div>
                <Label className="text-xs">{t("admin.payment_method")}</Label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full mt-1 h-8 text-sm rounded-md border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="alipay">Alipay</option>
                  <option value="wechat">WeChat Pay</option>
                  <option value="unionpay">UnionPay</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">{t("admin.account_name")}</Label>
                <Input className="h-8 text-sm mt-1" placeholder="e.g. John / Daiizen" value={paymentForm.accountName} onChange={e => setPaymentForm({ ...paymentForm, accountName: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">{t("admin.account_number")}</Label>
                <Input className="h-8 text-sm mt-1" placeholder="Phone / account number" value={paymentForm.accountNumber} onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">{t("admin.qr_code_url")}</Label>
                <Input className="h-8 text-sm mt-1" placeholder="QR code image URL (optional)" value={paymentForm.qrCodeUrl} onChange={e => setPaymentForm({ ...paymentForm, qrCodeUrl: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={paymentForm.isEnabled} onChange={e => setPaymentForm({ ...paymentForm, isEnabled: e.target.checked })} className="rounded" />
                <Label className="text-xs cursor-pointer">{t("admin.enable_method")}</Label>
              </div>
              <Button
                size="sm"
                onClick={() => setPaymentMethodMutation.mutate({ method: paymentForm.method as any, accountName: paymentForm.accountName, accountNumber: paymentForm.accountNumber, qrCodeUrl: paymentForm.qrCodeUrl || undefined, isEnabled: paymentForm.isEnabled })}
                disabled={setPaymentMethodMutation.isPending || !paymentForm.accountName || !paymentForm.accountNumber}
              >
                {setPaymentMethodMutation.isPending ? t("common.saving") : t("admin.save_payment_method")}
              </Button>
            </div>
          </div>
        )}
        {/* USDD Deposit Review */}
        {section === "usdd-deposits" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("admin.usdd_deposits")}</h2>
            <p className="text-sm text-muted-foreground">{t("admin.usdd_deposits_desc")}</p>
            {!pendingUsddDeposits || pendingUsddDeposits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-2">✅</div>
                <p>{t("admin.no_pending_usdd_deposits")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsddDeposits.map((tx: any) => (
                  <div key={tx.id} className="p-4 border rounded-xl bg-card space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-lg">{parseFloat(tx.amountUsdd).toFixed(2)} USDD</div>
                        <div className="text-sm text-muted-foreground">User ID: {tx.userId}</div>
                        <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                        {tx.txHash && <div className="text-xs font-mono text-blue-500 mt-1">TxHash: {tx.txHash}</div>}
                        {tx.note && <div className="text-xs text-muted-foreground mt-1">Note: {tx.note}</div>}
                      </div>
                      {tx.depositScreenshotUrl && (
                        <a href={tx.depositScreenshotUrl} target="_blank" rel="noopener noreferrer">
                          <img src={tx.depositScreenshotUrl} alt="screenshot" className="w-16 h-16 object-cover rounded border" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => confirmUsddDepositMutation.mutate({ txId: tx.id })} disabled={confirmUsddDepositMutation.isPending}>
                        ✓ {t("admin.confirm_deposit")}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectUsddDepositMutation.mutate({ txId: tx.id, adminNote: "rejected" })} disabled={rejectUsddDepositMutation.isPending}>
                        ✗ {t("admin.reject")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USDD Withdrawal Management */}
        {section === "usdd-withdrawals" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t("admin.usdd_withdrawals")}</h2>
            {!allWithdrawals || allWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-2">📋</div>
                <p>{t("admin.no_withdrawals")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allWithdrawals.map((req: any) => (
                  <div key={req.id} className="p-4 border rounded-xl bg-card space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-lg">{parseFloat(req.amountUsdd).toFixed(2)} USDD</div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">{req.walletAddress}</div>
                        <div className="text-xs text-muted-foreground">Store ID: {req.storeId} | {new Date(req.createdAt).toLocaleString()}</div>
                        {req.txHash && <div className="text-xs font-mono text-green-600 mt-1">TxHash: {req.txHash}</div>}
                        {req.rejectionReason && <div className="text-xs text-red-500 mt-1">{t("admin.rejection_reason")}: {req.rejectionReason}</div>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        req.status === "paid" ? "bg-green-100 text-green-700" :
                        req.status === "approved" ? "bg-blue-100 text-blue-700" :
                        req.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>{req.status}</span>
                    </div>
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveWithdrawalMutation.mutate({ id: req.id })} disabled={approveWithdrawalMutation.isPending}>
                          ✓ {t("admin.approve")}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectWithdrawalMutation.mutate({ id: req.id, rejectionReason: "Rejected by admin" })} disabled={rejectWithdrawalMutation.isPending}>
                          ✗ {t("admin.reject")}
                        </Button>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <div className="flex gap-2 items-center">
                        {markPaidForm !== null && markPaidForm.id === req.id ? (
                          <>
                            <Input
                              className="h-8 text-xs max-w-xs"
                              placeholder="Enter TRC-20 TxHash"
                              value={markPaidForm.txHash}
                              onChange={e => setMarkPaidForm(prev => prev ? { ...prev, txHash: e.target.value } : prev)}
                            />
                            <Button size="sm" onClick={() => { if (markPaidForm) markPaidMutation.mutate({ id: markPaidForm.id, txHash: markPaidForm.txHash }); }} disabled={!markPaidForm.txHash || markPaidMutation.isPending}>
                              {t("admin.confirm_payment")}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setMarkPaidForm(null)}>{t("common.cancel")}</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setMarkPaidForm({ id: req.id, txHash: "" })}>
                            💸 {t("admin.mark_paid")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
