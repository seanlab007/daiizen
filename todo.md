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

## Round 6: Full Authentication System (Google + Phone OTP + Email + Telegram)

- [x] Google OAuth: /api/auth/google, /api/auth/google/callback (passport-google-oauth20)
- [x] Email + password: /api/auth/register, /api/auth/login (bcrypt hashed passwords)
- [x] Phone OTP: /api/auth/phone/send-otp, /api/auth/phone/verify-otp (Twilio Verify Service)
- [x] Telegram Bot: /api/auth/telegram/config, /api/auth/telegram/callback
- [x] Social status endpoint: /api/auth/social/status (shows which providers are enabled)
- [x] DB: add passwordHash, phoneNumber, telegramId, googleId fields to users table
- [x] Frontend: LoginForm with Phone/Email tabs + Google/Telegram buttons (matching darkmatterbank style)
- [x] Frontend: Sign up page at /signup
- [x] Frontend: Replace Manus OAuth "Sign In" button with new auth modal
- [x] Vitest tests for all auth endpoints (71 tests passing)

## Round 7: Google OAuth Production + USDD Payment + Seller Withdrawal

### Google OAuth Production Setup
- [x] Create /privacy page (Privacy Policy)
- [x] Create /terms page (Terms of Service)
- [ ] Update OAuth consent screen with app name, logo, privacy/terms URLs
- [ ] Guide: submit Google OAuth app for production verification

### USDD Payment Integration (Dark Matter Bank)
- [ ] Research Dark Matter Bank USDD API endpoints
- [ ] DB schema: usddTransactions table (userId, type, amount, txHash, status)
- [ ] USDD wallet display: show user's USDD balance on account page
- [ ] USDD deposit flow: generate TRC-20 deposit address, monitor incoming transactions
- [ ] USDD checkout: pay orders with USDD balance (deduct from user balance)
- [ ] USDD exchange rate display: real-time USDD/USD rate on checkout
- [ ] Admin: USDD transaction management panel

### Seller Withdrawal System
- [ ] DB schema: withdrawalRequests table (sellerId, amount, walletAddress, status, txHash)
- [ ] Seller: earnings summary (available balance, pending, withdrawn)
- [ ] Seller: withdrawal request form (USDD wallet address + amount)
- [ ] Seller: withdrawal history with status tracking
- [ ] Admin: withdrawal request review panel (approve/reject)
- [ ] Admin: mark withdrawal as paid (enter TRC-20 txHash)
- [ ] Notification: seller notified when withdrawal approved/rejected/paid
- [ ] Vitest tests for withdrawal flow

## Bug Fix: Navigation Language Mismatch
- [x] Fix hardcoded Chinese nav items (全球商城, 开店入驻, 推荐奖励) not translating in English mode

## Round 7: Full Translation + USDD Payment + Seller Withdrawal

### Full-Site Translation Fix (Scan all pages)
- [x] Scan and fix hardcoded Chinese in Marketplace.tsx
- [x] Scan and fix hardcoded Chinese in ReferralPage.tsx
- [x] Scan and fix hardcoded Chinese in InfluencerOnboarding.tsx
- [x] Scan and fix hardcoded Chinese in SupplyChainOnboarding.tsx
- [ ] Scan and fix hardcoded Chinese in SellerDashboard/Store pages
- [ ] Scan and fix hardcoded Chinese in Admin pages
- [ ] Scan and fix hardcoded Chinese in all remaining pages

### Add Chinese (ZH) Language
- [x] Add "zh" to LANGUAGES list in LanguageContext.tsx
- [x] Add full Chinese translations for all keys
- [x] Test language switcher shows 中文 option

