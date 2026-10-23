export interface UserProfile {
  id: number;
  telegram_id?: number;
  full_name: string;
  phone_number: string;
  role: 'employer' | 'freelancer' | 'arbitrator';
  wallet_balance: number;
  escrow_locked_balance: number;
  kyc_level: string;
  kyc_status: string;
  referral_code: string;
  created_at: string;
  sheba?: string;
  national_id?: string;
  kyc_card_image?: string;
  kyc_submitted_at?: string;
}

export interface Contract {
  id: string;
  contract_id: string;
  title: string;
  amount: number;
  category: string;
  deadline: number;
  description: string;
  free_edits: number;
  free_edits_left: number;
  commission_payer: string;
  creator_id: number;
  created_by: number;
  status: string;
  buyer_id?: number;
  buyer_fullname?: string;
  buyer_phone?: string;
  buyer_national_id?: string;
  buyer_signed_at?: string;
  buyer_otp_verified: boolean;
  seller_id?: number;
  seller_fullname?: string;
  seller_phone?: string;
  seller_national_id?: string;
  seller_signed_at?: string;
  seller_otp_verified: boolean;
  milestones: any[];
  staged_payment: boolean;
  history: any[];
  created_at: string;
  deliverables?: any;
  dispute_id?: string;
}

export interface WalletTransaction {
  id: string;
  user_id: number;
  type: string;
  amount: number;
  title: string;
  status: string;
  ref_id: string;
  created_at: string;
  sheba?: string;
  contract_id?: string;
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
  status: string;
  messages: DisputeMessage[];
  created_at: string;
  ruling?: any;
}

export interface DisputeMessage {
  id: string;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  text: string;
  attachment?: string;
  timestamp: string;
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
  referral_history: any[];
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: string;
}
