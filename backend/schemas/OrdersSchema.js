const { Schema } = require("mongoose");
const OrdersSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 64 },
  qty: { type: Number, required: true, min: 1, max: 1000000, validate: Number.isSafeInteger },
  price: { type: Number, required: true, min: 0.01, max: 100000000, validate: Number.isFinite },
  mode: { type: String, required: true, enum: ["BUY", "SELL"] },
}, { timestamps: true });
module.exports = { OrdersSchema };
