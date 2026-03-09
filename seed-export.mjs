import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const CDN = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/ebebYjMErshCmhKiJP5h4X';

const IMAGES = {
  visionSystem: `${CDN}/GLAA0WSCm3sK_cff9d011.webp`,
  visionInspection: `${CDN}/LA2GdIZapBEA_a4b888b5.jpg`,
  underwaterRobotHull: `${CDN}/sCxhlU80gTRN_c9d5c1bf.jpg`,
  underwaterRobotROV: `${CDN}/6zTdbtIrZkTY_6f0d8e8d.jpg`,
  underwaterRobotCrawler: `${CDN}/xNxqELFhbg3C_81556260.png`,
  steamGenerator: `${CDN}/zZP4ukb54BsO_fd567937.jpg`,
  steamGeneratorIndustrial: `${CDN}/kscNNXlPoege_63d6c33b.jpg`,
  dreameL40: `${CDN}/YGy6xAggEC04_eb621760.jpg`,
  dreameL10s: `${CDN}/kL9prtUZRY55_9fb2c695.jpg`,
  vwID3: `${CDN}/c79UDygEy5oj_4c07493a.jpg`,
  vwID4: `${CDN}/RCciDDBz3qwo_7cf630f3.jpg`,
  liAutoL9: `${CDN}/DoVALvv2NQAL_ac70979d.jpg`,
  bydHan: `${CDN}/oRDU7UMl5QwC_77fdca51.png`,
  bydHanHonor: `${CDN}/x7MgDmpCuKnw_147ada71.png`,
  catlBattery: `${CDN}/nX6Jlilqj0z9_33488e0d.jpg`,
  catlPack: `${CDN}/vK3DrbYX2PNL_0c01d795.png`,
  uhvSubstation: `${CDN}/DXYBh72r5lCC_4372eb47.jpg`,
  polyacrylamide: `${CDN}/GWIRePwbvOy5_e4c2f201.jpg`,
  snowGlobe1: `${CDN}/YWQOUO1GIF3X_bda4a223.webp`,
  snowGlobe2: `${CDN}/SUpHwCLpuNHf_cbb1f837.jpg`,
  snowGlobe3: `${CDN}/lsbU9FNV9Kd7_d42cb190.jpg`,
  christmasVillage: `${CDN}/BakjAPWeqsoQ_2185a9ec.webp`,
};

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get existing category IDs
const [cats] = await conn.execute('SELECT id, slug FROM categories');
const catMap = {};
for (const c of cats) catMap[c.slug] = c.id;
console.log('Existing categories:', Object.keys(catMap));

// Helper to get or create category
async function getOrCreateCat(slug, nameEn, nameEs, nameTr, namePt, nameAr, nameRu) {
  if (catMap[slug]) return catMap[slug];
  const [r] = await conn.execute(
    'INSERT INTO categories (slug, nameEn, nameEs, nameTr, namePt, nameAr, nameRu) VALUES (?,?,?,?,?,?,?)',
    [slug, nameEn, nameEs, nameTr, namePt, nameAr, nameRu]
  );
  catMap[slug] = r.insertId;
  console.log(`Created category: ${slug} (id=${r.insertId})`);
  return r.insertId;
}

// Create/get categories
const catIndustrial = await getOrCreateCat('industrial-equipment', 'Industrial Equipment', 'Equipos Industriales', 'Endüstriyel Ekipman', 'Equipamentos Industriais', 'المعدات الصناعية', 'Промышленное оборудование');
const catEV = await getOrCreateCat('electric-vehicles', 'Electric Vehicles', 'Vehículos Eléctricos', 'Elektrikli Araçlar', 'Veículos Elétricos', 'السيارات الكهربائية', 'Электромобили');
const catSmartHome = await getOrCreateCat('smart-home', 'Smart Home Appliances', 'Electrodomésticos Inteligentes', 'Akıllı Ev Aletleri', 'Eletrodomésticos Inteligentes', 'الأجهزة المنزلية الذكية', 'Умная бытовая техника');
const catChemical = await getOrCreateCat('chemical-materials', 'Chemical Materials', 'Materiales Químicos', 'Kimyasal Malzemeler', 'Materiais Químicos', 'المواد الكيميائية', 'Химические материалы');
const catConsumer = await getOrCreateCat('consumer-goods', 'Consumer Goods', 'Bienes de Consumo', 'Tüketim Malları', 'Bens de Consumo', 'السلع الاستهلاكية', 'Потребительские товары');
const catPower = await getOrCreateCat('power-infrastructure', 'Power Infrastructure', 'Infraestructura Eléctrica', 'Güç Altyapısı', 'Infraestrutura de Energia', 'البنية التحتية للطاقة', 'Энергетическая инфраструктура');
const catUnderwater = await getOrCreateCat('underwater-robotics', 'Underwater Robotics', 'Robótica Submarina', 'Su Altı Robotik', 'Robótica Subaquática', 'الروبوتات تحت الماء', 'Подводная робототехника');

