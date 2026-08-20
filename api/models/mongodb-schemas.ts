/**
 * MongoDB Schemas para EasyFamily
 * TypeScript + Mongoose
 *
 * IMPORTANTE: Usar Decimal128 para todos os valores monetários
 * IMPORTANTE: family_id em TODOS os documentos (multi-tenancy)
 * IMPORTANTE: Usar Clerk user ID, não ObjectId para member_id
 */

import mongoose, { Document, Schema } from 'mongoose';

// ============================================================================
// FAMILY
// ============================================================================

export interface IFamily extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  global_cycle_start_day: number; // 1-31, default: 1
  currency: 'BRL'; // v1.0: apenas BRL
  created_by: string; // Clerk user ID (owner)
  members: string[]; // Array of Clerk user IDs (cache)
  created_at: Date;
  updated_at: Date;
}

const FamilySchema = new Schema<IFamily>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    global_cycle_start_day: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 31,
      validate: {
        validator: (v: number) => v >= 1 && v <= 31,
        message: 'global_cycle_start_day deve estar entre 1 e 31',
      },
    },
    currency: {
      type: String,
      required: true,
      default: 'BRL',
      enum: ['BRL'],
    },
    created_by: {
      type: String,
      required: true, // Clerk user ID
      index: true,
    },
    members: [
      {
        type: String, // Clerk user IDs
        required: true,
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

FamilySchema.index({ created_by: 1 });
FamilySchema.index({ members: 1 });

export const Family = mongoose.model<IFamily>('Family', FamilySchema);

// ============================================================================
// MEMBER
// ============================================================================

export interface IBudgetLimit {
  category_id: mongoose.Types.ObjectId;
  monthly_limit: mongoose.Types.Decimal128;
}

export interface IMember extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  clerk_user_id: string; // Unique identifier
  name: string;
  email: string;
  role: 'ADMIN' | 'CONTRIBUTOR' | 'DEPENDENT';
  budget_limits?: IBudgetLimit[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const BudgetLimitSchema = new Schema<IBudgetLimit>(
  {
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    monthly_limit: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (value: any) => (value ? value.toString() : '0'),
    },
  },
  { _id: false }
);

const MemberSchema = new Schema<IMember>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    clerk_user_id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'CONTRIBUTOR', 'DEPENDENT'],
      default: 'CONTRIBUTOR',
      required: true,
    },
    budget_limits: {
      type: [BudgetLimitSchema],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

MemberSchema.index({ family_id: 1, clerk_user_id: 1 }, { unique: true });
MemberSchema.index({ family_id: 1, role: 1 });

export const Member = mongoose.model<IMember>('Member', MemberSchema);

// ============================================================================
// CATEGORY
// ============================================================================

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  parent_category_id?: mongoose.Types.ObjectId;
  icon?: string; // emoji ou ícone
  color?: string; // hex color
  created_by: string; // Clerk user ID
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
      required: true,
      index: true,
    },
    parent_category_id: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    icon: {
      type: String,
      default: '📁',
    },
    color: {
      type: String,
      default: '#3B82F6',
      match: /^#[0-9A-F]{6}$/i,
    },
    created_by: {
      type: String,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

CategorySchema.index({ family_id: 1, type: 1 });
CategorySchema.index({ family_id: 1, name: 1 }, { unique: true });
CategorySchema.index({ parent_category_id: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

// ============================================================================
// ACCOUNT
// ============================================================================

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  name: string;
  owner_member_id: string; // Clerk user ID
  is_shared: boolean;
  account_type: 'CHECKING' | 'CREDIT_CARD' | 'SAVINGS' | 'WALLET';
  balance?: mongoose.Types.Decimal128;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    owner_member_id: {
      type: String,
      required: true, // Clerk user ID
    },
    is_shared: {
      type: Boolean,
      default: false,
    },
    account_type: {
      type: String,
      enum: ['CHECKING', 'CREDIT_CARD', 'SAVINGS', 'WALLET'],
      required: true,
    },
    balance: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

AccountSchema.index({ family_id: 1, owner_member_id: 1 });
AccountSchema.index({ family_id: 1, is_shared: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);

// ============================================================================
// TRANSACTION
// ============================================================================

export interface ITransactionSplit {
  member_id: string; // Clerk user ID
  percentage: number; // 0-100, deve somar 100
  amount: mongoose.Types.Decimal128;
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  amount: mongoose.Types.Decimal128;
  description: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category_id: mongoose.Types.ObjectId;
  account_id: mongoose.Types.ObjectId;
  paid_by_member_id: string; // Clerk user ID
  competence_date: Date; // Período da transação
  due_date?: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  scope: 'PERSONAL' | 'SHARED'; // Se afeta settlement
  linked_asset_id?: mongoose.Types.ObjectId;
  splits: ITransactionSplit[];
  notes?: string;
  is_deleted: boolean; // Soft delete
  created_at: Date;
  updated_at: Date;
  created_by: string; // Clerk user ID
}

const TransactionSplitSchema = new Schema<ITransactionSplit>(
  {
    member_id: {
      type: String,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (value: any) => (value ? value.toString() : '0'),
    },
  },
  { _id: false }
);

const TransactionSchema = new Schema<ITransaction>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
      required: true,
      index: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    paid_by_member_id: {
      type: String,
      required: true,
      index: true,
    },
    competence_date: {
      type: Date,
      required: true,
      index: true,
    },
    due_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE'],
      default: 'PAID',
    },
    scope: {
      type: String,
      enum: ['PERSONAL', 'SHARED'],
      default: 'SHARED',
      index: true,
    },
    linked_asset_id: {
      type: Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },
    splits: {
      type: [TransactionSplitSchema],
      required: true,
    },
    notes: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    created_by: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

TransactionSchema.index({ family_id: 1, competence_date: -1 });
TransactionSchema.index({ family_id: 1, type: 1, scope: 1 });
TransactionSchema.index({ family_id: 1, is_deleted: 1 });

export const Transaction = mongoose.model<ITransaction>(
  'Transaction',
  TransactionSchema
);

// ============================================================================
// ASSET
// ============================================================================

export interface IAssetOwnership {
  member_id: string; // Clerk user ID
  percentage: number; // 0-100, deve somar 100
}

export interface IAsset extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  name: string;
  type: 'REAL_ESTATE' | 'VEHICLE' | 'INVESTMENT' | 'CRYPTO' | 'OTHER';
  current_value: mongoose.Types.Decimal128;
  acquired_date?: Date;
  ownership: IAssetOwnership[];
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const AssetOwnershipSchema = new Schema<IAssetOwnership>(
  {
    member_id: {
      type: String,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const AssetSchema = new Schema<IAsset>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['REAL_ESTATE', 'VEHICLE', 'INVESTMENT', 'CRYPTO', 'OTHER'],
      required: true,
    },
    current_value: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    acquired_date: {
      type: Date,
      default: null,
    },
    ownership: {
      type: [AssetOwnershipSchema],
      required: true,
      validate: {
        validator: function (ownerships: IAssetOwnership[]) {
          const sum = ownerships.reduce((acc, o) => acc + o.percentage, 0);
          return Math.abs(sum - 100) < 0.01; // Permitir pequeno erro de arredondamento
        },
        message: 'Percentuais de propriedade devem somar 100%',
      },
    },
    description: {
      type: String,
      default: null,
      maxlength: 500,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

AssetSchema.index({ family_id: 1, type: 1 });

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);

// ============================================================================
// SAVINGS GOAL
// ============================================================================

export interface ISavingsGoal extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  name: string;
  target_amount: mongoose.Types.Decimal128;
  current_amount: mongoose.Types.Decimal128;
  deadline?: Date;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    target_amount: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    current_amount: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    deadline: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      default: null,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: '🎯',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

SavingsGoalSchema.index({ family_id: 1, is_active: 1 });

export const SavingsGoal = mongoose.model<ISavingsGoal>(
  'SavingsGoal',
  SavingsGoalSchema
);

// ============================================================================
// GOAL CONTRIBUTION
// ============================================================================

export interface IGoalContribution extends Document {
  _id: mongoose.Types.ObjectId;
  goal_id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  member_id: string; // Clerk user ID
  amount: mongoose.Types.Decimal128;
  contributed_at: Date;
}

const GoalContributionSchema = new Schema<IGoalContribution>(
  {
    goal_id: {
      type: Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      required: true,
      index: true,
    },
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    member_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    contributed_at: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

export const GoalContribution = mongoose.model<IGoalContribution>(
  'GoalContribution',
  GoalContributionSchema
);

// ============================================================================
// SETTLEMENT CYCLE
// ============================================================================

export interface ISettlementCycle extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  period_start: Date;
  period_end: Date;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'FINALIZED' | 'REVERSED';
  total_amount: mongoose.Types.Decimal128;
  transaction_count: number;
  created_at: Date;
  finalized_at?: Date;
  finalized_by?: string; // Clerk user ID
}

const SettlementCycleSchema = new Schema<ISettlementCycle>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    period_start: {
      type: Date,
      required: true,
      index: true,
    },
    period_end: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'FINALIZED', 'REVERSED'],
      default: 'DRAFT',
      index: true,
    },
    total_amount: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    transaction_count: {
      type: Number,
      default: 0,
    },
    finalized_at: {
      type: Date,
      default: null,
    },
    finalized_by: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

SettlementCycleSchema.index({ family_id: 1, period_start: -1 });
SettlementCycleSchema.index({ family_id: 1, status: 1 });

export const SettlementCycle = mongoose.model<ISettlementCycle>(
  'SettlementCycle',
  SettlementCycleSchema
);

// ============================================================================
// SETTLEMENT TRANSACTION
// ============================================================================

export interface ISettlementTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  settlement_cycle_id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  from_member_id: string; // Clerk user ID (quem paga)
  to_member_id: string; // Clerk user ID (quem recebe)
  amount: mongoose.Types.Decimal128;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: Date;
  completed_at?: Date;
}

const SettlementTransactionSchema = new Schema<ISettlementTransaction>(
  {
    settlement_cycle_id: {
      type: Schema.Types.ObjectId,
      ref: 'SettlementCycle',
      required: true,
      index: true,
    },
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    from_member_id: {
      type: String,
      required: true,
      index: true,
    },
    to_member_id: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

SettlementTransactionSchema.index({ settlement_cycle_id: 1 });
SettlementTransactionSchema.index({
  family_id: 1,
  from_member_id: 1,
  to_member_id: 1,
});

export const SettlementTransaction = mongoose.model<ISettlementTransaction>(
  'SettlementTransaction',
  SettlementTransactionSchema
);

// ============================================================================
// TRANSACTION AUDIT LOG
// ============================================================================

export interface ITransactionAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  transaction_id?: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  entity_type: 'TRANSACTION' | 'MEMBER' | 'CATEGORY' | 'ACCOUNT' | 'ASSET';
  entity_id: mongoose.Types.ObjectId;
  changed_by: string; // Clerk user ID
  change_type: 'CREATED' | 'UPDATED' | 'DELETED';
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  created_at: Date;
}

const TransactionAuditLogSchema = new Schema<ITransactionAuditLog>(
  {
    transaction_id: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
      index: true,
    },
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    entity_type: {
      type: String,
      enum: ['TRANSACTION', 'MEMBER', 'CATEGORY', 'ACCOUNT', 'ASSET'],
      required: true,
      index: true,
    },
    entity_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    changed_by: {
      type: String,
      required: true,
      index: true,
    },
    change_type: {
      type: String,
      enum: ['CREATED', 'UPDATED', 'DELETED'],
      required: true,
      index: true,
    },
    old_value: {
      type: Schema.Types.Mixed,
      default: null,
    },
    new_value: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
);

TransactionAuditLogSchema.index({ family_id: 1, created_at: -1 });
TransactionAuditLogSchema.index({ entity_id: 1, change_type: 1 });

export const TransactionAuditLog = mongoose.model<ITransactionAuditLog>(
  'TransactionAuditLog',
  TransactionAuditLogSchema
);

// ============================================================================
// BUDGET USAGE (Cache para performance)
// ============================================================================

export interface IBudgetUsage extends Document {
  _id: mongoose.Types.ObjectId;
  family_id: mongoose.Types.ObjectId;
  member_id: string; // Clerk user ID
  category_id: mongoose.Types.ObjectId;
  period: string; // YYYY-MM
  spent: mongoose.Types.Decimal128;
  limit: mongoose.Types.Decimal128;
  last_updated: Date;
}

const BudgetUsageSchema = new Schema<IBudgetUsage>(
  {
    family_id: {
      type: Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
      index: true,
    },
    member_id: {
      type: String,
      required: true,
      index: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    spent: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    limit: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: (value: any) => (value ? value.toString() : '0'),
    },
    last_updated: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: false,
  }
);

BudgetUsageSchema.index(
  { family_id: 1, member_id: 1, period: 1, category_id: 1 },
  { unique: true }
);

export const BudgetUsage = mongoose.model<IBudgetUsage>(
  'BudgetUsage',
  BudgetUsageSchema
);

// ============================================================================
// EXPORT ALL MODELS
// ============================================================================

export const models = {
  Family,
  Member,
  Category,
  Account,
  Transaction,
  Asset,
  SavingsGoal,
  GoalContribution,
  SettlementCycle,
  SettlementTransaction,
  TransactionAuditLog,
  BudgetUsage,
};