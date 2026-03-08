import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Store, Package, ExternalLink, ShoppingCart, Tag, Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok", pinduoduo: "Pinduoduo", xiaohongshu: "Xiaohongshu",
  amazon: "Amazon", shein: "SHEIN", taobao: "Taobao", jd: "JD.com",
  lazada: "Lazada", shopee: "Shopee", other: "Other",
};

function StarRating({ rating, size = 4 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-${size} h-${size} ${
            s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewsSection({ storeProductId }: { storeProductId: number }) {
  const { t } = useLanguage();
  const { data: reviews, isLoading } = trpc.reviews.getByProduct.useQuery({ storeProductId });

  if (isLoading) {
    return (
      <div className="space-y-3 mt-8">
        <div className="h-5 bg-muted rounded w-32 animate-pulse" />
        <div className="h-20 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const reviewList = reviews ?? [];
  const avgRating = reviewList.length > 0
    ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
    : 0;

  return (
    <div className="mt-10 border-t pt-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">
          {t("review.title") || "Customer Reviews"}
        </h2>
        {reviewList.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={avgRating} size={4} />
            <span className="text-sm text-muted-foreground">
              {avgRating.toFixed(1)} ({reviewList.length})
            </span>
          </div>
        )}
      </div>

      {reviewList.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("review.no_reviews") || "No reviews yet. Be the first to review!"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviewList.map((review) => (
            <Card key={review.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {review.userId.toString().slice(-2)}
                    </div>
                    <div>
                      <StarRating rating={review.rating} size={3} />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StoreProductDetail() {
  const { slug: storeSlug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const { t } = useLanguage();

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
        <h2 className="text-xl font-semibold">{t("common.error") || "Product not found"}</h2>
        <Button variant="outline" asChild>
          <Link href={`/store/${storeSlug}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back") || "Back to Store"}
          </Link>
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
        <Link href="/marketplace" className="hover:text-foreground transition-colors">
          {t("nav.marketplace") || "Marketplace"}
        </Link>
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
              {t("storeproduct.from") || "From"} {PLATFORM_LABELS[product.externalPlatform] ?? product.externalPlatform}
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
            <span className="text-muted-foreground">{t("products.qty") || "Stock"}:</span>
            <span className={product.stock > 0 ? "text-green-600 font-medium" : "text-destructive"}>
              {product.stock > 0
                ? `${product.stock} ${t("storeproduct.units") || "units"}`
                : t("products.out_stock") || "Sold out"}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("storeproduct.description") || "Description"}</p>
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
                    {t("storeproduct.buy_on") || "Buy on"} {PLATFORM_LABELS[product.externalPlatform ?? "other"] ?? "Original Platform"}
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("storeproduct.redirect_note") || "This product will redirect to the original platform"}
                </p>
              </div>
            ) : (
              <Button
                className="w-full gap-2"
                disabled={product.stock === 0}
                onClick={() => toast.info(t("common.coming_soon") || "Coming soon")}
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stock > 0
                  ? t("products.add_cart") || "Add to Cart"
                  : t("products.out_stock") || "Sold Out"}
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
                  <p className="text-xs text-muted-foreground">
                    {t("storeproduct.view_more") || "View more products from this store"}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/store/${store.slug}`}>
                    {t("storeproduct.enter_store") || "Visit Store"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection storeProductId={product.id} />
    </div>
  );
}
