import mongoose, { Schema, Document } from 'mongoose';

export interface ICreator extends Document {
  walletAddress: string;
  username?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    discord?: string;
    youtube?: string;
    linkedin?: string;
    instagram?: string;
    telegram?: string;
  };
  isPublic: boolean;
  showStats: boolean;
  isAgent: boolean;
  erc8004AgentId?: number;
  totalSales: number;
  totalRevenueUsdc: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreatorSchema = new Schema<ICreator>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null values while maintaining uniqueness
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/, // Only lowercase alphanumeric and hyphens
      minlength: 3,
      maxlength: 30,
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    website: {
      type: String,
      trim: true,
    },
    socialLinks: {
      twitter: { type: String, trim: true },
      github: { type: String, trim: true },
      discord: { type: String, trim: true },
      youtube: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      instagram: { type: String, trim: true },
      telegram: { type: String, trim: true },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    showStats: {
      type: Boolean,
      default: true,
    },
    isAgent: {
      type: Boolean,
      default: false,
    },
    erc8004AgentId: {
      type: Number,
      default: null,
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenueUsdc: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// walletAddress and username are already indexed via unique: true
CreatorSchema.index({ isPublic: 1 });
CreatorSchema.index({ totalSales: -1 });
CreatorSchema.index({ createdAt: -1 });

export const Creator = mongoose.model<ICreator>('Creator', CreatorSchema);
