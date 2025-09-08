// controllers/analyticsController.js
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";

// helper: parse dates from query, fallback to last 30 days
function getDateRange(q) {
  const end = q.end ? new Date(q.end) : new Date();
  const start = q.start ? new Date(q.start) : new Date(end.getTime() - 30*24*60*60*1000);
  return { start, end };
}

// helper: bucket key by granularity
function bucketKey(date, granularity="daily") {
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,"0");
  const day = String(d.getUTCDate()).padStart(2,"0");

  if (granularity === "monthly") return `${y}-${m}`;
  if (granularity === "weekly") {
    // ISO week (approx): take Thursday as week anchor
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = (dt.getUTCDay() + 6) % 7;
    dt.setUTCDate(dt.getUTCDate() - dayNum + 3);
    const week1 = new Date(Date.UTC(dt.getUTCFullYear(),0,4));
    const weekNum = 1 + Math.round(((dt - week1)/(24*3600*1000) - 3)/7);
    return `${y}-W${String(weekNum).padStart(2,"0")}`;
  }
  // daily
  return `${y}-${m}-${day}`;
}

// fetch orders with payment.success === true (to count real sales)
async function fetchPaidOrders(start, end) {
  const orders = await orderModel
    .find({
      createdAt: { $gte: start, $lte: end },
      "payment.success": true
    })
    .sort({ createdAt: 1 })
    .lean();

  return orders;
}

// Build product map for price/name/category
async function buildProductMap(productIds) {
  const uniqueIds = [...new Set(productIds.map(String))];
  if (uniqueIds.length === 0) return new Map();
  const products = await productModel
    .find({ _id: { $in: uniqueIds } })
    .select("_id name price category")
    .lean();
  const map = new Map();
  products.forEach(p => map.set(String(p._id), p));
  return map;
}

// Build category map
async function buildCategoryMap(categoryIds) {
  const unique = [...new Set(categoryIds.map(String))];
  if (unique.length === 0) return new Map();
  const cats = await categoryModel
    .find({ _id: { $in: unique } })
    .select("_id name")
    .lean();
  const map = new Map();
  cats.forEach(c => map.set(String(c._id), c));
  return map;
}

// GET /summary
export const salesSummaryController = async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);

    // Flatten product occurrences
    const productOccurrences = [];
    orders.forEach(o => {
      (o.products || []).forEach(pid => productOccurrences.push(String(pid)));
    });

    const productMap = await buildProductMap(productOccurrences);

    // totals
    let itemsSold = 0;
    let revenue = 0;
    const perProductCount = new Map();
    productOccurrences.forEach(pid => {
      itemsSold += 1;
      const p = productMap.get(pid);
      if (p && typeof p.price === "number") revenue += p.price;
      perProductCount.set(pid, (perProductCount.get(pid) || 0) + 1);
    });

    // Top products (by count, then revenue)
    const topProducts = [...perProductCount.entries()]
      .map(([pid, count]) => {
        const p = productMap.get(pid);
        const rev = (p && typeof p.price === "number") ? p.price * count : 0;
        return { productId: pid, name: p?.name || "Unknown", count, revenue: rev, category: p?.category || null };
      })
      .sort((a,b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 10);

    // Category ranking
    const perCategory = new Map();
    topProducts.forEach(tp => {
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
        revenue: agg.revenue
      }))
      .sort((a,b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      range: { start, end },
      orders: orders.length,
      itemsSold,
      revenue,
      topProducts,
      topCategories
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to build summary", error: e.message });
  }
};

// GET /timeseries?granularity=daily|weekly|monthly
export const salesTimeSeriesController = async (req, res) => {
  try {
    const granularity = ["daily","weekly","monthly"].includes(req.query.granularity) ? req.query.granularity : "daily";
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);

    // Build product map once
    const allProductIds = [];
    orders.forEach(o => (o.products || []).forEach(pid => allProductIds.push(String(pid))));
    const productMap = await buildProductMap(allProductIds);

    // bucketize
    const buckets = new Map(); // key -> { ordersSet:Set, itemsSold, revenue }
    orders.forEach(o => {
      const key = bucketKey(o.createdAt, granularity);
      if (!buckets.has(key)) buckets.set(key, { ordersSet: new Set(), itemsSold: 0, revenue: 0 });
      const b = buckets.get(key);
      b.ordersSet.add(String(o._id));
      (o.products || []).forEach(pid => {
        b.itemsSold += 1;
        const p = productMap.get(String(pid));
        if (p && typeof p.price === "number") b.revenue += p.price;
      });
    });

    const points = [...buckets.entries()]
      .map(([period, v]) => ({
        period,
        orders: v.ordersSet.size,
        itemsSold: v.itemsSold,
        revenue: Number(v.revenue.toFixed(2))
      }))
      .sort((a,b) => a.period.localeCompare(b.period));

    res.json({
      success: true,
      granularity,
      range: { start, end },
      points
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to build time series", error: e.message });
  }
};

// Optional convenience: top products/categories with limit
export const topProductsController = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);
    const occ = [];
    orders.forEach(o => (o.products || []).forEach(pid => occ.push(String(pid))));
    const productMap = await buildProductMap(occ);

    const perProductCount = new Map();
    occ.forEach(pid => perProductCount.set(pid, (perProductCount.get(pid) || 0) + 1));

    const list = [...perProductCount.entries()]
      .map(([pid, count]) => {
        const p = productMap.get(pid);
        const revenue = (p && typeof p.price === "number") ? p.price * count : 0;
        return { productId: pid, name: p?.name || "Unknown", count, revenue, category: p?.category || null };
      })
      .sort((a,b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, limit);

    res.json({ success: true, items: list });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to get top products", error: e.message });
  }
};

export const topCategoriesController = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 5), 50);
    const { start, end } = getDateRange(req.query);
    const orders = await fetchPaidOrders(start, end);
    const occ = [];
    orders.forEach(o => (o.products || []).forEach(pid => occ.push(String(pid))));
    const productMap = await buildProductMap(occ);

    const perCategory = new Map();
    occ.forEach(pid => {
      const p = productMap.get(String(pid));
      const cid = p?.category ? String(p.category) : null;
      if (!cid) return;
      const prev = perCategory.get(cid) || { count: 0, revenue: 0 };
      perCategory.set(cid, { count: prev.count + 1, revenue: prev.revenue + (p?.price || 0) });
    });

    const categoryMap = await buildCategoryMap([...perCategory.keys()]);
    const list = [...perCategory.entries()]
      .map(([cid, agg]) => ({
        categoryId: cid,
        name: categoryMap.get(cid)?.name || "Unknown",
        count: agg.count,
        revenue: agg.revenue
      }))
      .sort((a,b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, limit);

    res.json({ success: true, items: list });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to get top categories", error: e.message });
  }
};
