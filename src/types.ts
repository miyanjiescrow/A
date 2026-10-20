export interface UserProfile {
  id: number;
  telegram_id?: number;
  full_name: string;
  phone_number: string;
  national_id?: string;
  sheba?: string;
  role: 'employer' | 'freelancer' | 'arbitrator' | 'admin';
  wallet_balance: number;
  escrow_locked_balance: number;
  kyc_level: 'basic' | 'silver' | 'gold';
  kyc_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  kyc_submitted_at?: string;
  kyc_card_image?: string;
  referral_code: string;
  referred_by?: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: number;
  type: 'deposit' | 'withdraw' | 'escrow_lock' | 'escrow_release' | 'commission' | 'affiliate_reward' | 'refund';
  amount: number;
  title: string;
  status: 'completed' | 'pending' | 'rejected';
  ref_id: string;
  contract_id?: string;
  sheba?: string;
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'paid' | 'delivered' | 'completed';
}

export interface Contract {
  id: string;
  contract_id: string;
  title: string;
  amount: number;
  category: 'DEV' | 'DS' | 'CNT' | 'MKT' | 'GEN';
  deadline: number;
  description: string;
  free_edits: number;
  free_edits_left: number;
  commission_payer: 'freelancer' | 'employer' | 'split';
  creator_id: number;
  created_by: number;
  status: 'draft' | 'pending_party_b' | 'awaiting_payment' | 'awaiting_receipt_approval' | 'active' | 'work_submitted' | 'completed' | 'cancelled' | 'in_dispute';
  buyer_id?: number;
  buyer_fullname?: string;
  buyer_phone?: string;
  buyer_national_id?: string;
  buyer_signed_at?: string;
  buyer_otp_verified?: boolean;
  seller_id?: number;
  seller_fullname?: string;
  seller_phone?: string;
  seller_national_id?: string;
  seller_signed_at?: string;
  seller_otp_verified?: boolean;
  deliverables?: {
    notes?: string;
    links?: string[];
    submitted_at?: string;
  };
  milestones?: Milestone[];
  staged_payment?: boolean;
  dispute_id?: string;
  history: Array<{ event: string; timestamp: string; actor?: string }>;
  created_at: string;
}

export interface DisputeMessage {
  id: string;
  sender_id: number;
  sender_name: string;
  sender_role: 'buyer' | 'seller' | 'arbitrator';
  text: string;
  attachment?: string;
  timestamp: string;
}

export interface DisputeCase {
  id: string;
  contract_id: string;
  contract_title: string;
  claimant_id: number;
  claimant_name: string;
  reason: string;
  description: string;
  evidence_files: string[];
  status: 'under_review' | 'evidence_gathering' | 'arbitration_decision' | 'resolved';
  ruling?: {
    decision: 'refund_buyer' | 'pay_seller' | 'split_50_50';
    arbitrator_name: string;
    comment: string;
    resolved_at: string;
  };
  messages: DisputeMessage[];
  created_at: string;
}

export interface AffiliateStats {
  referral_code: string;
  referral_link: string;
  total_clicks: number;
  total_invited: number;
  active_traders: number;
  total_commission_earned: number;
  withdrawable_commission: number;
  commission_rate_percent: number;
  referral_history: Array<{
    user_name: string;
    signed_up_at: string;
    contracts_count: number;
    earned_amount: number;
  }>;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'message' | 'status_change' | 'escrow' | 'arbitration';
  contractId?: string;
  timestamp: string;
  read: boolean;
}
