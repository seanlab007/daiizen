import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, ChevronDown, Search, Menu, X, Leaf, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const { data: cartData } = trpc.cart.count.useQuery(undefined, { enabled: isAuthenticated });
  const cartCount = cartData?.count ?? 0;

  const { data: notifData, refetch: refetchNotifs } = trpc.notifications.list.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );
  const { data: unreadData, refetch: refetchUnread } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );
  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => { refetchNotifs(); refetchUnread(); },
  });
  const unreadCount = unreadData?.count ?? 0;
  const notifications = Array.isArray(notifData) ? notifData : [];
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              {t("nav.marketplace")}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  {t("nav.open_store")} <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/influencer-onboarding" className="gap-2">
                    {t("nav.influencer")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/supply-chain-onboarding" className="gap-2">
                    {t("nav.supply_chain")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/seller" className="gap-2">
                    {t("nav.seller_dashboard")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/referral" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.referral")}
            </Link>
            <Link href="/emergency" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors flex items-center gap-1">
              🚨 Emergency
            </Link>
            <Link href="/quote" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
              📋 Bulk Quote
            </Link>
            <Link href="/parallel-export" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
              🌏 Parallel Export
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

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 relative"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                  }}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                {notifOpen && (
                  <div className="absolute right-0 top-10 w-80 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => markReadMutation.mutate({})}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</div>
                    ) : (
                      notifications.map((n: { id: number; title: string; body: string; link?: string | null; isRead: number; createdAt: Date | number }) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors ${
                            !n.isRead ? "bg-primary/5" : ""
                          }`}
                          onClick={() => {
                            if (!n.isRead) markReadMutation.mutate({ ids: [n.id] });
                            if (n.link) { setLocation(n.link); setNotifOpen(false); }
                          }}
                        >
                          <p className={`text-sm font-medium ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

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
                    <Link href="/seller">{t("nav.my_store")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referral">{t("nav.referral")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet">💰 USDD Wallet</Link>
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
                onClick={() => (window.location.href = "/login")}
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
                {t("nav.marketplace")}
              </Link>
              <Link href="/influencer-onboarding" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                {t("nav.influencer")}
              </Link>
              <Link href="/supply-chain-onboarding" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                {t("nav.supply_chain")}
              </Link>
              <Link href="/seller" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                {t("nav.seller_dashboard")}
              </Link>
              <Link href="/referral" onClick={() => setMobileOpen(false)} className="px-2 py-1.5 text-sm hover:bg-accent rounded-md">
                💰 {t("nav.referral")}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
