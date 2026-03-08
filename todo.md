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
