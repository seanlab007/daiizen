import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { ShoppingCart, ArrowLeft, Package, Plus, Minus, Star, MessageSquare, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

function StarRating({ rating, size = 4 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-${size} h-${size} ${
            s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewsList({ productSlug }: { productSlug: string }) {
  const { data: product } = trpc.products.bySlug.useQuery({ slug: productSlug });
  // We'll use a separate query for reviews by product ID via storeProductId
  // For direct products (non-store), we show a placeholder
  if (!product) return null;
  return null; // Direct products don't have storeProductId reviews yet
}

export default function ProductDetail() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const params = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading, error } = trpc.products.bySlug.useQuery({ slug: params.slug });
  const utils = trpc.useUtils();

  // Bulk discounts for this product
  const { data: bulkDiscounts = [] } = trpc.bulkDiscounts.forProduct.useQuery(
    { productId: product?.id ?? 0, categoryId: product?.categoryId ?? null },
    { enabled: !!product }
  );

  // Calculate discounted price based on current quantity
  const applicableDiscount = bulkDiscounts
    .filter(d => quantity >= d.minQty)
    .sort((a, b) => parseFloat(b.discountPct) - parseFloat(a.discountPct))[0] ?? null;
  const discountedPrice = applicableDiscount
    ? Number(product?.priceUsdd ?? 0) * (1 - parseFloat(applicableDiscount.discountPct) / 100)
    : null;

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
      utils.cart.count.invalidate();
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const getLocalizedField = (field: string) => {
    if (!product) return "";
    const key = `${field}${language.charAt(0).toUpperCase() + language.slice(1)}`;
    return (product as Record<string, unknown>)[key] as string || (product as Record<string, unknown>)[`${field}En`] as string || "";
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    if (!product) return;
    addToCartMutation.mutate({ productId: product.id, quantity });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen py-8">
        <div className="container text-center py-20">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Product not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/products"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = [...((product.images as string[]) || [])];
  if (product.aiGeneratedImageUrl && !images.includes(product.aiGeneratedImageUrl)) {
    images.push(product.aiGeneratedImageUrl);
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition-colors">{t("products.title")}</Link>
          <span>/</span>
          <span className="text-foreground">{product.nameEn}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted/40 border border-border/60">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.nameEn} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? "border-primary" : "border-border/60"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {product.category && (
              <Link href={`/products?category=${product.category.slug}`} className="text-xs text-primary hover:underline">
                {getLocalizedField("name").length > 0 ? "" : product.category.nameEn}
              </Link>
            )}
            <h1 className="text-2xl font-serif font-semibold text-foreground leading-tight">
              {getLocalizedField("name") || product.nameEn}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              {discountedPrice ? (
                <>
                  <span className="text-3xl font-bold text-red-600">{discountedPrice.toFixed(2)}</span>
                  <span className="text-lg text-muted-foreground line-through">{Number(product.priceUsdd).toFixed(2)}</span>
                  <span className="text-sm font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    -{applicableDiscount!.discountPct}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold text-primary">{Number(product.priceUsdd).toFixed(2)}</span>
                </>
              )}
              <span className="text-lg text-muted-foreground">USDD</span>
            </div>

            {/* Bulk Discount Tiers */}
            {bulkDiscounts.length > 0 && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-semibold text-orange-800 mb-2">📦 Bulk Purchase Discounts</p>
                <div className="flex flex-wrap gap-2">
                  {bulkDiscounts.map((d) => (
                    <div
                      key={d.id}
                      className={`text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
                        quantity >= d.minQty
                          ? "bg-orange-600 text-white border-orange-600"
                          : "bg-white text-orange-700 border-orange-300"
                      }`}
                    >
                      {d.label || `Buy ${d.minQty}+: ${d.discountPct}% off`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                  ✓ {t("products.in_stock")} ({product.stock})
                </span>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {t("products.out_stock")}
                </span>
              )}
            </div>

            {/* Description */}
            {getLocalizedField("description") && (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p className="leading-relaxed">{getLocalizedField("description")}</p>
              </div>
            )}

            {/* Quantity + Add to Cart / B2B Inquiry */}
            {product.stock > 0 && (
              <div className="space-y-3">
                {/* B2B Inquiry badge for high-value items */}
                {Number(product.priceUsdd) >= 10000 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-800 font-medium">
                      This is a B2B product. Contact us for pricing, MOQ, and shipping terms.
                    </span>
                  </div>
                )}

                {Number(product.priceUsdd) < 10000 ? (
                  // Standard Add to Cart for consumer products
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{t("products.qty")}:</span>
                      <div className="flex items-center gap-1 border border-border rounded-lg">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors rounded-l-lg"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors rounded-r-lg"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="w-full gap-2"
                      onClick={handleAddToCart}
                      disabled={addToCartMutation.isPending}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {t("products.add_cart")}
                    </Button>
                  </>
                ) : (
                  // B2B Inquiry flow for high-value products (>$10,000)
                  <div className="space-y-2">
                    <Link href={`/quote?product=${encodeURIComponent(product.nameEn)}&price=${product.priceUsdd}`}>
                      <Button size="lg" className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <MessageSquare className="w-4 h-4" />
                        Request Bulk Quote
                      </Button>
                    </Link>
                    <Link href="/parallel-export">
                      <Button size="lg" variant="outline" className="w-full gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                        🌏 View Parallel Export Deals
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* USDD info */}
            <div className="p-3 rounded-lg bg-accent/30 border border-accent text-xs text-accent-foreground">
              💎 Priced in USDD — stable value, protected from inflation.
              <a href="https://www.darkmatterbank.com" target="_blank" rel="noopener noreferrer" className="ml-1 underline">Get USDD →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
