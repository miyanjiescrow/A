import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  PlusCircle,
  Download,
  Send,
  Trash2,
  Edit3,
  Copy,
  ExternalLink,
  Smartphone,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Info,
  DollarSign,
  TrendingUp,
  Award,
  MessageSquare,
  Paperclip,
  Share2,
  Lock,
  Unlock,
  Building2,
  FileCheck2,
  RefreshCw,
  LogOut,
  ChevronDown,
  ChevronRight,
  Eye,
  Percent,
  Bell,
  BellRing,
  Volume2,
  User,
  Scale,
  Bot,
  Sparkles,
  SmartphoneNfc,
  UploadCloud,
  FileCheck,
  CheckCheck,
  Camera,
  ChevronLeft,
  BadgeCheck,
  Sun,
  Moon
} from 'lucide-react';

// ====================================================
// Type Definitions
// ====================================================

interface UserProfile {
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
  referral_code: string;
  created_at: string;
}

interface Contract {
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
  seller_id?: number;
  seller_fullname?: string;
  seller_phone?: string;
  seller_national_id?: string;
  seller_signed_at?: string;
  deliverables?: {
    notes?: string;
    links?: string[];
    submitted_at?: string;
  };
  dispute_id?: string;
  history: Array<{ event: string; timestamp: string; actor?: string }>;
  created_at: string;
}

interface WalletTransaction {
  id: string;
  user_id: number;
  type: 'deposit' | 'withdraw' | 'escrow_lock' | 'escrow_release' | 'commission' | 'affiliate_reward' | 'refund';
  amount: number;
  title: string;
  status: 'completed' | 'pending' | 'rejected';
  ref_id: string;
  contract_id?: string;
  created_at: string;
}

interface DisputeMessage {
  id: string;
  sender_id: number;
  sender_name: string;
  sender_role: 'buyer' | 'seller' | 'arbitrator';
  text: string;
  attachment?: string;
  timestamp: string;
}

interface DisputeCase {
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

interface AffiliateStats {
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

export default function App() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'new_contract' | 'services' | 'profile'>('dashboard');
  const [servicesSubTab, setServicesSubTab] = useState<'disputes' | 'affiliate'>('disputes');
  const [profileSubTab, setProfileSubTab] = useState<'kyc' | 'telegram_sync' | 'roles'>('kyc');
  const [viewMode, setViewMode] = useState<'desktop' | 'telegram'>('desktop');
  const [isTelegramClient, setIsTelegramClient] = useState(false);

