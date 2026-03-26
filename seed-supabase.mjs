/**
 * seed-supabase.mjs
 * Seeds daiizen_categories and daiizen_products in Supabase PostgreSQL
 * Run: node seed-supabase.mjs
 */

import postgres from 'postgres';

const DB_URL = 'postgresql://postgres.fczherphuixpdjuevzsh:Sb%407002005_12345@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';

const sql = postgres(DB_URL, { max: 1, connect_timeout: 15, ssl: { rejectUnauthorized: false } });

const CATEGORIES = [
  { slug: 'plastic-kitchenware', name_en: 'Plastic Kitchenware', name_es: 'Utensilios de Cocina Plásticos', name_tr: 'Plastik Mutfak Gereçleri', name_pt: 'Utensílios de Cozinha Plásticos', name_ar: 'أدوات مطبخ بلاستيكية', name_ru: 'Пластиковая Кухонная Посуда', sort_order: 1 },
  { slug: 'storage-organizers',  name_en: 'Storage & Organizers',  name_es: 'Almacenamiento y Organizadores', name_tr: 'Depolama ve Düzenleyiciler', name_pt: 'Armazenamento e Organizadores', name_ar: 'التخزين والمنظمات', name_ru: 'Хранение и Органайзеры', sort_order: 2 },
  { slug: 'bottles-cups',        name_en: 'Bottles & Cups',        name_es: 'Botellas y Vasos', name_tr: 'Şişeler ve Bardaklar', name_pt: 'Garrafas e Copos', name_ar: 'زجاجات وأكواب', name_ru: 'Бутылки и Стаканы', sort_order: 3 },
  { slug: 'daily-essentials',    name_en: 'Daily Essentials',      name_es: 'Artículos de Primera Necesidad', name_tr: 'Günlük Temel Ürünler', name_pt: 'Essenciais do Dia a Dia', name_ar: 'الضروريات اليومية', name_ru: 'Товары Первой Необходимости', sort_order: 4 },
  { slug: 'cleaning-supplies',   name_en: 'Cleaning Supplies',     name_es: 'Artículos de Limpieza', name_tr: 'Temizlik Malzemeleri', name_pt: 'Produtos de Limpeza', name_ar: 'مستلزمات التنظيف', name_ru: 'Чистящие Средства', sort_order: 5 },
];

const CDN = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/ebebYjMErshCmhKiJP5h4X';
const IMG = {
  bowl:    `${CDN}/bowl-set_4be0f172.jpg`,
  rice:    `${CDN}/rice-container_ee17208c.jpg`,
  rice2:   `${CDN}/rice-container-2_9e631f5e.jpg`,
  storage: `${CDN}/storage-container_6ff88ecb.jpg`,
  bottle:  `${CDN}/water-bottle_57a56003.jpg`,
  bottles: `${CDN}/water-bottles-bulk_3fbcb997.jpg`,
  cart:    `${CDN}/drawer-cart_7361335e.png`,
  drawer:  `${CDN}/drawer-organizer_481470dd.jpg`,
};

