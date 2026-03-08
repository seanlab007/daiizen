import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Store, Package } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PLATFORM_LABELS_KEY: Record<string, string> = {
  tiktok: "TikTok",
  pinduoduo: "marketplace.platform.pinduoduo",
  xiaohongshu: "marketplace.platform.xiaohongshu",
  amazon: "Amazon",
  shein: "SHEIN",
  taobao: "marketplace.platform.taobao",
  jd: "marketplace.platform.jd",
  lazada: "Lazada",
  shopee: "Shopee",
  other: "marketplace.platform.other",
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

function StoreCard({ store }: { store: any }) {
  return (
    <Link href={`/store/${store.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        {store.bannerUrl ? (
          <div className="h-24 overflow-hidden rounded-t-lg">
            <img src={store.bannerUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg flex items-center justify-center">
            <Store className="w-8 h-8 text-primary/30" />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{store.name}</p>
              {store.country && <p className="text-xs text-muted-foreground">{store.country}</p>}
            </div>
          </div>
          {store.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{store.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function MarketplaceProductCard({ item, t }: { item: { product: any; store: any }; t: (k: string) => string }) {
  const { product, store } = item;
  const platformKey = PLATFORM_LABELS_KEY[product.externalPlatform];
  const platformLabel = platformKey
    ? (platformKey.startsWith("marketplace.") ? t(platformKey) : platformKey)
    : product.externalPlatform;

  return (
    <Link href={`/store/${store.slug}/product/${product.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
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
              {platformLabel}
            </span>
          )}
        </div>
        <CardContent className="p-3 space-y-1.5">
          <p className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
          <div className="flex items-center justify-between">
            <span className="text-primary font-bold">{parseFloat(product.priceUsdd).toFixed(2)} USDD</span>
            {product.originalPriceUsdd && parseFloat(product.originalPriceUsdd) > parseFloat(product.priceUsdd) && (
              <span className="text-xs text-muted-foreground line-through">
                {parseFloat(product.originalPriceUsdd).toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-muted overflow-hidden flex-shrink-0">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-3 h-3 m-0.5 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate">{store.name}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Marketplace() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"products" | "stores">("products");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState<string>("");

  const products = trpc.store.marketplace.useQuery({
    search: debouncedSearch || undefined,
    platform: platformFilter || undefined,
    page,
    limit: 20,
  });

  const stores = trpc.store.listStores.useQuery({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setTimeout(() => setDebouncedSearch(value), 400);
  };

  const platforms = [
    { value: "", label: t("marketplace.platform.all") },
    { value: "tiktok", label: "TikTok" },
    { value: "pinduoduo", label: t("marketplace.platform.pinduoduo") },
    { value: "xiaohongshu", label: t("marketplace.platform.xiaohongshu") },
    { value: "amazon", label: "Amazon" },
    { value: "shein", label: "SHEIN" },
    { value: "taobao", label: t("marketplace.platform.taobao") },
    { value: "jd", label: t("marketplace.platform.jd") },
  ];

  const totalPages = Math.ceil((products.data?.total ?? 0) / 20);

  return (
    <div className="container py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{t("marketplace.title")}</h1>
        <p className="text-muted-foreground">{t("marketplace.subtitle")}</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("marketplace.search")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            {t("marketplace.products")}
            {products.data && <Badge variant="secondary" className="ml-1">{products.data.total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="stores" className="gap-2">
            <Store className="w-4 h-4" />
            {t("marketplace.stores")}
            {stores.data && <Badge variant="secondary" className="ml-1">{stores.data.total}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {platforms.map((p) => (
              <Button
                key={p.value}
                variant={platformFilter === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => { setPlatformFilter(p.value); setPage(1); }}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {products.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.data?.products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("marketplace.no_products")}</p>
              {search && <p className="text-sm mt-1">{t("marketplace.try_other")}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.data?.products.map((item) => (
                <MarketplaceProductCard key={item.product.id} item={item} t={t} />
              ))}
            </div>
          )}

          {(products.data?.total ?? 0) > 20 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("marketplace.prev")}</Button>
              <span className="text-sm text-muted-foreground self-center">
                {t("marketplace.page_of").replace("{page}", String(page)).replace("{total}", String(totalPages))}
              </span>
              <Button variant="outline" size="sm" disabled={page * 20 >= (products.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>{t("marketplace.next")}</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stores" className="mt-4">
          {stores.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stores.data?.stores.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("marketplace.no_stores")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.data?.stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}

          {(stores.data?.total ?? 0) > 20 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("marketplace.prev")}</Button>
              <span className="text-sm text-muted-foreground self-center">{t("marketplace.page_of").replace("{page}", String(page)).replace("{total}", String(Math.ceil((stores.data?.total ?? 0) / 20)))}</span>
              <Button variant="outline" size="sm" disabled={page * 20 >= (stores.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>{t("marketplace.next")}</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="border rounded-xl p-6 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-semibold text-lg">{t("marketplace.open_store_cta")}</h3>
          <p className="text-muted-foreground text-sm">{t("marketplace.open_store_desc")}</p>
        </div>
        <Button asChild>
          <Link href="/seller">{t("marketplace.open_store_btn")}</Link>
        </Button>
      </div>
    </div>
  );
}
