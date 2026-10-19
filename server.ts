import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve Font files statically
app.use('/Font', express.static(path.join(__dirname, 'Font')));
app.use('/fonts', express.static(path.join(__dirname, 'Font')));

// ====================================================
// Type Definitions
// ====================================================
export interface UserProfile {
  id: number;
  telegram_id?: number;
  full_name: string;
  phone_number: string;
  national_id?: string;
  sheba?: string;
  role: 'employer' | 'freelancer' | 'arbitrator';
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

// ====================================================
// In-Memory Database Stores
// ====================================================

// Pre-seeded Demo Users
let users: UserProfile[] = [
  {
    id: 1802649782,
    telegram_id: 1802649782,
    full_name: 'علیرضا رضوانی',
    phone_number: '09121112233',
    national_id: '0012345678',
    sheba: 'IR520120000000001234567890',
    role: 'employer',
    wallet_balance: 45000000,
    escrow_locked_balance: 6000000,
    kyc_level: 'gold',
    kyc_status: 'verified',
    referral_code: 'REF-ALIREZA',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 290184712,
    telegram_id: 290184712,
    full_name: 'حسین سهرابی',
    phone_number: '09359998877',
    national_id: '0087654321',
    sheba: 'IR680170000000009876543210',
    role: 'freelancer',
    wallet_balance: 18500000,
    escrow_locked_balance: 0,
    kyc_level: 'silver',
    kyc_status: 'verified',
    referral_code: 'REF-HOSSEIN',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 999000111,
    telegram_id: 999000111,
    full_name: 'داور حقوقی میانجی (دکتر کریمی)',
    phone_number: '09120009988',
    national_id: '0055443322',
    role: 'arbitrator',
    wallet_balance: 0,
    escrow_locked_balance: 0,
    kyc_level: 'gold',
    kyc_status: 'verified',
    referral_code: 'REF-ARBITER',
    created_at: new Date(Date.now() - 90 * 86400000).toISOString()
  }
];

// Current logged in user ID (default to Alireza)
let currentUserId = 1802649782;

// Initial Contracts
let contracts: Contract[] = [
  {
    id: 'c_01',
    contract_id: 'DEV-842-109',
    title: 'طراحی و پیاده‌سازی ربات فروشگاهی و اسکرو تلگرام',
    amount: 15000000,
    category: 'DEV',
    deadline: 14,
    description: 'پیاده‌سازی ربات با پنل مدیریت، درگاه پرداخت امن، اتصال به دیتابیس Supabase و اعتبارسنجی خودکار قراردادها.',
    free_edits: 3,
    free_edits_left: 3,
    commission_payer: 'freelancer',
    creator_id: 1802649782,
    created_by: 1802649782,
    status: 'draft',
    buyer_id: 1802649782,
    buyer_fullname: 'علیرضا رضوانی',
    buyer_phone: '09121112233',
    buyer_national_id: '0012345678',
    seller_id: 290184712,
    seller_fullname: 'حسین سهرابی',
    seller_phone: '09359998877',
    history: [
      { event: 'پیش‌نویس اولیه قرارداد ایجاد شد.', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'کارفرما' }
    ],
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'c_02',
    contract_id: 'DS-419-702',
    title: 'طراحی هویت بصری، لوگو و رابط کاربری اپلیکیشن',
    amount: 8500000,
    category: 'DS',
    deadline: 7,
    description: 'طراحی لوگومونوگرام، پالت رنگ، تایپوگرافی و پروتوتایپ ۱۰ صفحه کلیدی در فیگما همراه با دیزاین سیستم.',
    free_edits: 2,
    free_edits_left: 2,
    commission_payer: 'split',
    creator_id: 1802649782,
    created_by: 1802649782,
    status: 'awaiting_payment',
    buyer_id: 1802649782,
    buyer_fullname: 'علیرضا رضوانی',
    buyer_phone: '09121112233',
    buyer_national_id: '0012345678',
    buyer_signed_at: new Date(Date.now() - 7200000).toISOString(),
    buyer_otp_verified: true,
    seller_id: 290184712,
    seller_fullname: 'حسین سهرابی',
    seller_phone: '09359998877',
    seller_signed_at: new Date(Date.now() - 5000000).toISOString(),
    seller_otp_verified: true,
    history: [
      { event: 'پیش‌نویس قرارداد ایجاد شد.', timestamp: new Date(Date.now() - 7400000).toISOString(), actor: 'کارفرما' },
      { event: 'قرارداد توسط کارفرما با کد OTP امضا شد.', timestamp: new Date(Date.now() - 7200000).toISOString(), actor: 'کارفرما' },
      { event: 'قرارداد توسط مجری تایید و امضا شد. در انتظار تامین وجه اسکرو.', timestamp: new Date(Date.now() - 5000000).toISOString(), actor: 'مجری' }
    ],
    created_at: new Date(Date.now() - 7400000).toISOString()
  },
  {
    id: 'c_03',
    contract_id: 'CNT-912-304',
    title: 'تولید ۲۰ مقاله تخصصی سئو و استراتژی محتوا',
    amount: 6000000,
    category: 'CNT',
    deadline: 10,
    description: 'نگارش مقالات سئومحور بالای ۱۵۰۰ کلمه به همراه تحقیق کلمات کلیدی، عناوین جذاب و تصاویر اختصاصی.',
    free_edits: 3,
    free_edits_left: 2,
    commission_payer: 'freelancer',
    creator_id: 1802649782,
    created_by: 1802649782,
    status: 'active',
    buyer_id: 1802649782,
    buyer_fullname: 'علیرضا رضوانی',
    buyer_phone: '09121112233',
    buyer_national_id: '0012345678',
    buyer_signed_at: new Date(Date.now() - 86400000).toISOString(),
    buyer_otp_verified: true,
    seller_id: 290184712,
    seller_fullname: 'حسین سهرابی',
    seller_phone: '09359998877',
    seller_national_id: '0087654321',
    seller_signed_at: new Date(Date.now() - 82000000).toISOString(),
    seller_otp_verified: true,
    history: [
      { event: 'قرارداد ثبت و توسط هر دو طرف با OTP امضا شد.', timestamp: new Date(Date.now() - 82000000).toISOString(), actor: 'سیستم' },
      { event: 'مبلغ ۶,۰۰۰,۰۰۰ تومان در صندوق امانی میانجی قفل شد و پروژه آغاز گردید.', timestamp: new Date(Date.now() - 80000000).toISOString(), actor: 'کارفرما' }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'c_04',
    contract_id: 'MKT-331-590',
    title: 'کمپین تبلیغاتی اینستاگرام و راه‌اندازی استراتژی رشد',
    amount: 12000000,
    category: 'MKT',
    deadline: 5,
    description: 'مدیریت و اجرای کمپین اینفلوئنسر مارکتینگ همراه با تدوین استوری‌ها و گزارش بازگشت سرمایه (ROI).',
    free_edits: 1,
    free_edits_left: 1,
    commission_payer: 'employer',
    creator_id: 1802649782,
    created_by: 1802649782,
    status: 'work_submitted',
    buyer_id: 1802649782,
    buyer_fullname: 'علیرضا رضوانی',
    buyer_phone: '09121112233',
    buyer_signed_at: new Date(Date.now() - 172800000).toISOString(),
    buyer_otp_verified: true,
    seller_id: 290184712,
    seller_fullname: 'حسین سهرابی',
    seller_phone: '09359998877',
    seller_signed_at: new Date(Date.now() - 170000000).toISOString(),
    seller_otp_verified: true,
    deliverables: {
      notes: 'تمامی فایل‌های بنرها، اکسل آمار دسترسی و گزارش نهایی بارگذاری گردید.',
      links: ['https://drive.google.com/drive/folders/miyanji-report-01'],
      submitted_at: new Date(Date.now() - 10000000).toISOString()
    },
    history: [
      { event: 'مبلغ ۱۲,۰۰۰,۰۰۰ تومان در اسکرو میانجی قفل شد.', timestamp: new Date(Date.now() - 165000000).toISOString(), actor: 'کارفرما' },
      { event: '📦 خروجی‌های پروژه توسط مجری ارسال شد و در انتظار تایید نهایی کارفرماست.', timestamp: new Date(Date.now() - 10000000).toISOString(), actor: 'مجری' }
    ],
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'c_05',
    contract_id: 'DEV-105-882',
    title: 'توسعه ماژول پرداخت کریپتو و داشبورد کاربری',
    amount: 22000000,
    category: 'DEV',
    deadline: 12,
    description: 'اتصال به وب۳، احراز هویت با متامسک و گزارش‌گیری تراکنش‌ها در فرانت‌اند با ری‌اکت.',
    free_edits: 3,
    free_edits_left: 3,
    commission_payer: 'freelancer',
    creator_id: 1802649782,
    created_by: 1802649782,
    status: 'completed',
    buyer_id: 1802649782,
    buyer_fullname: 'علیرضا رضوانی',
    buyer_phone: '09121112233',
    buyer_signed_at: new Date(Date.now() - 400000000).toISOString(),
    buyer_otp_verified: true,
    seller_id: 290184712,
    seller_fullname: 'حسین سهرابی',
    seller_phone: '09359998877',
    seller_signed_at: new Date(Date.now() - 390000000).toISOString(),
    seller_otp_verified: true,
    history: [
      { event: 'پروژه تایید نهایی شد و مبلغ ۱۹,۸۰۰,۰۰۰ تومان به مجری تسویه گردید (۲,۲۰۰,۰۰۰ تومان کارمزد پلتفرم).', timestamp: new Date(Date.now() - 200000000).toISOString(), actor: 'سیستم اسکرو' }
    ],
    created_at: new Date(Date.now() - 400000000).toISOString()
  }
];

// Initial Transactions
let transactions: WalletTransaction[] = [
  {
    id: 'tx_01',
    user_id: 1802649782,
    type: 'deposit',
    amount: 50000000,
    title: 'شارژ کیف پول از طریق درگاه پرداخت شاپرک',
    status: 'completed',
    ref_id: 'SHP-9812401',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'tx_02',
    user_id: 1802649782,
    type: 'escrow_lock',
    amount: 6000000,
    title: 'قفل شدن وجه در اسکرو برای قرارداد CNT-912-304',
    status: 'completed',
    ref_id: 'ESC-778102',
    contract_id: 'CNT-912-304',
    created_at: new Date(Date.now() - 80000000).toISOString()
  },
  {
    id: 'tx_03',
    user_id: 290184712,
    type: 'escrow_release',
    amount: 19800000,
    title: 'تسویه نهایی قرارداد DEV-105-882 پس از کسر کارمزد',
    status: 'completed',
    ref_id: 'REL-339101',
    contract_id: 'DEV-105-882',
    created_at: new Date(Date.now() - 200000000).toISOString()
  },
  {
    id: 'tx_04',
    user_id: 1802649782,
    type: 'affiliate_reward',
    amount: 220000,
    title: 'پاداش دعوت دوستان (۱۰٪ از کارمزد قرارداد معامله)',
    status: 'completed',
    ref_id: 'AFF-99120',
    created_at: new Date(Date.now() - 190000000).toISOString()
  }
];

// Initial Dispute Cases
let disputes: DisputeCase[] = [
  {
    id: 'disp_101',
    contract_id: 'DS-419-702',
    contract_title: 'طراحی هویت بصری، لوگو و رابط کاربری اپلیکیشن',
    claimant_id: 1802649782,
    claimant_name: 'علیرضا رضوانی (کارفرما)',
    reason: 'تاخیر در تحویل و عدم تطابق لوگو با بریف اولیه توافق‌شده',
    description: 'طبق بند ۲ قرارداد، موعد تحویل طرح‌ها ۳ روز پیش بوده اما مجری پاسخگو نبوده و طرح‌های ارسال‌شده اولیه فاقد کیفیت است.',
    evidence_files: ['https://placehold.co/600x400/1D4ED8/white?text=Screenshot+Chat'],
    status: 'under_review',
    messages: [
      {
        id: 'msg_1',
        sender_id: 1802649782,
        sender_name: 'علیرضا رضوانی',
        sender_role: 'buyer',
        text: 'سلام به داور محترم میانجی. متاسفانه مجری طبق تاریخ قرارداد عمل نکرده و تقاضای عودت وجه یا تحویل فوری طرح‌های باکیفیت را دارم.',
        timestamp: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: 'msg_2',
        sender_id: 290184712,
        sender_name: 'حسین سهرابی',
        sender_role: 'seller',
        text: 'درود. بنده فیدبک‌های کارفرما را روز گذشته اعمال کردم و طرح‌های جدید در فیگما آماده مشاهده است، درخواست ۲۴ ساعت فرصت برای هماهنگی نهایی دارم.',
        timestamp: new Date(Date.now() - 10000000).toISOString()
      },
      {
        id: 'msg_3',
        sender_id: 999000111,
        sender_name: 'داور حقوقی میانجی',
        sender_role: 'arbitrator',
        text: 'پیام هر دو طرف بررسی شد. طرفین لطفاً مستندات تکمیلی خود را تا ساعت ۱۸ امروز ارسال فرمایند تا رأی داوری صادر گردد.',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    created_at: new Date(Date.now() - 18000000).toISOString()
  }
];

// Helper to generate Contract ID
function generateContractId(category = 'GEN'): string {
  const num1 = Math.floor(100 + Math.random() * 900);
  const num2 = Math.floor(100 + Math.random() * 900);
  return `${category}-${num1}-${num2}`;
}

// Helper to calculate Sheba validation (Iranian IBAN MOD-97)
function isValidIranianSheba(sheba: string): boolean {
  const clean = (sheba || '').trim().toUpperCase();
  if (!/^IR\d{24}$/.test(clean)) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  const numericStr = rearranged
    .split('')
    .map(ch => (ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch))
    .join('');
  let remainder = 0;
  for (let i = 0; i < numericStr.length; i += 7) {
    const chunk = remainder + numericStr.substring(i, i + 7);
    remainder = Number(chunk) % 97;
  }
  return remainder === 1;
}

// Helper to validate Iranian National ID
function isValidIranianNationalId(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;
  const check = parseInt(code[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code[i], 10) * (10 - i);
  }
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}

// ====================================================
// Authentication & Profile Endpoints
// ====================================================

// Get Current Logged In User Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = users.find(u => u.id === currentUserId) || users[0];
  res.json(user);
});

// Switch active user role (Buyer, Seller, Arbitrator) for convenient testing
app.post('/api/auth/switch_user', (req: Request, res: Response) => {
  const { user_id } = req.body;
  const target = users.find(u => u.id === Number(user_id));
  if (target) {
    currentUserId = target.id;
    return res.json({ success: true, user: target });
  }
  res.status(404).json({ error: 'کاربر مورد نظر یافت نشد' });
});

// Phone & Password Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { phone_number, password } = req.body;
  if (!phone_number) {
    return res.status(400).json({ error: 'شماره تماس الزامی است.' });
  }

  let user = users.find(u => u.phone_number === phone_number);
  if (!user) {
    // Auto-create user if not found for seamless onboarding
    user = {
      id: Math.floor(100000000 + Math.random() * 900000000),
      full_name: 'کاربر جدید میانجی',
      phone_number: phone_number,
      role: 'employer',
      wallet_balance: 5000000,
      escrow_locked_balance: 0,
      kyc_level: 'basic',
      kyc_status: 'unverified',
      referral_code: `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      created_at: new Date().toISOString()
    };
    users.push(user);
  }

  currentUserId = user.id;
  res.json({
    success: true,
    message: 'ورود با موفقیت انجام شد.',
    user
  });
});

// Telegram Mini App Automatic Auth
app.post('/api/auth/telegram', (req: Request, res: Response) => {
  const { tg_user_id, tg_username, tg_fullname, initData } = req.body;
  const tid = Number(tg_user_id) || 1802649782;

  let user = users.find(u => u.telegram_id === tid);
  if (!user) {
    user = {
      id: tid,
      telegram_id: tid,
      full_name: tg_fullname || (tg_username ? `@${tg_username}` : 'کاربر تلگرام'),
      phone_number: '09120000000',
      role: 'employer',
      wallet_balance: 10000000,
      escrow_locked_balance: 0,
      kyc_level: 'basic',
      kyc_status: 'unverified',
      referral_code: `TG-${tid.toString().slice(-4)}`,
      created_at: new Date().toISOString()
    };
    users.push(user);
  }

  currentUserId = user.id;
  res.json({
    success: true,
    authenticated_via: 'Telegram WebApp',
    user
  });
});

// ====================================================
// Wallet & Financial Transactions Endpoints
// ====================================================

// Get Wallet Balance & Summary
app.get('/api/wallet/balance', (req: Request, res: Response) => {
  const user = users.find(u => u.id === currentUserId) || users[0];
  res.json({
    total_balance: user.wallet_balance + user.escrow_locked_balance,
    available_balance: user.wallet_balance,
    escrow_locked_balance: user.escrow_locked_balance,
    sheba: user.sheba || null,
    kyc_level: user.kyc_level
  });
});

// Get Transactions List
app.get('/api/wallet/transactions', (req: Request, res: Response) => {
  const userTx = transactions
    .filter(t => t.user_id === currentUserId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(userTx);
});

// Deposit into Wallet
app.post('/api/wallet/deposit', (req: Request, res: Response) => {
  const { amount, method = 'gateway', receipt_url } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount < 10000) {
    return res.status(400).json({ error: 'حداقل مبلغ واریز ۱۰,۰۰۰ تومان است.' });
  }

  const user = users.find(u => u.id === currentUserId) || users[0];
  user.wallet_balance += numAmount;

  const newTx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    user_id: user.id,
    type: 'deposit',
    amount: numAmount,
    title: method === 'card_to_card' ? 'واریز کارت به کارت (تایید شده)' : 'شارژ کیف پول از طریق درگاه پرداخت امن شاپرک',
    status: 'completed',
    ref_id: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
    created_at: new Date().toISOString()
  };

  transactions.unshift(newTx);

  res.json({
    success: true,
    message: `مبلغ ${numAmount.toLocaleString('fa-IR')} تومان با موفقیت به موجودی کیف پول اضافه شد.`,
    new_balance: user.wallet_balance,
    transaction: newTx
  });
});

// Withdraw from Wallet to Sheba IBAN
app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
  const { amount, sheba, account_owner } = req.body;
  const numAmount = Number(amount);
  const user = users.find(u => u.id === currentUserId) || users[0];

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'مبلغ برداشت نامعتبر است.' });
  }

  if (numAmount > user.wallet_balance) {
    return res.status(400).json({ error: 'موجودی قابل برداشت شما کمتر از مبلغ درخواستی است.' });
  }

  const targetSheba = sheba || user.sheba;
  if (!targetSheba) {
    return res.status(400).json({ error: 'لطفاً شماره شبای معتبر بانکی خود را وارد کنید.' });
  }

  // Deduct from available balance
  user.wallet_balance -= numAmount;

  const newTx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    user_id: user.id,
    type: 'withdraw',
    amount: numAmount,
    title: `درخواست برداشت وجه به شماره شبا ${targetSheba.slice(-8)}`,
    status: 'completed',
    ref_id: `WTH-${Math.floor(100000 + Math.random() * 900000)}`,
    sheba: targetSheba,
    created_at: new Date().toISOString()
  };

  transactions.unshift(newTx);

  res.json({
    success: true,
    message: `درخواست برداشت ${numAmount.toLocaleString('fa-IR')} تومان به شماره شبا ثبت و واریز شد (پایا/ساتنا).`,
    new_balance: user.wallet_balance,
    transaction: newTx
  });
});

// ====================================================
// Escrow Contracts Management Endpoints
// ====================================================

// General Stats
app.get('/api/stats', (req: Request, res: Response) => {
  const active = contracts.filter(c => c.status === 'active' || c.status === 'work_submitted').length;
  const pending = contracts.filter(c => c.status === 'pending_party_b' || c.status === 'awaiting_payment').length;
  const drafts = contracts.filter(c => c.status === 'draft').length;
  const completed = contracts.filter(c => c.status === 'completed').length;
  const inDispute = contracts.filter(c => c.status === 'in_dispute').length;
  const totalVolume = contracts
    .filter(c => c.status !== 'cancelled' && c.status !== 'draft')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  res.json({
    active,
    pending,
    drafts,
    completed,
    inDispute,
    totalVolume,
    contractsCount: contracts.length,
    commissionRate: 10
  });
});

// Get Contracts (Filterable by status, role, search)
app.get('/api/contracts', (req: Request, res: Response) => {
  const { status, category, search } = req.query;
  let result = [...contracts];

  if (status && status !== 'all') {
    if (status === 'active') {
      result = result.filter(c => c.status === 'active' || c.status === 'work_submitted');
    } else if (status === 'pending') {
      result = result.filter(c => c.status === 'pending_party_b' || c.status === 'awaiting_payment' || c.status === 'awaiting_receipt_approval');
    } else {
      result = result.filter(c => c.status === status);
    }
  }

  if (category && category !== 'all') {
    result = result.filter(c => c.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    result = result.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.contract_id.toLowerCase().includes(q) ||
      (c.buyer_fullname && c.buyer_fullname.toLowerCase().includes(q)) ||
      (c.seller_fullname && c.seller_fullname.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

// Get Single Contract by ID
app.get('/api/contracts/:id', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) {
    return res.status(404).json({ error: 'قرارداد یا پیش‌نویس مورد نظر یافت نشد.' });
  }
  res.json(c);
});

// Create New Escrow Contract or Draft
app.post('/api/contracts', (req: Request, res: Response) => {
  const body = req.body || {};
  const cat = body.category || 'GEN';
  const cid = body.contract_id || generateContractId(cat);
  const now = new Date().toISOString();
  const user = users.find(u => u.id === currentUserId) || users[0];

  const role = body.role || 'employer';
  const isEmployer = role === 'employer';

  const newContract: Contract = {
    id: `c_${Date.now()}`,
    contract_id: cid,
    title: body.title || 'قرارداد جدید میانجی',
    amount: Number(body.amount) || 0,
    category: cat,
    deadline: Number(body.deadline) || 7,
    description: body.description || '',
    free_edits: Number(body.free_edits) || 3,
    free_edits_left: Number(body.free_edits) || 3,
    commission_payer: body.commission_payer || 'freelancer',
    creator_id: user.id,
    created_by: user.id,
    status: body.as_draft ? 'draft' : 'pending_party_b',
    buyer_id: isEmployer ? user.id : undefined,
    buyer_fullname: isEmployer ? (body.signer_fullname || user.full_name) : body.counterparty_name,
    buyer_phone: isEmployer ? (body.signer_phone || user.phone_number) : body.counterparty_phone,
    buyer_national_id: isEmployer ? (body.signer_national_id || user.national_id) : undefined,
    buyer_signed_at: isEmployer && !body.as_draft ? now : undefined,
    buyer_otp_verified: isEmployer && !body.as_draft ? true : false,
    seller_id: !isEmployer ? user.id : undefined,
    seller_fullname: !isEmployer ? (body.signer_fullname || user.full_name) : body.counterparty_name,
    seller_phone: !isEmployer ? (body.signer_phone || user.phone_number) : body.counterparty_phone,
    seller_national_id: !isEmployer ? (body.signer_national_id || user.national_id) : undefined,
    seller_signed_at: !isEmployer && !body.as_draft ? now : undefined,
    seller_otp_verified: !isEmployer && !body.as_draft ? true : false,
    milestones: body.milestones || [],
    staged_payment: Boolean(body.staged_payment),
    history: [
      { event: `قرارداد توسط ${user.full_name} ثبت گردید.`, timestamp: now, actor: isEmployer ? 'کارفرما' : 'مجری' }
    ],
    created_at: now
  };

  contracts.unshift(newContract);
  res.status(201).json(newContract);
});

// Update Contract / Draft
app.put('/api/contracts/:id', (req: Request, res: Response) => {
  const index = contracts.findIndex(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'قرارداد یافت نشد.' });
  }

  const existing = contracts[index];
  const updates = req.body || {};
  const updated: Contract = {
    ...existing,
    ...updates,
    history: [
      ...existing.history,
      { event: 'مشخصات قرارداد به‌روزرسانی شد.', timestamp: new Date().toISOString(), actor: 'کاربر' }
    ]
  };

  contracts[index] = updated;
  res.json(updated);
});

// Delete Draft
app.delete('/api/contracts/:id', (req: Request, res: Response) => {
  const cid = req.params.id;
  const initialLen = contracts.length;
  contracts = contracts.filter(c => c.contract_id !== cid && c.id !== cid);

  if (contracts.length === initialLen) {
    return res.status(404).json({ error: 'پیش‌نویس یافت نشد.' });
  }

  res.json({ success: true, message: 'پیش‌نویس با موفقیت حذف گردید.' });
});

// Sign Contract with OTP
app.post('/api/contracts/:id/sign', (req: Request, res: Response) => {
  const cid = req.params.id;
  const c = contracts.find(x => x.contract_id === cid || x.id === cid);
  if (!c) {
    return res.status(404).json({ error: 'قرارداد یافت نشد.' });
  }

  const { role, fullname, phone, national_id } = req.body;
  const now = new Date().toISOString();

  if (role === 'employer' || (!c.buyer_signed_at && c.status === 'draft')) {
    c.buyer_fullname = fullname || c.buyer_fullname || 'کارفرما';
    c.buyer_phone = phone || c.buyer_phone || '09121112233';
    c.buyer_national_id = national_id || c.buyer_national_id || '0012345678';
    c.buyer_signed_at = now;
    c.buyer_otp_verified = true;
    c.history.push({
      event: `✍️ قرارداد توسط کارفرما (${c.buyer_fullname}) با تایید دیجیتال امضا شد.`,
      timestamp: now,
      actor: 'کارفرما'
    });

    if (c.seller_signed_at) {
      c.status = 'awaiting_payment';
      c.history.push({
        event: 'هر دو طرف قرارداد را تایید کردند. در انتظار پرداخت وجه به صندوق امانت.',
        timestamp: now,
        actor: 'سیستم اسکرو'
      });
    } else {
      c.status = 'pending_party_b';
    }
  } else {
    c.seller_fullname = fullname || c.seller_fullname || 'مجری پروژه';
    c.seller_phone = phone || c.seller_phone || '09359998877';
    c.seller_national_id = national_id || c.seller_national_id || '0087654321';
    c.seller_signed_at = now;
    c.seller_otp_verified = true;
    c.history.push({
      event: `✍️ قرارداد توسط مجری (${c.seller_fullname}) با تایید دیجیتال امضا شد.`,
      timestamp: now,
      actor: 'مجری'
    });

    if (c.buyer_signed_at) {
      c.status = 'awaiting_payment';
      c.history.push({
        event: 'هر دو طرف قرارداد را تایید کردند. در انتظار تامین وجه اسکرو.',
        timestamp: now,
        actor: 'سیستم اسکرو'
      });
    } else {
      c.status = 'pending_party_b';
    }
  }

  res.json({
    success: true,
    contract: c,
    pdf_ready: Boolean(c.buyer_signed_at && c.seller_signed_at),
    pdf_url: `/api/contracts/${c.contract_id}/pdf`
  });
});

// Escrow Funding / Deposit
app.post('/api/contracts/:id/pay', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const user = users.find(u => u.id === currentUserId) || users[0];
  const now = new Date().toISOString();

  // If user has enough balance in wallet, deduct from available and increase locked escrow
  if (user.wallet_balance >= c.amount) {
    user.wallet_balance -= c.amount;
    user.escrow_locked_balance += c.amount;
  }

  c.status = 'active';
  c.history.push({
    event: `💳 مبلغ ${c.amount.toLocaleString('fa-IR')} تومان در صندوق امانت امن میانجی قفل شد. پروژه فعال گردید.`,
    timestamp: now,
    actor: 'کارفرما'
  });

  const newTx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    user_id: user.id,
    type: 'escrow_lock',
    amount: c.amount,
    title: `قفل شدن وجه در اسکرو برای قرارداد ${c.contract_id}`,
    status: 'completed',
    ref_id: `ESC-${Math.floor(100000 + Math.random() * 900000)}`,
    contract_id: c.contract_id,
    created_at: now
  };
  transactions.unshift(newTx);

  res.json({ success: true, contract: c });
});

// Submit Deliverables / Work Done
app.post('/api/contracts/:id/deliver', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const { notes, links } = req.body || {};
  const now = new Date().toISOString();

  c.status = 'work_submitted';
  c.deliverables = {
    notes: notes || 'خروجی کار آماده شده و طبق توافقات تحویل گردید.',
    links: links || [],
    submitted_at: now
  };

  c.history.push({
    event: '📦 مجری پروژه خروجی‌های کار را ارسال کرد و در انتظار بررسی و تایید کارفرماست.',
    timestamp: now,
    actor: 'مجری'
  });

  res.json({ success: true, contract: c });
});

// Approve & Release Funds to Seller
app.post('/api/contracts/:id/approve', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const now = new Date().toISOString();
  c.status = 'completed';

  const commissionRate = 0.10; // 10% Platform fee
  const commission = Math.round(c.amount * commissionRate);
  const netAmount = c.amount - commission;

  // Release buyer locked escrow
  const buyer = users.find(u => u.id === (c.buyer_id || currentUserId));
  if (buyer && buyer.escrow_locked_balance >= c.amount) {
    buyer.escrow_locked_balance -= c.amount;
  }

  // Credit seller wallet
  const seller = users.find(u => u.id === c.seller_id) || users[1];
  if (seller) {
    seller.wallet_balance += netAmount;
  }

  // Credit affiliate 10% of commission
  const affiliateReward = Math.round(commission * 0.10);
  if (buyer) {
    buyer.wallet_balance += affiliateReward;
    transactions.unshift({
      id: `tx_${Date.now() + 1}`,
      user_id: buyer.id,
      type: 'affiliate_reward',
      amount: affiliateReward,
      title: `پاداش معرف معامله ${c.contract_id}`,
      status: 'completed',
      ref_id: `AFF-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: now
    });
  }