const PRODUCTS = [
  // Plastic Kitchenware
  { category_slug: 'plastic-kitchenware', slug: 'colorful-bowl-set-5pcs', name_en: 'Colorful Plastic Bowl Set (5pcs)', name_es: 'Juego de Tazones de Plástico Coloridos', name_tr: 'Renkli Plastik Kase Seti', name_pt: 'Conjunto de Tigelas Plásticas Coloridas', name_ar: 'مجموعة أوعية بلاستيكية ملونة', name_ru: 'Набор Цветных Пластиковых Мисок', description_en: 'Stackable food-grade plastic bowls with lids. BPA-free, microwave safe.', price_usdd: '2.80', stock: 500, images: [IMG.bowl], is_featured: true, is_active: true },
  { category_slug: 'plastic-kitchenware', slug: 'plastic-mixing-bowl-large', name_en: 'Large Plastic Mixing Bowl 4L', name_es: 'Tazón Grande para Mezclar 4L', name_tr: 'Büyük Plastik Karıştırma Kasesi 4L', name_pt: 'Tigela Grande para Misturar 4L', name_ar: 'وعاء خلط بلاستيكي كبير', name_ru: 'Большая Пластиковая Миска 4л', description_en: 'Heavy-duty 4-liter mixing bowl. Non-slip base, pour spout.', price_usdd: '1.90', stock: 300, images: [IMG.bowl], is_featured: false, is_active: true },
  { category_slug: 'plastic-kitchenware', slug: 'plastic-plate-set-6pcs', name_en: 'Plastic Dinner Plate Set (6pcs)', name_es: 'Juego de Platos de Plástico', name_tr: 'Plastik Tabak Seti', name_pt: 'Conjunto de Pratos Plásticos', name_ar: 'مجموعة أطباق بلاستيكية', name_ru: 'Набор Пластиковых Тарелок', description_en: 'Durable round dinner plates in assorted colors. Shatterproof, lightweight.', price_usdd: '3.20', stock: 400, images: [IMG.bowl], is_featured: true, is_active: true },
  // Storage & Organizers
  { category_slug: 'storage-organizers', slug: 'airtight-rice-container-5kg', name_en: 'Airtight Rice Storage Container 5kg', name_es: 'Contenedor Hermético para Arroz 5kg', name_tr: 'Hava Geçirmez Pirinç Saklama Kabı', name_pt: 'Recipiente Hermético para Arroz', name_ar: 'حاوية تخزين أرز محكمة الإغلاق', name_ru: 'Герметичный Контейнер для Риса', description_en: 'Large-capacity airtight container keeps rice, flour, and grains fresh.', price_usdd: '4.50', stock: 200, images: [IMG.rice], is_featured: true, is_active: true },
  { category_slug: 'storage-organizers', slug: 'food-storage-container-set', name_en: 'Food Storage Container Set (8pcs)', name_es: 'Juego de Recipientes para Alimentos', name_tr: 'Gıda Saklama Kabı Seti', name_pt: 'Conjunto de Recipientes para Alimentos', name_ar: 'مجموعة حاويات تخزين الطعام', name_ru: 'Набор Контейнеров для Еды', description_en: 'Stackable food containers with snap-lock lids. Microwave and freezer safe.', price_usdd: '5.80', stock: 250, images: [IMG.storage], is_featured: true, is_active: true },
  { category_slug: 'storage-organizers', slug: '3-drawer-storage-cart', name_en: '3-Drawer Plastic Storage Cart', name_es: 'Carrito de Almacenamiento con 3 Cajones', name_tr: '3 Çekmeceli Plastik Depolama Arabası', name_pt: 'Carrinho de Armazenamento com 3 Gavetas', name_ar: 'عربة تخزين بلاستيكية بـ 3 أدراج', name_ru: 'Пластиковая Тумба с 3 Ящиками', description_en: 'Versatile 3-drawer rolling cart for bedroom, bathroom, or office.', price_usdd: '12.90', stock: 80, images: [IMG.cart], is_featured: true, is_active: true },
  { category_slug: 'storage-organizers', slug: 'rice-dispenser-container', name_en: 'Rice Dispenser Container 10kg', name_es: 'Dispensador de Arroz 10kg', name_tr: 'Pirinç Dispenseri 10kg', name_pt: 'Dispensador de Arroz 10kg', name_ar: 'موزع أرز 10 كجم', name_ru: 'Диспенсер для Риса 10 кг', description_en: 'Automatic rice dispenser with measuring cup function. Keeps rice fresh.', price_usdd: '7.20', stock: 120, images: [IMG.rice2], is_featured: true, is_active: true },
  // Bottles & Cups
  { category_slug: 'bottles-cups', slug: 'sports-water-bottle-700ml', name_en: 'Sports Water Bottle 700ml', name_es: 'Botella de Agua Deportiva 700ml', name_tr: 'Spor Su Şişesi 700ml', name_pt: 'Garrafa de Água Esportiva 700ml', name_ar: 'زجاجة ماء رياضية 700 مل', name_ru: 'Спортивная Бутылка для Воды 700 мл', description_en: 'BPA-free sports water bottle with push-pull lid. Leak-proof design.', price_usdd: '1.80', stock: 800, images: [IMG.bottle], is_featured: true, is_active: true },
  { category_slug: 'bottles-cups', slug: 'plastic-cups-set-12pcs', name_en: 'Plastic Cups Set 12pcs (400ml)', name_es: 'Juego de Vasos de Plástico 12 piezas', name_tr: 'Plastik Bardak Seti 12 Adet', name_pt: 'Conjunto de Copos Plásticos 12 peças', name_ar: 'مجموعة أكواب بلاستيكية 12 قطعة', name_ru: 'Набор Пластиковых Стаканов 12 шт.', description_en: 'Reusable transparent plastic cups. Shatterproof, stackable, dishwasher safe.', price_usdd: '2.20', stock: 600, images: [IMG.bottles], is_featured: false, is_active: true },
  { category_slug: 'bottles-cups', slug: 'insulated-water-bottle-500ml', name_en: 'Insulated Water Bottle 500ml', name_es: 'Botella de Agua Aislada 500ml', name_tr: 'Yalıtımlı Su Şişesi 500ml', name_pt: 'Garrafa de Água Isolada 500ml', name_ar: 'زجاجة ماء عازلة 500 مل', name_ru: 'Термобутылка 500 мл', description_en: 'Double-wall insulated bottle keeps drinks cold 24h or hot 12h.', price_usdd: '3.50', stock: 400, images: [IMG.bottle], is_featured: true, is_active: true },
  // Daily Essentials
  { category_slug: 'daily-essentials', slug: 'plastic-shoe-rack-3-tier', name_en: '3-Tier Plastic Shoe Rack', name_es: 'Zapatero de Plástico de 3 Niveles', name_tr: '3 Katlı Plastik Ayakkabılık', name_pt: 'Sapateira Plástica de 3 Andares', name_ar: 'رف أحذية بلاستيكي 3 طوابق', name_ru: 'Пластиковая Полка для Обуви 3 Яруса', description_en: 'Stackable shoe rack organizer. Holds up to 9 pairs of shoes.', price_usdd: '5.90', stock: 150, images: [IMG.cart], is_featured: true, is_active: true },
  { category_slug: 'daily-essentials', slug: 'plastic-hangers-10pcs', name_en: 'Plastic Clothes Hangers (10pcs)', name_es: 'Perchas de Plástico', name_tr: 'Plastik Elbise Askısı', name_pt: 'Cabides de Plástico', name_ar: 'علاقات ملابس بلاستيكية', name_ru: 'Пластиковые Вешалки для Одежды', description_en: 'Slim-profile plastic hangers save closet space. Non-slip shoulder design.', price_usdd: '1.20', stock: 1000, images: [IMG.drawer], is_featured: false, is_active: true },
  { category_slug: 'daily-essentials', slug: 'plastic-trash-can-10l', name_en: 'Plastic Trash Can 10L with Lid', name_es: 'Papelera de Plástico 10L con Tapa', name_tr: 'Kapaklı Plastik Çöp Kovası', name_pt: 'Lixeira Plástica 10L com Tampa', name_ar: 'سلة مهملات بلاستيكية 10 لتر', name_ru: 'Пластиковое Мусорное Ведро 10 л', description_en: 'Compact 10L waste bin with flip-top lid. Slim design fits small spaces.', price_usdd: '2.60', stock: 350, images: [IMG.cart], is_featured: false, is_active: true },
  // Cleaning Supplies
  { category_slug: 'cleaning-supplies', slug: 'dish-drying-rack', name_en: 'Plastic Dish Drying Rack', name_es: 'Escurridor de Platos de Plástico', name_tr: 'Plastik Bulaşık Kurutma Rafı', name_pt: 'Escorredor de Pratos Plástico', name_ar: 'رف تجفيف الأطباق البلاستيكي', name_ru: 'Пластиковая Сушилка для Посуды', description_en: 'Two-tier dish drying rack with drip tray. Holds plates, bowls, cups, utensils.', price_usdd: '4.80', stock: 200, images: [IMG.bowl], is_featured: true, is_active: true },
  { category_slug: 'cleaning-supplies', slug: 'plastic-mop-bucket', name_en: 'Plastic Mop Bucket with Wringer', name_es: 'Cubo de Fregona con Escurridor', name_tr: 'Sıkacaklı Plastik Paspas Kovası', name_pt: 'Balde de Esfregona com Espremedor', name_ar: 'دلو مبلل بلاستيكي مع عاصرة', name_ru: 'Пластиковое Ведро для Швабры', description_en: '15L mop bucket with built-in wringer. Foot pedal for hands-free wringing.', price_usdd: '8.50', stock: 100, images: [IMG.cart], is_featured: false, is_active: true },
];