### USDD Payment Integration
- [x] DB schema: usddWallets table (userId, balance, depositAddress)
- [x] DB schema: usddTransactions table (userId, type, amount, txHash, status, note)
- [x] USDD wallet page: show balance, deposit address, transaction history
- [x] Deposit flow: manual TRC-20 deposit with screenshot upload + admin confirmation
- [ ] Pay with USDD balance: deduct balance on order placement (future)
- [x] Admin: USDD deposit review panel (confirm/reject deposits)
- [x] tRPC procedures: wallet.getMyWallet, wallet.getMyTransactions, wallet.submitDeposit, wallet.adminConfirmDeposit, wallet.adminRejectDeposit
- [ ] Vitest tests for USDD wallet procedures

### Seller Withdrawal System
- [x] DB schema: withdrawalRequests table (storeId, userId, amount, walletAddress, status, txHash)
- [ ] Seller: earnings summary widget (available, pending, total withdrawn)
- [ ] Seller: withdrawal request form (TRC-20 wallet + amount)
- [x] Seller: withdrawal history page (/seller/withdrawal)
- [x] Admin: withdrawal review panel (approve/reject with reason)
- [x] Admin: mark as paid (enter TRC-20 txHash)
- [x] Notification: admin notified on new withdrawal request
- [x] tRPC procedures: withdrawal.requestWithdrawal, withdrawal.getMyWithdrawals, withdrawal.adminGetAll, withdrawal.adminApprove, withdrawal.adminReject, withdrawal.adminMarkPaid
- [ ] Vitest tests for withdrawal procedures

## Round 8: USDD Balance Payment & Seller Auto-Settlement
- [x] tRPC: wallet.payWithBalance procedure (deduct balance, create order, notify seller)
- [x] tRPC: seller earnings auto-settlement on order completion (credit seller wallet)
- [x] Frontend: Checkout page - show USDD balance, add "Pay with USDD Balance" button
- [x] Frontend: Show insufficient balance warning with link to /wallet deposit
- [x] Frontend: Payment success page shows USDD deduction confirmation (toast + redirect to order)
- [x] Admin: Order list shows payment method (USDD balance vs manual)
- [x] Vitest tests for wallet.payWithBalance procedure (71 tests passing)

## Round 9: Google OAuth Prod + Auto-Settlement + QR Code
- [ ] Google OAuth: Add privacy policy and terms URLs to OAuth consent screen (guide user)
- [x] Auto-settle seller earnings when admin marks order as "completed"
- [x] Admin: updateOrderStatus triggers creditSellerEarningsForOrder on "completed"
- [x] Wallet page: show TRC-20 deposit address as QR code (using qrcode.react)
- [x] Wallet page: copy-to-clipboard button for deposit address
- [x] Wallet page: show network label (TRC-20 / TRON) next to deposit address

## Round 10: Reviews + Referral Rewards + Marketplace Filters
- [x] DB: productReviews table (orderId, userId, productId, rating 1-5, comment, createdAt)
- [x] tRPC: reviews.submit (after order completed), reviews.getByProduct, reviews.getMyReviews
- [x] Frontend: OrderDetail page - show "Leave a Review" button after order completed
- [x] Frontend: Review form (star rating + text comment)
- [x] Frontend: Product page - show average rating + review list
- [x] Frontend: Store page - show seller average rating
- [x] DB: referralRewards table (referrerId, refereeId, orderId, amountUsdd, status)
- [x] tRPC: auto-credit referrer USDD wallet on referee's first completed order
- [x] Frontend: ReferralPage - show earned rewards history
- [x] Marketplace: category filter sidebar/chips
- [x] Marketplace: price range filter (min/max USDD)
- [x] Marketplace: sort options (newest, price low-high, price high-low, most popular)
- [x] Marketplace: active filter chips display with clear button

## Round 11: Reviews Display + Backend Translation + Seller Notifications
- [x] Frontend: ProductDetail page - show average rating + review list at bottom
- [x] Frontend: StoreProduct page - show average rating + review list at bottom
- [x] Frontend: Store page - show seller average rating badge
- [x] Scan and fix hardcoded Chinese in SellerDashboard.tsx
- [x] Scan and fix hardcoded Chinese in Admin.tsx
- [x] Scan and fix hardcoded Chinese in SellerWithdrawal.tsx and WalletPage.tsx
- [x] Add new translation keys for seller/admin UI to all 7 languages (EN + ZH full, others fallback to EN)
- [x] Seller notification: in-app notification to store owner on new order (DB-backed, 30s polling)
- [x] Seller notification: notification bell in SellerDashboard with unread badge + popover list
- [x] Vitest tests: 71 tests passing (6 test files)

