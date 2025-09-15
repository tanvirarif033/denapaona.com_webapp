// controllers/analyticsController.js
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

// helper: parse dates from query, fallback to last 30 days
function getDateRange(q) {
  const end = q.end ? new Date(q.end) : new Date();
  const start = q.start ? new Date(q.start) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

// helper: bucket key by granularity
function bucketKey(date, granularity = "daily") {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  if (granularity === "monthly") return `${y}-${m}`;
  if (granularity === "weekly") {
    // ISO-ish week calc
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = (dt.getUTCDay() + 6) % 7;
    dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
    const week1 = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
    const weekNum = 1 + Math.round(((dt - week1) / (24 * 3600 * 1000) - 3) / 7);
    return `${y}-W${String(weekNum).padStart(2, "0")}`;
  }
  return `${y}-${m}-${day}`;
}

// fetch orders with payment.success === true (to count real sales)
async function fetchPaidOrders(start, end) {
  return orderModel
    .find({ createdAt: { $gte: start, $lte: end }, "payment.success": true })
    .sort({ createdAt: 1 })
    .lean();
}

// Build product map for price/name/category
async function buildProductMap(productIds) {
  const uniqueIds = [...new Set(productIds.map(String))];
  if (!uniqueIds.length) return new Map();
  const products = await productModel
    .find({ _id: { $in: uniqueIds } })
    .select("_id name price category")
    .lean();
  const map = new Map();
  products.forEach((p) => map.set(String(p._id), p));
  return map;
}

// Build category map
async function buildCategoryMap(categoryIds) {
  const unique = [...new Set(categoryIds.map(String))];
  if (!unique.length) return new Map();
  const cats = await categoryModel.find({ _id: { $in: unique } }).select("_id name").lean();
  const map = new Map();
  cats.forEach((c) => map.set(String(c._id), c));
  return map;
}

// ---------- NEW CORE: normalize items from an order ----------
// Returns array of { productId, priceCharged } where priceCharged is purchase-time price
function extractLineItems(order, productMap) {
  // Prefer order.items (purchase-time prices) if present
  if (Array.isArray(order?.items) && order.items.length) {
    return order.items
      .map((it) => {
        const pid = String(it?.product?._id || it?.product || "");
        if (!pid) return null;
        const price =
          typeof it?.price === "number"
            ? it.price
            : Number(productMap.get(pid)?.price || 0);
        return { productId: pid, priceCharged: Number(price || 0) };
      })
      .filter(Boolean);
  }

  // Fallback to legacy orders that only have products[]
  const products = Array.isArray(order?.products) ? order.products : [];
  return products.map((pidLike) => {
    const pid = String(pidLike?._id || pidLike);
    const price = Number(productMap.get(pid)?.price || 0);
    return { productId: pid, priceCharged: price };
  });
}

// ---------- SUMMARY ----------
export const salesSummaryController = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);

    // Build product map once (from both items[].product and products[])
    const allPids = [];
    for (const o of orders) {
      if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach((it) => it?.product && allPids.push(String(it.product)));
      } else {
        (o.products || []).forEach((pid) => allPids.push(String(pid)));
      }
    }
    const productMap = await buildProductMap(allPids);

    // Aggregate
    let itemsSold = 0;
    let revenue = 0;
    const perProduct = new Map(); // pid -> { count, revenue }

    for (const o of orders) {
      const items = extractLineItems(o, productMap);
      for (const li of items) {
        itemsSold += 1;
        revenue += li.priceCharged;
        const prev = perProduct.get(li.productId) || { count: 0, revenue: 0 };
        perProduct.set(li.productId, {
          count: prev.count + 1,
          revenue: prev.revenue + li.priceCharged,
        });
      }
    }

    // Top products
    const topProducts = [...perProduct.entries()]
      .map(([pid, agg]) => ({
        productId: pid,
        name: productMap.get(pid)?.name || "Unknown",
        count: agg.count,
        revenue: Number(agg.revenue.toFixed(2)),
        category: productMap.get(pid)?.category || null,
      }))
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 10);

    // Categories
    const perCategory = new Map(); // cid -> { count, revenue }
    topProducts.forEach((tp) => {
      const cid = tp.category ? String(tp.category) : null;
      if (!cid) return;
      const prev = perCategory.get(cid) || { count: 0, revenue: 0 };
      perCategory.set(cid, { count: prev.count + tp.count, revenue: prev.revenue + tp.revenue });
    });
    const categoryMap = await buildCategoryMap([...perCategory.keys()]);
    const topCategories = [...perCategory.entries()]
      .map(([cid, agg]) => ({
        categoryId: cid,
        name: categoryMap.get(cid)?.name || "Unknown",
        count: agg.count,
        revenue: Number(agg.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      range: { start, end },
      orders: orders.length,
      itemsSold,
      revenue: Number(revenue.toFixed(2)),
      topProducts,
      topCategories,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to build summary", error: e.message });
  }
};

// ---------- TIMESERIES ----------
export const salesTimeSeriesController = async (req, res) => {
  try {
    const granularity = ["daily", "weekly", "monthly"].includes(req.query.granularity)
      ? req.query.granularity
      : "daily";
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);

    // Build product map once
    const allPids = [];
    for (const o of orders) {
      if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach((it) => it?.product && allPids.push(String(it.product)));
      } else {
        (o.products || []).forEach((pid) => allPids.push(String(pid)));
      }
    }
    const productMap = await buildProductMap(allPids);

    const buckets = new Map(); // key -> { ordersSet:Set, itemsSold, revenue }
    for (const o of orders) {
      const key = bucketKey(o.createdAt, granularity);
      if (!buckets.has(key)) buckets.set(key, { ordersSet: new Set(), itemsSold: 0, revenue: 0 });
      const b = buckets.get(key);
      b.ordersSet.add(String(o._id));

      const items = extractLineItems(o, productMap);
      for (const li of items) {
        b.itemsSold += 1;
        b.revenue += li.priceCharged;
      }
    }

    const points = [...buckets.entries()]
      .map(([period, v]) => ({
        period,
        orders: v.ordersSet.size,
        itemsSold: v.itemsSold,
        revenue: Number(v.revenue.toFixed(2)),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    res.json({ success: true, granularity, range: { start, end }, points });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ success: false, message: "Failed to build time series", error: e.message });
  }
};

// ---------- TOP PRODUCTS ----------
export const topProductsController = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);

    const allPids = [];
    orders.forEach((o) => {
      if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach((it) => it?.product && allPids.push(String(it.product)));
      } else {
        (o.products || []).forEach((pid) => allPids.push(String(pid)));
      }
    });
    const productMap = await buildProductMap(allPids);

    const perProduct = new Map(); // pid -> { count, revenue }
    for (const o of orders) {
      const items = extractLineItems(o, productMap);
      for (const li of items) {
        const prev = perProduct.get(li.productId) || { count: 0, revenue: 0 };
        perProduct.set(li.productId, {
          count: prev.count + 1,
          revenue: prev.revenue + li.priceCharged,
        });
      }
    }

    const list = [...perProduct.entries()]
      .map(([pid, agg]) => ({
        productId: pid,
        name: productMap.get(pid)?.name || "Unknown",
        count: agg.count,
        revenue: Number(agg.revenue.toFixed(2)),
        category: productMap.get(pid)?.category || null,
      }))
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, limit);

    res.json({ success: true, items: list });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to get top products", error: e.message });
  }
};

