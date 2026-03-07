import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useSearch } from "wouter";
import { useState } from "react";
import { Search, Package, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Products() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [search, setSearch] = useState(params.get("q") || "");
  const [categorySlug, setCategorySlug] = useState(params.get("category") || "");
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.products.list.useQuery({ search, categorySlug, sort, page, limit: 20 });
  const { data: cats } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
      utils.cart.count.invalidate();
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const getLocalizedName = (item: Record<string, unknown>) => {
    const key = `name${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return (item[key] as string) || (item.nameEn as string);
  };

  const handleAddToCart = (productId: number) => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <h1 className="text-2xl font-serif font-semibold text-foreground mb-6">{t("products.title")}</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t("products.search")}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "price_asc" | "price_desc")}
            className="h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground"
          >
            <option value="newest">{t("products.sort.newest")}</option>
            <option value="price_asc">{t("products.sort.price_asc")}</option>
            <option value="price_desc">{t("products.sort.price_desc")}</option>
          </select>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <button
            onClick={() => { setCategorySlug(""); setPage(1); }}
            className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${!categorySlug ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
          >
            {t("products.all")}
          </button>
          {cats?.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => { setCategorySlug(cat.slug); setPage(1); }}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-full border transition-colors ${categorySlug === cat.slug ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground"}`}
            >
              {getLocalizedName(cat as Record<string, unknown>)}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm">{t("products.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {data?.items.map((product) => (
              <div key={product.id} className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                <Link href={`/products/${product.slug}`}>
                  <div className="aspect-square bg-muted/40 overflow-hidden cursor-pointer">
                    {(product.images as string[])?.[0] ? (
                      <img src={(product.images as string[])[0]} alt={product.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : product.aiGeneratedImageUrl ? (
                      <img src={product.aiGeneratedImageUrl} alt={product.nameEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/products/${product.slug}`}>
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-2 hover:text-primary transition-colors cursor-pointer">
                      {getLocalizedName(product as Record<string, unknown>)}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-primary">{Number(product.priceUsdd).toFixed(2)} USDD</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock === 0 || addToCartMutation.isPending}
                    >
                      <ShoppingCart className="w-3 h-3" />
                    </Button>
                  </div>
                  {product.stock === 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">{t("products.out_stock")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
