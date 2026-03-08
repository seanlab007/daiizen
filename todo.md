# Daiizen - Global Marketplace TODO

## Phase 1: Database Schema & Architecture
- [x] Design and push database schema (products, categories, cart, orders, addresses, exchange rates)
- [x] Set up i18n framework (language context + translations)

## Phase 2: Global Style, Navigation & Homepage
- [x] Global CSS with Zen/minimalist design tokens (OKLCH palette, typography, spacing)
- [x] Top navigation bar with language switcher, cart icon, user menu
- [x] Homepage: hero section, featured products, category grid, exchange rate ticker
- [x] Footer with links and USDD branding

## Phase 3: Product System
- [x] Product list page with grid layout
- [x] Category filtering sidebar/tabs
- [x] Search functionality (name, description)
- [x] Product detail page with image gallery, description, price in USDD
- [x] Product card component (reusable)

## Phase 4: Cart, Orders & Tracking
- [x] Shopping cart (add, remove, update quantity)
- [x] Cart page
- [x] Checkout flow with address selection
- [x] Order creation (server-side)
- [x] Order history page
- [x] Order detail & status tracking page (pending, paid, shipped, completed)

## Phase 5: USDD Payment & Exchange Rates
- [x] USDD payment flow integration (manual TRON TRC-20 flow)
- [x] Real-time exchange rate display (USDD vs ARS, TRY, VES, etc.)
- [x] Exchange rate ticker component (homepage + navbar)
- [x] Payment confirmation page

## Phase 6: User Account System
- [x] User profile page (name, email, role)
- [x] Shipping address management (add, delete, set default)
- [x] Order history accessible from account page

## Phase 7: Admin Backend
- [x] Admin dashboard (stats: total orders, revenue, products)
- [x] Product management: list, add, delete
- [x] AI marketing image generation for products (via LLM image generation)
- [x] Order management for admins (mark shipped, complete)
- [x] Exchange rate refresh button

## Phase 8: AI Customer Service & Notifications
- [x] AI multilingual chatbot (24/7 support for products, orders, payments)
- [x] Chat widget floating on all pages
- [x] Owner notification on new order, payment complete, status change

## Phase 9: Testing & Checkpoint
- [x] Vitest unit tests for core procedures (products, orders, cart, auth, admin guard)
- [x] Database migration (pnpm db:push)
- [x] Save checkpoint

## Seed Data
- [x] Sample categories and products seeded via seed.mjs

## Round 2: Payment & Products

- [x] Add Alipay, WeChat Pay, LianLian Pay payment methods
- [x] Configure USDD TRON TRC-20 wallet address (via VITE_USDD_PAYMENT_ADDRESS env var)
- [x] Seed 25 Yiwu plastic/daily goods products with real CDN images
- [x] Add 5 product categories: Plastic Kitchenware, Storage, Bottles & Cups, Daily Essentials, Cleaning
- [x] Domain binding guide for www.daiizen.com (Alibaba Cloud)

## Round 3: B2C Multi-Vendor Marketplace
- [x] DB schema: stores, storeProducts, storeDeposits, commissions tables
- [x] Seller: apply to open store (with deposit payment)
- [x] Seller: store profile management (name, logo, description, banner)
- [x] Seller: product upload (own products with images, price, stock)
- [x] Seller: external link import (TikTok/Pinduoduo/Xiaohongshu/Amazon/SHEIN/TikTok Shop)
- [x] External link conversion: parse product info from external URL via AI
- [x] Platform commission: configurable rate per sale, auto-deduct from seller earnings
- [x] Deposit system: required deposit to open store, admin-exempt
- [x] Seller dashboard: sales stats, orders, earnings, commission history
- [x] Buyer: marketplace page showing all stores and products
- [x] Buyer: individual store page
- [x] Buyer: store product detail page
- [x] Admin: store approval/rejection workflow
- [x] Admin: commission rate configuration
- [x] Admin: deposit management (view, refund)
- [x] Admin: seller management (suspend, reinstate)
- [x] Vitest tests for store/seller procedures

