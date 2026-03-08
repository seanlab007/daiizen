import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Store, Package, ExternalLink, ShoppingCart, Tag } from "lucide-react";
import { toast } from "sonner";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok", pinduoduo: "拼多多", xiaohongshu: "小红书",
  amazon: "Amazon", shein: "SHEIN", taobao: "淘宝", jd: "京东",
  lazada: "Lazada", shopee: "Shopee", other: "其他",
};

export default function StoreProductDetail() {
  const { slug: storeSlug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data, isLoading, error } = trpc.store.getStoreProduct.useQuery(
    { slug: productSlug! },
    { enabled: !!productSlug }
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-16 text-center space-y-4">
        <Package className="w-12 h-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">商品不存在</h2>
        <Button variant="outline" asChild>
          <Link href={`/store/${storeSlug}`}>返回店铺</Link>
        </Button>
      </div>
    );
  }

  const { product, store } = data;
  const images = (product.images as string[]) ?? [];
  const tags = (product.tags as string[]) ?? [];

  return (
    <div className="container py-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/marketplace" className="hover:text-foreground transition-colors">商城</Link>
        <span>/</span>
        <Link href={`/store/${storeSlug}`} className="hover:text-foreground transition-colors">
          {store?.name ?? storeSlug}
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-48">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-xl overflow-hidden">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    i === selectedImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {/* Platform badge */}
          {product.externalPlatform && (
            <Badge variant="secondary" className="gap-1">
              <ExternalLink className="w-3 h-3" />
              来自 {PLATFORM_LABELS[product.externalPlatform] ?? product.externalPlatform}
            </Badge>
          )}

          <h1 className="text-xl font-bold leading-tight">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {parseFloat(product.priceUsdd).toFixed(2)} USDD
            </span>
            {product.originalPriceUsdd && parseFloat(product.originalPriceUsdd) > parseFloat(product.priceUsdd) && (
              <span className="text-lg text-muted-foreground line-through">
                {parseFloat(product.originalPriceUsdd).toFixed(2)} USDD
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">库存：</span>
            <span className={product.stock > 0 ? "text-green-600 font-medium" : "text-destructive"}>
              {product.stock > 0 ? `${product.stock} 件` : "已售罄"}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">商品描述</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-muted-foreground" />
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {product.externalUrl ? (
              <div className="space-y-2">
                <Button className="w-full gap-2" asChild>
                  <a href={product.externalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                    前往 {PLATFORM_LABELS[product.externalPlatform ?? "other"] ?? "原平台"} 购买
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  此商品将跳转至原平台完成购买
                </p>
              </div>
            ) : (
              <Button
                className="w-full gap-2"
                disabled={product.stock === 0}
                onClick={() => toast.info("购物车功能即将开放")}
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stock > 0 ? "加入购物车" : "已售罄"}
              </Button>
            )}
          </div>

          {/* Store info */}
          {store && (
            <Card className="mt-4">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{store.name}</p>
                  <p className="text-xs text-muted-foreground">查看店铺更多商品</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/store/${store.slug}`}>进店</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
