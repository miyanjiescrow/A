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
  Volume2
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'new_contract' | 'kyc' | 'disputes' | 'affiliate'>('dashboard');
  const [viewMode, setViewMode] = useState<'desktop' | 'telegram'>('desktop');
  const [isTelegramClient, setIsTelegramClient] = useState(false);

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

  // KYC Form State
  const [kycNid, setKycNid] = useState('');
  const [kycSheba, setKycSheba] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

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
      // Harmonic 2-tone melodic chime
      osc.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
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

    // 1. Play audio chime
    playNotificationSound();

    // 2. Add to in-app notification store
    setNotifications(prev => [newNotif, ...prev]);

    // 3. Display floating banner
    setBannerNotif(newNotif);
    setTimeout(() => {
      setBannerNotif(current => (current?.id === newNotif.id ? null : current));
    }, 6000);

    // 4. Trigger native browser notification if granted
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
          // Graceful ignore inside sandboxed iframes
        }
      }
    }

    // 5. Telegram WebApp haptic vibration if available
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

  // Test simulation for contract status change and chat messages
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
        setActiveTab('disputes');
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
      case 'DEV': return { text: 'توسعه نرم‌افزار و ربات', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'DS': return { text: 'طراحی گرافیک و UI/UX', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'CNT': return { text: 'محتوا و سئو', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'MKT': return { text: 'مارکتینگ و تبلیغات', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default: return { text: 'معامله عمومی', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return { text: 'در حال انجام (وجه در اسکرو)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Lock };
      case 'work_submitted':
        return { text: 'خروجی کار تحویل شد (در انتظار تایید)', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Clock };
      case 'awaiting_payment':
        return { text: 'امضا شده - در انتظار تامین وجه', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: CreditCard };
      case 'pending_party_b':
        return { text: 'در انتظار تایید و امضای طرف دوم', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Users };
      case 'completed':
        return { text: 'تکمیل و تسویه شده', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 };
      case 'in_dispute':
        return { text: 'در جریان داوری حقوقی', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangle };
      case 'draft':
        return { text: 'پیش‌نویس اولیه', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Edit3 };
      case 'cancelled':
        return { text: 'لغو شده (مسترد شده)', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: X };
      default:
        return { text: 'نامشخص', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Info };
    }
  };

  // ====================================================
  // Render Main Content
  // ====================================================

  const renderContent = () => (
    <div className="flex-1 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md w-full">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Floating Browser Notification Card (Banner) */}
      {bannerNotif && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-white border-2 border-blue-600 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-6 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">{bannerNotif.title}</span>
                  {bannerNotif.contractId && (
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                      #{bannerNotif.contractId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{bannerNotif.body}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">اعلان مرورگر • {bannerNotif.timestamp}</span>
              </div>
            </div>
            <button
              onClick={() => setBannerNotif(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition shrink-0"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
            {bannerNotif.contractId && (
              <button
                onClick={() => {
                  const target = contracts.find(x => x.contract_id === bannerNotif.contractId);
                  if (target) {
                    setSelectedContract(target);
                    setActiveTab(bannerNotif.type === 'arbitration' ? 'disputes' : 'contracts');
                  }
                  setBannerNotif(null);
                }}
                className="text-xs text-blue-700 hover:text-blue-800 font-bold px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              >
                مشاهده قرارداد / پرونده
              </button>
            )}
            <button
              onClick={() => setBannerNotif(null)}
              className="text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg transition"
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
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
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
                  className="flex-1 bg-white text-blue-800 hover:bg-blue-50 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  شارژ کیف پول
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex-1 bg-blue-600/60 hover:bg-blue-600 text-white py-2 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <ArrowRight className="w-4 h-4" />
                  برداشت به شبا
                </button>
              </div>
            </div>

            {/* Escrow Locked Balance */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-medium text-slate-500">امانت امن در اسکرو (قفل شده)</span>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                    {(currentUser?.escrow_locked_balance || 0).toLocaleString('fa-IR')}{' '}
                    <span className="text-xs font-normal text-slate-500">تومان</span>
                  </div>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                وجه معاملات فعال در صندوق امانت میانجی تضمین شده و پس از تایید نهایی آزاد می‌گردد.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-blue-700 font-semibold cursor-pointer hover:underline" onClick={() => { setActiveTab('contracts'); setContractFilter('active'); }}>
                مشاهده معاملات فعال در اسکرو
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Active Contracts Summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xs font-medium text-slate-500">قراردادها و اعتبار کاربر</span>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                    {contracts.length}{' '}
                    <span className="text-xs font-normal text-slate-500">قرارداد ثبت‌شده</span>
                  </div>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <ShieldCheck className="w-6 h-6 text-blue-700" />
                </div>
              </div>
              <div className="space-y-2 mt-4 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>سطح احراز هویت (KYC):</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">سطح {currentUser?.kyc_level === 'gold' ? 'طلایی (کامل)' : 'نقره‌ای'}</span>
                </div>
                <div className="flex justify-between">
                  <span>نرخ کارمزد اسکرو:</span>
                  <span className="font-bold text-blue-700">۱۰٪ بر عهده مجری/توافقی</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-700 text-white rounded-xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">آغاز معامله امن جدید در میانجی</h3>
                <p className="text-xs text-slate-600 mt-0.5">ثبت رسمی مشخصات، قفل امن مبلغ در اسکرو و صدور فوری سند PDF معتبر با امضای دیجیتال</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('new_contract')}
              className="w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              ایجاد قرارداد جدید
            </button>
          </div>

          {/* Recent Deals Table / List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">معاملات و قراردادهای اخیر شما</h3>
                <p className="text-xs text-slate-500 mt-0.5">وضعیت زنده، مراحل اسکرو و اقدامات سریع</p>
              </div>
              <button
                onClick={() => setActiveTab('contracts')}
                className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
              >
                مشاهده همه
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {contracts.slice(0, 4).map((c) => {
                const badge = getStatusBadge(c.status);
                const BadgeIcon = badge.icon;
                const catInfo = getCategoryBadge(c.category);

                return (
                  <div key={c.id} className="p-4 md:p-5 hover:bg-slate-50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${badge.color}`}>
                        <BadgeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{c.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${catInfo.color}`}>
                            {catInfo.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                          <span>شناسه: <strong className="font-mono text-slate-700">{c.contract_id}</strong></span>
                          <span>مبلغ: <strong className="text-blue-700 font-semibold">{c.amount.toLocaleString('fa-IR')} تومان</strong></span>
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
                        className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        title="مشاهده جزییات"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wallet Transaction History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">گردش مالی و تراکنش‌های اخیر</h3>
                <p className="text-xs text-slate-500 mt-0.5">واریز، برداشت و قفل وجه در صندوق امانت میانجی</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">تراکنشی یافت نشد.</div>
              ) : (
                transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        t.type === 'deposit' || t.type === 'affiliate_reward' || t.type === 'escrow_release'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        {t.type === 'deposit' ? <PlusCircle className="w-4 h-4" /> :
                         t.type === 'withdraw' ? <ArrowRight className="w-4 h-4" /> :
                         t.type === 'escrow_lock' ? <Lock className="w-4 h-4" /> :
                         <TrendingUp className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-semibold text-slate-800">{t.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">کد پیگیری: {t.ref_id}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`font-bold text-sm ${
                        t.type === 'deposit' || t.type === 'affiliate_reward' || t.type === 'escrow_release'
                          ? 'text-emerald-600'
                          : 'text-slate-900'
                      }`}>
                        {t.type === 'deposit' || t.type === 'affiliate_reward' || t.type === 'escrow_release' ? '+' : '-'}
                        {t.amount.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-500 font-normal">تومان</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">موفق</span>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">مدیریت قراردادهای اسکرو</h2>
              <p className="text-xs text-slate-500 mt-1">مشاهده وضعیت امانت، اقدامات آزادسازی و دانلود نسخه PDF معتبر</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس عنوان یا شناسه..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700"
                />
              </div>
              <button
                onClick={() => setActiveTab('new_contract')}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
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
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
              const isBuyer = c.buyer_id === currentUser?.id || currentUser?.role === 'employer';

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border transition shadow-sm p-5 space-y-4 ${
                    selectedContract?.id === c.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {/* Top Meta */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-semibold border ${catInfo.color}`}>
                          {catInfo.text}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">#{c.contract_id}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{c.title}</h3>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium shrink-0 flex items-center gap-1 ${badge.color}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {badge.text}
                    </span>
                  </div>

                  {/* Lifecycle Visual Stepper */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-700 mb-2">مراحل امنیتی اسکرو میانجی:</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 relative">
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 ${
                          c.status !== 'draft' ? 'bg-blue-700 text-white' : 'bg-slate-300 text-slate-700'
                        }`}>۱</div>
                        <span>ثبت و امضا</span>
                      </div>
                      <div className="h-0.5 bg-slate-200 flex-1 mx-1" />
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 ${
                          c.status === 'active' || c.status === 'work_submitted' || c.status === 'completed'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}>۲</div>
                        <span>قفل در اسکرو</span>
                      </div>
                      <div className="h-0.5 bg-slate-200 flex-1 mx-1" />
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 ${
                          c.status === 'work_submitted' || c.status === 'completed'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}>۳</div>
                        <span>ارسال کار</span>
                      </div>
                      <div className="h-0.5 bg-slate-200 flex-1 mx-1" />
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mb-1 ${
                          c.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-300 text-slate-700'
                        }`}>۴</div>
                        <span>تسویه نهایی</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Parties Meta */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">مبلغ کل معامله:</span>
                      <strong className="text-blue-700 font-bold">{c.amount.toLocaleString('fa-IR')} تومان</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">مهلت تحویل:</span>
                      <strong className="text-slate-800 font-semibold">{c.deadline} روز کاری</strong>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px]">کارفرما (خریدار):</span>
                      <span className="text-slate-700 font-medium">{c.buyer_fullname || 'ثبت‌نشده'}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-400 block text-[10px]">مجری (فروشنده):</span>
                      <span className="text-slate-700 font-medium">{c.seller_fullname || 'ثبت‌نشده'}</span>
                    </div>
                  </div>

                  {/* Description Snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {c.description || 'تعهدات اجرایی طبق مفاد استاندارد اسکرو میانجی.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {/* Pay into Escrow (If Awaiting Payment) */}
                    {c.status === 'awaiting_payment' && (
                      <button
                        onClick={() => handleFundEscrow(c.contract_id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        واریز به اسکرو و شروع پروژه
                      </button>
                    )}

                    {/* Deliver Work (If Active) */}
                    {c.status === 'active' && (
                      <button
                        onClick={() => setShowDeliverModal(c)}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        ارسال خروجی‌های کار
                      </button>
                    )}

                    {/* Approve & Release Funds (If Work Submitted) */}
                    {c.status === 'work_submitted' && (
                      <button
                        onClick={() => handleApproveRelease(c.contract_id)}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تایید و آزادسازی وجه به مجری
                      </button>
                    )}

                    {/* Download PDF Contract */}
                    <button
                      onClick={() => handleDownloadPdf(c.contract_id)}
                      disabled={downloadingPdf === c.contract_id}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-700" />
                      {downloadingPdf === c.contract_id ? 'در حال دانلود...' : 'دانلود PDF رسمی'}
                    </button>

                    {/* Dispute Option (If Active or Work Submitted) */}
                    {(c.status === 'active' || c.status === 'work_submitted') && (
                      <button
                        onClick={() => setShowDisputeModal(c)}
                        className="text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition mr-auto flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        ثبت اختلاف
                      </button>
                    )}

                    {/* Cancel button if draft or pending */}
                    {(c.status === 'draft' || c.status === 'pending_party_b') && (
                      <button
                        onClick={() => handleCancelContract(c.contract_id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition mr-auto"
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
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-base mb-1">
              <FileText className="w-5 h-5" />
              فرم ثبت قرارداد و معامله امن اسکرو
            </div>
            <p className="text-xs text-slate-500">
              اطلاعات معامله را تکمیل کنید. پس از ثبت، لینک تایید برای طرف مقابل ارسال می‌شود و وجه تا زمان رضایت در صندوق امن میانجی نگهداری خواهد شد.
            </p>
          </div>

          <form onSubmit={handleCreateContract} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان کامل قرارداد یا معامله *</label>
              <input
                type="text"
                placeholder="مثال: طراحی وبسایت فروشگاهی با درگاه پرداخت و پنل ادمین"
                value={newContractForm.title}
                onChange={(e) => setNewContractForm({ ...newContractForm, title: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white transition"
                required
              />
            </div>

            {/* Category & Deadline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">دسته‌بندی موضوعی</label>
                <select
                  value={newContractForm.category}
                  onChange={(e) => setNewContractForm({ ...newContractForm, category: e.target.value as any })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white"
                >
                  <option value="DEV">توسعه نرم‌افزار، وب و ربات تلگرام</option>
                  <option value="DS">طراحی هویت بصری و گرافیک</option>
                  <option value="CNT">تولید محتوا، ترجمه و سئو</option>
                  <option value="MKT">دیجیتال مارکتینگ و تبلیغات</option>
                  <option value="GEN">معاملات عمومی و کالای دیجیتال</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مهلت تحویل (روز کاری) *</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={newContractForm.deadline}
                  onChange={(e) => setNewContractForm({ ...newContractForm, deadline: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Amount & Commission Payer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">مبلغ کل قرارداد (تومان) *</label>
                <input
                  type="number"
                  placeholder="مثال: 15000000"
                  value={newContractForm.amount}
                  onChange={(e) => setNewContractForm({ ...newContractForm, amount: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white"
                  required
                />
                {newContractForm.amount && (
                  <span className="text-[11px] text-blue-700 font-semibold block mt-1">
                    {Number(newContractForm.amount).toLocaleString('fa-IR')} تومان
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">پرداخت‌کننده کارمزد (۱۰٪)</label>
                <select
                  value={newContractForm.commission_payer}
                  onChange={(e) => setNewContractForm({ ...newContractForm, commission_payer: e.target.value as any })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white"
                >
                  <option value="freelancer">کسر از سهم مجری (پیش‌فرض)</option>
                  <option value="employer">پرداخت توسط کارفرما</option>
                  <option value="split">بالمناصفه (۵۰٪ کارفرما - ۵۰٪ مجری)</option>
                </select>
              </div>
            </div>

            {/* Counterparty info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نام یا شناسه طرف دوم</label>
                <input
                  type="text"
                  placeholder="مثال: حسین سهرابی یا @hossein_dev"
                  value={newContractForm.counterparty_name}
                  onChange={(e) => setNewContractForm({ ...newContractForm, counterparty_name: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره تماس طرف دوم (جهت پیامک)</label>
                <input
                  type="text"
                  placeholder="0912..."
                  value={newContractForm.counterparty_phone}
                  onChange={(e) => setNewContractForm({ ...newContractForm, counterparty_phone: e.target.value })}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white"
                />
              </div>
            </div>

            {/* Scope of Work */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">شرح تعهدات و مشخصات دقیق تحویل پروژه *</label>
              <textarea
                rows={4}
                placeholder="تعهدات مجری، موارد تحویلی، معیارهای پذیرش کارفرما و شرایط فسخ را با دقت بنویسید..."
                value={newContractForm.description}
                onChange={(e) => setNewContractForm({ ...newContractForm, description: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setNewContractForm({ ...newContractForm, as_draft: true });
                  setTimeout(() => {
                    const fakeE = { preventDefault: () => {} } as any;
                    handleCreateContract(fakeE);
                  }, 50);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                ذخیره به عنوان پیش‌نویس
              </button>
              <button
                type="submit"
                onClick={() => setNewContractForm({ ...newContractForm, as_draft: false })}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                ثبت و ارسال دعوتنامه معامله
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KYC Tab */}
      {activeTab === 'kyc' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">سامانه احراز هویت هوشمند میانجی (KYC)</h2>
                <p className="text-xs text-slate-500 mt-0.5">استعلام آنلاین سامانه شاهکار و تطابق کد ملی با شماره شبا</p>
              </div>
            </div>

            {/* Status overview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-600 block">سطح فعلی حساب شما:</span>
                  <strong className="text-sm font-bold text-blue-800">
                    {currentUser?.kyc_level === 'gold' ? 'سطح طلایی (احراز هویت شده کامل)' : 'سطح پایه'}
                  </strong>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  فعال و معتبر
                </span>
              </div>
            </div>

            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">کد ملی ۱۰ رقمی (تطابق با شماره موبایل ثبت‌نامی)</label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="مثال: 0012345678"
                  value={kycNid}
                  onChange={(e) => setKycNid(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره شبای بانکی جهت واریز و تسویه (IBAN)</label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={26}
                    placeholder="IR120120000000001234567890"
                    value={kycSheba}
                    onChange={(e) => setKycSheba(e.target.value.toUpperCase())}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 focus:bg-white font-mono"
                    required
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">فرمت با حروف انگلیسی بزرگ: IR + ۲۴ رقم</span>
              </div>

              <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/50">
                <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">بارگذاری تصویر کارت ملی یا کارت بانکی (اختیاری)</div>
                <p className="text-[11px] text-slate-400 mt-1">جهت ارتقا به سقف نامحدود معاملات روزانه</p>
                <button
                  type="button"
                  onClick={() => showToast('فایل تصویر هویتی انتخاب شد.')}
                  className="mt-3 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  انتخاب فایل از سیستم
                </button>
              </div>

              <button
                type="submit"
                disabled={kycSubmitting}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
              >
                {kycSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    در حال استعلام از سامانه شاهکار...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    استعلام و ارتقای سطح حساب کاربری
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                مرکز داوری حقوقی و حل اختلاف میانجی
              </div>
              <p className="text-xs text-slate-500 mt-1">
                بررسی سه‌جانبه پرونده‌ها توسط وکلای متخصص و صدور رأی قطعی بر اساس اسناد و مدارک ثبت‌شده
              </p>
            </div>
            {currentUser?.role === 'arbitrator' && (
              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-200">
                حالت دسترسی داور ارشد فعال است
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Disputes List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs px-1">پرونده‌های فعال و در جریان ({disputes.length})</h3>
              <div className="space-y-2">
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDispute(d)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      selectedDispute?.id === d.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-600">{d.contract_id}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        d.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {d.status === 'resolved' ? 'رأی صادر شد' : 'در دست بررسی داور'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{d.contract_title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">شاکی: {d.claimant_name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispute Chat & Ruling Panel */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px]">
              {selectedDispute ? (
                <>
                  {/* Thread Header */}
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{selectedDispute.contract_title}</h4>
                      <p className="text-xs text-rose-600 mt-0.5 font-medium">علت اختلاف: {selectedDispute.reason}</p>
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-bold">پرونده: #{selectedDispute.id}</span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {selectedDispute.messages.map((m) => {
                      const isArb = m.sender_role === 'arbitrator';
                      const isMe = m.sender_id === currentUser?.id;

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[85%] ${
                            isArb
                              ? 'mx-auto w-full bg-purple-50 border border-purple-200 text-purple-950 p-3 rounded-2xl text-center'
                              : isMe
                              ? 'mr-auto bg-blue-700 text-white p-3 rounded-2xl rounded-br-none'
                              : 'ml-auto bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-bl-none'
                          }`}
                        >
                          <div className={`text-[10px] mb-1 font-semibold ${
                            isArb ? 'text-purple-700' : isMe ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {m.sender_name} {isArb && '⚖️ (داور رسمی میانجی)'}
                          </div>
                          <p className="text-xs leading-relaxed">{m.text}</p>
                        </div>
                      );
                    })}

                    {selectedDispute.ruling && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 my-2 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                        <h5 className="font-bold text-emerald-900 text-xs">رأی نهایی داوری صادر گردید</h5>
                        <p className="text-xs text-emerald-800 mt-1">{selectedDispute.ruling.comment}</p>
                      </div>
                    )}
                  </div>

                  {/* Arbitrator Actions (If Arbitrator) */}
                  {currentUser?.role === 'arbitrator' && selectedDispute.status !== 'resolved' && (
                    <div className="p-3 bg-purple-50 border-t border-purple-200 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-purple-900">صدور رأی نهایی داوری:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveDispute('refund_buyer')}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold"
                        >
                          عودت کامل وجه به خریدار
                        </button>
                        <button
                          onClick={() => handleResolveDispute('pay_seller')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold"
                        >
                          تسویه کامل با مجری
                        </button>
                        <button
                          onClick={() => handleResolveDispute('split_50_50')}
                          className="bg-purple-700 hover:bg-purple-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold"
                        >
                          تسهیم ۵۰-۵۰
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Input Box */}
                  <div className="p-3 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="متن پیام، دفاعیه یا توضیحات تکمیلی..."
                      value={newDisputeMsg}
                      onChange={(e) => setNewDisputeMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendDisputeMessage()}
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700"
                    />
                    <button
                      onClick={handleSendDisputeMessage}
                      className="bg-blue-700 hover:bg-blue-800 text-white p-2.5 rounded-xl transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
                  <p className="text-xs">یک پرونده را از ستون راست جهت مشاهده جزییات و مکاتبات انتخاب فرمایید.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Program Tab */}
      {activeTab === 'affiliate' && affiliateStats && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
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
                  className="w-full bg-white text-blue-800 hover:bg-blue-50 py-1.5 px-3 rounded-lg text-xs font-bold transition shadow-sm"
                >
                  انتقال به کیف پول
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Users className="w-5 h-5 text-blue-700 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-slate-900">{affiliateStats.total_invited} نفر</div>
              <span className="text-xs text-slate-500">کاربران ثبت‌نامی</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-slate-900">{affiliateStats.active_traders} نفر</div>
              <span className="text-xs text-slate-500">معامله‌گران فعال</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <DollarSign className="w-5 h-5 text-blue-700 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-slate-900">{affiliateStats.total_commission_earned.toLocaleString('fa-IR')}</div>
              <span className="text-xs text-slate-500">کل سود پرداختی (تومان)</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Percent className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-slate-900">۱۰ درصد</div>
              <span className="text-xs text-slate-500">پورسانت پلتفرم</span>
            </div>
          </div>

          {/* Link Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">لینک و کد اختصاصی دعوت شما</h3>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-700 font-mono truncate">{affiliateStats.referral_link}</span>
              </div>
              <button
                onClick={() => copyToClipboard(affiliateStats.referral_link, 'لینک دعوت')}
                className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Copy className="w-4 h-4" />
                کپی لینک اختصاصی
              </button>
              <button
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(affiliateStats.referral_link)}&text=${encodeURIComponent('واسطه‌گری امن و ثبت رسمی قراردادهای الکترونیک با میانجی اسکرو')}`)}
                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Share2 className="w-4 h-4" />
                اشتراک در تلگرام
              </button>
            </div>
          </div>

          {/* Invited History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-xs">
              لیست زیرمجموعه‌ها و معاملات مشمول پاداش
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {affiliateStats.referral_history.map((r, i) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {r.user_name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{r.user_name}</div>
                      <div className="text-[11px] text-slate-400">عضویت: {r.signed_up_at}</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <strong className="text-emerald-600 block">+{r.earned_amount.toLocaleString('fa-IR')} تومان</strong>
                    <span className="text-[10px] text-slate-500">{r.contracts_count} معامله انجام داده</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900 ${viewMode === 'telegram' ? 'p-0 md:p-6 bg-slate-900' : ''}`}>
      {/* Top Banner & Mode Switcher Bar */}
      <div className="bg-slate-900 text-white py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">سامانه واسطه‌گری امن و ثبت رسمی قراردادهای الکترونیک میانجی (Miyanji Escrow)</span>
          </div>

          <div className="flex items-center gap-3">
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

            {/* Test User Switcher */}
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>تغییر نقش تستی:</span>
              <button
                onClick={() => handleSwitchUser(1802649782)}
                className={`px-2 py-0.5 rounded ${currentUser?.id === 1802649782 ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
              >
                کارفرما
              </button>
              <span>|</span>
              <button
                onClick={() => handleSwitchUser(290184712)}
                className={`px-2 py-0.5 rounded ${currentUser?.id === 290184712 ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
              >
                مجری
              </button>
              <span>|</span>
              <button
                onClick={() => handleSwitchUser(999000111)}
                className={`px-2 py-0.5 rounded ${currentUser?.id === 999000111 ? 'bg-purple-600 text-white font-bold' : 'hover:text-white'}`}
              >
                داور
              </button>
            </div>
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
              <button onClick={() => showToast('منوی تلگرام')} className="hover:opacity-80">•••</button>
              <button onClick={() => setViewMode('desktop')} className="hover:opacity-80 text-white/80">✕ بستن</button>
            </div>
          </div>
        )}

        {/* Brand App Header */}
        <header className="bg-white border-b border-slate-200 py-3.5 px-4 md:px-6 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-200">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">میانجی • Miyanji</h1>
                <p className="text-[11px] text-slate-500">سامانه جامع اسکرو و واسطه‌گری امن معاملات</p>
              </div>
            </div>

            {/* Header Actions: Notification Bell & User Profile */}
            <div className="flex items-center gap-2.5">
              {/* Notification Bell Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className={`p-2 rounded-xl border transition relative flex items-center justify-center ${
                    showNotifDropdown
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50'
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
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">اعلان‌های سامانه میانجی</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {notifications.filter(n => !n.read).length} جدید
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-blue-700 hover:underline font-medium"
                        >
                          خوانده شد
                        </button>
                        <button
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Browser Notification Permission Banner (if not granted) */}
                    {browserPerm !== 'granted' && (
                      <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-blue-900 leading-tight">
                          <strong>فعال‌سازی اعلان مرورگر</strong>
                          <span className="block text-slate-500 text-[10px]">دریافت پیام و تغییر وضعیت قرارداد حتی در تب‌های دیگر</span>
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
                    <div className="p-2 bg-slate-100/70 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">شبیه‌سازی اعلان زنده:</span>
                      <button
                        onClick={simulateTestNotification}
                        className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-blue-700 font-bold px-2.5 py-1 rounded-md transition flex items-center gap-1 shadow-xs"
                      >
                        <Volume2 className="w-3 h-3 text-blue-600" />
                        تست اعلان پیام / وضعیت
                      </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
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
                                  setActiveTab(n.type === 'arbitration' ? 'disputes' : 'contracts');
                                  setShowNotifDropdown(false);
                                }
                              }
                            }}
                            className={`p-3 hover:bg-slate-50 transition cursor-pointer flex items-start gap-2.5 ${
                              !n.read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              !n.read ? 'bg-blue-600' : 'bg-transparent'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-bold text-slate-800 text-xs">{n.title}</span>
                                <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                              {n.contractId && (
                                <span className="inline-block mt-1 font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                  #{n.contractId}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                        <button
                          onClick={clearAllNotifications}
                          className="text-[10px] text-slate-500 hover:text-rose-600 font-medium"
                        >
                          پاک کردن لیست اعلان‌ها
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Quick Info */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800">{currentUser?.full_name}</span>
                <span className="text-[10px] text-emerald-600 font-medium">احراز شده (سطح {currentUser?.kyc_level})</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center border border-blue-200 text-xs">
                {currentUser?.full_name ? currentUser.full_name[0] : 'U'}
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 md:gap-2 mt-3 overflow-x-auto text-xs font-medium pb-1">
            {[
              { id: 'dashboard', label: 'داشبورد و کیف پول', icon: Layers },
              { id: 'contracts', label: 'قراردادها و اسکرو', icon: FileText },
              { id: 'new_contract', label: 'ثبت معامله جدید', icon: PlusCircle },
              { id: 'kyc', label: 'احراز هویت', icon: ShieldCheck },
              { id: 'disputes', label: 'مرکز داوری', icon: AlertTriangle },
              { id: 'affiliate', label: 'سامانه سفیران', icon: Users }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                    isActive
                      ? 'bg-blue-700 text-white font-bold shadow-sm shadow-blue-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-6">
          {renderContent()}
        </main>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">شارژ کیف پول میانجی</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ شارژ (تومان)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 font-bold text-blue-700"
                />
                <div className="flex gap-2 mt-2">
                  {['2000000', '5000000', '15000000'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setDepositAmount(p)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-700 font-medium"
                    >
                      {Number(p).toLocaleString('fa-IR')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">روش واریز</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setDepositMethod('gateway')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      depositMethod === 'gateway' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    درگاه شاپرک (شتاب)
                  </button>
                  <button
                    onClick={() => setDepositMethod('card_to_card')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      depositMethod === 'card_to_card' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600'
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">درخواست تسویه و برداشت به شماره شبا</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ برداشت (تومان)</label>
                <input
                  type="number"
                  placeholder="مبلغ مورد نظر به تومان"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  موجودی قابل برداشت: {(currentUser?.wallet_balance || 0).toLocaleString('fa-IR')} تومان
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شماره شبای مقصد (IBAN)</label>
                <input
                  type="text"
                  maxLength={26}
                  placeholder="IR..."
                  value={withdrawSheba}
                  onChange={(e) => setWithdrawSheba(e.target.value.toUpperCase())}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 font-mono"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">تحویل خروجی‌های معامله</h3>
              <button onClick={() => setShowDeliverModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                پروژه: <strong>{showDeliverModal.title}</strong>
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و گزارش کار انجام‌شده *</label>
                <textarea
                  rows={3}
                  value={deliverNotes}
                  onChange={(e) => setDeliverNotes(e.target.value)}
                  placeholder="توضیح دهید چه کارهایی تحویل شده و فایل‌ها چگونه در دسترس هستند..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">لینک دانلود خروجی‌ها (گوگل‌درایو، گیت‌هاب و ...)</label>
                <input
                  type="url"
                  value={deliverLink}
                  onChange={(e) => setDeliverLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700 font-mono"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-rose-600 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                درخواست رسیدگی داوری حقوقی
              </h3>
              <button onClick={() => setShowDisputeModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">دلیل اصلی ثبت اختلاف</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700"
                >
                  <option value="تاخیر در تحویل و عدم پاسخگویی">تاخیر غیرمجاز در تحویل کار</option>
                  <option value="عدم مطابقت کیفیت کار با بریف توافق‌شده">عدم انطباق خروجی‌ها با تعهدات قرارداد</option>
                  <option value="درخواست ویرایش‌های نامتعارف خارج از قرارداد">درخواست تغییرات فراتر از مفاد قرارداد</option>
                  <option value="سایر موارد و عدم توافق">سایر موارد اختلاف</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شرح کامل اختلاف و ادعا</label>
                <textarea
                  rows={4}
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="مستندات و توضیحات خود را برای بررسی داور بنویسید..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-700"
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
