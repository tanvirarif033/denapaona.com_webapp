// controllers/returnController.js
import ReturnRequest from "../models/ReturnRequest.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Notification from "../models/Notification.js";

const ensureDeliveredAndOwner = async (orderId, userId) => {
  const order = await orderModel.findById(orderId).select("_id buyer status products createdAt").lean();
  if (!order) throw new Error("Order not found");
  if (order.buyer?.toString() !== userId.toString()) throw new Error("Forbidden");
  if (order.status !== "Delivered") throw new Error("Return allowed only for Delivered orders");
  return order;
};

// POST /api/v1/returns/:orderId
export const createReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = "", desiredResolution } = req.body;

    await ensureDeliveredAndOwner(orderId, req.user._id);

    const exists = await ReturnRequest.findOne({
      order: orderId,
      buyer: req.user._id,
      status: { $in: ["pending", "accepted"] },
    }).lean();
    if (exists) {
      return res.status(400).json({ success: false, message: "You already have an open return request for this order." });
    }

    const rr = await ReturnRequest.create({
      order: orderId,
      buyer: req.user._id,
      reason: reason.trim(),
      desiredResolution,
    });

    // Admin notify
    const buyerName = req.user?.name || "A user";
    const title = "New return request";
    const text = `${buyerName} requested ${desiredResolution} for Order #${String(orderId).slice(-6)}`;
    const link = "/dashboard/admin/return-requests";

    const admins = await userModel.find({ role: 1 }).select("_id").lean();
    if (admins?.length) {
      const docs = admins.map(a => ({ toUser: a._id, title, text, link }));
      await Notification.insertMany(docs);
    }
    const io = req.app.get("io");
    io?.to("admins").emit("notification:new", { title, text, link, createdAt: new Date() });

    res.status(201).json({ success: true, message: "Return request submitted", request: rr });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Unable to submit return request" });
  }
};

// GET /api/v1/returns/my
export const myReturnRequests = async (req, res) => {
  const items = await ReturnRequest.find({ buyer: req.user._id }).sort({ createdAt: -1 }).lean();

  const ids = items.map(i => i.order);
  const orders = await orderModel
    .find({ _id: { $in: ids } })
    .select("_id status createdAt buyer products")
    .populate("buyer", "name")
    .populate("products", "_id name")
    .lean();
  const map = new Map(orders.map(o => [o._id.toString(), o]));
  const withOrder = items.map(i => ({ ...i, orderInfo: map.get(i.order.toString()) || null }));

  res.json({ success: true, items: withOrder });
};

// GET /api/v1/returns  (admin)
export const allReturnRequests = async (req, res) => {
  const items = await ReturnRequest.find({}).sort({ createdAt: -1 }).lean();

  const ids = items.map(i => i.order);
  const orders = await orderModel
    .find({ _id: { $in: ids } })
    .select("_id status createdAt buyer products")
    .populate("buyer", "name email")
    .populate("products", "_id name")
    .lean();
  const map = new Map(orders.map(o => [o._id.toString(), o]));
  const withOrder = items.map(i => ({ ...i, orderInfo: map.get(i.order.toString()) || null }));

  res.json({ success: true, items: withOrder });
};

// PUT /api/v1/returns/:id/decision  body: { decision: 'accepted'|'rejected', resolution?, adminNote? }
export const decideReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, resolution, adminNote = "" } = req.body;

    const rr = await ReturnRequest.findById(id);
    if (!rr) return res.status(404).json({ success: false, message: "Request not found" });
    if (rr.status !== "pending") {
      return res.status(400).json({ success: false, message: "This request has already been processed" });
    }

    if (decision === "accepted") {
      if (!["refund", "replacement"].includes(resolution)) {
        return res.status(400).json({ success: false, message: "Resolution required" });
      }

      rr.status = "accepted";
      rr.adminResolution = resolution;
      rr.adminNote = adminNote;
      rr.processedAt = new Date();

      // ===== Replacement flow =====
      if (resolution === "replacement") {
        const orig = await orderModel.findById(rr.order);
        if (!orig) return res.status(404).json({ success: false, message: "Original order not found" });

        // 1) Original order => Processing (AdminOrders UI ready) :contentReference[oaicite:6]{index=6}
        orig.status = "Processing";
        await orig.save();

        // 2) Create replacement order (same products + buyer)
        const repl = await new orderModel({
          products: orig.products, // IDs
          buyer: orig.buyer,
          status: "Processing",
          payment: { success: true, method: "replacement", note: `Replacement for ${orig._id}` },
        }).save();

        // 3) Link & notify
        rr.replacementOrder = repl._id;

        const title = "Return request accepted (Replacement)";
        const text  = `We created a replacement order #${String(repl._id).slice(-6)}. It's now Processing.`;
        const link  = "/dashboard/user/orders";
        await Notification.create({ toUser: rr.buyer, title, text, link });
        const io = req.app.get("io");
        io?.to(`user:${rr.buyer}`).emit("notification:new", { title, text, link, createdAt: new Date() });
      }

      // ===== Refund flow (simple notify) =====
      if (resolution === "refund") {
        const title = "Return request accepted (Refund)";
        const text  = `Your return request for Order #${String(rr.order).slice(-6)} was accepted for refund.`;
        const link  = "/dashboard/user/orders";
        await Notification.create({ toUser: rr.buyer, title, text, link });
        const io = req.app.get("io");
        io?.to(`user:${rr.buyer}`).emit("notification:new", { title, text, link, createdAt: new Date() });
      }

      await rr.save();
      return res.json({ success: true, message: "Request accepted", request: rr });
    }

    if (decision === "rejected") {
      rr.status = "rejected";
      rr.adminNote = adminNote;
      rr.processedAt = new Date();
      await rr.save();

      const title = "Return request rejected";
      const text  = `Your return request for Order #${String(rr.order).slice(-6)} was rejected.`;
      const link  = "/dashboard/user/orders";
      await Notification.create({ toUser: rr.buyer, title, text, link });
      const io = req.app.get("io");
      io?.to(`user:${rr.buyer}`).emit("notification:new", { title, text, link, createdAt: new Date() });

      return res.json({ success: true, message: "Request rejected", request: rr });
    }

    return res.status(400).json({ success: false, message: "Invalid decision" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || "Failed to process request" });
  }
};

// PUT /api/v1/returns/:id/complete
export const completeReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const rr = await ReturnRequest.findById(id);
    if (!rr) return res.status(404).json({ success: false, message: "Request not found" });
    if (rr.status !== "accepted")
      return res.status(400).json({ success: false, message: "Only accepted requests can be completed" });

    rr.status = "completed";
    rr.completedAt = new Date();
    await rr.save();

    res.json({ success: true, message: "Request marked as completed", request: rr });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || "Failed to complete request" });
  }
};
