import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Store, Package, MapPin, Mail, Phone, Search, ArrowLeft, ExternalLink } from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok", pinduoduo: "拼多多", xiaohongshu: "小红书",
  amazon: "Amazon", shein: "SHEIN", taobao: "淘宝", jd: "京东",
  lazada: "Lazada", shopee: "Shopee", other: "其他",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white", pinduoduo: "bg-orange-500 text-white",
  xiaohongshu: "bg-red-500 text-white", amazon: "bg-yellow-500 text-black",
  shein: "bg-pink-500 text-white", taobao: "bg-orange-600 text-white",
  jd: "bg-red-600 text-white", lazada: "bg-blue-600 text-white",
  shopee: "bg-orange-400 text-white", other: "bg-gray-500 text-white",
};

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const store = trpc.store.getStore.useQuery({ slug: slug! }, { enabled: !!slug });
  const products = trpc.store.getStoreProducts.useQuery(
    { storeSlug: slug!, search: search || undefined, page, limit: 20 },
    { enabled: !!slug && !!store.data }
  );

  if (store.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (store.error || !store.data) {
    return (
      <div className="container py-16 text-center space-y-4">
        <Store className="w-12 h-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">店铺不存在</h2>
        <Button variant="outline" asChild><Link href="/marketplace">返回商城</Link></Button>
      </div>
    );
  }

  const storeData = store.data;

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-40 md:h-56 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        {storeData.bannerUrl && (
          <img src={storeData.bannerUrl} alt={storeData.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 container pb-4">
          <Button variant="ghost" size="sm" className="mb-2 text-white/80 hover:text-white" asChild>
            <Link href="/marketplace">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回商城
            </Link>
          </Button>
        </div>
      </div>

      {/* Store Info */}
      <div className="container">
        <div className="flex items-end gap-4 -mt-8 mb-6 relative z-10">
          <div className="w-16 h-16 rounded-xl bg-background border-2 border-background shadow-lg flex items-center justify-center overflow-hidden">
            {storeData.logoUrl ? (
              <img src={storeData.logoUrl} alt={storeData.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="pb-1">
            <h1 className="text-xl font-bold">{storeData.name}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {storeData.country && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{storeData.country}</span>
              )}
              {storeData.contactEmail && (
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{storeData.contactEmail}</span>
              )}
            </div>
          </div>
        </div>

        {storeData.description && (
          <p className="text-muted-foreground text-sm mb-6 max-w-2xl">{storeData.description}</p>
        )}

        {/* Products */}
        <div className="space-y-4 pb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold text-lg">
              全部商品
              {products.data && <span className="text-muted-foreground font-normal text-sm ml-2">({products.data.total})</span>}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 w-48"
                placeholder="搜索商品..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {products.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.data?.products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>该店铺暂无商品</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.data?.products.map((product) => (
                <Link key={product.id} href={`/store/${slug}/product/${product.slug}`}>
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
                          {PLATFORM_LABELS[product.externalPlatform] ?? product.externalPlatform}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <p className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">{parseFloat(product.priceUsdd).toFixed(2)} USDD</span>
                        {product.originalPriceUsdd && parseFloat(product.originalPriceUsdd) > parseFloat(product.priceUsdd) && (
                          <span className="text-xs text-muted-foreground line-through">
                            {parseFloat(product.originalPriceUsdd).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {(products.data?.total ?? 0) > 20 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
              <span className="text-sm text-muted-foreground self-center">第 {page} 页</span>
              <Button variant="outline" size="sm" disabled={page * 20 >= (products.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}>下一页</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