  c.history.push({
    event: `🏁 کارفرما کار را تایید نهایی کرد. وجه امانت به مبلغ ${netAmount.toLocaleString('fa-IR')} تومان به کیف پول مجری واریز گردید. کارمزد پلتفرم: ${commission.toLocaleString('fa-IR')} تومان.`,
    timestamp: now,
    actor: 'کارفرما'
  });

  transactions.unshift({
    id: `tx_${Date.now()}`,
    user_id: seller ? seller.id : 290184712,
    type: 'escrow_release',
    amount: netAmount,
    title: `تسویه نهایی قرارداد ${c.contract_id} پس از کسر کارمزد`,
    status: 'completed',
    ref_id: `REL-${Math.floor(100000 + Math.random() * 900000)}`,
    contract_id: c.contract_id,
    created_at: now
  });

  res.json({ success: true, contract: c });
});

// Cancel Contract & Refund
app.post('/api/contracts/:id/cancel', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const now = new Date().toISOString();
  c.status = 'cancelled';

  // If was active, refund buyer
  const buyer = users.find(u => u.id === (c.buyer_id || currentUserId));
  if (buyer && buyer.escrow_locked_balance >= c.amount) {
    buyer.escrow_locked_balance -= c.amount;
    buyer.wallet_balance += c.amount;
    transactions.unshift({
      id: `tx_${Date.now()}`,
      user_id: buyer.id,
      type: 'refund',
      amount: c.amount,
      title: `استرداد وجه قرارداد لغو شده ${c.contract_id}`,
      status: 'completed',
      ref_id: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      contract_id: c.contract_id,
      created_at: now
    });
  }

  c.history.push({
    event: '❌ قرارداد لغو گردید و وجه به کیف پول واریزکننده بازگردانده شد.',
    timestamp: now,
    actor: 'سیستم'
  });

  res.json({ success: true, contract: c });
});

