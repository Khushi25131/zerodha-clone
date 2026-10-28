const { Schema } = require("mongoose");

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 64 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, index: true },
  passwordSalt: { type: String, required: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

module.exports = { UserSchema };
