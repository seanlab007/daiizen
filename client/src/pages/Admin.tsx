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
  const { t } = useLanguage();
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
  const confirmUsddDepositMutation = trpc.wallet.adminConfirmDeposit.useMutation({ onSuccess: () => { refetchUsddDeposits(); toast.success("充值已确认，余额已更新"); } });
  const rejectUsddDepositMutation = trpc.wallet.adminRejectDeposit.useMutation({ onSuccess: () => { refetchUsddDeposits(); toast.success("充值已拒绝"); } });
  const approveWithdrawalMutation = trpc.withdrawal.adminApprove.useMutation({ onSuccess: () => { refetchWithdrawals(); toast.success("提现已批准"); } });
  const rejectWithdrawalMutation = trpc.withdrawal.adminReject.useMutation({ onSuccess: () => { refetchWithdrawals(); toast.success("提现已拒绝，余额已退回"); } });
  const [markPaidForm, setMarkPaidForm] = useState<{ id: number; txHash: string } | null>(null);
  const markPaidMutation = trpc.withdrawal.adminMarkPaid.useMutation({ onSuccess: () => { refetchWithdrawals(); setMarkPaidForm(null); toast.success("已标记为已支付"); } });
  const { data: marketplaceConfig, refetch: refetchConfig } = trpc.store.getConfig.useQuery(undefined, { enabled: section === "marketplace-config" && isAuthenticated && user?.role === "admin" });
  const [configForm, setConfigForm] = useState({ commissionRate: "", depositAmount: "", depositWalletAddress: "" });
  const [paymentForm, setPaymentForm] = useState({ method: "alipay", accountName: "", accountNumber: "", qrCodeUrl: "", isEnabled: true });
  const { data: paymentMethods, refetch: refetchPaymentMethods } = trpc.payment.adminGetPaymentConfigs.useQuery(undefined, { enabled: section === "payment-config" && isAuthenticated && user?.role === "admin" });
  const setPaymentMethodMutation = trpc.payment.adminUpdatePaymentConfig.useMutation({ onSuccess: () => { refetchPaymentMethods(); toast.success("收款方式已更新"); setPaymentForm({ method: "alipay", accountName: "", accountNumber: "", qrCodeUrl: "", isEnabled: true }); } });
  const deletePaymentMethodMutation = trpc.payment.adminUpdatePaymentConfig.useMutation({ onSuccess: () => { refetchPaymentMethods(); toast.success("已删除"); } });
  const approveStoreMutation = trpc.store.adminApproveStore.useMutation({ onSuccess: () => { refetchStores(); toast.success("店铺已通过"); } });
  const rejectStoreMutation = trpc.store.adminRejectStore.useMutation({ onSuccess: () => { refetchStores(); toast.success("店铺已拒绝"); } });
  const suspendStoreMutation = trpc.store.adminSuspendStore.useMutation({ onSuccess: () => { refetchStores(); toast.success("店铺已暂停"); } });
  const reinstateStoreMutation = trpc.store.adminReinstateStore.useMutation({ onSuccess: () => { refetchStores(); toast.success("店铺已恢复"); } });
  const confirmDepositMutation = trpc.store.adminConfirmDeposit.useMutation({ onSuccess: () => { refetchDeposits(); toast.success("保证金已确认"); } });
  const refundDepositMutation = trpc.store.adminRefundDeposit.useMutation({ onSuccess: () => { refetchDeposits(); toast.success("已拒绝保证金"); } });
  const updateConfigMutation = trpc.store.adminSetConfig.useMutation({ onSuccess: () => { refetchConfig(); toast.success("配置已更新"); } });
  const { data: products, refetch: refetchProducts } = trpc.products.list.useQuery({ page: 1, limit: 50 }, { enabled: section === "products" });
  const { data: orders, refetch: refetchOrders } = trpc.admin.orders.useQuery(undefined, { enabled: section === "orders" });
  const { data: cats, refetch: refetchCats } = trpc.categories.list.useQuery(undefined, { enabled: section === "categories" });

  const createProductMutation = trpc.admin.createProduct.useMutation({ onSuccess: () => { refetchProducts(); setShowNewProduct(false); toast.success("Product created"); } });
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({ onSuccess: () => { refetchProducts(); toast.success("Product deleted"); } });
  const generateImageMutation = trpc.admin.generateProductImage.useMutation({ onSuccess: () => { refetchProducts(); toast.success("Image generated!"); } });
  const updateOrderStatusMutation = trpc.admin.updateOrderStatus.useMutation({ onSuccess: () => refetchOrders() });
  const refreshRatesMutation = trpc.exchangeRates.refresh.useMutation({ onSuccess: () => toast.success("Rates refreshed!") });

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
    { id: "stores", label: "店铺管理", icon: Store },
    { id: "deposits", label: "保证金", icon: DollarSign },
    { id: "marketplace-config", label: "市场配置", icon: Settings },
    { id: "payment-config", label: "收款配置", icon: CreditCard },
    { id: "usdd-deposits", label: "USDD充值审核", icon: DollarSign },
    { id: "usdd-withdrawals", label: "卖家提现", icon: Banknote },
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
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Stock</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {products?.items.map(product => (
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
                      <td className="p-3 text-muted-foreground">{product.stock}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders */}
        {section === "orders" && (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
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
              <h2 className="text-lg font-semibold mb-3">待审核店铺</h2>
              {pendingStores?.stores.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">暂无待审核店铺</p>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">店铺</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">卖家</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">申请时间</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">操作</th>
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
                                <CheckCircle className="w-3 h-3" /> 通过
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => { const note = prompt("拒绝原因（可选）"); trpc.useUtils().store.adminListStores.invalidate(); rejectStoreMutation.mutate({ id: store.id, adminNote: note ?? "" }); }} disabled={approveStoreMutation.isPending}>
                                <XCircle className="w-3 h-3" /> 拒绝
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-3">全部店铺</h2>
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">店铺</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">商品数</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">操作</th>
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
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => suspendStoreMutation.mutate({ id: store.id, adminNote: prompt("暂停原因") ?? "" })} disabled={suspendStoreMutation.isPending}>
                                暂停
                              </Button>
                            )}
                            {store.status === "suspended" && (
                              <Button size="sm" className="h-7 text-xs" onClick={() => reinstateStoreMutation.mutate({ id: store.id })} disabled={reinstateStoreMutation.isPending}>
                                恢复
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
        )}

        {/* Deposits */}
        {section === "deposits" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">保证金管理</h2>
            {pendingDeposits?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">暂无待确认保证金</p>
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">店铺</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">金额</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">交易哈希</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">操作</th>
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
                                  确认收款
                                </Button>
                                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => refundDepositMutation.mutate({ id: dep.deposit.id })} disabled={refundDepositMutation.isPending}>
                                  拒绝
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
            )}
          </div>
        )}

        {/* Marketplace Config */}
        {section === "marketplace-config" && (
          <div className="max-w-md space-y-6">
            <h2 className="text-lg font-semibold">市场平台配置</h2>
            <div className="space-y-4 p-5 rounded-xl border border-border/60 bg-card">
              <div>
                <Label className="text-xs">平台手续费率（当前：{marketplaceConfig ? (marketplaceConfig.commissionRate * 100).toFixed(1) : "-"}%）</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  placeholder="如 0.05 表示 5%"
                  value={configForm.commissionRate}
                  onChange={e => setConfigForm({ ...configForm, commissionRate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">开店保证金（USDD）（当前：{marketplaceConfig?.depositAmount ?? "-"}）</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  placeholder="如 50"
                  value={configForm.depositAmount}
                  onChange={e => setConfigForm({ ...configForm, depositAmount: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">收款钱包地址（USDD TRC-20）</Label>
                <Input
                  className="h-8 text-sm mt-1"
                  placeholder="TRC-20 地址"
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
                  if (!configForm.commissionRate && !configForm.depositAmount && !configForm.depositWalletAddress) toast.info("请输入要修改的配置项");
                }}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending ? "保存中..." : "保存配置"}
              </Button>
            </div>
          </div>
        )}
        {/* Payment Config */}
        {section === "payment-config" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-lg font-semibold">收款方式配置</h2>
            <p className="text-sm text-muted-foreground">配置支付宝、微信、銀联收款账户，卖家缴交保证金时将看到这些账户信息</p>

            {/* Existing methods */}
            {paymentMethods && paymentMethods.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">已配置收款方式</h3>
                {paymentMethods.map((m: any) => (
                  <div key={m.method} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                        m.method === "alipay" ? "bg-blue-500" : m.method === "wechat" ? "bg-green-500" : m.method === "unionpay" ? "bg-red-500" : "bg-gray-500"
                      }`}>
                        {m.method === "alipay" || m.method === "wechat" ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{m.method === "alipay" ? "支付宝" : m.method === "wechat" ? "微信支付" : m.method === "unionpay" ? "銀联转账" : m.method}</div>
                        <div className="text-xs text-muted-foreground">{m.accountName} · {m.accountNumber}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {m.isActive ? "启用" : "关闭"}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => deletePaymentMethodMutation.mutate({ method: m.method, accountName: m.accountName, accountNumber: m.accountNumber, isEnabled: false })}>
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit method */}
            <div className="p-5 rounded-xl border border-border/60 bg-card space-y-4">
              <h3 className="text-sm font-medium">添加/更新收款方式</h3>
              <div>
                <Label className="text-xs">支付方式</Label>
                <select
                  value={paymentForm.method}
                  onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full mt-1 h-8 text-sm rounded-md border border-input bg-background px-3 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="alipay">支付宝</option>
                  <option value="wechat">微信支付</option>
                  <option value="unionpay">銀联转账</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">收款人姓名 / 商户名</Label>
                <Input className="h-8 text-sm mt-1" placeholder="如：张三 / Daiizen商贸" value={paymentForm.accountName} onChange={e => setPaymentForm({ ...paymentForm, accountName: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">手机号 / 账号</Label>
                <Input className="h-8 text-sm mt-1" placeholder="支付宝手机号或銀行卡号" value={paymentForm.accountNumber} onChange={e => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">收款二维码 URL（可选）</Label>
                <Input className="h-8 text-sm mt-1" placeholder="二维码图片的直链 URL" value={paymentForm.qrCodeUrl} onChange={e => setPaymentForm({ ...paymentForm, qrCodeUrl: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={paymentForm.isEnabled} onChange={e => setPaymentForm({ ...paymentForm, isEnabled: e.target.checked })} className="rounded" />
                <Label className="text-xs cursor-pointer">启用此收款方式</Label>
              </div>
              <Button
                size="sm"
                onClick={() => setPaymentMethodMutation.mutate({ method: paymentForm.method as any, accountName: paymentForm.accountName, accountNumber: paymentForm.accountNumber, qrCodeUrl: paymentForm.qrCodeUrl || undefined, isEnabled: paymentForm.isEnabled })}
                disabled={setPaymentMethodMutation.isPending || !paymentForm.accountName || !paymentForm.accountNumber}
              >
                {setPaymentMethodMutation.isPending ? "保存中..." : "保存收款方式"}
              </Button>
            </div>
          </div>
        )}
        {/* USDD Deposit Review */}
        {section === "usdd-deposits" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">USDD 充值审核</h2>
            <p className="text-sm text-muted-foreground">用户提交充值申请后需要管理员手动确认，确认后余额自动更新。</p>
            {!pendingUsddDeposits || pendingUsddDeposits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-2">✅</div>
                <p>暂无待审核充值申请</p>
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
                        ✓ 确认充值
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectUsddDepositMutation.mutate({ txId: tx.id, adminNote: "拒绝" })} disabled={rejectUsddDepositMutation.isPending}>
                        ✗ 拒绝
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
            <h2 className="text-lg font-semibold">卖家提现管理</h2>
            {!allWithdrawals || allWithdrawals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="text-4xl mb-2">📋</div>
                <p>暂无提现申请</p>
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
                        {req.rejectionReason && <div className="text-xs text-red-500 mt-1">拒绝原因: {req.rejectionReason}</div>}
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
                          ✓ 批准
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectWithdrawalMutation.mutate({ id: req.id, rejectionReason: "管理员拒绝" })} disabled={rejectWithdrawalMutation.isPending}>
                          ✗ 拒绝
                        </Button>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <div className="flex gap-2 items-center">
                        {markPaidForm !== null && markPaidForm.id === req.id ? (
                          <>
                            <Input
                              className="h-8 text-xs max-w-xs"
                              placeholder="输入 TRC-20 TxHash"
                              value={markPaidForm.txHash}
                              onChange={e => setMarkPaidForm(prev => prev ? { ...prev, txHash: e.target.value } : prev)}
                            />
                            <Button size="sm" onClick={() => { if (markPaidForm) markPaidMutation.mutate({ id: markPaidForm.id, txHash: markPaidForm.txHash }); }} disabled={!markPaidForm.txHash || markPaidMutation.isPending}>
                              确认支付
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setMarkPaidForm(null)}>取消</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setMarkPaidForm({ id: req.id, txHash: "" })}>
                            💸 标记已支付
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