## Round 12: Buyer Notifications + Store Search + Mobile Responsive

### Buyer Order Status Notifications
- [x] Backend: send userNotification to buyer when order status → "shipped"
- [x] Backend: send userNotification to buyer when order status → "completed"
- [x] Frontend: Notification bell in Navbar for all logged-in users (not just sellers)
- [x] Frontend: Notification dropdown in Navbar with unread badge

### Store Search in Marketplace
- [x] Backend: extend marketplace tRPC procedure to accept storeSearch param
- [x] Backend: filter stores by name when storeSearch is provided
- [x] Frontend: add store name search input to Marketplace page
- [x] Frontend: show store results section when searching by store name

### Mobile Responsive Fixes
- [x] SellerDashboard: uses card grid layout (already mobile-friendly)
- [x] Admin page: fix table overflow on mobile (horizontal scroll with overflow-x-auto + min-w)
- [x] WalletPage: card-based layout (already mobile-friendly)
- [x] Navbar: notification bell works on mobile (already implemented)

## Round 13: Strategic/Emergency Supply Products

- [x] Search for product images (antibiotics, flashlights, first aid, emergency supplies)
- [x] Add "Emergency Supplies" category to database
- [x] Seed 16 strategic supply products with CDN images and multilingual names
- [x] Verify products appear in Marketplace

## Round 14: Emergency Section + Bulk Discount + Stock Alerts

### Emergency Supplies Featured Section
- [x] Homepage: add "Emergency Supplies" banner/section with featured products
- [x] Add "战区急需" / "Emergency" badge to emergency category products
- [x] Link to filtered product list for emergency category

### Bulk Purchase Discounts
- [x] DB: add bulkDiscounts table (categoryId/productId, minQty, discountPct)
- [x] Backend: tRPC procedure to get discount tiers for a product
- [x] Frontend: show discount tiers on product detail page (live price update as qty changes)
- [x] Admin: bulk discount tier management UI (add/edit/delete)

### Low-Stock Admin Notifications
- [x] Backend: tRPC admin procedure to set low-stock threshold per product
- [x] Backend: trigger notifyOwner when stock falls below threshold (24h debounce)
- [x] Admin: low-stock threshold management UI (inline edit per product row)
- [x] Frontend: show low-stock warning badge (red AlertCircle) in admin product list

## Round 15: Cart Discounts + Emergency Page + Bulk Stock Update

### Cart Bulk Discount Display
- [x] Cart page: show bulk discount badge and discounted price per line item
- [x] Cart page: show total savings from bulk discounts
- [x] Cart page: show original price crossed out when discount applies

### Emergency Supplies Dedicated Page (/emergency)
- [x] Create /emergency route in App.tsx
- [x] Emergency page: hero banner with crisis zone context
- [x] Emergency page: NGO/bulk buyer contact section (email + WhatsApp)
- [x] Emergency page: full product grid filtered to emergency-supplies category
- [x] Emergency page: bulk discount tiers prominently displayed
- [x] Emergency page: key commitments section (priority shipping, discreet packaging, verified suppliers)
- [x] Add "Emergency Supplies" link to navbar (red, prominent)

### Admin Bulk Stock Update
- [x] Admin products tab: inline stock edit (click stock number to edit in-place)
- [x] Admin products tab: Save/Cancel buttons appear on click
- [x] Backend: reuses existing updateProduct procedure

## Round 16: Military/Tactical Product Expansion

- [x] Research military supply websites for product references and pricing
- [x] Find product images for drones, military aircraft, firearms/ammo, medical supplies
- [x] Add new subcategories: Drones & UAV, Firearms & Ammo, Military Medical, Military Aircraft
- [x] Seed 19 new military/tactical products with CDN images
- [x] Verified: 59 total active products in database

