import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// CDN base
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/ebebYjMErshCmhKiJP5h4X";

const IMGS = {
  fpvDrone: `${CDN}/CJyGvRVYb3PE_bf1b4c04.jpg`,
  tacticalDrone: `${CDN}/elXGvKGhiGLO_ca6c13b1.jpg`,
  djiMatrice400: `${CDN}/Oqr3HrKnU9oM_66603e78.jpg`,
  djiMatrice4: `${CDN}/M2p9Hv0ylwom_76fab54e.jpg`,
  f35: `${CDN}/KP7FlGdb8ZES_2977ecd0.jpg`,
  apacheHeli1: `${CDN}/Qw0UsRrkM6Cv_34f31aab.jpeg`,
  apacheHeli2: `${CDN}/f7K4D4wHo3LL_253fe4d9.jpeg`,
  ak47: `${CDN}/EOMM4idz1wlc_87d8439d.jpg`,
  m4carbine: `${CDN}/m8dwKROpGnuV_cff9f002.jpg`,
  ammoCan: `${CDN}/0efkergMrEYQ_2ecc3215.jpg`,
  ammo556: `${CDN}/wfiUbreMhOwH_321b6b13.png`,
  glock17: `${CDN}/muhI2iVcGqEK_243c5dbb.jpg`,
  barrettM82: `${CDN}/Rsea2iS5K1tH_08fbf135.jpg`,
  rpg7: `${CDN}/m2c0f332YiMP_4a1683c0.jpg`,
  amoxicillin500: `${CDN}/TXoznHIyPzOn_2849b314.jpg`,
  amoxicillinCaps: `${CDN}/av8fG04ObCWc_ec4acf8a.jpg`,
  quikclotGauze: `${CDN}/prhuyrgkyouD_75f26bef.jpg`,
  hemostatic: `${CDN}/dV4LQIp9ZaHl_f7a4a5e6.jpg`,
  morphineInjector: `${CDN}/OCMNhzMly9Wa_6f1b88c9.jpg`,
  morphineAutoInj: `${CDN}/Y0KUuvWpd3KR_f0593e9b.png`,
};

// Get or create categories (no nameZh column)
async function getOrCreateCategory(slug, nameEn) {
  const [rows] = await conn.execute("SELECT id FROM categories WHERE slug = ?", [slug]);
  if (rows.length > 0) return rows[0].id;
  const [result] = await conn.execute(
    "INSERT INTO categories (nameEn, nameEs, nameTr, namePt, nameAr, nameRu, slug) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [nameEn, nameEn, nameEn, nameEn, nameEn, nameEn, slug]
  );
  return result.insertId;
}

const emergencyId = await getOrCreateCategory("emergency-supplies", "Emergency Supplies");
const droneId = await getOrCreateCategory("drones-uav", "Drones & UAV");
const firearmsId = await getOrCreateCategory("firearms-ammo", "Firearms & Ammunition");
const militaryMedId = await getOrCreateCategory("military-medical", "Military Medical");
const aircraftId = await getOrCreateCategory("military-aircraft", "Military Aircraft");

console.log("Categories:", { emergencyId, droneId, firearmsId, militaryMedId, aircraftId });

