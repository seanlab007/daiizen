import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const CDN = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/ebebYjMErshCmhKiJP5h4X';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get existing categories
const [cats] = await conn.execute('SELECT id, slug FROM categories');
const catMap = {};
for (const c of cats) catMap[c.slug] = c.id;

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

async function insertProduct(p) {
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

const catWifi = await getOrCreateCat('portable-wifi', 'Portable Wi-Fi & Hotspots', 'Wi-Fi Portátil y Puntos de Acceso', 'Taşınabilir Wi-Fi ve Hotspot', 'Wi-Fi Portátil e Hotspots', 'واي فاي محمول ونقاط اتصال', 'Портативный Wi-Fi и хот-споты');
const catPower = await getOrCreateCat('power-banks', 'Power Banks & Chargers', 'Bancos de Energía y Cargadores', 'Taşınabilir Şarj Cihazları', 'Bancos de Energia e Carregadores', 'بنوك الطاقة والشواحن', 'Портативные зарядные устройства');

console.log('\n--- Seeding Portable Wi-Fi Products ---');
await insertProduct({
  slug: 'portable-4g-lte-mifi-router',
  nameEn: 'Portable 4G LTE MiFi Router — Unlocked', nameEs: 'Router MiFi 4G LTE Portátil — Desbloqueado', nameTr: 'Taşınabilir 4G LTE MiFi Router — Kilitsiz', namePt: 'Roteador MiFi 4G LTE Portátil — Desbloqueado', nameAr: 'راوتر MiFi 4G LTE محمول — غير مقيد', nameRu: 'Портативный 4G LTE MiFi роутер — разблокированный',
  descriptionEn: 'Compact 4G LTE pocket WiFi router. Supports all global SIM cards (unlocked). Up to 10 devices simultaneously. 3000mAh battery — 8 hours continuous use. 150Mbps download speed. Ideal for travel, remote work, and field operations. China factory price — 60% below European retail.',
  priceUsdd: '28.90', stock: 200, categoryId: catWifi, imageUrl: `${CDN}/JYHlgNHTL1JD_2855ab0d.jpg`, isFeatured: true,
});
await insertProduct({
  slug: 'portable-4g-5g-wifi-hotspot-display',
  nameEn: 'Portable 4G/5G WiFi Hotspot with Display', nameEs: 'Hotspot WiFi 4G/5G Portátil con Pantalla', nameTr: 'Ekranlı Taşınabilir 4G/5G WiFi Hotspot', namePt: 'Hotspot WiFi 4G/5G Portátil com Display', nameAr: 'نقطة اتصال WiFi 4G/5G محمولة مع شاشة', nameRu: 'Портативный 4G/5G WiFi хот-спот с дисплеем',
  descriptionEn: 'Advanced 4G/5G pocket WiFi with color LCD display showing signal strength, battery, and data usage. Supports 32 simultaneous connections. 5000mAh battery. Dual-band 2.4G+5G WiFi 6. Perfect for Dianxiaoer (电小二) resellers and travel operators.',
  priceUsdd: '45.50', stock: 150, categoryId: catWifi, imageUrl: `${CDN}/rlwlTsUKjOqn_6239fe98.jpg`, isFeatured: false,
});
await insertProduct({
  slug: '5g-wifi6-portable-hotspot-router',
  nameEn: '5G WiFi 6 Portable Hotspot Router', nameEs: 'Router Hotspot Portátil 5G WiFi 6', nameTr: '5G WiFi 6 Taşınabilir Hotspot Router', namePt: 'Roteador Hotspot Portátil 5G WiFi 6', nameAr: 'راوتر هوت سبوت محمول 5G WiFi 6', nameRu: '5G WiFi 6 портативный хот-спот роутер',
  descriptionEn: 'Next-gen 5G WiFi 6 portable router. MediaTek MT6877 Dimensity 900 chipset. Up to 3.5Gbps download on 5G. Supports 64 devices. Type-C fast charging. Ideal for enterprise field teams, event organizers, and Dianxiaoer (电小二) shared WiFi business operators.',
  priceUsdd: '89.00', stock: 100, categoryId: catWifi, imageUrl: `${CDN}/hWpUzfc5stFk_9e8ba445.webp`, isFeatured: true,
});
await insertProduct({
  slug: '5g-pocket-wifi-dual-sim',
  nameEn: '5G Pocket WiFi — Dual SIM Unlocked', nameEs: 'WiFi de Bolsillo 5G — Dual SIM Desbloqueado', nameTr: '5G Cep WiFi — Çift SIM Kilitsiz', namePt: 'WiFi de Bolso 5G — Dual SIM Desbloqueado', nameAr: 'واي فاي جيب 5G — شريحتان غير مقيد', nameRu: '5G карманный WiFi — Dual SIM разблокированный',
  descriptionEn: 'Ultra-compact 5G pocket WiFi with dual SIM support. Switch between carriers for best signal. 4000mAh battery. Supports NSA/SA 5G networks. Ideal for Dianxiaoer (电小二) operators running shared WiFi rental businesses in markets, hotels, and tourist areas.',
  priceUsdd: '68.00', stock: 120, categoryId: catWifi, imageUrl: `${CDN}/UXJy9Eeyn22P_e103eee2.webp`, isFeatured: false,
});
await insertProduct({
  slug: 'travel-vpn-router-gliinet',
  nameEn: 'Travel VPN Router — GL.iNet Pocket Router', nameEs: 'Router VPN de Viaje — GL.iNet Router de Bolsillo', nameTr: 'Seyahat VPN Router — GL.iNet Cep Router', namePt: 'Roteador VPN de Viagem — GL.iNet Router de Bolso', nameAr: 'راوتر VPN للسفر — GL.iNet راوتر جيب', nameRu: 'Дорожный VPN роутер — GL.iNet карманный роутер',
  descriptionEn: 'GL.iNet pocket travel router with built-in OpenVPN/WireGuard support. Converts hotel/public WiFi into secure private network. Dual-band WiFi, USB tethering, Ethernet. 300Mbps. Ideal for business travelers, journalists, and expats in restricted regions.',
  priceUsdd: '49.00', stock: 80, categoryId: catWifi, imageUrl: `${CDN}/a29gewYPg6FG_73932d6c.jpg`, isFeatured: false,
});
await insertProduct({
  slug: 'tplink-wifi7-travel-router',
  nameEn: 'TP-Link WiFi 7 Travel Router', nameEs: 'Router de Viaje TP-Link WiFi 7', nameTr: 'TP-Link WiFi 7 Seyahat Router', namePt: 'Roteador de Viagem TP-Link WiFi 7', nameAr: 'راوتر سفر TP-Link WiFi 7', nameRu: 'Дорожный роутер TP-Link WiFi 7',
  descriptionEn: 'TP-Link latest WiFi 7 (802.11be) travel router. Up to 5.8Gbps combined throughput. Multi-Link Operation (MLO) for ultra-low latency. Compact design fits in a pocket. Perfect for power users and remote workers who need the fastest possible mobile connectivity.',
  priceUsdd: '119.00', stock: 60, categoryId: catWifi, imageUrl: `${CDN}/lCAOlk4CpKB8_e53ff850.jpg`, isFeatured: false,
});

console.log('\n--- Seeding Power Banks ---');
await insertProduct({
  slug: 'anker-20000mah-power-bank',
  nameEn: 'Anker 20000mAh Power Bank — Dual USB', nameEs: 'Banco de Energía Anker 20000mAh — Doble USB', nameTr: 'Anker 20000mAh Taşınabilir Şarj — Çift USB', namePt: 'Banco de Energia Anker 20000mAh — USB Duplo', nameAr: 'بنك طاقة Anker 20000 مللي أمبير — USB مزدوج', nameRu: 'Портативное зарядное Anker 20000 мАч — Dual USB',
  descriptionEn: 'Anker 20000mAh high-capacity power bank. Charges iPhone 16 up to 5 times. Dual USB-A + USB-C output. 15W max output. Compact design with LED indicator. Ideal for travel, emergency backup, and field operations. Global bestseller.',
  priceUsdd: '35.99', stock: 300, categoryId: catPower, imageUrl: `${CDN}/OtqbBj3FtqM4_82916d76.jpeg`, isFeatured: true,
});
await insertProduct({
  slug: 'anker-20000mah-power-bank-usbc',
  nameEn: 'Anker 20000mAh Power Bank — USB-C 65W', nameEs: 'Banco de Energía Anker 20000mAh — USB-C 65W', nameTr: 'Anker 20000mAh Taşınabilir Şarj — USB-C 65W', namePt: 'Banco de Energia Anker 20000mAh — USB-C 65W', nameAr: 'بنك طاقة Anker 20000 مللي أمبير — USB-C 65W', nameRu: 'Портативное зарядное Anker 20000 мАч — USB-C 65W',
  descriptionEn: 'Anker 737 Power Bank with 65W USB-C output — charges laptops, tablets, and phones simultaneously. 20000mAh capacity. Smart display showing wattage and remaining charge. Foldable prongs for wall charging. The ultimate travel companion.',
  priceUsdd: '79.99', stock: 200, categoryId: catPower, imageUrl: `${CDN}/WoMsPE5B2vJg_a53eede1.jpg`, isFeatured: false,
});
await insertProduct({
  slug: 'solar-power-bank-30000mah',
  nameEn: 'Solar Power Bank 30000mAh — Outdoor Rugged', nameEs: 'Banco de Energía Solar 30000mAh — Resistente para Exteriores', nameTr: 'Güneş Enerjili Güç Bankası 30000mAh — Sağlam Outdoor', namePt: 'Banco de Energia Solar 30000mAh — Resistente para Exterior', nameAr: 'بنك طاقة شمسية 30000 مللي أمبير — متين للخارج', nameRu: 'Солнечный павербанк 30000 мАч — прочный для улицы',
  descriptionEn: 'Heavy-duty solar power bank with 30000mAh capacity and dual solar panels. IP67 waterproof, dustproof, shockproof. Built-in LED flashlight. Charges via solar or USB-C. Perfect for camping, hiking, disaster preparedness, and emergency zones. Popular in conflict regions.',
  priceUsdd: '42.00', stock: 150, categoryId: catPower, imageUrl: `${CDN}/Y9iYRetpnzuD_63c83775.png`, isFeatured: true,
});
await insertProduct({
  slug: 'solar-power-bank-30000mah-carabiner',
  nameEn: 'Solar Power Bank 30000mAh — Carabiner Clip', nameEs: 'Banco de Energía Solar 30000mAh — Clip Mosquetón', nameTr: 'Güneş Enerjili Güç Bankası 30000mAh — Karabina Klips', namePt: 'Banco de Energia Solar 30000mAh — Clip Mosquetão', nameAr: 'بنك طاقة شمسية 30000 مللي أمبير — مشبك كاراباينر', nameRu: 'Солнечный павербанк 30000 мАч — карабин клип',
  descriptionEn: 'Outdoor solar power bank with carabiner clip for backpack attachment. 30000mAh, 3 solar panels, compass, LED torch. Charges 3 devices simultaneously. Waterproof. Ideal for military field use, NGO operations, and outdoor enthusiasts.',
  priceUsdd: '38.50', stock: 200, categoryId: catPower, imageUrl: `${CDN}/V3UpCcytlaui_18326f71.jpg`, isFeatured: false,
});
await insertProduct({
  slug: 'xiaomi-slim-power-bank-10000mah',
  nameEn: 'Xiaomi Slim Power Bank 10000mAh', nameEs: 'Banco de Energía Delgado Xiaomi 10000mAh', nameTr: 'Xiaomi İnce Güç Bankası 10000mAh', namePt: 'Banco de Energia Slim Xiaomi 10000mAh', nameAr: 'بنك طاقة Xiaomi النحيف 10000 مللي أمبير', nameRu: 'Тонкий павербанк Xiaomi 10000 мАч',
  descriptionEn: 'Xiaomi slim aluminum power bank, 10000mAh. Ultra-thin 14.1mm profile. USB-C bidirectional fast charging. Charges iPhone 16 twice. Elegant design — popular parallel export item in Europe and Middle East at 40% below local retail price.',
  priceUsdd: '22.00', stock: 400, categoryId: catPower, imageUrl: `${CDN}/WsD4ZJLtjyIM_6e109469.jpg`, isFeatured: false,
});
await insertProduct({
  slug: 'slim-builtin-cable-power-bank-10000mah',
  nameEn: 'Slim Power Bank 10000mAh — Built-in Cable', nameEs: 'Banco de Energía Delgado 10000mAh — Cable Integrado', nameTr: 'İnce Güç Bankası 10000mAh — Dahili Kablo', namePt: 'Banco de Energia Slim 10000mAh — Cabo Integrado', nameAr: 'بنك طاقة نحيف 10000 مللي أمبير — كابل مدمج', nameRu: 'Тонкий павербанк 10000 мАч — встроенный кабель',
  descriptionEn: 'Ultra-slim power bank with built-in Lightning + USB-C retractable cables. No cable needed. 10000mAh, 22.5W fast charge. Fits in any pocket. Perfect for travelers who hate carrying extra cables. China factory price — 50% below US retail.',
  priceUsdd: '19.90', stock: 350, categoryId: catPower, imageUrl: `${CDN}/uVwMLlySFuix_985049bf.jpg`, isFeatured: false,
});

const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM products WHERE isActive = 1');
console.log(`\n✅ Done! Total active products: ${countResult[0].total}`);
await conn.end();
