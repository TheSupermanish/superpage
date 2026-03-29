import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderIntent extends Document {
  id: string;
  storeId: string;
  items: any[];
  shippingAddress: any;
  email: string;
  subtotalAmount: string;
  shippingAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: Date;
  bodyHash?: string;
  x402Requirements?: any;
  verifiedAt?: Date;
  verificationStatus?: string;
  paymentTxHash?: string;
  paymentHeaderB64?: string;
  createdAt: Date;
}

const OrderIntentSchema = new Schema<IOrderIntent>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    storeId: {
      type: String,
      required: true,
      ref: 'Store',
    },
    items: {
      type: Schema.Types.Mixed,
      required: true,
    },
    shippingAddress: {
      type: Schema.Types.Mixed,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subtotalAmount: {
      type: String,
      required: true,
    },
    shippingAmount: {
      type: String,
      default: '0',
    },
    taxAmount: {
      type: String,
      default: '0',
    },
    totalAmount: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired', 'cancelled'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    bodyHash: {
      type: String,
    },
    x402Requirements: {
      type: Schema.Types.Mixed,
    },
    verifiedAt: {
      type: Date,
    },
    verificationStatus: {
      type: String,
    },
    paymentTxHash: {
      type: String,
    },
    paymentHeaderB64: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// id is already indexed via unique: true
OrderIntentSchema.index({ storeId: 1 });
OrderIntentSchema.index({ status: 1 });
// TTL index to automatically delete expired intents from MongoDB
OrderIntentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OrderIntentSchema.index({ email: 1 });

export const OrderIntent = mongoose.model<IOrderIntent>('OrderIntent', OrderIntentSchema);
