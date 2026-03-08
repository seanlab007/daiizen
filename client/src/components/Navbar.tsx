import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, ChevronDown, Search, Menu, X, Leaf } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: cartData } = trpc.cart.count.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cartData?.count ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const currentLang = LANGUAGES.find((l) => l.code === language)!;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-serif font-semibold tracking-tight text-foreground">
              Daiizen
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.home")}
            </Link>
            <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.products")}
            </Link>
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              全球商城
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  开店入驻 <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/influencer-onboarding" className="gap-2">
                    <span>🌟</span> 网红 / KOL 入驻
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/supply-chain-onboarding" className="gap-2">
                    <span>🏭</span> 供应链 / 品牌入驻
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/seller" className="gap-2">
                    <span>📊</span> 卖家后台
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/referral" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              推荐奖励
            </Link>
          </nav>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("nav.search")}
                className="pl-9 h-9 text-sm bg-muted/50 border-transparent focus:border-border focus:bg-background"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 gap-1 text-sm">
                  <span>{currentLang.flag}</span>
                  <span className="hidden sm:inline text-xs text-muted-foreground">{currentLang.code.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`gap-2 ${language === lang.code ? "bg-accent text-accent-foreground" : ""}`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm">{lang.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account">{t("account.title")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">{t("orders.title")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/seller">我的店铺</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referral">推荐奖励</Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin">{t("nav.admin")}</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                    {t("nav.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                className="h-9 text-sm"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                {t("nav.login")}
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-9 w-9 p-0"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("nav.search")}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <Link href="/" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                {t("nav.home")}
              </Link>
              <Link href="/products" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                {t("nav.products")}
              </Link>
              <Link href="/marketplace" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                全球商城
              </Link>
              <Link href="/influencer-onboarding" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                🌟 网红入驻
              </Link>
              <Link href="/supply-chain-onboarding" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                🏭 供应链入驻
              </Link>
              <Link href="/seller" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                📊 卖家后台
              </Link>
              <Link href="/referral" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                💰 推荐奖励
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
