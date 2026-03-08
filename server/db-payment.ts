import mysql from "mysql2/promise";

let _conn: mysql.Connection | null = null;

async function getRawConn() {
  if (!_conn && process.env.DATABASE_URL) {
    _conn = await mysql.createConnection(process.env.DATABASE_URL);
  }
  return _conn!;
}

// ─── Payment Config ───────────────────────────────────────────────────────────

export async function getPaymentConfigs() {
  const conn = await getRawConn();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM paymentConfigs WHERE isEnabled = 1 ORDER BY method"
  );
  return rows;
}

export async function getPaymentConfigByMethod(method: string) {
  const conn = await getRawConn();
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM paymentConfigs WHERE method = ?",
    [method]
  );
  return (rows[0] as any) ?? null;
}

export async function upsertPaymentConfig(
  method: string,
  data: {
    accountName?: string;
    accountNumber?: string;
    qrCodeUrl?: string | null;
    isEnabled?: boolean;
  }
) {
  const conn = await getRawConn();
  const now = Date.now();
  await conn.execute(
    `INSERT INTO paymentConfigs (method, accountName, accountNumber, qrCodeUrl, isEnabled, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       accountName = VALUES(accountName),
       accountNumber = VALUES(accountNumber),
       qrCodeUrl = COALESCE(VALUES(qrCodeUrl), qrCodeUrl),
       isEnabled = VALUES(isEnabled),
       updatedAt = VALUES(updatedAt)`,
    [
      method,
      data.accountName ?? "",
      data.accountNumber ?? "",
      data.qrCodeUrl ?? null,
      data.isEnabled !== false ? 1 : 0,
      now,
    ]
  );
}

// ─── Deposit with payment method ─────────────────────────────────────────────

export async function updateDepositPaymentInfo(
  depositId: number,
  data: {
    paymentMethod: string;
    paymentAmountCny?: number;
    transferScreenshotUrl?: string;
    transferNote?: string;
  }
) {
  const conn = await getRawConn();
  await conn.execute(
    `UPDATE storeDeposits SET
      paymentMethod = ?,
      paymentAmountCny = ?,
      transferScreenshotUrl = ?,
      transferNote = ?,
      status = 'pending'
     WHERE id = ?`,
    [
      data.paymentMethod,
      data.paymentAmountCny ?? null,
      data.transferScreenshotUrl ?? null,
      data.transferNote ?? null,
      depositId,
    ]
  );
}

export async function adminReviewDeposit(
  depositId: number,
  action: "confirm" | "reject",
  reviewNote?: string
) {
  const conn = await getRawConn();
  const status = action === "confirm" ? "confirmed" : "rejected";
  const now = Date.now();
  await conn.execute(
    `UPDATE storeDeposits SET status = ?, reviewedAt = ?, reviewNote = ? WHERE id = ?`,
    [status, now, reviewNote ?? null, depositId]
  );
  if (action === "confirm") {
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT storeId FROM storeDeposits WHERE id = ?",
      [depositId]
    );
    const storeId = (rows[0] as any)?.storeId;
    if (storeId) {
      await conn.execute(
        "UPDATE stores SET status = 'active' WHERE id = ? AND status = 'pending'",
        [storeId]
      );
    }
  }
}

export async function listPendingDepositsWithPayment(page = 1, limit = 20) {
  const conn = await getRawConn();
  const offset = (page - 1) * limit;
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT d.*, s.name AS storeName, u.name AS userName, u.email AS userEmail
     FROM storeDeposits d
     JOIN stores s ON d.storeId = s.id
     JOIN users u ON d.userId = u.id
     WHERE d.status IN ('pending', 'rejected')
     ORDER BY d.createdAt DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [countRows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM storeDeposits WHERE status IN ('pending', 'rejected')"
  );
  return {
    deposits: rows as any[],
    total: Number((countRows[0] as any)?.total ?? 0),
  };
}

// ─── Product Analytics ────────────────────────────────────────────────────────

export async function trackProductEvent(data: {
  storeProductId: number;
  eventType: "view" | "cart_add" | "order";
  userId?: number;
  orderId?: number;
  amountUsdd?: string;
}) {
  const conn = await getRawConn();
  const now = Date.now();
  await conn.execute(
    `INSERT INTO productEvents (storeProductId, eventType, userId, orderId, amountUsdd, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.storeProductId,
      data.eventType,
      data.userId ?? null,
      data.orderId ?? null,
      data.amountUsdd ?? null,
      now,
    ]
  );
}

export async function getStoreAnalytics(storeId: number) {
  const conn = await getRawConn();
  const [products] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT sp.id, sp.name, sp.slug, sp.priceUsdd, sp.imageUrls,
       COALESCE(v.cnt, 0) AS views,
       COALESCE(c.cnt, 0) AS cartAdds,
       COALESCE(o.cnt, 0) AS orders,
       COALESCE(o.gmv, 0) AS gmvUsdd
     FROM storeProducts sp
     LEFT JOIN (
       SELECT storeProductId, COUNT(*) AS cnt FROM productEvents WHERE eventType='view' GROUP BY storeProductId
     ) v ON v.storeProductId = sp.id
     LEFT JOIN (
       SELECT storeProductId, COUNT(*) AS cnt FROM productEvents WHERE eventType='cart_add' GROUP BY storeProductId
     ) c ON c.storeProductId = sp.id
     LEFT JOIN (
       SELECT storeProductId, COUNT(*) AS cnt, SUM(amountUsdd) AS gmv FROM productEvents WHERE eventType='order' GROUP BY storeProductId
     ) o ON o.storeProductId = sp.id
     WHERE sp.storeId = ? AND sp.status = 'active'
     ORDER BY gmvUsdd DESC`,
    [storeId]
  );

  const typedProducts = products as any[];
  const totals = typedProducts.reduce(
    (acc, p) => ({
      views: acc.views + Number(p.views),
      cartAdds: acc.cartAdds + Number(p.cartAdds),
      orders: acc.orders + Number(p.orders),
      gmvUsdd: acc.gmvUsdd + Number(p.gmvUsdd),
    }),
    { views: 0, cartAdds: 0, orders: 0, gmvUsdd: 0 }
  );

  return { products: typedProducts, totals };
}

export async function getPlatformAnalytics() {
  const conn = await getRawConn();
  const [eventRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT eventType, COUNT(*) AS count, COALESCE(SUM(amountUsdd), 0) AS totalAmount
     FROM productEvents GROUP BY eventType`
  );
  const events: Record<string, { count: number; totalAmount: string }> = {};
  for (const row of eventRows as any[]) {
    events[row.eventType] = {
      count: Number(row.count),
      totalAmount: String(row.totalAmount),
    };
  }

  const [storeRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS totalStores,
       SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS activeStores,
       SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pendingStores
     FROM stores`
  );

  return { events, stores: (storeRows[0] as any) ?? {} };
}
