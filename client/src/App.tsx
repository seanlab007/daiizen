import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import ExchangeRateTicker from "./components/ExchangeRateTicker";
import ChatWidget from "./components/ChatWidget";
import Login from "./pages/Login";
import { lazy, Suspense } from "react";

// Lazy-load heavy pages
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Account = lazy(() => import("./pages/Account"));
const Payment = lazy(() => import("./pages/Payment"));
const Admin = lazy(() => import("./pages/Admin"));

// Business pages
const Marketplace = lazy(() => import("./pages/Marketplace"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const DepositPayment = lazy(() => import("./pages/DepositPayment"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerAnalytics = lazy(() => import("./pages/SellerAnalytics"));
const SellerWithdrawal = lazy(() => import("./pages/SellerWithdrawal"));
const StorePage = lazy(() => import("./pages/StorePage"));
const StoreProductDetail = lazy(() => import("./pages/StoreProductDetail"));
const InfluencerOnboarding = lazy(() => import("./pages/InfluencerOnboarding"));
const SupplyChainOnboarding = lazy(() => import("./pages/SupplyChainOnboarding"));
const GroupBuy = lazy(() => import("./pages/GroupBuy"));
const CreatorCard = lazy(() => import("./pages/CreatorCard"));
const QuoteRequest = lazy(() => import("./pages/QuoteRequest"));
const BulkImport = lazy(() => import("./pages/BulkImport"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/products" component={Products} />
        <Route path="/products/:slug" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/account" component={Account} />
        <Route path="/payment/:orderId" component={Payment} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/:section" component={Admin} />
        {/* Business routes */}
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/wallet/deposit" component={DepositPayment} />
        <Route path="/seller" component={SellerDashboard} />
        <Route path="/seller/analytics" component={SellerAnalytics} />
        <Route path="/seller/withdrawal" component={SellerWithdrawal} />
        <Route path="/stores/:slug" component={StorePage} />
        <Route path="/stores/:storeSlug/products/:productSlug" component={StoreProductDetail} />
        <Route path="/onboarding/influencer" component={InfluencerOnboarding} />
        <Route path="/onboarding/supply-chain" component={SupplyChainOnboarding} />
        <Route path="/group-buy" component={GroupBuy} />
        <Route path="/creator-card" component={CreatorCard} />
        <Route path="/quote" component={QuoteRequest} />
        <Route path="/bulk-import" component={BulkImport} />
        <Route path="/referral" component={ReferralPage} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <div className="min-h-screen flex flex-col">
              <ExchangeRateTicker />
              <Navbar />
              <main className="flex-1">
                <Router />
              </main>
              <ChatWidget />
            </div>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