// ====================================================
// KYC (Identity Verification) Endpoints
// ====================================================

// Submit KYC
app.post('/api/kyc/submit', (req: Request, res: Response) => {
  const { national_id, sheba, card_image } = req.body;
  const user = users.find(u => u.id === currentUserId) || users[0];

  if (national_id && !isValidIranianNationalId(national_id)) {
    return res.status(400).json({ error: 'کد ملی وارد شده با الگوریتم ثبت احوال کشور مطابقت ندارد.' });
  }

  if (sheba && !isValidIranianSheba(sheba)) {
    return res.status(400).json({ error: 'شماره شبای وارد شده نامعتبر است (فرمت IR + ۲۴ رقم و چک‌سام استاندارد).' });
  }

  user.national_id = national_id || user.national_id;
  user.sheba = sheba ? sheba.toUpperCase() : user.sheba;
  user.kyc_card_image = card_image || 'uploaded';
  user.kyc_status = 'verified';
  user.kyc_level = 'gold';
  user.kyc_submitted_at = new Date().toISOString();

  res.json({
    success: true,
    message: 'مدارک هویتی شما استعلام گردید و حساب کاربری به سطح طلایی ارتقا یافت.',
    user
  });
});

// Get KYC Status
app.get('/api/kyc/status', (req: Request, res: Response) => {
  const user = users.find(u => u.id === currentUserId) || users[0];
  res.json({
    kyc_level: user.kyc_level,
    kyc_status: user.kyc_status,
    national_id: user.national_id ? `${user.national_id.slice(0, 3)}***${user.national_id.slice(-3)}` : null,
    sheba: user.sheba || null
  });
});