const products = [
  // ── DRONES & UAV ──────────────────────────────────────────────────
  {
    slug: "fpv-combat-drone-5inch",
    nameEn: "FPV Combat Drone 5-inch Freestyle",
    nameEs: "Dron FPV de combate 5 pulgadas",
    nameTr: "FPV Savaş Dronu 5 inç",
    namePt: "Drone FPV de combate 5 polegadas",
    nameAr: "طائرة FPV قتالية 5 بوصة",
    nameRu: "FPV боевой дрон 5 дюймов",
    descEn: "High-speed FPV racing/combat drone with 5-inch propellers, 4S LiPo compatible, 120mph top speed. Used extensively in modern conflict zones for reconnaissance and payload delivery. Includes FPV goggles and controller.",
    priceUsdd: "1200.00",
    stock: 50,
    categoryId: droneId,
    images: [IMGS.fpvDrone],
  },
  {
    slug: "am-fpv-multi-role-drone",
    nameEn: "AM-FPV Multi-Role Military Drone",
    nameEs: "Dron militar AM-FPV multirol",
    nameTr: "AM-FPV Çok Amaçlı Askeri Drone",
    namePt: "Drone militar AM-FPV multiuso",
    nameAr: "طائرة AM-FPV العسكرية متعددة الأدوار",
    nameRu: "Многоцелевой военный дрон AM-FPV",
    descEn: "Professional multi-role FPV drone designed for contested military operations. Features 6-rotor design, 45-minute flight time, encrypted video link, and modular payload bay for reconnaissance or supply drops.",
    priceUsdd: "3500.00",
    stock: 20,
    categoryId: droneId,
    images: [IMGS.tacticalDrone],
  },
  {
    slug: "dji-matrice-400-enterprise",
    nameEn: "DJI Matrice 400 Enterprise Drone",
    nameEs: "Dron empresarial DJI Matrice 400",
    nameTr: "DJI Matrice 400 Kurumsal Drone",
    namePt: "Drone empresarial DJI Matrice 400",
    nameAr: "طائرة DJI Matrice 400 المؤسسية",
    nameRu: "Корпоративный дрон DJI Matrice 400",
    descEn: "DJI Matrice 400 enterprise-grade quadcopter with IP55 weather resistance, 38-minute flight time, and support for multiple payloads including thermal cameras and LiDAR. Ideal for ISR (Intelligence, Surveillance, Reconnaissance) missions.",
    priceUsdd: "8900.00",
    stock: 10,
    categoryId: droneId,
    images: [IMGS.djiMatrice400],
  },
  {
    slug: "dji-matrice-4t-thermal",
    nameEn: "DJI Matrice 4T Thermal Surveillance Drone",
    nameEs: "Dron de vigilancia térmica DJI Matrice 4T",
    nameTr: "DJI Matrice 4T Termal Gözetleme Dronu",
    namePt: "Drone de vigilância térmica DJI Matrice 4T",
    nameAr: "طائرة DJI Matrice 4T للمراقبة الحرارية",
    nameRu: "Тепловизионный дрон DJI Matrice 4T",
    descEn: "Next-generation DJI Matrice 4T with integrated thermal and wide-angle cameras, 43-minute flight time, and omnidirectional obstacle sensing. Perfect for night surveillance, search & rescue, and perimeter security.",
    priceUsdd: "12500.00",
    stock: 8,
    categoryId: droneId,
    images: [IMGS.djiMatrice4],
  },

  // ── MILITARY AIRCRAFT ──────────────────────────────────────────────
  {
    slug: "f35-lightning-ii-scale-model",
    nameEn: "F-35 Lightning II 1:48 Scale Diecast Model",
    nameEs: "Maqueta diecast F-35 Lightning II escala 1:48",
    nameTr: "F-35 Lightning II 1:48 Ölçekli Döküm Model",
    namePt: "Modelo diecast F-35 Lightning II escala 1:48",
    nameAr: "نموذج F-35 Lightning II بمقياس 1:48",
    nameRu: "Масштабная модель F-35 Lightning II 1:48",
    descEn: "Museum-quality 1:48 scale diecast model of the F-35 Lightning II stealth multirole fighter. Hand-painted with authentic markings, retractable landing gear, and opening canopy. Collector's edition with display stand.",
    priceUsdd: "280.00",
    stock: 35,
    categoryId: aircraftId,
    images: [IMGS.f35],
  },
  {
    slug: "ah64-apache-scale-model",
    nameEn: "AH-64 Apache Attack Helicopter 1:48 Scale Model",
    nameEs: "Maqueta helicóptero de ataque AH-64 Apache 1:48",
    nameTr: "AH-64 Apache Saldırı Helikopteri 1:48 Model",
    namePt: "Modelo helicóptero de ataque AH-64 Apache 1:48",
    nameAr: "نموذج مروحية الهجوم AH-64 Apache بمقياس 1:48",
    nameRu: "Масштабная модель вертолёта AH-64 Apache 1:48",
    descEn: "Highly detailed 1:48 scale diecast model of the Boeing AH-64 Apache attack helicopter. Features rotating rotor blades, authentic desert camouflage, and Hellfire missile replicas. Perfect for military aviation enthusiasts.",
    priceUsdd: "320.00",
    stock: 25,
    categoryId: aircraftId,
    images: [IMGS.apacheHeli1, IMGS.apacheHeli2],
  },

  // ── FIREARMS & AMMUNITION ──────────────────────────────────────────
  {
    slug: "ak47-assault-rifle-7-62mm",
    nameEn: "AK-47 Assault Rifle 7.62×39mm",
    nameEs: "Fusil de asalto AK-47 7.62×39mm",
    nameTr: "AK-47 Saldırı Tüfeği 7.62×39mm",
    namePt: "Fuzil de assalto AK-47 7.62×39mm",
    nameAr: "بندقية AK-47 الهجومية 7.62×39 ملم",
    nameRu: "Штурмовая винтовка АК-47 7,62×39 мм",
    descEn: "Iconic Soviet-designed AK-47 assault rifle chambered in 7.62×39mm. Gas-operated rotating bolt action, 30-round detachable box magazine, effective range 350m. Renowned for reliability in extreme conditions. Includes 3 magazines.",
    priceUsdd: "850.00",
    stock: 100,
    categoryId: firearmsId,
    images: [IMGS.ak47],
  },
  {
    slug: "m4-carbine-5-56mm",
    nameEn: "M4 Carbine 5.56×45mm NATO",
    nameEs: "Carabina M4 5.56×45mm OTAN",
    nameTr: "M4 Karabina 5.56×45mm NATO",
    namePt: "Carabina M4 5.56×45mm OTAN",
    nameAr: "كاربين M4 5.56×45 ملم ناتو",
    nameRu: "Карабин M4 5,56×45 мм НАТО",
    descEn: "US military standard M4 carbine in 5.56×45mm NATO. 14.5-inch barrel, collapsible stock, Picatinny rail system. Effective range 500m. Standard service rifle of US forces and NATO allies. Includes 5 STANAG magazines.",
    priceUsdd: "1200.00",
    stock: 80,
    categoryId: firearmsId,
    images: [IMGS.m4carbine],
  },
  {
    slug: "glock-17-9mm-pistol",
    nameEn: "Glock 17 Gen5 9mm Service Pistol",
    nameEs: "Pistola de servicio Glock 17 Gen5 9mm",
    nameTr: "Glock 17 Gen5 9mm Servis Tabancası",
    namePt: "Pistola de serviço Glock 17 Gen5 9mm",
    nameAr: "مسدس الخدمة Glock 17 Gen5 9mm",
    nameRu: "Служебный пистолет Glock 17 Gen5 9 мм",
    descEn: "Glock 17 Gen5 polymer-frame striker-fired pistol in 9×19mm Parabellum. 17+1 capacity, 4.49-inch barrel, ambidextrous slide stop. Most widely adopted military and law enforcement pistol worldwide. Includes 3 magazines and holster.",
    priceUsdd: "650.00",
    stock: 150,
    categoryId: firearmsId,
    images: [IMGS.glock17],
  },
  {
    slug: "barrett-m82-50-cal-sniper",
    nameEn: "Barrett M82A1 .50 BMG Anti-Materiel Rifle",
    nameEs: "Rifle antimaterial Barrett M82A1 .50 BMG",
    nameTr: "Barrett M82A1 .50 BMG Anti-Materyal Tüfek",
    namePt: "Rifle anti-material Barrett M82A1 .50 BMG",
    nameAr: "بندقية Barrett M82A1 .50 BMG المضادة للمعدات",
    nameRu: "Крупнокалиберная снайперская винтовка Barrett M82A1 .50 BMG",
    descEn: "Barrett M82A1 semi-automatic anti-materiel rifle in .50 BMG (12.7×99mm). Effective range 1,800m. 10-round detachable box magazine. Used by military forces in 60+ countries for long-range precision engagement.",
    priceUsdd: "9500.00",
    stock: 15,
    categoryId: firearmsId,
    images: [IMGS.barrettM82],
  },
  {
    slug: "rpg-7-rocket-launcher",
    nameEn: "RPG-7 Rocket Propelled Grenade Launcher",
    nameEs: "Lanzagranadas propulsado por cohete RPG-7",
    nameTr: "RPG-7 Roket Güdümlü Bomba Fırlatıcı",
    namePt: "Lançador de granadas propulsado por foguete RPG-7",
    nameAr: "قاذف القنابل الصاروخية RPG-7",
    nameRu: "Реактивный противотанковый гранатомёт РПГ-7",
    descEn: "Soviet-designed RPG-7 reusable rocket-propelled grenade launcher. Effective against armored vehicles and fortifications. Caliber 40mm, effective range 300m (moving target), 500m (stationary). Includes 5 PG-7VL anti-tank rounds.",
    priceUsdd: "1800.00",
    stock: 30,
    categoryId: firearmsId,
    images: [IMGS.rpg7],
  },
  {
    slug: "5-56mm-ammo-1000-rounds",
    nameEn: "5.56×45mm NATO Ammunition 1000 Rounds",
    nameEs: "Munición 5.56×45mm OTAN 1000 cartuchos",
    nameTr: "5.56×45mm NATO Mühimmat 1000 Mermi",
    namePt: "Munição 5.56×45mm OTAN 1000 cartuchos",
    nameAr: "ذخيرة 5.56×45 ملم ناتو 1000 طلقة",
    nameRu: "Патроны 5,56×45 мм НАТО 1000 штук",
    descEn: "Military-grade 5.56×45mm NATO FMJ ammunition. 55-grain projectile, muzzle velocity 940 m/s. Packed in sealed military ammo cans (500 rounds per can, 2 cans). Compatible with M4, AR-15, and all STANAG-compatible rifles.",
    priceUsdd: "950.00",
    stock: 500,
    categoryId: firearmsId,
    images: [IMGS.ammoCan, IMGS.ammo556],
  },

  // ── MILITARY MEDICAL ──────────────────────────────────────────────
  {
    slug: "amoxicillin-500mg-100caps",
    nameEn: "Amoxicillin 500mg Capsules (100 caps)",
    nameEs: "Cápsulas de Amoxicilina 500mg (100 cápsulas)",
    nameTr: "Amoksisilin 500mg Kapsül (100 kapsül)",
    namePt: "Cápsulas de Amoxicilina 500mg (100 cápsulas)",
    nameAr: "كبسولات أموكسيسيلين 500 ملغ (100 كبسولة)",
    nameRu: "Капсулы Амоксициллин 500 мг (100 капсул)",
    descEn: "Broad-spectrum penicillin-type antibiotic for treating bacterial infections including respiratory tract, skin, urinary tract, and wound infections. 500mg capsules, 100 per bottle. Standard combat medical supply.",
    priceUsdd: "45.00",
    stock: 2000,
    categoryId: militaryMedId,
    images: [IMGS.amoxicillin500, IMGS.amoxicillinCaps],
  },
  {
    slug: "penicillin-vk-500mg-tablets",
    nameEn: "Penicillin VK 500mg Tablets (50 tabs)",
    nameEs: "Tabletas de Penicilina VK 500mg (50 tabletas)",
    nameTr: "Penisilin VK 500mg Tablet (50 tablet)",
    namePt: "Comprimidos de Penicilina VK 500mg (50 comprimidos)",
    nameAr: "أقراص بنسلين VK 500 ملغ (50 قرصاً)",
    nameRu: "Таблетки Пенициллин VK 500 мг (50 таблеток)",
    descEn: "Phenoxymethylpenicillin (Penicillin V) 500mg oral tablets. First-line antibiotic for streptococcal infections, dental infections, and prophylaxis. TCCC recommended for combat wound infection prevention. 50 tablets per pack.",
    priceUsdd: "28.00",
    stock: 3000,
    categoryId: militaryMedId,
    images: [IMGS.amoxicillinCaps],
  },
  {
    slug: "moxifloxacin-400mg-tccc",
    nameEn: "Moxifloxacin 400mg Tablets (10 tabs) — TCCC Approved",
    nameEs: "Tabletas de Moxifloxacino 400mg (10 tabletas) — Aprobado TCCC",
    nameTr: "Moksifloksasin 400mg Tablet (10 tablet) — TCCC Onaylı",
    namePt: "Comprimidos de Moxifloxacino 400mg (10 comprimidos) — Aprovado TCCC",
    nameAr: "أقراص موكسيفلوكساسين 400 ملغ (10 أقراص) — معتمد TCCC",
    nameRu: "Таблетки Моксифлоксацин 400 мг (10 таблеток) — одобрено TCCC",
    descEn: "Moxifloxacin 400mg broad-spectrum fluoroquinolone antibiotic. TCCC recommended first-line antibiotic for combat wounds when oral intake is possible. Effective against gram-positive, gram-negative, and anaerobic bacteria.",
    priceUsdd: "65.00",
    stock: 1500,
    categoryId: militaryMedId,
    images: [IMGS.amoxicillin500],
  },
  {
    slug: "quikclot-combat-gauze-z-fold",
    nameEn: "QuikClot Combat Gauze Z-Fold Hemostatic Dressing",
    nameEs: "Apósito hemostático QuikClot Combat Gauze plegado en Z",
    nameTr: "QuikClot Savaş Gazı Z-Katlı Hemostatik Pansuman",
    namePt: "Curativo hemostático QuikClot Combat Gauze dobrado em Z",
    nameAr: "ضمادة مرقئة QuikClot Combat Gauze مطوية على شكل Z",
    nameRu: "Гемостатическая повязка QuikClot Combat Gauze Z-сложения",
    descEn: "QuikClot Combat Gauze with kaolin hemostatic agent. Z-folded for rapid one-handed application. Stops severe hemorrhage in 3 minutes. FDA-cleared, TCCC recommended. Used by US military and NATO forces. Single sterile package, 3-inch × 4-yard.",
    priceUsdd: "38.00",
    stock: 5000,
    categoryId: militaryMedId,
    images: [IMGS.quikclotGauze, IMGS.hemostatic],
  },
  {
    slug: "hemostatic-combat-gauze-xl",
    nameEn: "Hemostatic Combat Gauze XL (6-inch × 5-yard)",
    nameEs: "Gasa de combate hemostática XL (6 pulgadas × 5 yardas)",
    nameTr: "Hemostatik Savaş Gazı XL (6 inç × 5 yarda)",
    namePt: "Gaze de combate hemostática XL (6 polegadas × 5 jardas)",
    nameAr: "شاش القتال المرقئ XL (6 بوصات × 5 ياردات)",
    nameRu: "Гемостатическая боевая марля XL (15 см × 4,5 м)",
    descEn: "Extra-large hemostatic combat gauze for junctional and large wound hemorrhage control. 6-inch × 5-yard format for packing deep wounds, axillary, groin, and neck injuries. Kaolin-impregnated, single sterile package.",
    priceUsdd: "55.00",
    stock: 3000,
    categoryId: militaryMedId,
    images: [IMGS.hemostatic],
  },
  {
    slug: "morphine-autoinjector-10mg",
    nameEn: "Morphine Sulfate Auto-Injector 10mg/0.7mL",
    nameEs: "Autoinyector de Sulfato de Morfina 10mg/0.7mL",
    nameTr: "Morfin Sülfat Oto-Enjektör 10mg/0.7mL",
    namePt: "Auto-injetor de Sulfato de Morfina 10mg/0.7mL",
    nameAr: "حقنة تلقائية كبريتات المورفين 10 ملغ/0.7 مل",
    nameRu: "Автоинъектор морфина сульфата 10 мг/0,7 мл",
    descEn: "Military-issue morphine sulfate auto-injector for battlefield pain management. 10mg/0.7mL pre-filled auto-injector for intramuscular administration. TCCC approved for severe combat trauma pain. For use by trained medical personnel only.",
    priceUsdd: "85.00",
    stock: 500,
    categoryId: militaryMedId,
    images: [IMGS.morphineInjector, IMGS.morphineAutoInj],
  },
  {
    slug: "military-elastic-bandage-4inch-12pk",
    nameEn: "Military Elastic Bandage 4-inch (12-pack)",
    nameEs: "Vendaje elástico militar 4 pulgadas (paquete de 12)",
    nameTr: "Askeri Elastik Bandaj 4 inç (12'li paket)",
    namePt: "Bandagem elástica militar 4 polegadas (pacote com 12)",
    nameAr: "ضمادة مرنة عسكرية 4 بوصات (عبوة 12 قطعة)",
    nameRu: "Военный эластичный бинт 4 дюйма (упаковка 12 штук)",
    descEn: "Military-grade 4-inch elastic compression bandages for wound dressing, splinting, and pressure application. Latex-free, self-adhesive, tear-resistant. Pack of 12 individually wrapped sterile bandages. Standard issue for combat medic kits.",
    priceUsdd: "22.00",
    stock: 10000,
    categoryId: militaryMedId,
    images: [IMGS.hemostatic],
  },
];

let success = 0;
let failed = 0;

for (const p of products) {
  try {
    const [existing] = await conn.execute("SELECT id FROM products WHERE slug = ?", [p.slug]);
    if (existing.length > 0) {
      console.log(`⏭ SKIP: ${p.slug}`);
      continue;
    }

    await conn.execute(
      `INSERT INTO products 
        (slug, nameEn, nameEs, nameTr, namePt, nameAr, nameRu,
         descriptionEn, priceUsdd, stock, categoryId, images, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        p.slug,
        p.nameEn, p.nameEs, p.nameTr, p.namePt, p.nameAr, p.nameRu,
        p.descEn,
        p.priceUsdd,
        p.stock,
        p.categoryId,
        JSON.stringify(p.images),
      ]
    );
    console.log(`✅ ${p.nameEn}`);
    success++;
  } catch (err) {
    console.error(`❌ ${p.slug}: ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${success} inserted, ${failed} failed`);
await conn.end();
