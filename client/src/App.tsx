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
const Marketplace = lazy(() => import("./pages/Marketplace"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const StorePage = lazy(() => import("./pages/StorePage"));
const StoreProductDetail = lazy(() => import("./pages/StoreProductDetail"));
const InfluencerOnboarding = lazy(() => import("./pages/InfluencerOnboarding"));
const SupplyChainOnboarding = lazy(() => import("./pages/SupplyChainOnboarding"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));

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
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/seller" component={SellerDashboard} />
        <Route path="/store/:slug" component={StorePage} />
        <Route path="/store/:slug/product/:productSlug" component={StoreProductDetail} />
        <Route path="/influencer-onboarding" component={InfluencerOnboarding} />
        <Route path="/supply-chain-onboarding" component={SupplyChainOnboarding} />
        <Route path="/referral" component={ReferralPage} />
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
