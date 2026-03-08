import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { getStoreByUserId, createStoreProduct } from "../db-store";
import { getOrCreateStoreProfile, createSupplyChainProduct } from "../db-s2b2c";
import * as XLSX from "xlsx";

// ─── Template column definitions ─────────────────────────────────────────────
export const TEMPLATE_COLUMNS = [
  "name",           // Product name (required)
  "description",    // Product description
  "basePriceUsdd",  // Base/wholesale price in USDD (required)
  "stock",          // Available stock quantity
  "category",       // Category name
  "tags",           // Comma-separated tags
  "imageUrl",       // Main image URL
  "minOrderQty",    // Minimum order quantity
  "shippingDays",   // Estimated shipping days
] as const;

// ─── Parse raw rows from XLSX buffer ─────────────────────────────────────────
function parseXlsxBuffer(base64Data: string): { headers: string[]; rows: Record<string, string>[] } {
  const buffer = Buffer.from(base64Data, "base64");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (!raw || raw.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = (raw[0] as string[]).map((h) => String(h ?? "").trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < raw.length; i++) {
    const rowArr = raw[i] as string[];
    if (!rowArr || rowArr.every((v) => !v)) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = String(rowArr[idx] ?? "").trim();
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// ─── AI field mapping ─────────────────────────────────────────────────────────
async function aiMapColumns(
  userHeaders: string[],
  templateColumns: readonly string[]
): Promise<Record<string, string>> {
  // If headers already match template, return identity mapping
  const exactMatch = templateColumns.every((tc) => userHeaders.includes(tc));
  if (exactMatch) {
    return Object.fromEntries(templateColumns.map((tc) => [tc, tc]));
  }

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a data mapping assistant. Map user CSV column headers to standard template columns.
Return a JSON object where keys are template column names and values are the matching user column names (or null if no match).
Template columns: ${templateColumns.join(", ")}`,
      },
      {
        role: "user",
        content: `User CSV headers: ${userHeaders.join(", ")}
Map each template column to the best matching user column. Return JSON only.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "column_mapping",
        strict: true,
        schema: {
          type: "object",
          properties: Object.fromEntries(
            templateColumns.map((tc) => [tc, { type: ["string", "null"], description: `User column for ${tc}` }])
          ),
          required: [...templateColumns],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = response.choices[0]?.message?.content;
    return JSON.parse(typeof content === "string" ? content : "{}");
  } catch {
    return {};
  }
}

// ─── Validate and transform a single row ─────────────────────────────────────
function transformRow(
  row: Record<string, string>,
  mapping: Record<string, string | null>
): { data: Record<string, any>; errors: string[] } {
  const errors: string[] = [];
  const data: Record<string, any> = {};

  const get = (field: string) => {
    const col = mapping[field];
    return col ? (row[col] ?? "").trim() : "";
  };

  const name = get("name");
  if (!name) errors.push("商品名称(name)不能为空");
  data.name = name;

  const price = parseFloat(get("basePriceUsdd"));
  if (isNaN(price) || price <= 0) errors.push("价格(basePriceUsdd)必须为正数");
  data.basePriceUsdd = isNaN(price) ? "0" : price.toFixed(4);

  data.description = get("description") || null;
  data.category = get("category") || null;
  data.tags = get("tags") || null;
  data.imageUrl = get("imageUrl") || null;

  const stock = parseInt(get("stock"));
  data.stock = isNaN(stock) ? 0 : Math.max(0, stock);

  const minQty = parseInt(get("minOrderQty"));
  data.minOrderQty = isNaN(minQty) ? 1 : Math.max(1, minQty);

  const shipDays = parseInt(get("shippingDays"));
  data.shippingDays = isNaN(shipDays) ? 7 : Math.max(1, shipDays);

  return { data, errors };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const bulkImportRouter = router({
  // Download CSV template as base64
  getTemplate: publicProcedure.query(() => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_COLUMNS as unknown as string[],
      ["示例商品-保鲜盒套装", "高品质PP材质保鲜盒，5件套", "3.50", "500", "厨房用品", "保鲜盒,厨房,收纳", "https://example.com/image.jpg", "10", "7"],
      ["示例商品-洗衣液", "浓缩型洗衣液，2L装", "2.80", "1000", "日用品", "洗衣液,清洁", "", "50", "5"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "商品模板");
    const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    return { base64, filename: "supply_chain_products_template.xlsx" };
  }),

  // Preview import: parse file, AI map columns, return preview rows
  previewImport: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        filename: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "请先创建店铺" });

      const { headers, rows } = parseXlsxBuffer(input.fileBase64);
      if (rows.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "文件为空或格式不正确" });
      }

      const mapping = await aiMapColumns(headers, TEMPLATE_COLUMNS);

      // Preview first 5 rows
      const preview = rows.slice(0, 5).map((row, i) => {
        const { data, errors } = transformRow(row, mapping);
        return { rowIndex: i + 2, data, errors, raw: row };
      });

      return {
        totalRows: rows.length,
        headers,
        mapping,
        preview,
        templateColumns: TEMPLATE_COLUMNS,
      };
    }),

  // Execute import: process all rows and insert products
  executeImport: protectedProcedure
    .input(
      z.object({
        fileBase64: z.string(),
        mapping: z.record(z.string(), z.string().nullable()),
        isDropshipAvailable: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const store = await getStoreByUserId(ctx.user.id);
      if (!store) throw new TRPCError({ code: "NOT_FOUND", message: "请先创建店铺" });

      const { rows } = parseXlsxBuffer(input.fileBase64);
      if (rows.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "文件为空" });
      }

      let successCount = 0;
      const errorRows: { rowIndex: number; errors: string[] }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const { data, errors } = transformRow(rows[i], input.mapping);
        if (errors.length > 0) {
          errorRows.push({ rowIndex: i + 2, errors });
          continue;
        }

        try {
          await createSupplyChainProduct({
            storeId: store.id,
            name: data.name,
            description: data.description,
            basePriceUsdd: data.basePriceUsdd,
            stock: data.stock,
            images: data.imageUrl ? [data.imageUrl] : null,
            tags: data.tags,
            isDropshipAvailable: input.isDropshipAvailable ? 1 : 0,
          });
          successCount++;
        } catch (err: any) {
          errorRows.push({ rowIndex: i + 2, errors: [err.message ?? "插入失败"] });
        }
      }

      return {
        successCount,
        errorCount: errorRows.length,
        errorRows,
        totalRows: rows.length,
      };
    }),
});