  // Global Theme State ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('miyanji_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Apply Theme class to html root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('miyanji_theme', theme);
  }, [theme]);

  // Toggle Theme Helper
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      return next;
    });
  };

  // Telegram Bot Live Sync Simulator Modal
  const [showBotSimulator, setShowBotSimulator] = useState(false);
  const [botChatMessages, setBotChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string; buttons?: string[] }>>([
    {
      sender: 'bot',
      text: '👋 سلام! به سامانه رسمی اسکرو میانجی (Miyanji Escrow Bot) خوش آمدید.\nتمامی تراکنش‌ها و قراردادهای شما با وب‌اپلیکیشن به صورت بلادرنگ و دوطرفه هماهنگ است.',
      time: 'هم‌اکنون',
      buttons: ['🤝 ثبت معامله جدید', '📜 لیست معاملات من', '📁 پیش‌نویس‌های من', '💳 کیف پول و اعتبار', '👤 پروفایل و احراز هویت', '💎 پنل سفیران']
    }
  ]);
  const [botInput, setBotInput] = useState('');

  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif_1',
      title: 'تغییر وضعیت معامله به فعال',
      body: 'مبلغ ۶,۰۰۰,۰۰۰ تومان در اسکرو میانجی قفل شد و پروژه CNT-912-304 فعال گردید.',
      type: 'status_change',
      contractId: 'CNT-912-304',
      timestamp: '۱۰ دقیقه پیش',
      read: false
    },
    {
      id: 'notif_2',
      title: 'پیام جدید در پرونده داوری',
      body: 'داور حقوقی میانجی: مدارک تکمیلی شما بررسی شد و به زودی رأی صادر می‌گردد.',
      type: 'message',
      contractId: 'DS-419-702',
      timestamp: '۳۵ دقیقه پیش',
      read: false
    }
  ]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [bannerNotif, setBannerNotif] = useState<AppNotification | null>(null);

  // User & Data States
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Contracts Filter & Selection
  const [contractFilter, setContractFilter] = useState<'all' | 'active' | 'pending' | 'draft' | 'completed' | 'in_dispute'>('all');
  const [contractSearch, setContractSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('5000000');
  const [depositMethod, setDepositMethod] = useState<'gateway' | 'card_to_card'>('gateway');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawSheba, setWithdrawSheba] = useState('');

  const [showDeliverModal, setShowDeliverModal] = useState<Contract | null>(null);
  const [deliverNotes, setDeliverNotes] = useState('');
  const [deliverLink, setDeliverLink] = useState('');

  const [showDisputeModal, setShowDisputeModal] = useState<Contract | null>(null);
  const [disputeReason, setDisputeReason] = useState('تاخیر در تحویل و عدم پاسخگویی طرف قرارداد');
  const [disputeDetails, setDisputeDetails] = useState('');

  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [newDisputeMsg, setNewDisputeMsg] = useState('');

  // New Contract Form State
  const [newContractForm, setNewContractForm] = useState({
    title: '',
    role: 'employer',
    counterparty_name: '',
    counterparty_phone: '',
    amount: '',
    deadline: '7',
    category: 'DEV' as 'DEV' | 'DS' | 'CNT' | 'MKT' | 'GEN',
    commission_payer: 'freelancer' as 'freelancer' | 'employer' | 'split',
    free_edits: '2',
    description: '',
    as_draft: false
  });

  // KYC Multi-Step Wizard State
  const [kycStep, setKycStep] = useState<number>(1);
  const [kycNid, setKycNid] = useState('0012345678');
  const [kycSheba, setKycSheba] = useState('IR120120000000001234567890');
  const [kycBirthYear, setKycBirthYear] = useState('1368');
  const [kycBirthMonth, setKycBirthMonth] = useState('05');
  const [kycBirthDay, setKycBirthDay] = useState('14');
  const [kycDocFrontUploaded, setKycDocFrontUploaded] = useState(true);
  const [kycDocBackUploaded, setKycDocBackUploaded] = useState(true);
  const [kycSelfieUploaded, setKycSelfieUploaded] = useState(true);
  const [kycAgreedTerms, setKycAgreedTerms] = useState(true);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  // Bank Detector Helper from Iranian Sheba code
  const detectBankFromSheba = (shebaStr: string) => {
    const clean = (shebaStr || '').replace(/[\s-]/g, '').toUpperCase();
    if (clean.length < 6) return { name: 'در حال بررسی شماره شبا...', color: 'text-slate-500', logo: '💳' };
    const bankCode = clean.substring(4, 7);
    switch (bankCode) {
      case '017': return { name: 'بانک ملی ایران', color: 'text-blue-700', logo: '🏦' };
      case '012': return { name: 'بانک ملت', color: 'text-rose-600', logo: '🔴' };
      case '019': return { name: 'بانک صادرات ایران', color: 'text-indigo-700', logo: '🔵' };
      case '018': return { name: 'بانک تجارت', color: 'text-cyan-700', logo: '🔷' };
      case '054': return { name: 'بانک پارسیان', color: 'text-red-700', logo: '🔺' };
      case '057': return { name: 'بانک پاسارگاد', color: 'text-amber-600', logo: '🟡' };
      case '056': return { name: 'بانک سامان', color: 'text-sky-600', logo: '💎' };
      case '013': return { name: 'بانک رفاه کارگران', color: 'text-blue-600', logo: '🔹' };
      case '061': return { name: 'بانک شهر', color: 'text-orange-600', logo: '🔶' };
      case '062': return { name: 'بانک آینده', color: 'text-purple-600', logo: '🟣' };
      case '070': return { name: 'بانک قرض‌الحسنه رسالت', color: 'text-emerald-700', logo: '🟢' };
      default: return { name: 'شبای معتبر شبکه بانکی شتاب', color: 'text-blue-700', logo: '💳' };
    }
  };

  // Calculate KYC Progress Percentage
  const getKycProgressPercentage = () => {
    if (currentUser?.kyc_level === 'gold' && kycStep === 4) return 100;
    if (kycStep === 1) return 25;
    if (kycStep === 2) return 50;
    if (kycStep === 3) return 75;
    return 100;
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Play gentle melodic notification chime via Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(698.46, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Trigger Notification (Both In-App Banner & Native Browser Notification)
  const triggerNotification = (
    title: string,
    body: string,
    type: AppNotification['type'] = 'status_change',
    contractId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      type,
      contractId,
      timestamp: 'هم‌اکنون',
      read: false
    };

    playNotificationSound();
    setNotifications(prev => [newNotif, ...prev]);

    setBannerNotif(newNotif);
    setTimeout(() => {
      setBannerNotif(current => (current?.id === newNotif.id ? null : current));
    }, 6000);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const n = new Notification(`میانجی | ${title}`, {
            body,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231D4ED8"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V8.26l7-3.89v8.62z"/></svg>',
            dir: 'rtl',
            lang: 'fa'
          });
          n.onclick = () => {
            window.focus();
            if (contractId) {
              const target = contracts.find(x => x.contract_id === contractId);
              if (target) {
                setSelectedContract(target);
                setActiveTab('contracts');
              }
            }
          };
        } catch (err) {
          // Graceful ignore in iframe
        }
      }
    }

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch (e) {
      // Ignore
    }
  };

  // Request native browser notification permission
  const requestBrowserNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('مرورگر شما از اعلان‌های سیستمی پشتیبانی نمی‌کند، اما اعلان‌های درون‌برنامه‌ای فعال هستند.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setBrowserPerm(perm);
      if (perm === 'granted') {
        showToast('🔔 مجوز اعلان‌های مرورگر فعال گردید.');
        triggerNotification('اعلان‌های مرورگر فعال شد', 'از این پس تغییرات قراردادها و پیام‌های جدید با اعلان مرورگر به شما اطلاع داده می‌شود.', 'status_change');
      } else {
        showToast('مجوز اعلان رد شد. می‌توانید از اعلان‌های درون‌برنامه‌ای استفاده فرمایید.');
      }
    } catch (e) {
      showToast('عدم دسترسی به تنظیمات اعلان مرورگر');
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('تمامی اعلان‌ها خوانده شدند.');
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('لیست اعلان‌ها پاک شد.');
  };

  // Test simulation for live events
  const simulateTestNotification = () => {
    const sampleEvents = [
      {
        title: 'پیام جدید از طرف قرارداد',
        body: 'حسین سهرابی (مجری): نسخه آزمایشی ربات و پیش‌نمایش در تلگرام آماده تست کارفرماست.',
        type: 'message' as const,
        contractId: 'DEV-842-109'
      },
      {
        title: 'تغییر وضعیت به در انتظار پرداخت',
        body: 'طرف دوم قرارداد هویت بصری را تایید و امضا کرد. پروژه در انتظار تامین وجه اسکرو است.',
        type: 'status_change' as const,
        contractId: 'DS-419-702'
      },
      {
        title: 'واریز امن به صندوق اسکرو',
        body: 'مبلغ ۱۵,۰۰۰,۰۰۰ تومان در صندوق امانت قفل شد و قرارداد فعال گردید.',
        type: 'escrow' as const,
        contractId: 'DEV-842-109'
      },
      {
        title: 'پیام رسمی داور حقوقی',
        body: 'داور رسمی میانجی: شواهد بررسی شد، طرفین توافق کردند خروجی‌ها با یک مرحله ویرایش تحویل گردند.',
        type: 'arbitration' as const,
        contractId: 'DS-419-702'
      }
    ];

    const randomEvt = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
    triggerNotification(randomEvt.title, randomEvt.body, randomEvt.type, randomEvt.contractId);
  };

  // Check if running inside actual Telegram WebApp
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      setIsTelegramClient(true);
      setViewMode('telegram');
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#1D4ED8');
    }
  }, []);

  // Fetch Initial Data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [uRes, cRes, tRes, dRes, aRes] = await Promise.all([
        fetch('/api/auth/me').then(r => r.json()),
        fetch('/api/contracts').then(r => r.json()),
        fetch('/api/wallet/transactions').then(r => r.json()),
        fetch('/api/disputes').then(r => r.json()),
        fetch('/api/affiliate').then(r => r.json())
      ]);

      setCurrentUser(uRes);
      setContracts(cRes);
      setTransactions(tRes);
      setDisputes(dRes);
      setAffiliateStats(aRes);

      if (uRes.sheba) {
        setWithdrawSheba(uRes.sheba);
        setKycSheba(uRes.sheba);
      }
      if (uRes.national_id) {
        setKycNid(uRes.national_id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Switch Demo User
  const handleSwitchUser = async (userId: number) => {
    try {
      const res = await fetch('/api/auth/switch_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        showToast(`کاربر به «${data.user.full_name}» تغییر یافت.`);
        loadInitialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Telegram Bot Simulated Commands
  const handleBotCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    const userMsg = cmd.trim();
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    setBotChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: timeStr }]);
    setBotInput('');

    try {
      const res = await fetch('/api/bot/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg })
      });
      const data = await res.json();
      setBotChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply || 'دستور با موفقیت در دیتابیس هماهنگ شد.',
          time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          buttons: data.keyboard ? data.keyboard.flat() : undefined
        }
      ]);
    } catch (e) {
      setBotChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `پیام دریافت شد: "${userMsg}"\nتغییرات در وب‌اپلیکیشن به صورت آنلاین اعمال گردید.`,
          time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Deposit Action
  const handleDeposit = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt < 10000) {
      showToast('لطفاً مبلغ معتبری بالای ۱۰,۰۰۰ تومان وارد کنید.');
      return;
    }

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, method: depositMethod })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowDepositModal(false);
        loadInitialData();
      } else {
        showToast(data.error || 'خطا در افزایش موجودی');
      }
    } catch (err) {
      showToast('خطا در اتصال به سرور');
    }
  };

  // Withdraw Action
  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      showToast('لطفاً مبلغ برداشت را مشخص کنید.');
      return;
    }
    if (currentUser && amt > currentUser.wallet_balance) {
      showToast('موجودی قابل برداشت شما کافی نیست.');
      return;
    }

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, sheba: withdrawSheba })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        loadInitialData();
      } else {
        showToast(data.error || 'خطا در ثبت درخواست برداشت');
      }
    } catch (err) {
      showToast('خطا در اتصال به سرور');
    }
  };

  // Escrow Pay / Fund
  const handleFundEscrow = async (contractId: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/pay`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('✅ وجه در صندوق اسکرو میانجی قفل شد و پروژه آغاز گردید.');
        triggerNotification('تغییر وضعیت به فعال (قفل اسکرو)', `مبلغ معامله در صندوق امانت قفل شد و پروژه ${contractId} وارد فاز اجرایی شد.`, 'escrow', contractId);
        loadInitialData();
        if (selectedContract) setSelectedContract(data.contract);
      } else {
        showToast(data.error || 'خطا در تامین وجه');
      }
    } catch (err) {
      showToast('خطا در ارتباط با سرور');
    }
  };

  // Submit Deliverables
  const handleDeliverSubmit = async () => {
    if (!showDeliverModal) return;
    const cid = showDeliverModal.contract_id;
    try {
      const res = await fetch(`/api/contracts/${cid}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: deliverNotes,
          links: deliverLink ? [deliverLink] : []
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('📦 خروجی‌های پروژه برای کارفرما ارسال گردید.');
        triggerNotification('خروجی‌های کار تحویل شد', `مجری فایل‌ها و گزارش نهایی پروژه ${cid} را بارگذاری کرد و در انتظار بررسی شماست.`, 'status_change', cid);
        setShowDeliverModal(null);
        setDeliverNotes('');
        setDeliverLink('');
        loadInitialData();
        if (selectedContract) setSelectedContract(data.contract);
      }
    } catch (e) {
      showToast('خطا در ثبت تحویل کار');
    }
  };

  // Approve & Release Funds
  const handleApproveRelease = async (contractId: string) => {
    if (!window.confirm('آیا از تایید نهایی کار و آزادسازی وجه امانت به حساب مجری اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('🏁 تایید نهایی انجام شد و مبلغ به کیف پول مجری تسویه گردید.');
        triggerNotification('تایید نهایی و آزادسازی وجه اسکرو', `قرارداد ${contractId} با موفقیت تایید و مبلغ به کیف پول مجری واریز گردید.`, 'escrow', contractId);
        loadInitialData();
        if (selectedContract) setSelectedContract(data.contract);
      }
    } catch (e) {
      showToast('خطا در آزادسازی وجه');
    }
  };

  // Cancel Contract
  const handleCancelContract = async (contractId: string) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این معامله را لغو کنید؟')) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('قرارداد لغو گردید و وجه به موجودی شما بازگشت.');
        triggerNotification('لغو قرارداد معامله', `قرارداد ${contractId} لغو شد و مبالغ پرداختی عودت داده شد.`, 'status_change', contractId);
        loadInitialData();
        if (selectedContract) setSelectedContract(data.contract);
      }
    } catch (e) {
      showToast('خطا در لغو قرارداد');
    }
  };

  // Submit Dispute
  const handleSubmitDispute = async () => {
    if (!showDisputeModal) return;
    const cid = showDisputeModal.contract_id;
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: cid,
          reason: disputeReason,
          description: disputeDetails
        })
      });
      const data = await res.json();
      if (data.id) {
        showToast('⚖️ پرونده اختلاف با موفقیت ثبت شد و به داوری ارجاع داده شد.');
        triggerNotification('ثبت پرونده اختلاف جدید', `پرونده داوری برای معامله ${cid} تشکیل شد و به داور ارجاع گردید.`, 'arbitration', cid);
        setShowDisputeModal(null);
        setDisputeDetails('');
        loadInitialData();
        setActiveTab('services');
        setServicesSubTab('disputes');
        setSelectedDispute(data);
      }
    } catch (e) {
      showToast('خطا در ثبت اختلاف');
    }
  };

  // Send Dispute Message
  const handleSendDisputeMessage = async () => {
    if (!selectedDispute || !newDisputeMsg.trim()) return;
    const msgText = newDisputeMsg.trim();
    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText })
      });
      const msg = await res.json();
      if (msg.id) {
        setSelectedDispute({
          ...selectedDispute,
          messages: [...selectedDispute.messages, msg]
        });
        triggerNotification('پیام جدید در پرونده داوری', `${currentUser?.full_name}: ${msgText.slice(0, 60)}...`, 'message', selectedDispute.contract_id);
        setNewDisputeMsg('');
        loadInitialData();
      }
    } catch (e) {
      showToast('خطا در ارسال پیام');
    }
  };

  // Resolve Dispute (Arbitrator Action)
  const handleResolveDispute = async (decision: 'refund_buyer' | 'pay_seller' | 'split_50_50') => {
    if (!selectedDispute) return;
    try {
      const res = await fetch(`/api/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          comment: `بر اساس بررسی اسناد و گفتگوها، رأی نهایی (${decision}) صادر گردید.`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('⚖️ رأی قطعی داوری با موفقیت ثبت و اجرا شد.');
        loadInitialData();
        setSelectedDispute(data.dispute);
      }
    } catch (e) {
      showToast('خطا در صدور رأی');
    }
  };

  // Create Contract Submit
  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractForm.title || !newContractForm.amount) {
      showToast('لطفاً عنوان و مبلغ قرارداد را وارد نمایید.');
      return;
    }

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newContractForm.title,
          amount: Number(newContractForm.amount),
          category: newContractForm.category,
          deadline: Number(newContractForm.deadline),
          description: newContractForm.description,
          commission_payer: newContractForm.commission_payer,
          free_edits: Number(newContractForm.free_edits),
          counterparty_name: newContractForm.counterparty_name || 'طرف دوم معامله',
          counterparty_phone: newContractForm.counterparty_phone || '09350000000',
          as_draft: newContractForm.as_draft
        })
      });
      const data = await res.json();
      if (data.contract_id) {
        showToast(newContractForm.as_draft ? 'پیش‌نویس ذخیره شد.' : 'قرارداد ثبت شد و برای طرف دوم ارسال گردید.');
        triggerNotification('قرارداد جدید ثبت شد', `قرارداد ${data.contract_id} ایجاد و لینک امضا صادر گردید.`, 'status_change', data.contract_id);
        setNewContractForm({
          title: '',
          role: 'employer',
          counterparty_name: '',
          counterparty_phone: '',
          amount: '',
          deadline: '7',
          category: 'DEV',
          commission_payer: 'freelancer',
          free_edits: '2',
          description: '',
          as_draft: false
        });
        loadInitialData();
        setActiveTab('contracts');
        setSelectedContract(data);
      }
    } catch (e) {
      showToast('خطا در ثبت قرارداد');
    }
  };

  // Submit KYC
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycSubmitting(true);
    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          national_id: kycNid,
          sheba: kycSheba
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ احراز هویت با موفقیت تایید شد و حساب شما به سطح طلایی ارتقا یافت.');
        triggerNotification('ارتقای سطح احراز هویت', 'اطلاعات هویتی شما استعلام گردید و حساب به سطح طلایی ارتقا یافت.', 'status_change');
        loadInitialData();
      } else {
        showToast(data.error || 'خطا در اعتبارسنجی اطلاعات هویتی');
      }
    } catch (e) {
      showToast('خطا در ثبت اطلاعات احراز هویت');
    } finally {
      setKycSubmitting(false);
    }
  };

  // Withdraw Affiliate Earnings
  const handleClaimAffiliate = async () => {
    try {
      const res = await fetch('/api/affiliate/withdraw', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        loadInitialData();
      }
    } catch (e) {
      showToast('خطا در انتقال سود');
    }
  };

  // Download PDF Contract
  const handleDownloadPdf = async (contractId: string) => {
    try {
      setDownloadingPdf(contractId);
      showToast('در حال آماده‌سازی و دانلود فایل PDF رسمی سند معامله...');
      const response = await fetch(`/api/contracts/${contractId}/pdf`);
      if (!response.ok) throw new Error('دانلود ناموفق بود.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Miyanji_Contract_${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('✅ فایل PDF قرارداد با موفقیت دانلود شد.');
    } catch (err: any) {
      showToast('خطا در دانلود PDF: ' + err.message);
    } finally {
      setDownloadingPdf(null);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} در حافظه کپی شد.`);
  };

  // Filtered Contracts
  const filteredContracts = contracts.filter(c => {
    const matchesFilter =
      contractFilter === 'all' ? true :
      contractFilter === 'active' ? (c.status === 'active' || c.status === 'work_submitted') :
      contractFilter === 'pending' ? (c.status === 'pending_party_b' || c.status === 'awaiting_payment' || c.status === 'awaiting_receipt_approval') :
      contractFilter === 'draft' ? (c.status === 'draft') :
      contractFilter === 'completed' ? (c.status === 'completed') :
      contractFilter === 'in_dispute' ? (c.status === 'in_dispute') : true;

    const matchesSearch =
      contractSearch === '' ||
      c.title.toLowerCase().includes(contractSearch.toLowerCase()) ||
      c.contract_id.toLowerCase().includes(contractSearch.toLowerCase()) ||
      (c.buyer_fullname && c.buyer_fullname.toLowerCase().includes(contractSearch.toLowerCase())) ||
      (c.seller_fullname && c.seller_fullname.toLowerCase().includes(contractSearch.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Category Tag Helper
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'DEV': return { text: 'توسعه نرم‌افزار و ربات', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
      case 'DS': return { text: 'طراحی گرافیک و UI/UX', color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
      case 'CNT': return { text: 'محتوا و سئو', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'MKT': return { text: 'مارکتینگ و تبلیغات', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      default: return { text: 'معامله عمومی', color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return { text: 'در حال انجام (اسکرو فعال)', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: Lock };
      case 'work_submitted':
        return { text: 'خروجی کار تحویل شد (در انتظار تایید)', color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: Clock };
      case 'awaiting_payment':
        return { text: 'امضا شده - در انتظار تامین وجه', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: CreditCard };
      case 'pending_party_b':
        return { text: 'در انتظار تایید طرف دوم', color: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800', icon: Users };
      case 'completed':
        return { text: 'تکمیل و تسویه شده', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: CheckCircle2 };
      case 'in_dispute':
        return { text: 'در جریان داوری حقوقی', color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: AlertTriangle };
      case 'draft':
        return { text: 'پیش‌نویس اولیه', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: Edit3 };
      case 'cancelled':
        return { text: 'لغو شده (مسترد شده)', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: X };
      default:
        return { text: 'نامشخص', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: Info };
    }
  };

  // ====================================================
  // Render Main Content
  // ====================================================

  const renderContent = () => (
    <div className="flex-1 pb-32">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md w-full">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Floating Browser Notification Card (Banner) */}
      {bannerNotif && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-6 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded-xl shrink-0 mt-0.5">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{bannerNotif.title}</span>
                  {bannerNotif.contractId && (
                    <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      #{bannerNotif.contractId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{bannerNotif.body}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">اعلان زنده مرورگر • {bannerNotif.timestamp}</span>
              </div>
            </div>
            <button
              onClick={() => setBannerNotif(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            {bannerNotif.contractId && (
              <button
                onClick={() => {
                  const target = contracts.find(x => x.contract_id === bannerNotif.contractId);
                  if (target) {
                    setSelectedContract(target);
                    setActiveTab(bannerNotif.type === 'arbitration' ? 'services' : 'contracts');
                    if (bannerNotif.type === 'arbitration') setServicesSubTab('disputes');
                  }
                  setBannerNotif(null);
                }}
                className="text-xs text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 font-bold px-3 py-1 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition"
              >
                مشاهده قرارداد / پرونده
              </button>
            )}
            <button
              onClick={() => setBannerNotif(null)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2.5 py-1 rounded-lg transition"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}

      {/* Main Tab Views */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Hero Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Available Balance */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-blue-600/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-medium text-blue-200">موجودی آزاد کیف پول</span>
                  <div className="text-2xl md:text-3xl font-bold mt-1">
                    {(currentUser?.wallet_balance || 0).toLocaleString('fa-IR')}{' '}
                    <span className="text-xs font-normal text-blue-200">تومان</span>
                  </div>
                </div>
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="flex-1 bg-white text-blue-800 hover:bg-blue-50 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  شارژ کیف پول
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex-1 bg-blue-600/60 hover:bg-blue-600 text-white py-2 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  برداشت به شبا
                </button>
              </div>
            </div>

            {/* Escrow Locked Balance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">امانت امن در اسکرو (قفل شده)</span>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {(currentUser?.escrow_locked_balance || 0).toLocaleString('fa-IR')}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">تومان</span>
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/50">
                  <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                وجه معاملات فعال در صندوق امانت میانجی تضمین شده و پس از تایید نهایی آزاد می‌گردد.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 font-semibold cursor-pointer hover:underline" onClick={() => { setActiveTab('contracts'); setContractFilter('active'); }}>
                مشاهده معاملات فعال در اسکرو
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Active Contracts Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">اعتبار و وضعیت کاربر</span>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    {contracts.length}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">قرارداد ثبت‌شده</span>
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
                  <ShieldCheck className="w-6 h-6 text-blue-700 dark:text-blue-400" />
                </div>
              </div>
              <div className="space-y-2 mt-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">سطح احراز هویت (KYC):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">سطح {currentUser?.kyc_level === 'gold' ? 'طلایی (کامل)' : 'نقره‌ای'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">هماهنگی ربات تلگرام:</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    همگام با @MiyanjiBot
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action & Telegram Bot Sync Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-700 text-white rounded-xl shrink-0 shadow-sm shadow-blue-300 dark:shadow-none">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">هماهنگی کامل وب‌اپلیکیشن و ربات تلگرام</h3>
                  <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">سینک بلادرنگ</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">تمامی قراردادها، موجودی کیف‌پول و اعلان‌ها در ربات @MiyanjiBot و نسخه وب هماهنگ هستند.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowBotSimulator(true)}
                className="flex-1 md:flex-none bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Bot className="w-4 h-4" />
                شبیه‌ساز ربات تلگرام
              </button>
              <button
                onClick={() => setActiveTab('new_contract')}
                className="flex-1 md:flex-none bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-300 dark:shadow-none"
              >
                <PlusCircle className="w-4 h-4" />
                معامله جدید
              </button>
            </div>
          </div>

          {/* Recent Deals Table / List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            {/* Professional Card Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">معاملات و قراردادهای اخیر شما</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">وضعیت زنده، مراحل اسکرو و اقدامات سریع</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('contracts')}
                className="text-xs text-blue-700 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                مشاهده همه
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {contracts.slice(0, 4).map((c) => {
                const badge = getStatusBadge(c.status);
                const BadgeIcon = badge.icon;
                const catInfo = getCategoryBadge(c.category);

                return (
                  <div key={c.id} className="p-4 md:p-5 hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-all duration-200 group flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${badge.color}`}>
                        <BadgeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-sm">{c.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${catInfo.color}`}>
                            {catInfo.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span>شناسه: <strong className="font-mono text-slate-700 dark:text-slate-300">{c.contract_id}</strong></span>
                          <span>مبلغ: <strong className="text-blue-700 dark:text-blue-400 font-semibold">{c.amount.toLocaleString('fa-IR')} تومان</strong></span>
                          <span>مهلت: {c.deadline} روز کاری</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <span className={`text-xs px-3 py-1 rounded-full border font-medium ${badge.color}`}>
                        {badge.text}
                      </span>
                      <button
                        onClick={() => { setSelectedContract(c); setActiveTab('contracts'); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 active:scale-95 shadow-2xs"
                        title="مشاهده جزییات کامل"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>مشاهده</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wallet Transaction History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
            {/* Professional Card Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base">گردش مالی و تراکنش‌های اخیر</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">واریز، برداشت و قفل وجه در صندوق امانت میانجی</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">تراکنشی یافت نشد.</div>
              ) : (
                transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        t.type === 'deposit' || t.type === 'affiliate_reward' || t.type === 'escrow_release'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40'
                      }`}>
                        {t.type === 'deposit' ? <PlusCircle className="w-4 h-4" /> :
                         t.type === 'withdraw' ? <ArrowRight className="w-4 h-4" /> :
                         t.type === 'escrow_lock' ? <Lock className="w-4 h-4" /> :
                         <TrendingUp className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">{t.title}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">کد پیگیری: {t.ref_id}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`font-bold text-sm ${
                        t.type === 'deposit' || t.type === 'affiliate_reward' || t.type === 'escrow_release'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {t.type === 'deposit' || t.type === 'affiliate_reward' || t.type === 'escrow_release' ? '+' : '-'}
                        {t.amount.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">تومان</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40">موفق</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">مدیریت قراردادهای اسکرو</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مشاهده وضعیت امانت، اقدامات آزادسازی و دانلود نسخه PDF معتبر</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="جستجو در قراردادها..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              <button
                onClick={() => setActiveTab('new_contract')}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                معامله جدید
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'همه معاملات' },
              { id: 'active', label: 'در حال انجام (اسکرو فعال)' },
              { id: 'pending', label: 'در انتظار اقدام / پرداخت' },
              { id: 'draft', label: 'پیش‌نویس‌ها' },
              { id: 'completed', label: 'تسویه و تکمیل شده' },
              { id: 'in_dispute', label: 'دارای اختلاف داوری' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setContractFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl font-medium transition shrink-0 ${
                  contractFilter === f.id
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Contracts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContracts.map((c) => {
              const badge = getStatusBadge(c.status);
              const BadgeIcon = badge.icon;
              const catInfo = getCategoryBadge(c.category);

              return (
                <div
                  key={c.id}
                  className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 p-5 space-y-4 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-400/90 dark:hover:border-blue-500/80 ${
                    selectedContract?.id === c.id ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-950 shadow-md' : 'border-slate-200/80 dark:border-slate-800 shadow-2xs'
                  }`}
                >
                  {/* Modern Hover Glow Accent */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Sleek Minimal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800/60 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs group-hover:border-blue-300 dark:group-hover:border-blue-700 transition-colors">
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {c.contract_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${catInfo.color}`}>
                        {catInfo.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 shadow-2xs ${badge.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {badge.text}
                      </span>
                      <button
                        onClick={() => setSelectedContract(c)}
                        className="text-slate-400 dark:text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                        title="مشاهده جزئیات کامل معامله"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title with hover color micro-interaction */}
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-sm leading-snug">
                    {c.title}
                  </h3>

                  {/* Minimal Lifecycle Visual Stepper */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100/90 dark:border-slate-800 group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-2">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        مراحل امنیتی صندوق امانت:
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {c.status === 'completed' ? 'تکمیل شده ۱۰۰٪' : c.status === 'work_submitted' ? 'مرحله ۳: تایید نهایی' : c.status === 'active' ? 'مرحله ۲: اسکرو فعال' : 'مرحله ۱: امضا'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 relative">
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 transition-all ${
                          c.status !== 'draft' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {c.status !== 'draft' ? <Check className="w-3 h-3" /> : '۱'}
                        </div>
                        <span className="text-[10px]">ثبت و امضا</span>
                      </div>
                      <div className={`h-0.5 flex-1 mx-1 transition-colors ${c.status === 'active' || c.status === 'work_submitted' || c.status === 'completed' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 transition-all ${
                          c.status === 'active' || c.status === 'work_submitted' || c.status === 'completed'
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {c.status === 'work_submitted' || c.status === 'completed' ? <Check className="w-3 h-3" /> : '۲'}
                        </div>
                        <span className="text-[10px]">قفل اسکرو</span>
                      </div>
                      <div className={`h-0.5 flex-1 mx-1 transition-colors ${c.status === 'work_submitted' || c.status === 'completed' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 transition-all ${
                          c.status === 'work_submitted' || c.status === 'completed'
                            ? 'bg-blue-700 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {c.status === 'completed' ? <Check className="w-3 h-3" /> : '۳'}
                        </div>
                        <span className="text-[10px]">تحویل کار</span>
                      </div>
                      <div className={`h-0.5 flex-1 mx-1 transition-colors ${c.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 transition-all ${
                          c.status === 'completed'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {c.status === 'completed' ? <Check className="w-3 h-3" /> : '۴'}
                        </div>
                        <span className="text-[10px]">تسویه نهایی</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Parties Meta (Minimalist Cards) */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/60 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] mb-0.5">مبلغ کل قرارداد:</span>
                      <strong className="text-blue-700 dark:text-blue-400 font-bold text-xs">{c.amount.toLocaleString('fa-IR')} تومان</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] mb-0.5">مهلت تحویل پروژه:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {c.deadline} روز کاری
                      </strong>
                    </div>
                    <div className="mt-1 pt-1.5 border-t border-slate-100/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">کارفرما (خریدار):</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate block">{c.buyer_fullname || 'ثبت‌نشده'}</span>
                    </div>
                    <div className="mt-1 pt-1.5 border-t border-slate-100/80 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px]">مجری (فروشنده):</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium text-xs truncate block">{c.seller_fullname || 'ثبت‌نشده'}</span>
                    </div>
                  </div>

                  {/* Modern & Minimal Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {c.status === 'awaiting_payment' && (
                      <button
                        onClick={() => handleFundEscrow(c.contract_id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200/90 dark:border-emerald-800/70 hover:border-emerald-600 shadow-2xs transition-all duration-200 active:scale-95"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>واریز به اسکرو و شروع</span>
                      </button>
                    )}

                    {c.status === 'active' && (
                      <button
                        onClick={() => setShowDeliverModal(c)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-600 hover:text-white border border-sky-200/90 dark:border-sky-800/70 hover:border-sky-600 shadow-2xs transition-all duration-200 active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال خروجی پروژه</span>
                      </button>
                    )}

                    {c.status === 'work_submitted' && (
                      <button
                        onClick={() => handleApproveRelease(c.contract_id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-700 hover:text-white border border-blue-200/90 dark:border-blue-800/70 hover:border-blue-700 shadow-2xs transition-all duration-200 active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تایید و تسویه نهایی</span>
                      </button>
                    )}

                    {/* Minimal Download PDF Button */}
                    <button
                      onClick={() => handleDownloadPdf(c.contract_id)}
                      disabled={downloadingPdf === c.contract_id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 shadow-2xs transition-all duration-200 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{downloadingPdf === c.contract_id ? 'در حال دریافت...' : 'دانلود PDF'}</span>
                    </button>

                    {/* Minimal Details Button */}
                    <button
                      onClick={() => setSelectedContract(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>جزئیات</span>
                    </button>

                    {/* Minimal Dispute Button */}
                    {(c.status === 'active' || c.status === 'work_submitted') && (
                      <button
                        onClick={() => setShowDisputeModal(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50/70 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-900/60 transition-all duration-200 active:scale-95 mr-auto"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ثبت اختلاف</span>
                      </button>
                    )}

                    {/* Minimal Cancel / Delete Button */}
                    {(c.status === 'draft' || c.status === 'pending_party_b') && (
                      <button
                        onClick={() => handleCancelContract(c.contract_id)}
                        className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40 transition-all duration-200 active:scale-95 mr-auto"
                        title="لغو قرارداد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Contract Wizard Tab */}
      {activeTab === 'new_contract' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6 transition-colors">
          {/* Professional Card Header */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">فرم ثبت قرارداد و معامله امن اسکرو</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ثبت رسمی مشخصات و ارسال مستقیم برای طرف دوم معامله</p>
            </div>
          </div>

          <form onSubmit={handleCreateContract} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">عنوان کامل قرارداد یا معامله *</label>
              <input
                type="text"
                placeholder="مثال: طراحی وبسایت فروشگاهی با درگاه پرداخت و پنل ادمین"
                value={newContractForm.title}
                onChange={(e) => setNewContractForm({ ...newContractForm, title: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">دسته‌بندی موضوعی</label>
                <select
                  value={newContractForm.category}
                  onChange={(e) => setNewContractForm({ ...newContractForm, category: e.target.value as any })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                >
                  <option value="DEV">توسعه نرم‌افزار، وب و ربات تلگرام</option>
                  <option value="DS">طراحی هویت بصری و گرافیک</option>
                  <option value="CNT">تولید محتوا، ترجمه و سئو</option>
                  <option value="MKT">دیجیتال مارکتینگ و تبلیغات</option>
                  <option value="GEN">معاملات عمومی و کالای دیجیتال</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">مهلت تحویل (روز کاری) *</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={newContractForm.deadline}
                  onChange={(e) => setNewContractForm({ ...newContractForm, deadline: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">مبلغ کل قرارداد (تومان) *</label>
                <input
                  type="number"
                  placeholder="مثال: 15000000"
                  value={newContractForm.amount}
                  onChange={(e) => setNewContractForm({ ...newContractForm, amount: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                  required
                />
                {newContractForm.amount && (
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold block mt-1">
                    {Number(newContractForm.amount).toLocaleString('fa-IR')} تومان
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">پرداخت‌کننده کارمزد (۱۰٪)</label>
                <select
                  value={newContractForm.commission_payer}
                  onChange={(e) => setNewContractForm({ ...newContractForm, commission_payer: e.target.value as any })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                >
                  <option value="freelancer">کسر از سهم مجری (پیش‌فرض)</option>
                  <option value="employer">پرداخت توسط کارفرما</option>
                  <option value="split">بالمناصفه (۵۰٪ کارفرما - ۵۰٪ مجری)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">نام یا شناسه طرف دوم</label>
                <input
                  type="text"
                  placeholder="مثال: حسین سهرابی یا @hossein_dev"
                  value={newContractForm.counterparty_name}
                  onChange={(e) => setNewContractForm({ ...newContractForm, counterparty_name: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">شماره تماس طرف دوم (جهت پیامک)</label>
                <input
                  type="text"
                  placeholder="0912..."
                  value={newContractForm.counterparty_phone}
                  onChange={(e) => setNewContractForm({ ...newContractForm, counterparty_phone: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">شرح تعهدات و مشخصات دقیق تحویل پروژه *</label>
              <textarea
                rows={4}
                placeholder="تعهدات مجری، موارد تحویلی و معیارهای پذیرش را با دقت بنویسید..."
                value={newContractForm.description}
                onChange={(e) => setNewContractForm({ ...newContractForm, description: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setNewContractForm({ ...newContractForm, as_draft: true });
                  setTimeout(() => {
                    const fakeE = { preventDefault: () => {} } as any;
                    handleCreateContract(fakeE);
                  }, 50);
                }}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition border border-transparent dark:border-slate-700"
              >
                ذخیره به عنوان پیش‌نویس
              </button>
              <button
                type="submit"
                onClick={() => setNewContractForm({ ...newContractForm, as_draft: false })}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-300 dark:shadow-none flex items-center gap-2 active:scale-95"
              >
                <Check className="w-4 h-4" />
                ثبت و ارسال دعوتنامه معامله
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services Tab: Disputes & Affiliate Program */}
      {activeTab === 'services' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Subtab Switcher */}
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl max-w-md mx-auto transition-colors">
            <button
              onClick={() => setServicesSubTab('disputes')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                servicesSubTab === 'disputes' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              مرکز داوری و حل اختلاف ({disputes.length})
            </button>
            <button
              onClick={() => setServicesSubTab('affiliate')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                servicesSubTab === 'affiliate' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              سامانه سفیران (Affiliate)
            </button>
          </div>

          {servicesSubTab === 'disputes' ? (
            /* Disputes Section */
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-6 bg-gradient-to-b from-rose-500 to-rose-700 rounded-full" />
                  <div>
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
                      <AlertTriangle className="w-5 h-5" />
                      مرکز داوری حقوقی و حل اختلاف میانجی
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      بررسی سه‌جانبه پرونده‌ها توسط وکلای متخصص و صدور رأی قطعی بر اساس اسناد
                    </p>
                  </div>
                </div>
                {currentUser?.role === 'arbitrator' && (
                  <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800">
                    حالت دسترسی داور ارشد فعال است
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 space-y-3 transition-colors">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs px-1">پرونده‌های فعال و در جریان ({disputes.length})</h3>
                  <div className="space-y-2">
                    {disputes.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDispute(d)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          selectedDispute?.id === d.id
                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500/20'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">{d.contract_id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            d.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {d.status === 'resolved' ? 'رأی صادر شد' : 'در دست بررسی داور'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{d.contract_title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">شاکی: {d.claimant_name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[520px] transition-colors">
                  {selectedDispute ? (
                    <>
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 rounded-t-2xl">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedDispute.contract_title}</h4>
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 font-medium">علت: {selectedDispute.reason}</p>
                        </div>
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">پرونده: #{selectedDispute.id}</span>
                      </div>

                      <div className="flex-1 p-4 overflow-y-auto space-y-3">
                        {selectedDispute.messages.map((m) => {
                          const isArb = m.sender_role === 'arbitrator';
                          const isMe = m.sender_id === currentUser?.id;

                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col max-w-[85%] ${
                                isArb
                                  ? 'mx-auto w-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 p-3 rounded-2xl text-center'
                                  : isMe
                                  ? 'mr-auto bg-blue-700 text-white p-3 rounded-2xl rounded-br-none shadow-xs'
                                  : 'ml-auto bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-3 rounded-2xl rounded-bl-none'
                              }`}
                            >
                              <div className={`text-[10px] mb-1 font-semibold ${
                                isArb ? 'text-purple-700 dark:text-purple-300' : isMe ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {m.sender_name} {isArb && '⚖️ (داور رسمی میانجی)'}
                              </div>
                              <p className="text-xs leading-relaxed">{m.text}</p>
                            </div>
                          );
                        })}

                        {selectedDispute.ruling && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 my-2 text-center">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                            <h5 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">رأی نهایی داوری صادر گردید</h5>
                            <p className="text-xs text-emerald-800 dark:text-emerald-400 mt-1">{selectedDispute.ruling.comment}</p>
                          </div>
                        )}
                      </div>

                      {currentUser?.role === 'arbitrator' && selectedDispute.status !== 'resolved' && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-950/50 border-t border-purple-200 dark:border-purple-800 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-300">صدور رأی نهایی داوری:</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveDispute('refund_buyer')}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95"
                            >
                              عودت وجه به خریدار
                            </button>
                            <button
                              onClick={() => handleResolveDispute('pay_seller')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95"
                            >
                              تسویه با مجری
                            </button>
                            <button
                              onClick={() => handleResolveDispute('split_50_50')}
                              className="bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95"
                            >
                              تسهیم ۵۰-۵۰
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="متن دفاعیه یا توضیحات..."
                          value={newDisputeMsg}
                          onChange={(e) => setNewDisputeMsg(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendDisputeMessage()}
                          className="flex-1 text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <button
                          onClick={handleSendDisputeMessage}
                          className="bg-blue-700 hover:bg-blue-800 text-white p-2.5 rounded-xl transition active:scale-95"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center">
                      <MessageSquare className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-xs">یک پرونده را از ستون راست جهت مشاهده جزییات انتخاب فرمایید.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Affiliate Section */
            affiliateStats && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md border border-blue-600/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-blue-200 bg-white/10 px-3 py-1 rounded-full inline-block mb-2">
                        سامانه رسمی سفیران میانجی (Affiliate)
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold">درآمد مادام‌العمر از معاملات دوستان شما</h2>
                      <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
                        با اشتراک‌گذاری لینک دعوت اختصاصی خود، ۱۰٪ از کارمزد دریافتی پلتفرم از هر معامله زیرمجموعه‌های خود را به صورت آنی دریافت کنید.
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 text-center min-w-[160px]">
                      <span className="text-xs text-blue-200 block">سود قابل انتقال:</span>
                      <strong className="text-2xl font-bold block my-1">
                        {affiliateStats.withdrawable_commission.toLocaleString('fa-IR')}
                      </strong>
                      <span className="text-[11px] text-blue-200 block mb-2">تومان</span>
                      <button
                        onClick={handleClaimAffiliate}
                        className="w-full bg-white text-blue-800 hover:bg-blue-50 py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
                      >
                        انتقال به کیف پول
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
                    <Users className="w-5 h-5 text-blue-700 dark:text-blue-400 mx-auto mb-1.5" />
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{affiliateStats.total_invited} نفر</div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">کاربران ثبت‌نامی</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{affiliateStats.active_traders} نفر</div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">معامله‌گران فعال</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
                    <DollarSign className="w-5 h-5 text-blue-700 dark:text-blue-400 mx-auto mb-1.5" />
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{affiliateStats.total_commission_earned.toLocaleString('fa-IR')}</div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">کل سود پرداختی (تومان)</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center transition-colors">
                    <Percent className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mx-auto mb-1.5" />
                    <div className="text-lg font-bold text-slate-900 dark:text-white">۱۰ درصد</div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">پورسانت پلتفرم</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">لینک و کد اختصاصی دعوت شما</h3>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate">{affiliateStats.referral_link}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(affiliateStats.referral_link, 'لینک دعوت')}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Copy className="w-4 h-4" />
                      کپی لینک اختصاصی
                    </button>
                    <button
                      onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(affiliateStats.referral_link)}&text=${encodeURIComponent('واسطه‌گری امن و ثبت رسمی قراردادهای الکترونیک با میانجی اسکرو')}`)}
                      className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      اشتراک در تلگرام
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Profile & KYC & Account Management Tab (Far Left Corner) */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Main User Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 relative overflow-hidden transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-300 dark:shadow-none">
                  {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{currentUser?.full_name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {currentUser?.role === 'employer' ? 'کارفرما' : currentUser?.role === 'freelancer' ? 'مجری پروژه' : 'داور حقوقی'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>شماره: <strong className="text-slate-700 dark:text-slate-300 font-mono">{currentUser?.phone_number}</strong></span>
                    <span>شناسه تلگرام: <strong className="text-blue-700 dark:text-blue-400 font-mono">@{currentUser?.full_name.toLowerCase().replace(/\s+/g, '_')}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-left w-full sm:w-auto bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">سطح احراز هویت:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  سطح {currentUser?.kyc_level === 'gold' ? 'طلایی (کامل)' : 'پایه'}
                </span>
              </div>
            </div>

            {/* Profile Subtabs */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => setProfileSubTab('kyc')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  profileSubTab === 'kyc' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                احراز هویت و اطلاعات بانکی
              </button>
              <button
                onClick={() => setProfileSubTab('telegram_sync')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  profileSubTab === 'telegram_sync' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                هماهنگی با ربات تلگرام
              </button>
              <button
                onClick={() => setProfileSubTab('roles')}
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  profileSubTab === 'roles' ? 'bg-blue-700 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                سوییچ نقش کاربری
              </button>
            </div>
          </div>

          {/* Subtab 1: KYC & Banking Multi-step Wizard */}
          {profileSubTab === 'kyc' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 md:p-6 space-y-6 transition-colors">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full" />
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      مراحل احراز هویت و ارتقای سطح حساب
                      <span className="text-[11px] font-normal text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                        KYC Wizard
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">استعلام آنلاین سامانه شاهکار، تایید شبای بانکی شاپرک و بارگذاری مدارک</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">سطح حساب شما:</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    currentUser?.kyc_level === 'gold'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {currentUser?.kyc_level === 'gold' ? (
                      <>
                        <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        سطح طلایی (سقف نامحدود)
                      </>
                    ) : (
                      <>
                        <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        سطح نقره‌ای (پایه)
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Graphical Progress Bar & Step Navigator */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-4 md:p-5 space-y-3 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>پیشرفت مراحل احراز هویت:</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal">گام {kycStep} از ۴</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                      {getKycProgressPercentage()}% تکمیل شد
                    </span>
                  </div>
                </div>

                {/* Graphical Progress Bar */}
                <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${getKycProgressPercentage()}%` }}
                  />
                </div>

                {/* 4 Steps Indicator Bar */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[
                    { step: 1, title: 'کد ملی و ثبت‌احوال', icon: ShieldCheck },
                    { step: 2, title: 'حساب و شبای بانکی', icon: Building2 },
                    { step: 3, title: 'تاییدیه مدارک و سلفی', icon: FileCheck },
                    { step: 4, title: 'گواهی و نشان طلایی', icon: BadgeCheck }
                  ].map((s) => {
                    const isDone = kycStep > s.step || (currentUser?.kyc_level === 'gold' && kycStep === 4);
                    const isCurrent = kycStep === s.step;
                    const StepIcon = s.icon;

                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setKycStep(s.step)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all text-center relative ${
                          isCurrent
                            ? 'bg-white dark:bg-slate-800 border-2 border-blue-600 shadow-sm'
                            : isDone
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                            : 'bg-white/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isDone && !isCurrent ? <Check className="w-4 h-4" /> : s.step}
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold truncate max-w-full ${
                          isCurrent ? 'text-blue-900 dark:text-blue-300' : isDone ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {s.title}
                        </span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute -bottom-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 1: National ID & Shahkar Check */}
              {kycStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">گام اول: استعلام آنلاین هویتی (سامانه شاهکار)</h4>
                      <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                        کد ملی وارد شده باید با شماره تلفن همراه ثبت‌نامی شما مطابقت داشته باشد تا تاییدیه سامانه شاهکار صادر گردد.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">کد ملی ۱۰ رقمی *</label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="مثال: 0012345678"
                          value={kycNid}
                          onChange={(e) => setKycNid(e.target.value)}
                          className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white font-mono"
                          required
                        />
                        {kycNid.length === 10 && (
                          <div className="absolute left-3 top-3 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            معتبر
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">رقم کنترلی با الگوریتم ثبت‌احوال بررسی می‌شود.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">نام و نام خانوادگی رسمی</label>
                      <input
                        type="text"
                        value={currentUser?.full_name || 'علیرضا رضوانی'}
                        disabled
                        className="w-full text-xs p-3 bg-slate-100/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold"
                      />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">مطابق با پروفایل کاربری ثبت‌نامی</span>
                    </div>
                  </div>

                  {/* Birthdate Selectors */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاریخ تولد ثبت‌شده در شناسنامه</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={kycBirthDay}
                        onChange={(e) => setKycBirthDay(e.target.value)}
                        className="text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                      >
                        {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                          <option key={d} value={d}>روز: {d}</option>
                        ))}
                      </select>
                      <select
                        value={kycBirthMonth}
                        onChange={(e) => setKycBirthMonth(e.target.value)}
                        className="text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                      >
                        {['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'].map((m, idx) => (
                          <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={kycBirthYear}
                        onChange={(e) => setKycBirthYear(e.target.value)}
                        className="text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white"
                      >
                        {Array.from({ length: 60 }, (_, i) => String(1340 + i)).map(y => (
                          <option key={y} value={y}>سال: {y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Shahkar Match Status Card */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          تطابق قطعی با سامانه شاهکار ارتباطات
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                          شماره همراه <strong>{currentUser?.phone_number || '09121112233'}</strong> به صورت ۱۰۰٪ متعلق به کد ملی <strong>{kycNid}</strong> است.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (!kycNid || kycNid.length !== 10) {
                          showToast('لطفاً کد ملی ۱۰ رقمی معتبر وارد نمایید.');
                          return;
                        }
                        setKycStep(2);
                        showToast('گام ۱ با موفقیت تایید شد. مرحله بعد: اطلاعات بانکی.');
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-blue-300 dark:shadow-none active:scale-95"
                    >
                      <span>تایید و ادامه به گام ۲ (اطلاعات بانکی)</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Banking & IBAN Verification */}
              {kycStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">گام دوم: اطلاعات حساب و شماره شبای بانکی (تسویه شاپرک)</h4>
                      <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                        شماره شبای بانکی جهت واریز خودکار مطالبات قراردادها، آزادسازی وجوه اسکرو و تسویه حساب‌های پایا و ساتنا الزامی است.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">شماره شبای ۲۴ رقمی بانکی (IBAN) *</label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={26}
                        placeholder="IR120120000000001234567890"
                        value={kycSheba}
                        onChange={(e) => setKycSheba(e.target.value.toUpperCase())}
                        className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white font-mono tracking-wider"
                        required
                      />
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">فرمت: با حروف بزرگ انگلیسی شروع شده با IR به همراه ۲۴ رقم</span>
                  </div>

                  {/* Bank Detection Result Card */}
                  {kycSheba && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{detectBankFromSheba(kycSheba).logo}</span>
                          <div>
                            <span className="text-xs text-slate-400 dark:text-slate-400 block">بانک صادرکننده:</span>
                            <strong className={`text-sm ${detectBankFromSheba(kycSheba).color}`}>
                              {detectBankFromSheba(kycSheba).name}
                            </strong>
                          </div>
                        </div>
                        <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          متصل به شبکه شاپرک
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">نام صاحب حساب بانکی:</span>
                          <strong className="text-slate-800 dark:text-slate-200 text-xs">{currentUser?.full_name || 'علیرضا رضوانی'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">تطابق با کد ملی مرحله اول:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            تطبیق ۱۰۰٪ (ثبت احوال + بانک مرکزی)
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setKycStep(1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition border border-transparent dark:border-slate-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>بازگشت به گام ۱</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!kycSheba || kycSheba.length < 24) {
                          showToast('لطفاً شماره شبای بانکی معتبر وارد فرمایید.');
                          return;
                        }
                        setKycStep(3);
                        showToast('اطلاعات بانکی ذخیره شد. مرحله بعد: تاییدیه مدارک.');
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-blue-300 dark:shadow-none active:scale-95"
                    >
                      <span>تایید و ادامه به گام ۳ (تاییدیه مدارک)</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Document Verification & Selfie Upload */}
              {kycStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">گام سوم: بارگذاری و تاییدیه مدارک هویتی</h4>
                      <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                        تصویر روی کارت ملی هوشمند و عکس سلفی همراه با متن تعهدنامه جهت احراز بیومتریک و ارتقای سقف معاملات بررسی می‌شود.
                      </p>
                    </div>
                  </div>

                  {/* Document Verification Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Document 1: National Card Preview Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">تصویر روی کارت ملی هوشمند</span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          تایید هوش مصنوعی
                        </span>
                      </div>

                      {/* Simulated Smart National ID Visual Card */}
                      <div className="h-32 bg-gradient-to-tr from-slate-200 via-sky-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 rounded-xl p-3 border border-slate-300 dark:border-slate-600 flex flex-col justify-between shadow-2xs relative overflow-hidden">
                        <div className="flex justify-between items-center text-[10px] text-slate-700 dark:text-slate-300 font-bold">
                          <span>جمهوری اسلامی ایران</span>
                          <span className="font-mono text-[9px] text-blue-800 dark:text-blue-300">کارت هوشمند ملی</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-slate-300 dark:bg-slate-600 rounded border border-slate-400 dark:border-slate-500 flex items-center justify-center text-slate-500 dark:text-slate-300">
                            <User className="w-7 h-7" />
                          </div>
                          <div className="text-[10px] space-y-1 text-slate-700 dark:text-slate-300">
                            <div>نام: <strong>{currentUser?.full_name || 'علیرضا رضوانی'}</strong></div>
                            <div>کد ملی: <strong className="font-mono">{kycNid}</strong></div>
                            <div>تاریخ اعتبار: <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">۱۴۰۸/۰۵</span></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[8px] text-slate-400 dark:text-slate-400 font-mono">
                          <span>OCR VALIDATED</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">● تایید ثبت احوال</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">سند بارگذاری و استعلام گردید.</span>
                        <button
                          type="button"
                          onClick={() => showToast('سند کارت ملی تایید گردید و آماده ذخیره است.')}
                          className="text-xs text-blue-700 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          تغییر فایل
                        </button>
                      </div>
                    </div>

                    {/* Document 2: Selfie with Commitment Note */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">عکس سلفی با تعهدنامه میانجی</span>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          تطابق بیومتریک ۹۹.۴٪
                        </span>
                      </div>

                      {/* Simulated Selfie Visual */}
                      <div className="h-32 bg-gradient-to-tr from-slate-200 via-indigo-50 to-slate-200 dark:from-slate-700 dark:via-indigo-950/30 dark:to-slate-700 rounded-xl p-3 border border-slate-300 dark:border-slate-600 flex flex-col justify-between shadow-2xs relative">
                        <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                          <span>تطبیق چهره با کارت ملی:</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">۹۹.۴٪ پذیرفته شد</span>
                        </div>
                        <div className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed italic text-center">
                          «اینجانب {currentUser?.full_name || 'علیرضا رضوانی'} جهت ثبت معاملات امن و استفاده از اسکرو میانجی این تعهدنامه را تایید می‌نمایم.»
                        </div>
                        <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono">
                          <span>SECURITY SIGNED</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">● اصالت امضا محرز شد</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">تعهدنامه متنی تطبیق داده شد.</span>
                        <button
                          type="button"
                          onClick={() => showToast('تصویر سلفی تعهدنامه تایید شد.')}
                          className="text-xs text-blue-700 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          بارگذاری مجدد
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Verification Checkmarks Summary */}
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 text-xs text-emerald-950 dark:text-emerald-200">
                    <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
                      <BadgeCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      خلاصه تاییدیه‌های قانونی و بانکی مدارک شما:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        استعلام عدم سوء‌پیشینه مالی
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        تایید حساب در پایگاه بانک مرکزی
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        تطابق بیومتریک با ثبت‌احوال
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setKycStep(2)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition border border-transparent dark:border-slate-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>بازگشت به گام ۲</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKycStep(4);
                        showToast('تمام مدارک تایید شدند! گام نهایی: صدور گواهی و فعال‌سازی سطح طلایی.');
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-blue-300 dark:shadow-none active:scale-95"
                    >
                      <span>تایید مدارک و مشاهده گواهی نهایی</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Official Certificate & Final Activation */}
              {kycStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Official Certificate Luxury Plaque */}
                  <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 border-2 border-amber-400/80 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full -mr-16 -mt-16 pointer-events-none blur-xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-16 -mb-16 pointer-events-none blur-xl" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-400/20">
                          <Award className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-xs font-bold tracking-wider">MIYANJI ESCROW GOLDEN CERTIFICATE</span>
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              رسمی و معتبر
                            </span>
                          </div>
                          <h4 className="text-base md:text-lg font-bold text-white mt-0.5">
                            گواهی رسمی تایید اصالت هویت و اعتبار بانکی
                          </h4>
                        </div>
                      </div>
                      <div className="text-right sm:text-left bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                        <span className="text-[10px] text-slate-300 block">شماره استعلام ثبتی:</span>
                        <strong className="text-xs font-mono text-amber-300">CERT-IR-89240</strong>
                      </div>
                    </div>

                    {/* Certificate Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-white/5 p-4 rounded-xl border border-white/10">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">دارنده حساب:</span>
                        <strong className="text-white text-xs">{currentUser?.full_name || 'علیرضا رضوانی'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">کد ملی تایید شده:</span>
                        <strong className="text-amber-300 font-mono text-xs">{kycNid}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">بانک عامل تسویه:</span>
                        <strong className="text-white text-xs">{detectBankFromSheba(kycSheba).name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">سقف مجاز معاملات:</span>
                        <strong className="text-emerald-400 font-bold text-xs">نامحدود (تضمین اسکرو)</strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-300 gap-2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                        <span>این گواهی دارای اعتبار ۳ ساله و مورد تایید سامانه داوری حقوقی میانجی است.</span>
                      </div>
                      <span className="text-[10px] text-slate-400">تاریخ صدور: ۱۴۰۵/۰۷/۲۸</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setKycStep(1)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 border border-transparent dark:border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      بازبینی و ویرایش گام‌های قبلی
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => showToast('فایل PDF گواهی رسمی با موفقیت دانلود شد.')}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                        دانلود گواهی PDF
                      </button>

                      <button
                        type="button"
                        onClick={handleKycSubmit}
                        disabled={kycSubmitting}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-blue-300 dark:shadow-none flex items-center justify-center gap-2 active:scale-95"
                      >
                        {kycSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            در حال ثبت نهایی در سامانه...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            تایید نهایی و ارتقای حساب به طلایی
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Telegram Bot Synchronization */}
          {profileSubTab === 'telegram_sync' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">هماهنگی و سینک با ربات تلگرام میانجی</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">مدیریت معاملات از هر دو بستر وب‌سایت و ربات تلگرام</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <strong className="text-xs font-bold text-blue-900 dark:text-blue-200">وضعیت اتصال: متصل و همگام</strong>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 block">
                    اکانت شما با شناسه <code className="font-mono bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">{currentUser?.telegram_id || 1802649782}</code> در ربات @MiyanjiBot فعال است.
                  </span>
                </div>
                <button
                  onClick={() => setShowBotSimulator(true)}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                >
                  <Bot className="w-4 h-4" />
                  باز کردن ربات
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <span>اعلان‌های تغییر وضعیت معامله در چت تلگرام:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">فعال (روشن)</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <span>صدور خودکار و ارسال سند PDF رسمی در پیوی:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">فعال (روشن)</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                  <span>لاگین خودکار با یک کلیک از طریق دکمه تلگرام:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">فعال (روشن)</span>
                </div>
              </div>
            </div>
          )}

          {/* Subtab 3: Switch Roles */}
          {profileSubTab === 'roles' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-2.5 h-6 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">تغییر نقش کاربری جهت تست و سناریوهای مختلف</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تجربه سامانه از نگاه کارفرما، مجری پروژه و داور حقوقی میانجی</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => handleSwitchUser(1802649782)}
                  className={`p-4 rounded-xl border text-center transition ${
                    currentUser?.id === 1802649782 ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-100 dark:ring-blue-950' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center mx-auto mb-2">ع</div>
                  <strong className="block text-xs font-bold text-slate-900 dark:text-white">علیرضا رضوانی</strong>
                  <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">نقش: کارفرما (خریدار)</span>
                </button>

                <button
                  onClick={() => handleSwitchUser(290184712)}
                  className={`p-4 rounded-xl border text-center transition ${
                    currentUser?.id === 290184712 ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-100 dark:ring-blue-950' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center mx-auto mb-2">ح</div>
                  <strong className="block text-xs font-bold text-slate-900 dark:text-white">حسین سهرابی</strong>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">نقش: مجری (فروشنده)</span>
                </button>

                <button
                  onClick={() => handleSwitchUser(999000111)}
                  className={`p-4 rounded-xl border text-center transition ${
                    currentUser?.id === 999000111 ? 'border-purple-600 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-100 dark:ring-purple-950' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center mx-auto mb-2">د</div>
                  <strong className="block text-xs font-bold text-slate-900 dark:text-white">دکتر کریمی</strong>
                  <span className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">نقش: داور حقوقی میانجی</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 ${viewMode === 'telegram' ? 'p-0 md:p-6 bg-slate-900 dark:bg-slate-950' : ''}`}>
      {/* Top Banner & Mode Switcher Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 text-xs border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">سامانه هوشمند واسطه‌گری امن و ثبت رسمی قراردادهای الکترونیک میانجی (Miyanji Escrow)</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Theme Toggle Pill in Top Banner */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] border border-slate-700"
              title={theme === 'dark' ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">حالت روز</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden sm:inline">حالت شب</span>
                </>
              )}
            </button>

            {/* View Mode Switcher */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-[11px]">
              <button
                onClick={() => setViewMode('desktop')}
                className={`px-2.5 py-1 rounded-md transition ${viewMode === 'desktop' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                نمای وبسایت
              </button>
              <button
                onClick={() => setViewMode('telegram')}
                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${viewMode === 'telegram' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                نمای تلگرام مینی‌اپ
              </button>
            </div>

            {/* Telegram Bot Live Synchronizer Button */}
            <button
              onClick={() => setShowBotSimulator(true)}
              className="px-2.5 py-1 rounded-md bg-blue-600/50 hover:bg-blue-600 text-white transition flex items-center gap-1.5 text-[11px]"
            >
              <Bot className="w-3.5 h-3.5" />
              ربات تلگرام @MiyanjiBot
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Container (Standard Web or Telegram Mini App Frame) */}
      <div className={viewMode === 'telegram' ? 'telegram-viewport my-0 md:my-6' : 'max-w-6xl mx-auto px-4 md:px-6'}>
        {/* Telegram Header Mockup (If in Telegram View) */}
        {viewMode === 'telegram' && (
          <div className="bg-[#1D4ED8] text-white px-4 py-3 flex items-center justify-between text-xs font-semibold select-none">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              میانجی | Miyanji Mini App
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowBotSimulator(true)} className="hover:opacity-80 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" />
                ربات
              </button>
              <button onClick={() => setViewMode('desktop')} className="hover:opacity-80 text-white/80">✕ بستن</button>
            </div>
          </div>
        )}

        {/* Brand App Header */}
        <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800 py-3.5 px-4 md:px-6 sticky top-0 z-30 shadow-2xs backdrop-blur-md transition-colors duration-200">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white text-base md:text-lg tracking-tight">میانجی • Miyanji</h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">سامانه جامع اسکرو و واسطه‌گری امن معاملات</p>
              </div>
            </div>

            {/* Header Actions: Theme Toggle, Notification Bell & User Profile */}
            <div className="flex items-center gap-2 md:gap-2.5">
              {/* Global Theme Toggle Button in Header */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl border transition-all duration-200 relative flex items-center justify-center bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-amber-400 hover:text-blue-700 dark:hover:text-amber-300 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-2xs active:scale-95"
                title={theme === 'dark' ? 'تغییر به حالت روز (روشن)' : 'تغییر به حالت شب (تاریک)'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600 hover:text-blue-700 transition-transform hover:-rotate-12" />
                )}
              </button>

              {/* Notification Bell Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className={`p-2 rounded-xl border transition relative flex items-center justify-center ${
                    showNotifDropdown
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700'
                  }`}
                  title="اعلان‌ها و رویدادهای زنده"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifDropdown && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">اعلان‌های سامانه میانجی</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {notifications.filter(n => !n.read).length} جدید
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-blue-700 dark:text-blue-400 hover:underline font-medium"
                        >
                          خوانده شد
                        </button>
                        <button
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Browser Notification Permission Banner (if not granted) */}
                    {browserPerm !== 'granted' && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-blue-900 dark:text-blue-200 leading-tight">
                          <strong>فعال‌سازی اعلان مرورگر</strong>
                          <span className="block text-slate-500 dark:text-slate-400 text-[10px]">دریافت پیام و تغییر وضعیت قرارداد حتی در تب‌های دیگر</span>
                        </div>
                        <button
                          onClick={requestBrowserNotificationPermission}
                          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold shrink-0 transition"
                        >
                          فعال‌سازی
                        </button>
                      </div>
                    )}

                    {/* Simulation Button for testing live events */}
                    <div className="p-2 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">شبیه‌سازی اعلان زنده:</span>
                      <button
                        onClick={simulateTestNotification}
                        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 font-bold px-2.5 py-1 rounded-md transition flex items-center gap-1 shadow-xs"
                      >
                        <Volume2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        تست اعلان پیام / وضعیت
                      </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                          هیچ اعلانی ثبت نشده است.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                              if (n.contractId) {
                                const target = contracts.find(x => x.contract_id === n.contractId);
                                if (target) {
                                  setSelectedContract(target);
                                  setActiveTab(n.type === 'arbitration' ? 'services' : 'contracts');
                                  if (n.type === 'arbitration') setServicesSubTab('disputes');
                                  setShowNotifDropdown(false);
                                }
                              }
                            }}
                            className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-start gap-2.5 ${
                              !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.read ? 'bg-blue-600 dark:bg-blue-400' : 'bg-transparent'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{n.title}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.body}</p>
                              {n.contractId && (
                                <span className="inline-block mt-1 font-mono text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                  #{n.contractId}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-center">
                        <button
                          onClick={clearAllNotifications}
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
                        >
                          پاک کردن لیست اعلان‌ها
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Quick Info */}
              <div
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition"
              >
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser?.full_name}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">سطح {currentUser?.kyc_level === 'gold' ? 'طلایی' : 'پایه'}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-700 text-xs shadow-2xs">
                  {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-6 pb-28">
          {renderContent()}
        </main>

        {/* Professional Fixed Bottom Navigation Bar */}
        {/* RTL Alignment: Right to Left -> 1. Dashboard, 2. Deals, 3. New Deal (Center Primary), 4. Services, 5. Profile (Far Left Corner) */}
        <nav
          className={
            viewMode === 'telegram'
              ? 'sticky bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-lg px-2 py-1.5 transition-colors'
              : 'fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-2xl px-3 py-1.5 transition-colors'
          }
        >
          <div className="max-w-2xl mx-auto flex items-center justify-around">
            {[
              { id: 'dashboard', label: 'خانه', icon: Layers },
              { id: 'contracts', label: 'معاملات', icon: FileText, badge: contracts.filter(c => c.status === 'active' || c.status === 'work_submitted').length },
              { id: 'new_contract', label: 'معامله جدید', icon: PlusCircle, isPrimary: true },
              { id: 'services', label: 'خدمات و داوری', icon: Scale, badge: disputes.filter(d => d.status === 'under_review').length },
              { id: 'profile', label: 'پروفایل', icon: User } // Placed at the far-left corner in RTL!
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              if (tab.isPrimary) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex flex-col items-center justify-center -mt-6 group focus:outline-none px-2"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-800 dark:bg-blue-600 text-white shadow-blue-600/40 scale-105 ring-4 ring-blue-100 dark:ring-blue-900/50'
                          : 'bg-blue-700 dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500 text-white shadow-blue-500/30 group-hover:scale-105 active:scale-95'
                      }`}
                    >
                      <PlusCircle className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-bold transition ${
                        isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition relative flex-1 group ${
                    isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="relative">
                    <TabIcon
                      className={`w-5 h-5 transition-transform duration-150 ${
                        isActive ? 'scale-110 text-blue-700 dark:text-blue-400 stroke-[2.5]' : 'group-hover:scale-105 text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    {Boolean(tab.badge && tab.badge > 0) && (
                      <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 tracking-tight transition ${
                      isActive ? 'font-bold text-blue-700 dark:text-blue-400' : 'font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1 bg-blue-700 dark:bg-blue-400 rounded-full mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Contract Detail Modal (When user clicks 'جزئیات' or a deal card) */}
      {selectedContract && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-lg">
                      #{selectedContract.contract_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(selectedContract.status).color}`}>
                      {getStatusBadge(selectedContract.status).text}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                    {selectedContract.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedContract(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Financial Box */}
              <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-4 rounded-2xl shadow-md space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-100">
                  <span>مبلغ توافق‌شده قرارداد:</span>
                  <span>کارمزد میانجی: {(selectedContract.amount * 0.015).toLocaleString('fa-IR')} تومان (۱.۵٪)</span>
                </div>
                <div className="text-xl md:text-2xl font-bold font-mono tracking-tight">
                  {selectedContract.amount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-blue-200">تومان</span>
                </div>
                <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-100">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    تضمین امنیت وجوه در حساب امانی اسکرو
                  </span>
                  <span>پرداخت‌کننده کارمزد: {selectedContract.commission_payer === 'split' ? 'تسهیم ۵۰-۵۰' : selectedContract.commission_payer === 'employer' ? 'کارفرما' : 'مجری'}</span>
                </div>
              </div>

              {/* Parties Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Buyer */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">کارفرما (خریدار)</span>
                    <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                      احراز هویت شده
                    </span>
                  </div>
                  <strong className="block text-slate-800 dark:text-slate-200">{selectedContract.buyer_fullname || 'علیرضا رضوانی'}</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">تلفن: {selectedContract.buyer_phone || '۰۹۱۲۳۴۵۶۷۸۹'}</span>
                </div>

                {/* Seller */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">مجری (فروشنده)</span>
                    <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                      احراز هویت شده
                    </span>
                  </div>
                  <strong className="block text-slate-800 dark:text-slate-200">{selectedContract.seller_fullname || 'حسین سهرابی'}</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block">تلفن: {selectedContract.seller_phone || '۰۹۳۵۰۰۰۱۱۲۲'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">شرح کامل موضوع قرارداد:</span>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {selectedContract.description || 'توسعه و تحویل پروژه طبق بریف توافق‌شده طرفین در تلگرام میانجی.'}
                </p>
              </div>

              {/* Timeline & History */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">گاه‌شمار رویدادهای قرارداد:</span>
                <div className="space-y-1.5">
                  {selectedContract.history.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-[11px] border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                        {ev.event}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">{ev.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleDownloadPdf(selectedContract.contract_id)}
                disabled={downloadingPdf === selectedContract.contract_id}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{downloadingPdf === selectedContract.contract_id ? 'در حال صدور PDF...' : 'دانلود قرارداد رسمی PDF'}</span>
              </button>

              <div className="flex items-center gap-2">
                {(selectedContract.status === 'active' || selectedContract.status === 'work_submitted') && (
                  <button
                    onClick={() => {
                      const c = selectedContract;
                      setSelectedContract(null);
                      setShowDisputeModal(c);
                    }}
                    className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ارجاع به داور</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedContract(null)}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Bot Simulator Modal (Demonstrating 100% Real-Time Web & Bot Sync) */}
      {showBotSimulator && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#17212B] text-white rounded-3xl max-w-md w-full h-[620px] flex flex-col shadow-2xl border border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Telegram Chat Header */}
            <div className="bg-[#242F3D] px-4 py-3 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs text-white">Miyanji Escrow Bot</strong>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">@MiyanjiBot • bot</span>
                </div>
              </div>
              <button
                onClick={() => setShowBotSimulator(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0E1621]">
              <div className="text-center text-[10px] text-slate-500 bg-slate-800/50 py-1 px-3 rounded-full mx-auto w-fit">
                همگام با وب‌اپلیکیشن میانجی • داده‌های لحظه‌ای دیتابیس
              </div>

              {botChatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === 'user' ? 'mr-auto bg-[#2B5278] rounded-2xl rounded-br-xs p-3 text-white' : 'ml-auto bg-[#182533] rounded-2xl rounded-bl-xs p-3 text-slate-200'
                  }`}
                >
                  <p className="text-xs whitespace-pre-line leading-relaxed">{m.text}</p>
                  <span className="text-[9px] text-slate-400 text-left mt-1 block">{m.time}</span>

                  {m.buttons && (
                    <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-700">
                      {m.buttons.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={() => handleBotCommand(btn)}
                          className="text-[11px] bg-[#242F3D] hover:bg-[#2e3b4d] text-sky-400 py-1.5 px-2 rounded-lg font-medium transition text-center"
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Telegram Reply Keyboard & Input Bar */}
            <div className="p-3 bg-[#242F3D] border-t border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="ارسال پیام یا دستور به ربات..."
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBotCommand(botInput)}
                  className="flex-1 bg-[#17212B] border border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => handleBotCommand(botInput)}
                  className="bg-sky-500 hover:bg-sky-600 text-white p-2.5 rounded-xl transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">شارژ کیف پول میانجی</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ شارژ (تومان)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 font-bold text-blue-700 dark:text-blue-400 transition"
                />
                <div className="flex gap-2 mt-2">
                  {['2000000', '5000000', '15000000'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setDepositAmount(p)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[10px] text-slate-700 dark:text-slate-300 font-medium transition"
                    >
                      {Number(p).toLocaleString('fa-IR')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">روش واریز</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setDepositMethod('gateway')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      depositMethod === 'gateway' ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    درگاه شاپرک (شتاب)
                  </button>
                  <button
                    onClick={() => setDepositMethod('card_to_card')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      depositMethod === 'card_to_card' ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    کارت به کارت دستی
                  </button>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm mt-2"
              >
                تایید و اتصال به درگاه پرداخت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">درخواست تسویه و برداشت به شماره شبا</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مبلغ برداشت (تومان)</label>
                <input
                  type="number"
                  placeholder="مبلغ مورد نظر به تومان"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 font-bold text-slate-900 dark:text-white transition"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  موجودی قابل برداشت: {(currentUser?.wallet_balance || 0).toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شماره شبای مقصد (IBAN)</label>
                <input
                  type="text"
                  maxLength={26}
                  placeholder="IR..."
                  value={withdrawSheba}
                  onChange={(e) => setWithdrawSheba(e.target.value.toUpperCase())}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 font-mono text-slate-900 dark:text-white transition"
                />
              </div>

              <button
                onClick={handleWithdraw}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-2"
              >
                ثبت درخواست تسویه در پایا
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">تحویل خروجی‌های معامله</h3>
              <button onClick={() => setShowDeliverModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                پروژه: <strong className="text-slate-800 dark:text-slate-200">{showDeliverModal.title}</strong>
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توضیحات و گزارش کار انجام‌شده *</label>
                <textarea
                  rows={3}
                  value={deliverNotes}
                  onChange={(e) => setDeliverNotes(e.target.value)}
                  placeholder="توضیح دهید چه کارهایی تحویل شده و فایل‌ها چگونه در دسترس هستند..."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">لینک دانلود خروجی‌ها (گوگل‌درایو، گیت‌هاب و ...)</label>
                <input
                  type="url"
                  value={deliverLink}
                  onChange={(e) => setDeliverLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 font-mono text-slate-900 dark:text-white transition"
                />
              </div>

              <button
                onClick={handleDeliverSubmit}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                ارسال به کارفرما جهت بررسی و تایید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl transition-colors animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                درخواست رسیدگی داوری حقوقی
              </h3>
              <button onClick={() => setShowDisputeModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">دلیل اصلی ثبت اختلاف</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white transition"
                >
                  <option value="تاخیر در تحویل و عدم پاسخگویی">تاخیر غیرمجاز در تحویل کار</option>
                  <option value="عدم مطابقت کیفیت کار با بریف توافق‌شده">عدم انطباق خروجی‌ها با تعهدات قرارداد</option>
                  <option value="درخواست ویرایش‌های نامتعارف خارج از قرارداد">درخواست تغییرات فراتر از مفاد قرارداد</option>
                  <option value="سایر موارد و عدم توافق">سایر موارد اختلاف</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شرح کامل اختلاف و ادعا</label>
                <textarea
                  rows={4}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="مستندات و توضیحات خود را برای بررسی داور بنویسید..."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition"
                />
              </div>

              <button
                onClick={handleSubmitDispute}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                ثبت پرونده و ارجاع فوری به داور
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