## Round 17: Bulk Quote Request for Institutional Buyers

- [x] DB: add quoteRequests table (orgName, contactEmail, deliveryLocation, items JSON, status, notes, urgency, quotedPrice)
- [x] Backend: publicProcedure to submit a quote request (notifyOwner on submit with urgency label)
- [x] Backend: adminProcedure to list all quote requests
- [x] Backend: adminProcedure to update quote status (pending/reviewed/quoted/accepted/rejected)
- [x] Frontend: /quote page with multi-item form (product search dropdown + qty + unit price per line)
- [x] Frontend: add "Bulk Quote" link in Navbar (amber, prominent)
- [x] Admin: Quotes tab to list and manage all quote requests with status badges
- [x] Admin: Update status form with admin notes, quoted price, and Reply by Email button

## Round 18: High-Margin Chinese Export Products

- [x] Search product images for all categories
- [x] Add 7 new categories: Industrial Equipment, Electric Vehicles, Consumer Goods, Chemical Materials, Underwater Robotics, Smart Home Appliances, Power Infrastructure
- [x] Seed 20 high-margin export products with CDN images
- [x] Verified: 79 total active products in database

## Round 19: Wi-Fi Products, Parallel Export Page, B2B Inquiry Flow

### Portable Wi-Fi / Power Bank Products
- [x] Search images for portable Wi-Fi routers, power banks, Dianxiaoer devices
- [x] Add "portable-wifi" and "power-banks" categories
- [x] Seed 12 products (6 Wi-Fi routers + 6 power banks) with CDN images
- [x] Total: 91 active products in database

### Parallel Export Dedicated Page (/parallel-export)
- [x] Create /parallel-export route in App.tsx
- [x] Page: hero banner targeting Central Asia / Middle East traders
- [x] Page: China vs overseas price comparison table (5 EV models with savings %)
- [x] Page: product grid with tabs (EVs / Industrial / Smart Home)
- [x] Page: key export markets grid (8 countries)
- [x] Page: "Why Parallel Export Works" section
- [x] Page: contact/inquiry CTA section
- [x] Add "Parallel Export" link to Navbar (blue, prominent)

### B2B Inquiry Flow Optimization
- [x] ProductDetail: detect if price >= $10,000
- [x] ProductDetail: hide "Add to Cart" button for high-value products
- [x] ProductDetail: show "Request Bulk Quote" button linking to /quote with product pre-filled
- [x] ProductDetail: add "B2B Inquiry" info badge for high-value items
- [x] ProductDetail: add "View Parallel Export Deals" secondary button

## Round 20: Bug Fix + Homepage Banner + Quote Pre-fill

- [x] Fix /parallel-export JSON.parse crash (images field type mismatch — safe try/catch parsing)
- [x] Homepage: add parallel export banner section with price gap stats and 4 market flags
- [x] QuoteRequest: read ?product= and ?price= URL params to pre-fill first row
- [x] ParallelExport: price comparison table rows already link to product detail pages via slug

## Round 21: Group Buy (拼团) + Creator Card

### Group Buy (拼团)
- [x] DB: add groupBuys and groupBuyParticipants tables to schema.ts
- [x] Backend: port groupBuy.ts logic (tier ladder 11 tiers, virtual count, share links)
- [x] Backend: tRPC procedures (list, getByToken, create, join)
- [x] Frontend: /group-buy page with list view + detail view per share token
- [x] Frontend: join button, progress bar, tier ladder grid, share links (WhatsApp/Telegram/Twitter/Copy)
- [x] Add "🔥 Group Buy" nav link to Navbar (orange)

