import { UserProfile, Contract, WalletTransaction, DisputeCase } from './types';

export let users: UserProfile[] = [
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

export let currentUserId = 1802649782;

export let contracts: Contract[] = [
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

export let transactions: WalletTransaction[] = [
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

export let disputes: DisputeCase[] = [
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

export function generateContractId(category = 'GEN'): string {
  const num1 = Math.floor(100 + Math.random() * 900);
  const num2 = Math.floor(100 + Math.random() * 900);
  return `${category}-${num1}-${num2}`;
}

export function isValidIranianSheba(sheba: string): boolean {
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

export function isValidIranianNationalId(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;
  const check = parseInt(code[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code[i], 10) * (10 - i);
  }
  const remainder = sum % 11;
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}

export function setCurrentUserId(id: number) {
  currentUserId = id;
}

export function setContracts(c: Contract[]) {
  contracts = c;
}

export function setTransactions(t: WalletTransaction[]) {
  transactions = t;
}

export function setDisputes(d: DisputeCase[]) {
  disputes = d;
}
