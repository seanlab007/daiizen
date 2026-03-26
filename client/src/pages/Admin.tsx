import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Package, ShoppingBag, BarChart3, Plus, Pencil, Trash2, Sparkles, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

type Section = "dashboard" | "products" | "orders" | "categories" | "rates";

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
      </div>
    </div>
  );
}