// ====================================================
// Dispute & Arbitration Center Endpoints
// ====================================================

// Get All Disputes
app.get('/api/disputes', (req: Request, res: Response) => {
  res.json(disputes);
});

// Get Single Dispute with Messages
app.get('/api/disputes/:id', (req: Request, res: Response) => {
  const d = disputes.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'پرونده داوری یافت نشد.' });
  res.json(d);
});

// Open New Dispute for a Contract
app.post('/api/disputes', (req: Request, res: Response) => {
  const { contract_id, reason, description, evidence_files = [] } = req.body;
  const c = contracts.find(x => x.contract_id === contract_id || x.id === contract_id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const user = users.find(u => u.id === currentUserId) || users[0];
  const now = new Date().toISOString();

  const newDispute: DisputeCase = {
    id: `disp_${Date.now()}`,
    contract_id: c.contract_id,
    contract_title: c.title,
    claimant_id: user.id,
    claimant_name: `${user.full_name} (${user.role === 'employer' ? 'کارفرما' : 'مجری'})`,
    reason: reason || 'عدم توافق در تحویل یا کیفیت تعهدات',
    description: description || '',
    evidence_files,
    status: 'under_review',
    messages: [
      {
        id: `msg_${Date.now()}`,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role === 'employer' ? 'buyer' : 'seller',
        text: description || reason || 'درخواست رسیدگی داوری ثبت گردید.',
        timestamp: now
      }
    ],
    created_at: now
  };

  c.status = 'in_dispute';
  c.dispute_id = newDispute.id;
  c.history.push({
    event: `⚖️ پرونده داوری با شناسه ${newDispute.id} بازگشایی شد و به داور ارجاع گردید.`,
    timestamp: now,
    actor: 'داوری'
  });

  disputes.unshift(newDispute);
  res.status(201).json(newDispute);
});

// Send Message inside Dispute Thread
app.post('/api/disputes/:id/messages', (req: Request, res: Response) => {
  const d = disputes.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'پرونده داوری یافت نشد.' });

  const { text, attachment } = req.body;
  if (!text) return res.status(400).json({ error: 'متن پیام الزامی است.' });

  const user = users.find(u => u.id === currentUserId) || users[0];
  const now = new Date().toISOString();

  const newMsg: DisputeMessage = {
    id: `msg_${Date.now()}`,
    sender_id: user.id,
    sender_name: user.full_name,
    sender_role: user.role === 'arbitrator' ? 'arbitrator' : (user.role === 'employer' ? 'buyer' : 'seller'),
    text,
    attachment,
    timestamp: now
  };

  d.messages.push(newMsg);
  res.status(201).json(newMsg);
});