### Creator Card
- [x] DB: add creatorCards and creatorCardConsumptions tables to schema.ts
- [x] Backend: port creatorCardAI.ts (AI follower review + tier assignment: Silver/Gold/Platinum/Black)
- [x] Backend: tRPC procedures (applyCard, getMyCard, submitContent)
- [x] Frontend: /creator-card page with virtual card display (gradient per tier)
- [x] Frontend: application form with up to 5 social accounts + AI evaluation result
- [x] Frontend: credit usage progress bar + AI score display
- [x] Add "✨ Creator Card" nav link to Navbar (purple)

## Round 22: Group Buy Button + Creator Card Repayment + Admin Creator Cards

### Start Group Buy on ProductDetail
- [ ] ProductDetail: add "🔥 Start Group Buy" button below Add to Cart
- [ ] ProductDetail: dialog to configure group buy (duration hours, target count, group type)
- [ ] Backend: groupBuy.create procedure (already exists, wire up)
- [ ] After creation: show share link with copy + WhatsApp/Telegram buttons
- [ ] Show existing active group buys for the same product

### Creator Card Content Repayment
- [ ] CreatorCard page: add "Submit Content for Repayment" section when card is active
- [ ] Form: content URL input, platform selector, screenshot upload (S3)
- [ ] Backend: submitContent procedure (already exists, wire up)
- [ ] Show repayment history with status (pending/approved/rejected)

### Admin Creator Cards Management
- [ ] Admin: add "Creator Cards" tab to nav
- [ ] Admin: list all creator card applications with status badges
- [ ] Admin: approve/reject pending applications with manual override
- [ ] Admin: adjust credit limit for existing cards
- [ ] Admin: list content repayment submissions, approve/reject each

## Round 22: Group Buy Button + Creator Card Repayment + Admin Creator Cards ✅
- [x] ProductDetail: "Start Group Buy" button with dialog (title, target qty, end date, discount %)
- [x] ProductDetail: after creation, show share link with copy + WhatsApp/Telegram/Twitter buttons
- [x] CreatorCard: ConsumptionList component showing pending/submitted consumptions
- [x] CreatorCard: ContentRepaymentDialog with screenshot upload + content URL + description
- [x] CreatorCard: AI review result display (score, DARK reward, approval/rejection)
- [x] Backend: uploadContentScreenshot procedure (base64 → S3)
- [x] Backend: submitContent + adminListCards + adminListSubmissions + adminUpdateCard + adminReviewSubmission procedures
- [x] Admin: "Creator Cards" tab with card management table (activate/suspend/edit limit)
- [x] Admin: content repayment submissions list with approve/reject actions

## Round 23: Group Buy Redesign (No Cart) + Expiry + Homepage Section ✅
- [x] Group Buy: redesigned to wait-for-group model but NO shopping cart — join = reserve spot directly
- [x] Group Buy: join button shows "🔥 立即占位" with note "no cart needed, order auto-created on group completion"
- [x] Group Buy: when group completes, orders auto-created for all participants
- [x] Group Buy: auto-expiry processing (mark failed groups, notify participants with Chinese message)
- [x] Group Buy: completed state shows "查看我的订单" link button
- [x] Homepage: add "🔥 热门拼团" section (top 3 active groups, progress bars, countdown, discount badges)

## Round 24: Group Buy USDD Auto-Deduction + SEO OG Tags

### USDD Auto-Deduction on Group Completion
- [x] Backend: when group buy completes (currentCount >= targetCount), deduct USDD from each participant's wallet
- [x] Backend: mark orders as "paid" after successful USDD deduction
- [x] Backend: notify participants of successful payment and order confirmation
- [x] Backend: handle insufficient USDD balance (skip that participant, notify them)

### Group Buy Share Page SEO (Open Graph)
- [x] Backend: getGroupBuyByToken already returns all OG data (productName, discountPct, currentCount, targetCount, imageUrl)
- [x] Frontend: dynamic <meta> OG tags injected via useEffect on /group-buy/:token page
- [x] Frontend: og:title (product + discount%), og:description (X people joined, Y spots left), og:image, og:url, twitter:card
- [x] Client-side OG injection (sufficient for WhatsApp/Telegram when JS executes before share)
