const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  client: { type: String },
  clientId: { type: String },
  type: { type: String },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'canceled'],
    default: 'draft'
  },
  progress: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  budget: { type: Number },
  team: [{ type: String }], // Array of user IDs
}, { timestamps: true });

// Add id field for frontend compatibility
ProjectSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ProjectSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Project', ProjectSchema);