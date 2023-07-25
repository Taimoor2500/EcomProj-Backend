
const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
  reservedAt: { type: Date, default: Date.now },
});

const Reservation = mongoose.model("Reservation", reservationSchema);

module.exports = Reservation;