// ---------- TOP CATEGORIES ----------
export const topCategoriesController = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);

    const allPids = [];
    orders.forEach((o) => {
      if (Array.isArray(o.items) && o.items.length) {
        o.items.forEach((it) => it?.product && allPids.push(String(it.product)));
      } else {
        (o.products || []).forEach((pid) => allPids.push(String(pid)));
      }
    });
    const productMap = await buildProductMap(allPids);

    const perCategory = new Map(); // cid -> { count, revenue }
    for (const o of orders) {
      const items = extractLineItems(o, productMap);
      for (const li of items) {
        const cid = productMap.get(li.productId)?.category;
        if (!cid) continue;
        const key = String(cid);
        const prev = perCategory.get(key) || { count: 0, revenue: 0 };
        perCategory.set(key, {
          count: prev.count + 1,
          revenue: prev.revenue + li.priceCharged,
        });
      }
    }

    const categoryMap = await buildCategoryMap([...perCategory.keys()]);
    const list = [...perCategory.entries()]
      .map(([cid, agg]) => ({
        categoryId: cid,
        name: categoryMap.get(cid)?.name || "Unknown",
        count: agg.count,
        revenue: Number(agg.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, limit);

    res.json({ success: true, items: list });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to get top categories", error: e.message });
  }
};