## Round 4: S2B2C Platform - Influencer + Supply Chain

### Store Type System
- [x] Add storeType field to stores: "influencer" | "supply_chain" | "brand"
- [x] Influencer onboarding flow (separate from supply chain)
- [x] Supply chain onboarding flow (wholesale/dropship catalog)

### Influencer Features
- [x] Influencer dashboard: select supply chain products to sell (dropship)
- [x] Influencer can set own markup price on top of supply chain base price
- [x] Influencer referral link generator (unique per influencer)
- [x] AI product selection tool (trending analysis via LLM)
- [x] AI customer service auto-reply for influencer store
- [x] Influencer earnings: base commission + markup profit

### Supply Chain Features
- [x] Supply chain product catalog (wholesale products with base price)
- [x] Dropship fulfillment: when influencer sells, order goes to supply chain for direct shipping
- [x] Supply chain order management (pending fulfillment, shipped, tracking)
- [x] Supply chain earnings dashboard

### Social Referral System (3-Level, Compliance-Safe ≤3 tiers)
- [x] Referral code generation (one per user)
- [x] Referral tree: track up to 3 levels (L1/L2/L3 ancestors stored per user)
- [x] Reward trigger: when referred user completes FIRST purchase
- [x] Reward rates: L1=5%, L2=2%, L3=1% of first order value (platform credit)
- [x] Reward type: platform credit redeemable for goods or cash-out
- [x] Hard cap: max 3 levels, no downstream beyond L3
- [x] Referral dashboard: tree visualization, pending/confirmed rewards per level
- [x] Admin: referral reward approval and payout management

### Marketplace Updates
- [x] Marketplace shows store type badges (网红店 / 供应链)
- [x] Homepage section: "网红带货" featured influencer stores
- [x] Homepage section: "品质供应链" supply chain showcase

### Compliance & Operations
- [x] Terms of service page mentioning single-layer referral rules
- [x] Admin: referral reward approval/fulfillment management
- [x] Admin: supply chain partner management

### Tests
- [x] Vitest tests for referral system (3-level enforcement)
- [x] Vitest tests for dropship order flow

## Round 5: Payment, Bulk Import & Analytics

### Deposit Payment (Alipay / WeChat / UnionPay)
- [x] Admin: configure payment QR code images (Alipay, WeChat, UnionPay) and account names via admin panel
- [x] Deposit flow: seller selects payment method, sees QR code + account info, uploads transfer screenshot
- [x] DB: store payment method, transfer screenshot URL, amount, status per deposit record
- [x] Admin: review deposit screenshot, confirm or reject with reason
- [x] Seller: deposit status tracking (pending review / confirmed / rejected)
- [x] Notification: notify seller when deposit is confirmed or rejected

### Supply Chain Bulk Product Import
- [x] CSV/Excel template download (with field definitions)
- [x] File upload endpoint: parse CSV/Excel on server, validate fields
- [x] AI-assisted field mapping: if columns don't match template, AI infers mapping
- [x] Bulk insert products with validation errors reported per row
- [x] Import result summary: success count, error rows with reasons
- [x] Frontend: upload UI with progress, result table

### Influencer Sales Analytics Dashboard
- [x] Track product page views (click events stored per store product)
- [x] Track add-to-cart events per store product
- [x] Track completed orders per store product (GMV, units sold)
- [x] Influencer dashboard: per-product stats (views, cart adds, orders, GMV, conversion rate)
- [x] Influencer dashboard: total earnings breakdown (markup profit + referral rewards)
- [x] Influencer dashboard: top performing products chart
- [x] Admin: platform-wide GMV and commission revenue analytics

### Tests
- [x] Vitest tests for deposit payment flow
- [x] Vitest tests for bulk import parsing
- [x] Vitest tests for analytics data aggregation