async function seed() {
  console.log('🌱 Seeding daiizen_categories...');
  for (const cat of CATEGORIES) {
    await sql`
      INSERT INTO daiizen_categories (slug, name_en, name_es, name_tr, name_pt, name_ar, name_ru, sort_order)
      VALUES (${cat.slug}, ${cat.name_en}, ${cat.name_es}, ${cat.name_tr}, ${cat.name_pt}, ${cat.name_ar}, ${cat.name_ru}, ${cat.sort_order})
      ON CONFLICT (slug) DO UPDATE SET
        name_en = EXCLUDED.name_en, name_es = EXCLUDED.name_es,
        name_tr = EXCLUDED.name_tr, name_pt = EXCLUDED.name_pt,
        name_ar = EXCLUDED.name_ar, name_ru = EXCLUDED.name_ru,
        sort_order = EXCLUDED.sort_order
    `;
    console.log(`  ✓ ${cat.name_en}`);
  }

  console.log('\n🌱 Seeding daiizen_products...');
  for (const p of PRODUCTS) {
    // Get category id
    const cats = await sql`SELECT id FROM daiizen_categories WHERE slug = ${p.category_slug}`;
    const catId = cats[0]?.id ?? null;

    await sql`
      INSERT INTO daiizen_products (
        category_id, slug, name_en, name_es, name_tr, name_pt, name_ar, name_ru,
        description_en, price_usdd, stock, images, is_featured, is_active
      ) VALUES (
        ${catId}, ${p.slug}, ${p.name_en}, ${p.name_es}, ${p.name_tr}, ${p.name_pt}, ${p.name_ar}, ${p.name_ru},
        ${p.description_en}, ${p.price_usdd}, ${p.stock}, ${JSON.stringify(p.images)}, ${p.is_featured}, ${p.is_active}
      )
      ON CONFLICT (slug) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name_en = EXCLUDED.name_en, name_es = EXCLUDED.name_es,
        name_tr = EXCLUDED.name_tr, name_pt = EXCLUDED.name_pt,
        name_ar = EXCLUDED.name_ar, name_ru = EXCLUDED.name_ru,
        description_en = EXCLUDED.description_en,
        price_usdd = EXCLUDED.price_usdd, stock = EXCLUDED.stock,
        images = EXCLUDED.images, is_featured = EXCLUDED.is_featured,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `;
    console.log(`  ✓ ${p.name_en} — $${p.price_usdd}`);
  }

  await sql.end();
  console.log('\n✅ Seed complete!', CATEGORIES.length, 'categories,', PRODUCTS.length, 'products.');
}

seed().catch(e => { console.error('Seed failed:', e.message); process.exit(1); });