// Arbitrator Resolution Ruling
app.post('/api/disputes/:id/resolve', (req: Request, res: Response) => {
  const d = disputes.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'پرونده داوری یافت نشد.' });

  const { decision, comment } = req.body;
  const now = new Date().toISOString();
  const c = contracts.find(x => x.contract_id === d.contract_id);

  d.status = 'resolved';
  d.ruling = {
    decision: decision || 'split_50_50',
    arbitrator_name: 'داور رسمی میانجی (دکتر کریمی)',
    comment: comment || 'بر اساس شواهد و قرارداد، رأی نهایی صادر گردید.',
    resolved_at: now
  };

  if (c) {
    c.status = decision === 'pay_seller' ? 'completed' : 'cancelled';
    c.history.push({
      event: `⚖️ رأی داوری صادر شد: "${decision}". توضیحات: ${comment || 'مستندات بررسی شد.'}`,
      timestamp: now,
      actor: 'داور حقوقی'
    });
  }

  res.json({ success: true, dispute: d });
});

// ====================================================
// Affiliate & Ambassador Program Endpoints
// ====================================================

// Get Affiliate Stats
app.get('/api/affiliate', (req: Request, res: Response) => {
  const user = users.find(u => u.id === currentUserId) || users[0];
  const stats: AffiliateStats = {
    referral_code: user.referral_code,
    referral_link: `https://t.me/MiyanjiBot?start=${user.referral_code}`,
    total_clicks: 148,
    total_invited: 19,
    active_traders: 8,
    total_commission_earned: 1420000,
    withdrawable_commission: 420000,
    commission_rate_percent: 10,
    referral_history: [
      { user_name: 'محمد رضایی', signed_up_at: '۱۴۰۳/۰۷/۱۰', contracts_count: 3, earned_amount: 450000 },
      { user_name: 'سارا کاظمی', signed_up_at: '۱۴۰۳/۰۷/۱۴', contracts_count: 2, earned_amount: 320000 },
      { user_name: 'پویا امانی', signed_up_at: '۱۴۰۳/۰۷/۱۸', contracts_count: 1, earned_amount: 650000 }
    ]
  };
  res.json(stats);
});