// Helper to insert product
async function insertProduct(p) {
  // images column stores JSON array of URLs
  const imagesJson = JSON.stringify([p.imageUrl]);
  const [r] = await conn.execute(
    `INSERT INTO products (slug, nameEn, nameEs, nameTr, namePt, nameAr, nameRu,
      descriptionEn, priceUsdd, stock, categoryId, images, isFeatured, isActive)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [p.slug, p.nameEn, p.nameEs, p.nameTr, p.namePt, p.nameAr, p.nameRu,
     p.descriptionEn, p.priceUsdd, p.stock, p.categoryId, imagesJson, p.isFeatured ? 1 : 0, 1]
  );
  console.log(`  Inserted: ${p.nameEn} (id=${r.insertId})`);
}

console.log('\n--- Seeding Industrial Equipment ---');
await insertProduct({
  slug: 'ai-vision-inspection-system',
  nameEn: 'AI Vision Inspection System', nameEs: 'Sistema de Inspección por Visión IA', nameTr: 'AI Görüntü Denetim Sistemi', namePt: 'Sistema de Inspeção por Visão IA', nameAr: 'نظام فحص الرؤية بالذكاء الاصطناعي', nameRu: 'Система визуального контроля ИИ',
  descriptionEn: 'High-precision AI-powered machine vision inspection system. Detects defects at 0.01mm resolution at 1200 units/min. Replaces German/Japanese systems at 40% lower cost. Includes 7×24h local technical support. Used in automotive, electronics, and pharmaceutical manufacturing.',
  priceUsdd: '18500.00', stock: 12, categoryId: catIndustrial, imageUrl: IMAGES.visionSystem, isFeatured: true,
});
await insertProduct({
  slug: 'industrial-quality-detection-station',
  nameEn: 'Industrial Quality Detection Workstation', nameEs: 'Estación de Detección de Calidad Industrial', nameTr: 'Endüstriyel Kalite Tespit İstasyonu', namePt: 'Estação de Detecção de Qualidade Industrial', nameAr: 'محطة كشف الجودة الصناعية', nameRu: 'Рабочая станция контроля качества',
  descriptionEn: 'Compact inline quality inspection workstation with 4K camera array and deep learning defect classifier. Replaces manual inspection at 1/5 the cost of European equivalents. Plug-and-play integration with existing production lines.',
  priceUsdd: '8900.00', stock: 20, categoryId: catIndustrial, imageUrl: IMAGES.visionInspection, isFeatured: false,
});

console.log('\n--- Seeding Steam Generators ---');
await insertProduct({
  slug: 'industrial-electric-steam-generator-500kw',
  nameEn: 'Industrial Electric Steam Generator 500kW', nameEs: 'Generador de Vapor Eléctrico Industrial 500kW', nameTr: 'Endüstriyel Elektrikli Buhar Jeneratörü 500kW', namePt: 'Gerador de Vapor Elétrico Industrial 500kW', nameAr: 'مولد البخار الكهربائي الصناعي 500 كيلوواط', nameRu: 'Промышленный электрический парогенератор 500 кВт',
  descriptionEn: '500kW industrial electric steam generator. Pressure: 0.3–1.0 MPa. Efficiency >98%. 3x cheaper than European imports. Sold to 60+ countries including Africa and Southeast Asia. CE certified. Ideal for food processing, textile, chemical industries.',
  priceUsdd: '12800.00', stock: 8, categoryId: catIndustrial, imageUrl: IMAGES.steamGenerator, isFeatured: true,
});
await insertProduct({
  slug: 'industrial-steam-generator-200kw',
  nameEn: 'Compact Industrial Steam Generator 200kW', nameEs: 'Generador de Vapor Industrial Compacto 200kW', nameTr: 'Kompakt Endüstriyel Buhar Jeneratörü 200kW', namePt: 'Gerador de Vapor Industrial Compacto 200kW', nameAr: 'مولد البخار الصناعي المدمج 200 كيلوواط', nameRu: 'Компактный промышленный парогенератор 200 кВт',
  descriptionEn: 'Compact 200kW electric steam generator for small-to-medium factories. Fast startup in 3 minutes. Automatic water feed and pressure control. 1/3 the price of imported alternatives. Full CE/ISO certification.',
  priceUsdd: '5600.00', stock: 15, categoryId: catIndustrial, imageUrl: IMAGES.steamGeneratorIndustrial, isFeatured: false,
});

console.log('\n--- Seeding Underwater Robotics (Shihang) ---');
await insertProduct({
  slug: 'shihang-hull-cleaning-robot-pro',
  nameEn: 'Shihang Hull Cleaning Robot Pro', nameEs: 'Robot de Limpieza de Casco Shihang Pro', nameTr: 'Shihang Gemi Gövdesi Temizleme Robotu Pro', namePt: 'Robô de Limpeza de Casco Shihang Pro', nameAr: 'روبوت تنظيف هيكل السفينة شيهانغ برو', nameRu: 'Робот для очистки корпуса судна Shihang Pro',
  descriptionEn: 'World航 (Shihang) underwater hull cleaning robot. Magnetic crawler design, 6 thrusters, 4K underwater camera. Cleans 800m²/hr. Reduces fuel consumption by 10-15% after cleaning. No dry-dock required. Replaces $500K European systems at a fraction of the cost.',
  priceUsdd: '85000.00', stock: 5, categoryId: catUnderwater, imageUrl: IMAGES.underwaterRobotHull, isFeatured: true,
});
await insertProduct({
  slug: 'underwater-rov-hull-inspection',
  nameEn: 'Underwater ROV Hull Inspection System', nameEs: 'Sistema de Inspección ROV Submarino', nameTr: 'Su Altı ROV Gövde Denetim Sistemi', namePt: 'Sistema de Inspeção ROV Subaquático', nameAr: 'نظام فحص هيكل السفينة بالمركبة تحت الماء', nameRu: 'Подводный ROV для инспекции корпуса',
  descriptionEn: 'Professional underwater ROV for ship hull and dam inspection. 100m depth rating, 4K camera with LED lighting, sonar mapping. Replaces costly diver inspections. Includes laptop control station and 100m tether.',
  priceUsdd: '28000.00', stock: 10, categoryId: catUnderwater, imageUrl: IMAGES.underwaterRobotROV, isFeatured: false,
});
await insertProduct({
  slug: 'underwater-magnetic-crawler-robot',
  nameEn: 'Underwater Magnetic Crawler Cleaning Robot', nameEs: 'Robot Rastreador Magnético Submarino', nameTr: 'Su Altı Manyetik Paletli Temizleme Robotu', namePt: 'Robô Rastreador Magnético Subaquático', nameAr: 'روبوت الزاحف المغناطيسي تحت الماء', nameRu: 'Подводный магнитный гусеничный робот',
  descriptionEn: 'Compact magnetic crawler robot for underwater hull cleaning and inspection. 4 magnetic wheels, 500W brushes, 50m depth. Ideal for port operators and ship owners. Saves $30,000+ per cleaning vs traditional methods.',
  priceUsdd: '42000.00', stock: 8, categoryId: catUnderwater, imageUrl: IMAGES.underwaterRobotCrawler, isFeatured: false,
});

console.log('\n--- Seeding Smart Home (Dreame) ---');
await insertProduct({
  slug: 'dreame-l40-ultra-robot-vacuum',
  nameEn: 'Dreame L40 Ultra Robot Vacuum & Mop', nameEs: 'Aspiradora Robot Dreame L40 Ultra', nameTr: 'Dreame L40 Ultra Robot Süpürge ve Paspas', namePt: 'Aspirador Robô Dreame L40 Ultra', nameAr: 'مكنسة روبوت دريم L40 ألترا', nameRu: 'Робот-пылесос Dreame L40 Ultra',
  descriptionEn: 'Dreame L40 Ultra — flagship robot vacuum and mop with 12,000Pa suction, self-emptying, self-washing, self-drying station. AI obstacle avoidance, 3D mapping. Priced 40% below equivalent European brands. Global bestseller on Amazon.',
  priceUsdd: '899.00', stock: 50, categoryId: catSmartHome, imageUrl: IMAGES.dreameL40, isFeatured: true,
});
await insertProduct({
  slug: 'dreame-l10s-ultra-robot-vacuum',
  nameEn: 'Dreame L10s Ultra Robot Vacuum & Mop', nameEs: 'Aspiradora Robot Dreame L10s Ultra', nameTr: 'Dreame L10s Ultra Robot Süpürge', namePt: 'Aspirador Robô Dreame L10s Ultra', nameAr: 'مكنسة روبوت دريم L10s ألترا', nameRu: 'Робот-пылесос Dreame L10s Ultra',
  descriptionEn: 'Dreame L10s Ultra robot vacuum with 7,000Pa suction, LiDAR navigation, auto-empty base. Mops and vacuums simultaneously. 60-day hands-free cleaning. Comparable to Roomba j9+ at half the price.',
  priceUsdd: '649.00', stock: 80, categoryId: catSmartHome, imageUrl: IMAGES.dreameL10s, isFeatured: false,
});

console.log('\n--- Seeding Electric Vehicles ---');
await insertProduct({
  slug: 'volkswagen-id3-china-parallel-export',
  nameEn: 'Volkswagen ID.3 (China Edition) — Parallel Export', nameEs: 'Volkswagen ID.3 (Edición China) — Exportación Paralela', nameTr: 'Volkswagen ID.3 (Çin Versiyonu) — Paralel İhracat', namePt: 'Volkswagen ID.3 (Edição China) — Exportação Paralela', nameAr: 'فولكس واغن ID.3 (الإصدار الصيني) — تصدير موازي', nameRu: 'Volkswagen ID.3 (Китайская версия) — Параллельный экспорт',
  descriptionEn: 'SAIC Volkswagen ID.3 manufactured in China. Starting price in China ~¥120,000 vs €31,300 in Germany — save up to ¥200,000 per unit. Identical specs to European model. Popular parallel export item. Contact us for bulk fleet pricing.',
  priceUsdd: '16800.00', stock: 30, categoryId: catEV, imageUrl: IMAGES.vwID3, isFeatured: true,
});
await insertProduct({
  slug: 'volkswagen-id4-china-parallel-export',
  nameEn: 'Volkswagen ID.4 (China Edition) — Parallel Export', nameEs: 'Volkswagen ID.4 (Edición China) — Exportación Paralela', nameTr: 'Volkswagen ID.4 (Çin Versiyonu) — Paralel İhracat', namePt: 'Volkswagen ID.4 (Edição China) — Exportação Paralela', nameAr: 'فولكس واغن ID.4 (الإصدار الصيني) — تصدير موازي', nameRu: 'Volkswagen ID.4 (Китайская версия) — Параллельный экспорт',
  descriptionEn: 'SAIC Volkswagen ID.4 X SUV, China-manufactured. 520km CLTC range, 204hp. Priced 35% below European MSRP. Ideal for fleet operators and parallel importers in Central Asia, Middle East, and Southeast Asia.',
  priceUsdd: '22500.00', stock: 25, categoryId: catEV, imageUrl: IMAGES.vwID4, isFeatured: false,
});
await insertProduct({
  slug: 'li-auto-l9-parallel-export',
  nameEn: 'Li Auto L9 Extended-Range SUV — Parallel Export', nameEs: 'Li Auto L9 SUV de Autonomía Extendida', nameTr: 'Li Auto L9 Menzil Uzatmalı SUV', namePt: 'Li Auto L9 SUV de Autonomia Estendida', nameAr: 'لي أوتو L9 سيارة دفع رباعي موسعة المدى', nameRu: 'Li Auto L9 SUV с увеличенным запасом хода',
  descriptionEn: 'Li Auto L9 6-seat flagship SUV with extended-range electric system. 1315km total range. Sells for ¥450,000 in China but ¥1,000,000+ in Central Asia. Huge arbitrage opportunity for parallel importers. Air suspension, 15.7" screen, LIDAR.',
  priceUsdd: '62000.00', stock: 15, categoryId: catEV, imageUrl: IMAGES.liAutoL9, isFeatured: true,
});
await insertProduct({
  slug: 'byd-han-ev-parallel-export',
  nameEn: 'BYD Han EV — Parallel Export', nameEs: 'BYD Han EV — Exportación Paralela', nameTr: 'BYD Han EV — Paralel İhracat', namePt: 'BYD Han EV — Exportação Paralela', nameAr: 'BYD هان EV — تصدير موازي', nameRu: 'BYD Han EV — Параллельный экспорт',
  descriptionEn: 'BYD Han EV luxury sedan, 610km CLTC range, 0-100km/h in 3.9s. Blade Battery technology. Priced 50% below comparable European luxury EVs. Strong demand in Europe, Middle East, and Southeast Asia. Available in multiple colors.',
  priceUsdd: '38000.00', stock: 20, categoryId: catEV, imageUrl: IMAGES.bydHan, isFeatured: false,
});
await insertProduct({
  slug: 'catl-lfp-battery-pack-46kwh',
  nameEn: 'CATL LFP Battery Pack 46kWh (EV Grade)', nameEs: 'Paquete de Baterías CATL LFP 46kWh', nameTr: 'CATL LFP Batarya Paketi 46kWh', namePt: 'Pacote de Bateria CATL LFP 46kWh', nameAr: 'حزمة بطارية CATL LFP 46 كيلوواط ساعة', nameRu: 'Аккумуляторный блок CATL LFP 46 кВтч',
  descriptionEn: 'CATL 166V 280Ah 46kWh LFP battery pack, EV-grade. 3000+ cycle life, zero thermal runaway risk. Used in commercial EVs, energy storage, and marine applications. Direct factory pricing — 60% below Western equivalents.',
  priceUsdd: '8500.00', stock: 40, categoryId: catEV, imageUrl: IMAGES.catlBattery, isFeatured: false,
});

console.log('\n--- Seeding Power Infrastructure ---');
await insertProduct({
  slug: 'uhv-transformer-substation-equipment',
  nameEn: 'UHV Transformer Substation Components', nameEs: 'Componentes de Subestación Transformadora UHV', nameTr: 'UHV Trafo Trafo Merkezi Bileşenleri', namePt: 'Componentes de Subestação Transformadora UHV', nameAr: 'مكونات محطة المحولات فائقة الجهد', nameRu: 'Компоненты подстанции UHV трансформатора',
  descriptionEn: 'Ultra-high voltage (UHV) transformer substation components including bushings, surge arresters, and insulator strings. China leads global UHV technology. Priced 50% below ABB/Siemens equivalents. Exported to 30+ countries. Suitable for 500kV–1100kV systems.',
  priceUsdd: '125000.00', stock: 5, categoryId: catPower, imageUrl: IMAGES.uhvSubstation, isFeatured: true,
});
await insertProduct({
  slug: 'catl-energy-storage-battery-system',
  nameEn: 'CATL Grid-Scale Energy Storage System', nameEs: 'Sistema de Almacenamiento de Energía CATL', nameTr: 'CATL Şebeke Ölçekli Enerji Depolama Sistemi', namePt: 'Sistema de Armazenamento de Energia CATL', nameAr: 'نظام تخزين الطاقة على مستوى الشبكة CATL', nameRu: 'Система накопления энергии CATL',
  descriptionEn: 'CATL grid-scale LFP energy storage system. Modular design, 100kWh–10MWh scalable. 25-year design life, >90% round-trip efficiency. Used in solar/wind farms, microgrids, and industrial peak shaving. 40% cheaper than Tesla Megapack.',
  priceUsdd: '185000.00', stock: 3, categoryId: catPower, imageUrl: IMAGES.catlPack, isFeatured: false,
});

console.log('\n--- Seeding Chemical Materials ---');
await insertProduct({
  slug: 'polyacrylamide-pam-industrial-25kg',
  nameEn: 'Polyacrylamide (PAM) Industrial Grade 25kg', nameEs: 'Poliacrilamida (PAM) Grado Industrial 25kg', nameTr: 'Poliakrilamid (PAM) Endüstriyel Sınıf 25kg', namePt: 'Poliacrilamida (PAM) Grau Industrial 25kg', nameAr: 'بولي أكريلاميد (PAM) درجة صناعية 25 كجم', nameRu: 'Полиакриламид (PAM) промышленный 25 кг',
  descriptionEn: 'High-performance polyacrylamide flocculant for water treatment and papermaking. Efficiency upgraded from 74% to 91% vs European brands. Reduces sludge dewatering costs by 35%. Saves clients $2M+/year. Replaced BASF in 50+ Southeast Asian paper mills. 25kg bag.',
  priceUsdd: '185.00', stock: 500, categoryId: catChemical, imageUrl: IMAGES.polyacrylamide, isFeatured: false,
});

console.log('\n--- Seeding Consumer Goods (Yiwu Christmas) ---');
await insertProduct({
  slug: 'yiwu-christmas-snow-globe-santa',
  nameEn: 'Yiwu Christmas Snow Globe — Santa Claus', nameEs: 'Bola de Nieve Navideña Yiwu — Papá Noel', nameTr: 'Yiwu Noel Kar Küresi — Noel Baba', namePt: 'Globo de Neve de Natal Yiwu — Papai Noel', nameAr: 'كرة الثلج الكريسماسية يوو — بابا نويل', nameRu: 'Рождественский снежный шар Иу — Санта Клаус',
  descriptionEn: 'Handcrafted Christmas snow globe with Santa Claus figurine. Factory price: ¥18 RMB. Retail price in Paris Christmas markets: €25 (~¥200 RMB). 10x markup opportunity. MOQ 100 units. Yiwu supply chain — world\'s largest Christmas goods hub.',
  priceUsdd: '2.50', stock: 5000, categoryId: catConsumer, imageUrl: IMAGES.snowGlobe1, isFeatured: false,
});
await insertProduct({
  slug: 'yiwu-christmas-snow-globe-tree',
  nameEn: 'Yiwu Christmas Snow Globe — Christmas Tree', nameEs: 'Bola de Nieve Navideña Yiwu — Árbol de Navidad', nameTr: 'Yiwu Noel Kar Küresi — Noel Ağacı', namePt: 'Globo de Neve de Natal Yiwu — Árvore de Natal', nameAr: 'كرة الثلج الكريسماسية يوو — شجرة الكريسماس', nameRu: 'Рождественский снежный шар Иу — Ёлка',
  descriptionEn: 'Musical Christmas tree snow globe with LED lights and rotating base. Plays 8 Christmas songs. Factory price ¥35 RMB. European retail price €35–50. Perfect for wholesale to European Christmas markets and gift shops. MOQ 50 units.',
  priceUsdd: '4.80', stock: 3000, categoryId: catConsumer, imageUrl: IMAGES.snowGlobe2, isFeatured: false,
});
await insertProduct({
  slug: 'yiwu-christmas-miniature-village-set',
  nameEn: 'Yiwu Christmas Miniature Village Set', nameEs: 'Set de Pueblo Navideño en Miniatura Yiwu', nameTr: 'Yiwu Noel Minyatür Köy Seti', namePt: 'Conjunto de Vila Natalina em Miniatura Yiwu', nameAr: 'مجموعة قرية كريسماس مصغرة يوو', nameRu: 'Набор рождественской миниатюрной деревни Иу',
  descriptionEn: 'Resin Christmas miniature village set with musical snow globe centerpiece. 12-piece set including church, houses, trees, and figurines. European retailers sell for €80–120/set. Factory wholesale: ¥120 RMB/set. Ideal for department stores and Christmas markets.',
  priceUsdd: '16.50', stock: 1000, categoryId: catConsumer, imageUrl: IMAGES.christmasVillage, isFeatured: false,
});

const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM products WHERE isActive = 1');
console.log(`\n✅ Done! Total active products: ${countResult[0].total}`);

await conn.end();
