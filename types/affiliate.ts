/**
 * Affiliate System Types
 * Shared types for affiliate functionality
 */

export interface AffiliateUser {
  id: string;
  address: string;
  username?: string;
  email?: string;
  referralCode: string;
  referrerAddress?: string;
  level: number;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissions: number;
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  lastActiveAt?: string;
  profileLevel: UserProfileLevel;
  networkMetrics?: NetworkMetrics;
}

export interface AffiliateMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCommissions: number;
  monthlyCommissions: number;
  conversionRate: number;
  averageCommissionPerUser: number;
  topPerformers: AffiliateUser[];
  recentActivity: AffiliateActivity[];
}

export interface CommissionData {
  totalEarned: number;
  monthlyEarned: number;
  pendingCommissions: number;
  paidCommissions: number;
  commissionRate: number;
  recentTransactions: CommissionTransaction[];
  performanceMetrics: {
    clickThroughRate: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  // Additional properties used in components
  totalCommissions: number;
  tierBreakdown: {
    nomadCommissions: number;
    proCommissions: number;
    royalCommissions: number;
  };
}

export interface NetworkMetrics {
  totalNetworkSize: number;
  directReferrals: number;
  indirectReferrals: number;
  networkDepth: number;
  monthlyGrowth: number;
  networkValue: number;
  levelBreakdown: {
    [level: number]: {
      count: number;
      commissions: number;
    };
  };
  // Additional properties used in components
  personalNomadUsers: number;
  personalProUsers: number;
  personalRoyalUsers: number;
  networkNomadUsers: number;
  networkProUsers: number;
  networkRoyalUsers: number;
  networkLevel5Users: number;
  networkLevel6Users: number;
  networkLevel7Users: number;
  networkLevel8Users: number;
  networkLevel9Users: number;
  networkLevel10Users: number;
}

export interface UserProfileLevel {
  level: number;
  name: string;
  requirements: {
    minReferrals: number;
    minCommissions: number;
    minNetworkSize: number;
  };
  benefits: string[];
  commissionRate: number;
  bonuses: {
    [key: string]: number;
  };
}

export interface AffiliateActivity {
  id: string;
  type: 'referral' | 'commission' | 'level_up' | 'bonus';
  userAddress: string;
  description: string;
  amount?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CommissionTransaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  type: 'direct' | 'indirect' | 'bonus';
  level: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  transactionHash?: string;
}

export interface ReferralLink {
  id: string;
  userAddress: string;
  code: string;
  url: string;
  clicks: number;
  conversions: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AffiliateSettings {
  commissionRates: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
  bonusRates: {
    newUserBonus: number;
    monthlyBonus: number;
    performanceBonus: number;
  };
  requirements: {
    minPayoutAmount: number;
    payoutFrequency: 'weekly' | 'monthly' | 'quarterly';
    kycRequired: boolean;
  };
  features: {
    multiLevelEnabled: boolean;
    bonusesEnabled: boolean;
    customLinksEnabled: boolean;
    analyticsEnabled: boolean;
  };
}

// API Response interface for affiliate stats
export interface AffiliateStatsResponse {
  // Network metrics
  totalNetworkSize: number;
  directReferrals: number;
  indirectReferrals: number;
  networkDepth: number;
  monthlyGrowth: number;
  networkValue: number;
  levelBreakdown?: {
    [level: number]: {
      count: number;
      commissions: number;
    };
  };

  // User breakdown
  personalNomadUsers: number;
  personalProUsers: number;
  personalRoyalUsers: number;
  networkNomadUsers: number;
  networkProUsers: number;
  networkRoyalUsers: number;

  // Profile level breakdown
  networkLevel5Users: number;
  networkLevel6Users: number;
  networkLevel7Users: number;
  networkLevel8Users: number;
  networkLevel9Users: number;
  networkLevel10Users: number;

  // Commission data
  totalEarned: number;
  monthlyEarned: number;
  pendingCommissions: number;
  paidCommissions: number;
  commissionRate: number;
  totalCommissions: number;

  // Performance metrics
  performanceMetrics: {
    clickThroughRate: number;
    conversionRate: number;
    averageOrderValue: number;
  };

  // Tier breakdown
  tierBreakdown: {
    nomadCommissions: number;
    proCommissions: number;
    royalCommissions: number;
  };

  // Additional data
  recentTransactions: CommissionTransaction[];
  affiliateUsers: AffiliateUser[];
  totalCount: number;
  userProfileLevel: UserProfileLevel;
}