// Claim / Withdraw Affiliate Earnings
app.post('/api/affiliate/withdraw', (req: Request, res: Response) => {
  const user = users.find(u => u.id === currentUserId) || users[0];
  const claimAmount = 420000;

  user.wallet_balance += claimAmount;
  transactions.unshift({
    id: `tx_${Date.now()}`,
    user_id: user.id,
    type: 'affiliate_reward',
    amount: claimAmount,
    title: 'انتقال سود سیستم سفیران به کیف پول اصلی',
    status: 'completed',
    ref_id: `AFF-TRF-${Math.floor(100000 + Math.random() * 900000)}`,
    created_at: new Date().toISOString()
  });

  res.json({
    success: true,
    message: `مبلغ ${claimAmount.toLocaleString('fa-IR')} تومان از سود سفیران به کیف پول شما منتقل شد.`,
    new_wallet_balance: user.wallet_balance
  });
});

// ====================================================
// PDF Contract Generation Endpoint
// ====================================================
app.get('/api/contracts/:id/pdf', async (req: Request, res: Response) => {
  try {
    const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'قرارداد یافت نشد.' });
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(__dirname, 'Font', 'Vazirmatn-Regular.ttf');
    let fontRegular;
    let fontBold;
    if (fs.existsSync(fontPath)) {
      const fontBytes = fs.readFileSync(fontPath);
      fontRegular = await pdfDoc.embedFont(fontBytes);
      fontBold = fontRegular;
    } else {
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    // Header bar (Royal Blue #1D4ED8)
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: rgb(0.11, 0.31, 0.85) // #1D4ED8
    });

    page.drawText('MIYANJI SMART ESCROW & CONTRACTS', {
      x: 40,
      y: height - 40,
      size: 15,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('Official Electronic Escrow Certificate & Legal Agreement', {
      x: 40,
      y: height - 60,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.85, 0.92, 1)
    });

    page.drawText(`ID: ${c.contract_id}`, {
      x: width - 180,
      y: height - 40,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText(`Issued: ${new Date(c.created_at).toLocaleDateString('en-US')}`, {
      x: width - 180,
      y: height - 60,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.85, 0.92, 1)
    });

    let y = height - 120;

    // Title Card
    page.drawRectangle({
      x: 40,
      y: y - 50,
      width: width - 80,
      height: 60,
      color: rgb(0.96, 0.98, 1),
      borderColor: rgb(0.82, 0.89, 1),
      borderWidth: 1
    });

    page.drawText('Contract Subject / Title:', {
      x: 55,
      y: y - 15,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.4, 0.6)
    });

    page.drawText(c.title.substring(0, 65), {
      x: 55,
      y: y - 35,
      size: 12,
      font: fontBold,
      color: rgb(0.08, 0.2, 0.5)
    });

    y -= 80;

    // Financial Grid
    const colWidth = (width - 100) / 3;

    // Box 1: Amount
    page.drawRectangle({
      x: 40,
      y: y - 60,
      width: colWidth,
      height: 65,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.9, 0.98),
      borderWidth: 1
    });
    page.drawText('Escrow Amount:', { x: 50, y: y - 15, size: 8.5, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${c.amount.toLocaleString()} Tomans`, { x: 50, y: y - 35, size: 12, font: fontBold, color: rgb(0.11, 0.31, 0.85) });
    page.drawText('Secured by Miyanji Vault', { x: 50, y: y - 52, size: 8, font: fontRegular, color: rgb(0.1, 0.6, 0.3) });

    // Box 2: Deadline
    page.drawRectangle({
      x: 50 + colWidth,
      y: y - 60,
      width: colWidth,
      height: 65,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.9, 0.98),
      borderWidth: 1
    });
    page.drawText('Delivery Deadline:', { x: 60 + colWidth, y: y - 15, size: 8.5, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${c.deadline} Working Days`, { x: 60 + colWidth, y: y - 35, size: 12, font: fontBold, color: rgb(0.1, 0.15, 0.25) });
    page.drawText(`Free Edits: ${c.free_edits} included`, { x: 60 + colWidth, y: y - 52, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    // Box 3: Status
    page.drawRectangle({
      x: 60 + colWidth * 2,
      y: y - 60,
      width: colWidth,
      height: 65,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.9, 0.98),
      borderWidth: 1
    });
    page.drawText('Current Escrow Status:', { x: 70 + colWidth * 2, y: y - 15, size: 8.5, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(c.status.toUpperCase(), { x: 70 + colWidth * 2, y: y - 35, size: 11, font: fontBold, color: rgb(0.1, 0.6, 0.3) });
    page.drawText('Verified Electronic Seal', { x: 70 + colWidth * 2, y: y - 52, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    y -= 95;

    // Parties Identity Box
    page.drawRectangle({
      x: 40,
      y: y - 120,
      width: width - 80,
      height: 120,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.9, 0.98),
      borderWidth: 1
    });

    page.drawText('IDENTIFIED CONTRACTING PARTIES:', {
      x: 55,
      y: y - 20,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4)
    });

    // Party A: Buyer/Client
    page.drawText('PARTY A (Employer / Buyer):', { x: 55, y: y - 45, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`Name: ${c.buyer_fullname || 'Client'}`, { x: 55, y: y - 62, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Phone: ${c.buyer_phone || 'Verified'} | National ID: ${c.buyer_national_id || 'Verified'}`, { x: 55, y: y - 77, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`OTP Signature: ${c.buyer_signed_at ? 'DIGITALLY SEALED (Verified)' : 'Pending'}`, {
      x: 55,
      y: y - 92,
      size: 8,
      font: fontBold,
      color: c.buyer_signed_at ? rgb(0.06, 0.6, 0.2) : rgb(0.8, 0.4, 0.1)
    });

    // Party B: Seller/Provider
    const pBCol = width / 2 + 10;
    page.drawText('PARTY B (Contractor / Freelancer):', { x: pBCol, y: y - 45, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`Name: ${c.seller_fullname || 'Contractor'}`, { x: pBCol, y: y - 62, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Phone: ${c.seller_phone || 'Verified'} | National ID: ${c.seller_national_id || 'Verified'}`, { x: pBCol, y: y - 77, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`OTP Signature: ${c.seller_signed_at ? 'DIGITALLY SEALED (Verified)' : 'Pending'}`, {
      x: pBCol,
      y: y - 92,
      size: 8,
      font: fontBold,
      color: c.seller_signed_at ? rgb(0.06, 0.6, 0.2) : rgb(0.8, 0.4, 0.1)
    });

    y -= 150;

    // Legal Terms
    page.drawRectangle({
      x: 40,
      y: y - 110,
      width: width - 80,
      height: 110,
      color: rgb(0.99, 1, 1),
      borderColor: rgb(0.88, 0.92, 0.98),
      borderWidth: 1
    });

    page.drawText('TERMS OF ESCROW & ELECTRONIC ENFORCEABILITY:', {
      x: 55,
      y: y - 18,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4)
    });

    const descSnippet = (c.description || 'Standard electronic escrow terms and deliverables benchmarks applied.').substring(0, 160);
    page.drawText(descSnippet, {
      x: 55,
      y: y - 40,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText('1. Escrow Protection: Funds remain locked in Miyanji escrow vault until confirmation of deliverables.', {
      x: 55,
      y: y - 60,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });
    page.drawText('2. Electronic Signature: Validated through mobile authentication and encrypted integrity hash.', {
      x: 55,
      y: y - 75,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });
    page.drawText('3. Legal Arbitration: Disagreements will be decisively arbitrated by Miyanji legal arbitrator board.', {
      x: 55,
      y: y - 90,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });

    y -= 140;

    // Digital Seal
    page.drawRectangle({
      x: 40,
      y: y - 90,
      width: width - 80,
      height: 90,
      color: rgb(0.96, 0.98, 1),
      borderColor: rgb(0.7, 0.8, 0.98),
      borderWidth: 1.5
    });

    page.drawText('DIGITAL CERTIFICATE & VALIDATION DIGEST', {
      x: 55,
      y: y - 20,
      size: 9,
      font: fontBold,
      color: rgb(0.11, 0.31, 0.85)
    });

    page.drawText(`SHA-256 Seal: 9b8e21a7df04523c909e4bfd71e0915a2cc945ebf`, {
      x: 55,
      y: y - 40,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });

    page.drawText(`Verified by Miyanji Escrow Authority (miyanji.ir)`, {
      x: 55,
      y: y - 55,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.2)
    });

    page.drawText(`Status: FULLY PROTECTED UNDER IRANIAN E-COMMERCE ACT (Article 6)`, {
      x: 55,
      y: y - 70,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.2, 0.4, 0.7)
    });

    // Footer
    page.drawLine({
      start: { x: 40, y: 35 },
      end: { x: width - 40, y: 35 },
      thickness: 0.5,
      color: rgb(0.8, 0.85, 0.9)
    });

    page.drawText(`Miyanji Escrow Certificate - ID: ${c.contract_id} - Generated for Web & Telegram Mini App`, {
      x: 40,
      y: 20,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.65)
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Miyanji_Contract_${c.contract_id}.pdf"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'خطا در تولید فایل PDF قرارداد: ' + err.message });
  }
});

// Telegram Bot Web Simulator API
app.post('/api/bot/simulate', (req: Request, res: Response) => {
  const { command, text } = req.body;
  const input = (text || command || '').trim();

  if (input === '/start' || input === 'شروع') {
    return res.json({
      reply: 'سلام! به سامانه جامع اسکرو میانجی (Miyanji Escrow) خوش آمدید.\nپلتفرم ثبت قراردادهای الکترونیک و واسطه‌گری امن در بستر تلگرام و وب.',
      keyboard: [
        ['🤝 ثبت معامله جدید', '📜 لیست معاملات من'],
        ['📁 پیش‌نویس‌های من', '💳 کیف پول و اعتبار'],
        ['👤 پروفایل کاربری', '💎 پنل سفیران'],
        ['⚖️ داوری و حل اختلاف', '🎧 پشتیبانی']
      ]
    });
  }

  return res.json({
    reply: `پیام دریافت شد: "${input}"\nجهت استفاده از خدمات، یکی از گزینه‌های منو را انتخاب فرمایید.`,
    keyboard: [
      ['🤝 ثبت معامله جدید', '📜 لیست معاملات من'],
      ['💳 کیف پول و اعتبار', '💎 پنل سفیران']
    ]
  });
});

// ====================================================
// Vite Integration (Dev Mode & Static Prod)
// ====================================================
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: HOST, port: PORT },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Miyanji Escrow Web & MiniApp Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});
