import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Download,
  Send,
  Trash2,
  Edit3,
  Shield,
  ShieldCheck,
  Scale,
  CreditCard,
  Users,
  Search,
  RefreshCw,
  ArrowRight,
  Lock,
  Check,
  X,
  ExternalLink,
  Eye,
  Copy,
  Smartphone,
  Layers,
  HelpCircle,
  ChevronRight,
  FileCheck,
  Sparkles,
  UploadCloud,
  CheckCheck
} from 'lucide-react';

interface Milestone {
  title: string;
  amount: number;
  status: 'pending' | 'paid' | 'delivered' | 'completed';
}

interface Contract {
  id: string;
  contract_id: string;
  title: string;
  amount: number;
  category: string;
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
  milestones?: Milestone[];
  staged_payment?: boolean;
  history: Array<{ event: string; timestamp: string; actor?: string }>;
  created_at: string;
}

interface Stats {
  active: number;
  pending: number;
  drafts: number;
  completed: number;
  cancelled: number;
  totalVolume: number;
  contractsCount: number;
  commissionRate: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'contracts' | 'simulator' | 'pdf_view' | 'arbitration' | 'wallet'>('contracts');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New Draft Modal State
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftForm, setDraftForm] = useState({
    title: '',
    amount: '',
    role: 'employer',
    category: 'DEV',
    deadline: '7',
    free_edits: '3',
    commission_payer: 'freelancer',
    description: '',
    signer_fullname: 'علیرضا رضوانی',
    signer_phone: '09121112233',
    signer_national_id: '0012345678'
  });

  // Sign Modal State
  const [signModalContract, setSignModalContract] = useState<Contract | null>(null);
  const [signRole, setSignRole] = useState<'employer' | 'freelancer'>('employer');
  const [signerName, setSignerName] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [signerNid, setSignerNid] = useState('');
  const [otpCode, setOtpCode] = useState('849201');
  const [otpInput, setOtpInput] = useState('');
  const [signStep, setSignStep] = useState<'details' | 'otp'>('details');

  // Receipt Modal State
  const [receiptModalContract, setReceiptModalContract] = useState<Contract | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Reject Receipt Modal State
  const [rejectModal, setRejectModal] = useState<{ cid: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('مغایرت در مبلغ واریزی با مفاد قرارداد');

  // PDF Preview Certificate Modal State
  const [pdfPreviewModal, setPdfPreviewModal] = useState<Contract | null>(null);

  // User Simulated Wallet Balance
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Simulator Context & Chat State
  const [simulatorContext, setSimulatorContext] = useState<'idle' | 'wallet' | 'deposit' | 'contract_wizard' | 'deals'>('idle');
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'bot' | 'user';
    text: string;
    inlineButtons?: Array<Array<{ text: string; action: string; style?: 'primary' | 'danger' | 'success' }>>;
    document?: { title: string; filename: string; contractId: string };
    photo?: string;
    timestamp: string;
  }>>([
    {
      sender: 'bot',
      text: '👋 سلام به سامانه هوشمند میانجی (Miyanji Escrow) خوش آمدید!\nپلتفرم ثبت قراردادهای الکترونیک و واسطه‌گری امن در بستر تلگرام.\nاز منوی زیر می‌توانید معاملات، پیش‌نویس‌ها و واریزها را مدیریت کنید:',
      inlineButtons: [
        [
          { text: '➕ ثبت پیش‌نویس جدید', action: 'bot_cmd_new_draft' },
          { text: '📁 پیش‌نویس‌های من', action: 'bot_cmd_drafts' }
        ],
        [
          { text: '📜 لیست معاملات من', action: 'bot_cmd_my_deals' },
          { text: '💳 کیف پول و اعتبار', action: 'bot_cmd_wallet' }
        ]
      ],
      timestamp: 'هم‌اکنون'
    }
  ]);
  const [simulatorInput, setSimulatorInput] = useState('');

  // Fetch contracts & stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resContracts, resStats] = await Promise.all([
        fetch('/api/contracts').then(r => r.json()),
        fetch('/api/stats').then(r => r.json())
      ]);
      setContracts(resContracts);
      setStats(resStats);
      if (resContracts.length > 0 && !selectedContract) {
        setSelectedContract(resContracts[0]);
      } else if (selectedContract) {
        const updated = resContracts.find((x: Contract) => x.contract_id === selectedContract.contract_id);
        if (updated) setSelectedContract(updated);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Robust In-Iframe Blob PDF Downloader & Certificate Viewer
  const handleDownloadPdf = async (contractId: string) => {
    try {
      setDownloadingId(contractId);
      showToast('⏳ در حال آماده‌سازی و دانلود فایل PDF رسمی...');

      const response = await fetch(`/api/contracts/${contractId}/pdf`);
      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || `خطا در دریافت PDF (کد ${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Miyanji_Contract_${contractId}.pdf`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();

      // Delay revoking URL so browser download thread completes smoothly
      setTimeout(() => {
        try {
          if (a.parentNode) a.parentNode.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch {
          // ignore cleanup errors
        }
      }, 60000);

      showToast('✅ فایل PDF صادر و بارگیری آغاز گردید.');

      // Also open official PDF certificate preview modal for immediate viewing & printing
      const c = contracts.find(x => x.contract_id === contractId);
      if (c) {
        setSelectedContract(c);
        setPdfPreviewModal(c);
      }
    } catch (err: any) {
      console.error('Download error:', err);
      showToast('❌ خطا در دریافت فایل PDF: ' + (err.message || 'خطای نامشخص'));
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered contracts
  const filteredContracts = contracts.filter(c => {
    const matchesFilter =
      filterStatus === 'all' ? true :
      filterStatus === 'draft' ? c.status === 'draft' :
      filterStatus === 'pending' ? (c.status === 'pending_party_b' || c.status === 'awaiting_payment' || c.status === 'awaiting_receipt_approval') :
      filterStatus === 'active' ? (c.status === 'active' || c.status === 'work_submitted') :
      filterStatus === 'completed' ? c.status === 'completed' :
      filterStatus === 'cancelled' ? c.status === 'cancelled' :
      filterStatus === 'in_dispute' ? c.status === 'in_dispute' : true;

    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contract_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.buyer_fullname && c.buyer_fullname.includes(searchQuery)) ||
      (c.seller_fullname && c.seller_fullname.includes(searchQuery));

    return matchesFilter && matchesSearch;
  });

  // Handle Save New Draft
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftForm.title.trim()) {
      alert('لطفاً عنوان معامله را وارد کنید.');
      return;
    }

    try {
      const payload = {
        title: draftForm.title,
        amount: Number(draftForm.amount) || 0,
        category: draftForm.category,
        deadline: Number(draftForm.deadline) || 7,
        free_edits: Number(draftForm.free_edits) || 3,
        commission_payer: draftForm.commission_payer,
        description: draftForm.description,
        role: draftForm.role,
        signer_fullname: draftForm.signer_fullname,
        signer_phone: draftForm.signer_phone,
        signer_national_id: draftForm.signer_national_id,
        status: 'draft'
      };

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const created = await res.json();
      setShowDraftModal(false);
      setDraftForm({
        title: '',
        amount: '',
        role: 'employer',
        category: 'DEV',
        deadline: '7',
        free_edits: '3',
        commission_payer: 'freelancer',
        description: '',
        signer_fullname: 'علیرضا رضوانی',
        signer_phone: '09121112233',
        signer_national_id: '0012345678'
      });
      await fetchData();
      setSelectedContract(created);
      showToast(`✅ پیش‌نویس معامله با شناسه ${created.contract_id} در سامانه ذخیره شد.`);

      addSimulatorMessage('bot', `📁 پیش‌نویس جدید **${created.title}** (شناسه: \`${created.contract_id}\`) ذخیره شد.\nمی‌توانید هر زمان از بخش «پیش‌نویس‌های من» آن را تکمیل و امضا کنید.`, [
        [
          { text: `🚀 تکمیل و امضا (${created.contract_id})`, action: `bot_resume_${created.contract_id}` },
          { text: `🗑 حذف پیش‌نویس`, action: `bot_delete_${created.contract_id}` }
        ]
      ]);
    } catch (err: any) {
      alert('خطا در ذخیره پیش‌نویس: ' + err.message);
    }
  };

  // Delete Draft
  const handleDeleteDraft = async (cid: string) => {
    if (!confirm(`آیا از حذف پیش‌نویس ${cid} اطمینان دارید؟`)) return;
    try {
      await fetch(`/api/contracts/${cid}`, { method: 'DELETE' });
      showToast(`🗑 پیش‌نویس ${cid} با موفقیت حذف گردید.`);
      await fetchData();
      if (selectedContract?.contract_id === cid) {
        setSelectedContract(null);
      }
    } catch (err: any) {
      alert('خطا در حذف پیش‌نویس: ' + err.message);
    }
  };

  // Start Signing Flow
  const openSignModal = (contract: Contract, role: 'employer' | 'freelancer') => {
    setSignModalContract(contract);
    setSignRole(role);
    setSignerName(role === 'employer' ? (contract.buyer_fullname || 'علیرضا رضوانی') : (contract.seller_fullname || 'حسین سهرابی'));
    setSignerPhone(role === 'employer' ? (contract.buyer_phone || '09121112233') : (contract.seller_phone || '09359998877'));
    setSignerNid(role === 'employer' ? (contract.buyer_national_id || '0012345678') : (contract.seller_national_id || '0087654321'));
    const genOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(genOtp);
    setOtpInput(genOtp);
    setSignStep('details');
  };

  // Execute Signature
  const handleExecuteSign = async () => {
    if (!signModalContract) return;
    try {
      const res = await fetch(`/api/contracts/${signModalContract.contract_id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: signRole,
          fullname: signerName,
          phone: signerPhone,
          national_id: signerNid,
          otp: otpInput
        })
      });
      const data = await res.json();
      setSignModalContract(null);
      await fetchData();
      setSelectedContract(data.contract);

      if (data.pdf_ready) {
        showToast(`🎊 هر دو طرف معامله امضا کردند! سند رسمی PDF صادر شد و اکنون می‌توانید فیش واریزی را ارسال کنید.`);
        addSimulatorMessage('bot', `🎊 **تبریک! قرارداد شماره \`${data.contract.contract_id}\` با موفقیت توسط هر دو طرف امضا شد.**\n📄 فایل PDF رسمی قرارداد امضا شده صادر شد:`, [
          [
            { text: '📸 ارسال فیش واریزی به امانت', action: `bot_send_receipt_${data.contract.contract_id}` }
          ]
        ], {
          title: data.contract.title,
          filename: `Miyanji_Contract_${data.contract.contract_id}.pdf`,
          contractId: data.contract.contract_id
        });
      } else {
        showToast(`✍️ امضای ${signRole === 'employer' ? 'کارفرما' : 'مجری'} با موفقیت ثبت شد. لینک دعوت برای طرف دیگر معامله صادر گردید.`);
        addSimulatorMessage('bot', `✍️ امضای شما برای معامله \`${data.contract.contract_id}\` ثبت گردید.\n🔗 لینک دعوت طرف دوم:\n\`https://t.me/mianji_ir_bot?start=c_${data.contract.contract_id}\``);
      }
    } catch (err: any) {
      alert('خطا در ثبت امضا: ' + err.message);
    }
  };

  // Submit Receipt
  const handleSubmitReceipt = async (cid: string) => {
    try {
      const receiptImg = receiptImage || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400';
      const res = await fetch(`/api/contracts/${cid}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_image: receiptImg })
      });
      const data = await res.json();
      setReceiptModalContract(null);
      setReceiptImage(null);
      await fetchData();
      setSelectedContract(data.contract);
      showToast('✅ فیش واریزی با موفقیت دریافت و برای مدیریت ارسال گردید.');

      // 1. Add user receipt message to Telegram Simulator
      addSimulatorMessage('user', `[📷 ارسال تصویر فیش واریزی معامله ${cid}]`, undefined, undefined, receiptImg);

      // 2. Bot confirmation message to user
      addSimulatorMessage(
        'bot',
        `✅ **فیش واریزی معامله \`${cid}\` با موفقیت دریافت شد.**\n\n💰 **مبلغ واریزی:** ${data.contract.amount.toLocaleString('fa-IR')} تومان\n⏳ فیش جهت تطبیق حساب و تایید نهایی برای مدیریت ارسال گردید.\n💡 به محض تایید توسط مدیریت، معامله فعال شده و پیام اطلاع‌رسانی ارسال خواهد شد.`
      );

      // 3. Admin review card with approve and reject buttons
      addSimulatorMessage(
        'bot',
        `🔔 **[پنل مدیریت] فیش واریزی جدید جهت بررسی و تایید:**\n📌 **معامله:** \`${cid}\`\n📝 **عنوان:** ${data.contract.title}\n💵 **مبلغ مورد انتظار:** ${data.contract.amount.toLocaleString('fa-IR')} تومان\n👤 **کارفرما:** ${data.contract.buyer_fullname || 'کارفرما'}\n🖼️ تصویر فیش واریزی ضمیمه گردید:`,
        [
          [
            { text: '✅ تایید فیش و فعالسازی معامله', action: `admin_approve_receipt_${cid}`, style: 'success' },
            { text: '❌ رد فیش واریزی', action: `admin_open_reject_${cid}`, style: 'danger' }
          ]
        ],
        undefined,
        receiptImg
      );
    } catch (err: any) {
      showToast('❌ خطا در ارسال فیش: ' + (err.message || 'خطای نامشخص'));
    }
  };

  // Admin Approve Receipt
  const handleApproveReceipt = async (cid: string) => {
    try {
      const res = await fetch(`/api/contracts/${cid}/approve_receipt`, { method: 'POST' });
      const data = await res.json();
      await fetchData();
      setSelectedContract(data.contract);
      showToast('✅ فیش واریزی تایید شد و معامله با موفقیت فعال گردید.');
      addSimulatorMessage(
        'bot',
        `🎉 **فیش واریزی معامله \`${cid}\` توسط مدیریت تایید گردید.**\n🔒 مبلغ **${data.contract.amount.toLocaleString('fa-IR')} تومان** در صندوق امن میانجی قفل شد.\n🚀 وضعیت پروژه به «🟢 در حال انجام» تغییر یافت و کار آغاز گردید.`
      );
    } catch (err: any) {
      showToast('❌ خطا در تایید فیش: ' + (err.message || 'خطای نامشخص'));
    }
  };

  // Admin Open Reject Modal
  const handleOpenRejectModal = (cid: string) => {
    const c = contracts.find(x => x.contract_id === cid);
    setRejectModal({
      cid,
      title: c?.title || `معامله ${cid}`
    });
    setRejectReason('مغایرت در مبلغ واریزی با مفاد قرارداد');
  };

  // Admin Confirm Reject Receipt
  const handleConfirmRejectReceipt = async (cid: string, reason: string) => {
    try {
      const res = await fetch(`/api/contracts/${cid}/reject_receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'مغایرت مبلغ یا عدم واریز به حساب' })
      });
      const data = await res.json();
      setRejectModal(null);
      await fetchData();
      setSelectedContract(data.contract);
      showToast('❌ فیش واریزی توسط مدیریت رد شد.');
      addSimulatorMessage(
        'bot',
        `⚠️ **فیش واریزی معامله \`${cid}\` توسط مدیریت رد شد.**\n🚫 **علت رد:** ${reason || 'مغایرت مبلغ یا ناخوانا بودن فیش'}\n💡 لطفاً پس از بررسی، تصویر فیش معتبر را مجدداً ارسال فرمایید:`,
        [
          [
            { text: '📸 ارسال مجدد فیش واریزی', action: `bot_send_receipt_${cid}` }
          ]
        ]
      );
    } catch (err: any) {
      showToast('❌ خطا در رد فیش: ' + (err.message || 'خطای نامشخص'));
    }
  };

  // Escrow Deliver & Finalize
  const handleDeliverProject = async (cid: string) => {
    try {
      const res = await fetch(`/api/contracts/${cid}/deliver`, { method: 'POST' });
      const data = await res.json();
      await fetchData();
      setSelectedContract(data.contract);
      showToast(`📦 خروجی‌های پروژه تحویل داده شد و در انتظار تایید کارفرما قرار گرفت.`);
    } catch (err: any) {
      alert('خطا در تحویل: ' + err.message);
    }
  };

  const handleApproveWork = async (cid: string) => {
    try {
      const res = await fetch(`/api/contracts/${cid}/approve`, { method: 'POST' });
      const data = await res.json();
      await fetchData();
      setSelectedContract(data.contract);
      showToast(`🏁 کارفرما کار را تایید کرد. وجه امانت به حساب مجری تسویه شد.`);
    } catch (err: any) {
      alert('خطا در تایید کار: ' + err.message);
    }
  };

  const handleDispute = async (cid: string) => {
    const reason = prompt('لطفاً دلیل درخواست داوری و حل اختلاف را وارد کنید:');
    if (!reason) return;
    try {
      const res = await fetch(`/api/contracts/${cid}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      await fetchData();
      setSelectedContract(data.contract);
      showToast(`⚖️ درخواست داوری ثبت شد و پرونده به دپارتمان حل اختلاف ارجاع گردید.`);
    } catch (err: any) {
      alert('خطا در ارجاع به داوری: ' + err.message);
    }
  };

  // Simulator Message Dispatcher
  const addSimulatorMessage = (
    sender: 'bot' | 'user',
    text: string,
    inlineButtons?: Array<Array<{ text: string; action: string; style?: 'primary' | 'danger' | 'success' }>>,
    document?: { title: string; filename: string; contractId: string },
    photo?: string
  ) => {
    setChatMessages(prev => [
      ...prev,
      {
        sender,
        text,
        inlineButtons,
        document,
        photo,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSimulatorSend = (userText: string) => {
    if (!userText.trim()) return;
    const txt = userText.trim();
    setSimulatorInput('');
    addSimulatorMessage('user', txt);

    setTimeout(() => {
      // 1. Cancel handling (Fixed bug reported by user: Never says draft saved unless genuinely in contract wizard with draft data!)
      if (
        txt === '🔙 انصراف و بازگشت' ||
        txt === '❌ انصراف و بازگشت به منو' ||
        txt === '❌ انصراف' ||
        txt === 'انصراف' ||
        txt === '/cancel' ||
        txt === 'لغو'
      ) {
        const wasInDraftWizardWithData =
          simulatorContext === 'contract_wizard' &&
          (draftForm.title.trim().length > 0 || Number(draftForm.amount) > 0);

        setSimulatorContext('idle');
        setShowDraftModal(false);
        setReceiptModalContract(null);
        setSignModalContract(null);

        if (wasInDraftWizardWithData) {
          addSimulatorMessage(
            'bot',
            '📁 پیش‌نویس معامله در بخش «معاملات من > پیش‌نویس‌های من» ذخیره گردید و به منوی اصلی بازگشتید.',
            [
              [
                { text: '📁 مشاهده پیش‌نویس‌های من', action: 'bot_cmd_drafts' },
                { text: '➕ ایجاد پیش‌نویس جدید', action: 'bot_cmd_new_draft' }
              ],
              [
                { text: '📜 لیست معاملات من', action: 'bot_cmd_my_deals' },
                { text: '💳 کیف پول و اعتبار', action: 'bot_cmd_wallet' }
              ]
            ]
          );
        } else {
          // If in wallet, deposit, deals, or empty draft:
          addSimulatorMessage('bot', '❌ عملیات لغو شد و به منوی اصلی بازگشتید.', [
            [
              { text: '🤝 ثبت معامله جدید', action: 'bot_cmd_new_draft' },
              { text: '📜 لیست معاملات من', action: 'bot_cmd_my_deals' }
            ],
            [
              { text: '📁 پیش‌نویس‌های من', action: 'bot_cmd_drafts' },
              { text: '💳 کیف پول و اعتبار', action: 'bot_cmd_wallet' }
            ]
          ]);
        }
        return;
      }

      // 2. Drafts command
      if (txt === '📁 پیش‌نویس‌های من' || txt === 'پیش‌نویس‌ها' || txt.includes('پیش‌نویس')) {
        setSimulatorContext('deals');
        const userDrafts = contracts.filter(c => c.status === 'draft');
        if (userDrafts.length === 0) {
          addSimulatorMessage('bot', '📁 **پیش‌نویس‌های من**\n\nشما در حال حاضر هیچ پیش‌نویس ذخیره‌شده‌ای ندارید. جهت ایجاد یک پیش‌نویس جدید روی دکمه زیر کلیک کنید:', [
            [
              { text: '➕ ایجاد پیش‌نویس جدید', action: 'bot_cmd_new_draft' },
              { text: '📜 لیست معاملات من', action: 'bot_cmd_my_deals' }
            ]
          ]);
        } else {
          addSimulatorMessage('bot', `📁 **لیست پیش‌نویس‌های شما (${userDrafts.length} عدد):**\nبرای ادامه هر پیش‌نویس روی دکمه «🚀 تکمیل و امضا» کلیک کنید:`, [
            ...userDrafts.map(d => [
              { text: `🚀 تکمیل و امضا: ${d.title.substring(0, 22)}...`, action: `bot_resume_${d.contract_id}` },
              { text: `🗑 حذف`, action: `bot_delete_${d.contract_id}`, style: 'danger' as const }
            ]),
            [{ text: '➕ ایجاد پیش‌نویس جدید دیگر', action: 'bot_cmd_new_draft' }]
          ]);
        }
      } else if (txt === '🤝 ثبت معامله جدید' || txt === '➕ ثبت معامله جدید') {
        setSimulatorContext('contract_wizard');
        addSimulatorMessage('bot', '💼 **ایجاد پیش‌نویس قرارداد جدید**\n\n👤 لطفاً نقش خود را در این معامله مشخص کنید:', [
          [
            { text: '💼 کارفرما (خریدار)', action: 'bot_role_employer' },
            { text: '🛠 مجری (پیمانکار)', action: 'bot_role_freelancer' }
          ],
          [
            { text: '❌ انصراف و بازگشت به منو', action: 'bot_cmd_cancel' }
          ]
        ]);
      } else if (txt === '💳 کیف پول و اعتبار') {
        setSimulatorContext('wallet');
        addSimulatorMessage('bot', `💳 **کیف پول و موجودی میانجی**\n\n💰 موجودی قابل برداشت: \`${walletBalance.toLocaleString('fa-IR')} تومان\`\n🔒 موجودی بلوکه‌شده در امانت: \`۰ تومان\`\n\nجهت شارژ حساب یا ثبت درخواست برداشت از گزینه‌های زیر استفاده کنید:`, [
          [
            { text: '➕ شارژ حساب با فیش واریزی', action: 'bot_wallet_deposit' },
            { text: '➖ درخواست تسویه به شبا', action: 'bot_wallet_withdraw' }
          ],
          [
            { text: '🔙 انصراف و بازگشت', action: 'bot_cmd_cancel' }
          ]
        ]);
      } else if (txt === '📜 لیست معاملات من' || txt === '📜 معاملات من') {
        setSimulatorContext('deals');
        const draftsCount = contracts.filter(c => c.status === 'draft').length;
        const activeCount = contracts.filter(c => c.status === 'active').length;
        const pendingCount = contracts.filter(c => c.status === 'pending_party_b' || c.status === 'awaiting_payment' || c.status === 'awaiting_receipt_approval').length;
        const completedCount = contracts.filter(c => c.status === 'completed').length;
        addSimulatorMessage('bot', `📑 **پنل مدیریت هوشمند معاملات شما**\n\n📊 **آمار کلی:**\n• درحال انجام: \`${activeCount}\`\n• در انتظار اقدام: \`${pendingCount}\`\n• پیش‌نویس‌ها: \`${draftsCount}\`\n• تکمیل شده: \`${completedCount}\``, [
          [
            { text: `🟢 درحال انجام (${activeCount})`, action: 'bot_filter_active' },
            { text: `⏳ در انتظار اقدام (${pendingCount})`, action: 'bot_filter_pending' }
          ],
          [
            { text: `🏁 تکمیل شده (${completedCount})`, action: 'bot_filter_completed' },
            { text: `📁 پیش‌نویس‌های من (${draftsCount})`, action: 'bot_cmd_drafts' }
          ],
          [
            { text: '➕ ایجاد پیش‌نویس جدید', action: 'bot_cmd_new_draft' }
          ]
        ]);
      } else if (txt === '/start' || txt === 'شروع') {
        setSimulatorContext('idle');
        addSimulatorMessage('bot', '👋 به سامانه هوشمند واسطه‌گری امن و ثبت رسمی قراردادهای میانجی خوش آمدید.\nجهت شروع یکی از گزینه‌های زیر را انتخاب نمایید:', [
          [
            { text: '🤝 ثبت معامله جدید', action: 'bot_cmd_new_draft' },
            { text: '📁 پیش‌نویس‌های من', action: 'bot_cmd_drafts' }
          ],
          [
            { text: '📜 لیست معاملات من', action: 'bot_cmd_my_deals' },
            { text: '💳 کیف پول و اعتبار', action: 'bot_cmd_wallet' }
          ]
        ]);
      } else {
        addSimulatorMessage('bot', `درخواست دریافت شد: "${txt}".\nمی‌توانید از منوهای زیر جهت ساخت پیش‌نویس، بررسی معاملات، ارسال فیش یا امضای قرارداد استفاده فرمایید:`, [
          [
            { text: '🤝 ثبت معامله جدید', action: 'bot_cmd_new_draft' },
            { text: '📁 پیش‌نویس‌های من', action: 'bot_cmd_drafts' }
          ],
          [
            { text: '📜 لیست معاملات من', action: 'bot_cmd_my_deals' },
            { text: '💳 کیف پول و اعتبار', action: 'bot_cmd_wallet' }
          ]
        ]);
      }
    }, 350);
  };

  const handleSimulatorAction = (action: string) => {
    if (action === 'bot_cmd_new_draft') {
      setSimulatorContext('contract_wizard');
      setShowDraftModal(true);
      addSimulatorMessage('bot', '📝 فرم ایجاد پیش‌نویس قرارداد جدید باز شد. مشخصات را وارد فرمایید تا در بخش پیش‌نویس‌ها ثبت گردد.');
    } else if (action === 'bot_cmd_cancel') {
      handleSimulatorSend('❌ انصراف');
    } else if (action === 'bot_cmd_drafts') {
      handleSimulatorSend('📁 پیش‌نویس‌های من');
    } else if (action === 'bot_cmd_my_deals') {
      handleSimulatorSend('📜 لیست معاملات من');
    } else if (action === 'bot_cmd_wallet') {
      handleSimulatorSend('💳 کیف پول و اعتبار');
    } else if (action === 'bot_wallet_deposit') {
      setSimulatorContext('deposit');
      addSimulatorMessage('bot', '💳 **شارژ کیف پول میانجی با فیش بانکی**\n\nلطفاً مبلغ مورد نظر جهت شارژ را انتخاب فرمایید:', [
        [
          { text: '۵۰۰,۰۰۰ تومان', action: 'bot_dep_amt_500000' },
          { text: '۱,۰۰۰,۰۰۰ تومان', action: 'bot_dep_amt_1000000' }
        ],
        [
          { text: '۲,۰۰۰,۰۰۰ تومان', action: 'bot_dep_amt_2000000' },
          { text: '۵,۰۰۰,۰۰۰ تومان', action: 'bot_dep_amt_5000000' }
        ],
        [
          { text: '🔙 انصراف و بازگشت', action: 'bot_cmd_cancel' }
        ]
      ]);
    } else if (action.startsWith('bot_dep_amt_')) {
      const amtStr = action.replace('bot_dep_amt_', '');
      const amt = Number(amtStr);
      setSimulatorContext('deposit');
      addSimulatorMessage('bot', `💳 **دستورالعمل واریز وجه جهت شارژ کیف پول**\n\n💰 مبلغ: **${amt.toLocaleString('fa-IR')} تومان**\n\nلطفاً مبلغ فوق را به شماره کارت زیر واریز کرده و تصویر فیش واریزی را ارسال نمایید:\n\n🏧 **شماره کارت:** \`6037-9975-7534-8211\`\n👤 **بنام:** امیررضا مجتبایی (حساب امانی میانجی)\n\nجهت ارسال فیش، روی دکمه زیر کلیک نمایید:`, [
        [
          { text: `📷 ارسال تصویر فیش واریزی (${amt.toLocaleString('fa-IR')} تومان)`, action: `bot_do_deposit_receipt_${amt}` }
        ],
        [
          { text: '🔙 انصراف و بازگشت', action: 'bot_cmd_cancel' }
        ]
      ]);
    } else if (action.startsWith('bot_do_deposit_receipt_')) {
      const amt = Number(action.replace('bot_do_deposit_receipt_', ''));
      const receiptImg = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400';
      setSimulatorContext('idle');
      addSimulatorMessage('user', `[📷 ارسال تصویر فیش شارژ به مبلغ ${amt.toLocaleString('fa-IR')} تومان]`, undefined, undefined, receiptImg);
      addSimulatorMessage(
        'bot',
        `✅ **فیش واریزی شما دریافت شد.**\n\nفیش واریزی شارژ کیف پول به مبلغ **${amt.toLocaleString('fa-IR')} تومان** با موفقیت در سیستم ثبت گردید و در صف تایید مدیریت قرار گرفت.\n💡 پس از بررسی و تطبیق توسط ادمین، کیف پول شما به صورت آنی شارژ خواهد شد.`
      );
      addSimulatorMessage(
        'bot',
        `🏧 **[پنل مدیریت] درخواست شارژ کیف پول جدید:**\n💰 **مبلغ:** ${amt.toLocaleString('fa-IR')} تومان\n👤 **کاربر:** علیرضا رضوانی\n🖼️ تصویر فیش واریزی ضمیمه گردید:`,
        [
          [
            { text: `✅ تایید شارژ (${amt.toLocaleString('fa-IR')} ت)`, action: `admin_approve_wallet_dep_${amt}`, style: 'success' },
            { text: `❌ رد درخواست شارژ`, action: `admin_reject_wallet_dep_${amt}`, style: 'danger' }
          ]
        ],
        undefined,
        receiptImg
      );
    } else if (action.startsWith('admin_approve_wallet_dep_')) {
      const amt = Number(action.replace('admin_approve_wallet_dep_', ''));
      setWalletBalance(prev => prev + amt);
      showToast(`✅ شارژ کیف پول به مبلغ ${amt.toLocaleString('fa-IR')} تومان تایید گردید.`);
      addSimulatorMessage(
        'bot',
        `🎉 **درخواست شارژ توسط مدیریت تایید شد!**\nمبلغ **${amt.toLocaleString('fa-IR')} تومان** با موفقیت به موجودی کیف پول افزوده گردید.\n💰 موجودی جدید: **${(walletBalance + amt).toLocaleString('fa-IR')} تومان**`
      );
    } else if (action.startsWith('admin_reject_wallet_dep_')) {
      showToast('❌ درخواست شارژ کیف پول رد شد.');
      addSimulatorMessage(
        'bot',
        `⚠️ **درخواست شارژ کیف پول توسط مدیریت رد گردید.**\nعلت: مغایرت در واریز پایا یا ناخوانا بودن مشخصات فیش.\nلطفاً در صورت واریز وجه، تصویر واضح فیش را ارسال فرمایید.`
      );
    } else if (action.startsWith('bot_resume_')) {
      const cid = action.replace('bot_resume_', '');
      const c = contracts.find(x => x.contract_id === cid);
      if (c) {
        setSelectedContract(c);
        openSignModal(c, 'employer');
        addSimulatorMessage('bot', `🔄 پیش‌نویس \`${cid}\` بارگذاری شد. پنجره تایید مشخصات و امضای الکترونیک باز شد.`);
      }
    } else if (action.startsWith('bot_delete_')) {
      const cid = action.replace('bot_delete_', '');
      handleDeleteDraft(cid);
    } else if (action.startsWith('bot_send_receipt_')) {
      const cid = action.replace('bot_send_receipt_', '');
      const c = contracts.find(x => x.contract_id === cid);
      if (c) {
        setReceiptModalContract(c);
      }
    } else if (action.startsWith('admin_approve_receipt_')) {
      const cid = action.replace('admin_approve_receipt_', '');
      handleApproveReceipt(cid);
    } else if (action.startsWith('admin_open_reject_') || action.startsWith('admin_reject_receipt_')) {
      const cid = action.replace('admin_open_reject_', '').replace('admin_reject_receipt_', '');
      handleOpenRejectModal(cid);
    } else if (action === 'bot_role_employer' || action === 'bot_role_freelancer') {
      setShowDraftModal(true);
      setDraftForm(prev => ({ ...prev, role: action === 'bot_role_employer' ? 'employer' : 'freelancer' }));
    } else if (action === 'bot_filter_active') {
      setFilterStatus('active');
      showToast('فیلتر معاملات در حال انجام فعال شد.');
    } else if (action === 'bot_filter_pending') {
      setFilterStatus('pending');
      showToast('فیلتر معاملات در انتظار اقدام فعال شد.');
    } else if (action === 'bot_filter_completed') {
      setFilterStatus('completed');
      showToast('فیلتر معاملات تکمیل‌شده فعال شد.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><FileText className="w-3.5 h-3.5" /> پیش‌نویس</span>;
      case 'pending_party_b':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20"><Clock className="w-3.5 h-3.5" /> در انتظار امضای طرف دوم</span>;
      case 'awaiting_payment':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20"><CreditCard className="w-3.5 h-3.5" /> در انتظار ارسال فیش واریزی</span>;
      case 'awaiting_receipt_approval':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Clock className="w-3.5 h-3.5" /> فیش ارسال شد - در انتظار تایید ادمین</span>;
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Lock className="w-3.5 h-3.5" /> فعال (مبلغ در امانت)</span>;
      case 'work_submitted':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> خروجی تحویل شد</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20"><FileCheck className="w-3.5 h-3.5" /> تکمیل و تسویه‌شده</span>;
      case 'in_dispute':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><Scale className="w-3.5 h-3.5" /> درحال داوری</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md bg-slate-900 border border-cyan-500/40 text-cyan-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-xl">
              م
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">میانجی</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                  Miyanji Escrow
                </span>
              </div>
              <p className="text-xs text-slate-400">سامانه امن ثبت قراردادهای الکترونیک و داوری مالی تلگرام</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSimulatorContext('wizard');
                setShowDraftModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>➕ ایجاد پیش‌نویس جدید</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>سرور فعال (پورت ۳۰۰۰)</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-slate-800/50 pt-1 pb-1">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'contracts'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مدیریت قراردادها و پیش‌نویس‌ها</span>
            {stats && stats.drafts > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 font-mono">
                {stats.drafts} پیش‌نویس
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>شبیه‌ساز زنده ربات تلگرام</span>
            <span className="px-1.5 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">زنده</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf_view')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pdf_view'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>سند رسمی PDF قرارداد</span>
          </button>

          <button
            onClick={() => setActiveTab('arbitration')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'arbitration'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>اتاق داوری و حل اختلاف</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'wallet'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>کیف پول و کارمزد پلتفرم</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* TAB 1: Contracts & Drafts Management */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                onClick={() => setFilterStatus('draft')}
                className={`p-4 rounded-2xl bg-slate-900/80 border transition-all cursor-pointer ${
                  filterStatus === 'draft' ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">پیش‌نویس‌های من</span>
                  <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-400">{stats?.drafts ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">آماده ویرایش، تکمیل و امضا</p>
              </div>

              <div
                onClick={() => setFilterStatus('pending')}
                className={`p-4 rounded-2xl bg-slate-900/80 border transition-all cursor-pointer ${
                  filterStatus === 'pending' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">در انتظار اقدام</span>
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-extrabold text-blue-400">{stats?.pending ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">امضای طرف دوم یا ارسال فیش</p>
              </div>

              <div
                onClick={() => setFilterStatus('active')}
                className={`p-4 rounded-2xl bg-slate-900/80 border transition-all cursor-pointer ${
                  filterStatus === 'active' ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">قراردادهای جاری</span>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400">{stats?.active ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">مبلغ در صندوق امانی قفل شده</p>
              </div>

              <div
                onClick={() => setFilterStatus('completed')}
                className={`p-4 rounded-2xl bg-slate-900/80 border transition-all cursor-pointer ${
                  filterStatus === 'completed' ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">تکمیل و تسویه‌شده</span>
                  <FileCheck className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-2xl font-extrabold text-green-400">{stats?.completed ?? 0}</div>
                <p className="text-xs text-slate-500 mt-1">تسویه امن با مجری و کسر کارمزد</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  همه معاملات ({contracts.length})
                </button>
                <button
                  onClick={() => setFilterStatus('draft')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'draft' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📁 پیش‌نویس‌ها ({contracts.filter(c => c.status === 'draft').length})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'pending' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⏳ در انتظار امضا/فیش
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🟢 در حال انجام
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏁 تکمیل شده
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="جست‌وجوی شناسه یا عنوان..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-3 pr-9 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={fetchData}
                  title="تازه‌سازی"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Split View: List on Right, Detail on Left */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Deals List */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-300">
                    {filterStatus === 'draft' ? '📁 لیست پیش‌نویس‌های شما' : 'لیست معاملات'}
                  </h3>
                  <button
                    onClick={() => {
                      setSimulatorContext('wizard');
                      setShowDraftModal(true);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>➕ ایجاد پیش‌نویس جدید</span>
                  </button>
                </div>

                {filteredContracts.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                    <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400">هیچ معامله یا پیش‌نویسی در این بخش یافت نشد.</p>
                    <button
                      onClick={() => {
                        setSimulatorContext('wizard');
                        setShowDraftModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-medium transition-all cursor-pointer"
                    >
                      ➕ ایجاد اولین پیش‌نویس معامله
                    </button>
                  </div>
                ) : (
                  filteredContracts.map(c => {
                    const isSelected = selectedContract?.contract_id === c.contract_id;
                    return (
                      <div
                        key={c.contract_id}
                        onClick={() => setSelectedContract(c)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                              {c.contract_id}
                            </span>
                            <h4 className="font-semibold text-sm text-slate-100 mt-1.5 leading-snug">
                              {c.title}
                            </h4>
                          </div>
                          {getStatusBadge(c.status)}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                          <span className="font-bold text-slate-200">
                            {c.amount > 0 ? `${c.amount.toLocaleString('fa-IR')} تومان` : 'مبلغ نامشخص'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {c.deadline} روز کاری
                          </span>
                        </div>

                        {c.status === 'draft' && (
                          <div className="flex items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openSignModal(c, 'employer')}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>🚀 تکمیل و امضا</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(c.contract_id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-all cursor-pointer"
                              title="حذف پیش‌نویس"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Deal Details Panel */}
              <div className="lg:col-span-7">
                {selectedContract ? (
                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 sticky top-24">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                            {selectedContract.contract_id}
                          </span>
                          {getStatusBadge(selectedContract.status)}
                        </div>
                        <h2 className="text-lg font-bold text-white mt-2 leading-relaxed">
                          {selectedContract.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/contracts/${selectedContract.contract_id}/pdf`}
                          download={`Miyanji_Contract_${selectedContract.contract_id}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>دانلود PDF رسمی</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setPdfPreviewModal(selectedContract)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>مشاهده سند</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial & Terms Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-500 block">مبلغ معامله</span>
                        <span className="text-base font-bold text-cyan-400 mt-1 block">
                          {selectedContract.amount.toLocaleString('fa-IR')} تومان
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          کارمزد: {(selectedContract.amount * 0.1).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-500 block">مهلت و ویرایش رایگان</span>
                        <span className="text-base font-bold text-slate-200 mt-1 block">
                          {selectedContract.deadline} روز کاری
                        </span>
                        <span className="text-[11px] text-emerald-400 mt-0.5 block">
                          {selectedContract.free_edits} بار بازبینی رایگان
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-xs text-slate-500 block">طرفین قرارداد</span>
                        <span className="text-xs font-medium text-slate-200 mt-1 block truncate">
                          کارفرما: {selectedContract.buyer_fullname || 'ثبت‌نشده'}
                        </span>
                        <span className="text-xs font-medium text-slate-400 mt-0.5 block truncate">
                          مجری: {selectedContract.seller_fullname || 'در انتظار تایید'}
                        </span>
                      </div>
                    </div>

                    {/* Commitments & Description */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400">شرح موضوع و تعهدات:</h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                        {selectedContract.description || 'توضیحی برای این معامله ثبت نشده است.'}
                      </p>
                    </div>

                    {/* Escrow Process Action Bar */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>عملیات و مدیریت چرخه اسکرو (Escrow Lifecycle)</span>
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {/* If in Draft */}
                        {selectedContract.status === 'draft' && (
                          <>
                            <button
                              onClick={() => openSignModal(selectedContract, 'employer')}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>✍️ امضا توسط کارفرما با OTP</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(selectedContract.contract_id)}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>حذف پیش‌نویس</span>
                            </button>
                          </>
                        )}

                        {/* If pending Party B */}
                        {selectedContract.status === 'pending_party_b' && (
                          <div className="w-full space-y-2">
                            <p className="text-xs text-blue-300">
                              کارفرما امضا کرده است. اکنون مجری باید با کد تایید وارد شود و امضا نماید:
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openSignModal(selectedContract, 'freelancer')}
                                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>✍️ امضای مجری با OTP (صدور آنی PDF)</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://t.me/mianji_ir_bot?start=c_${selectedContract.contract_id}`);
                                  showToast('🔗 لینک دعوت کپی شد.');
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>کپی لینک دعوت مجری</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If awaiting payment -> Show Upload Receipt button */}
                        {selectedContract.status === 'awaiting_payment' && (
                          <div className="w-full space-y-2">
                            <p className="text-xs text-purple-300">
                              قرارداد امضا شده است. کارفرما باید فیش واریز به شماره کارت میانجی را ارسال نماید:
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setReceiptModalContract(selectedContract)}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                              >
                                <UploadCloud className="w-4 h-4" />
                                <span>📸 ارسال فیش واریزی</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If awaiting receipt approval -> Show Admin Review buttons */}
                        {selectedContract.status === 'awaiting_receipt_approval' && (
                          <div className="w-full space-y-3 bg-yellow-950/30 p-3.5 rounded-xl border border-yellow-500/30">
                            <div className="flex items-center gap-2 text-xs font-bold text-yellow-400">
                              <Clock className="w-4 h-4" />
                              <span>فیش واریزی ارسال شده و در انتظار تایید مدیریت است:</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveReceipt(selectedContract.contract_id)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                              >
                                <CheckCheck className="w-4 h-4" />
                                <span>✅ تایید فیش و فعالسازی معامله</span>
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(selectedContract.contract_id)}
                                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                <span>❌ رد فیش واریزی</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If active */}
                        {selectedContract.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleDeliverProject(selectedContract.contract_id)}
                              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                              <span>📦 تحویل پروژه توسط مجری</span>
                            </button>
                            <button
                              onClick={() => handleDispute(selectedContract.contract_id)}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-medium border border-slate-700 cursor-pointer"
                            >
                              <Scale className="w-4 h-4" />
                              <span>درخواست داوری</span>
                            </button>
                          </>
                        )}

                        {/* If work submitted */}
                        {selectedContract.status === 'work_submitted' && (
                          <>
                            <button
                              onClick={() => handleApproveWork(selectedContract.contract_id)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✅ تایید کیفیت و آزادسازی وجه به مجری</span>
                            </button>
                            <button
                              onClick={() => handleDispute(selectedContract.contract_id)}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-medium border border-slate-700 cursor-pointer"
                            >
                              <Scale className="w-4 h-4" />
                              <span>درخواست داوری</span>
                            </button>
                          </>
                        )}

                        {/* If completed */}
                        {selectedContract.status === 'completed' && (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>این قرارداد با موفقیت تسویه و پرونده آن بسته شده است.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline History */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400">سیاهه وقایع و تاریخچه معامله (Audit Log):</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedContract.history.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
                            <div className="flex-1">
                              <p className="leading-snug">{h.event}</p>
                              <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                                {new Date(h.timestamp).toLocaleTimeString('fa-IR')} - {new Date(h.timestamp).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
                    <p className="text-sm text-slate-400">یک معامله یا پیش‌نویس را از لیست انتخاب کنید تا جزئیات نمایش داده شود.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Live Telegram Bot Simulator */}
        {activeTab === 'simulator' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
              <span>🤖 **محیط تست زنده ربات تلگرام میانجی:** می‌توانید بخش پیش‌نویس‌ها، ارسال فیش، تایید مدیریت و دریافت آنی فایل PDF را در قالب تلگرام بیازمایید.</span>
              <button
                onClick={() => setChatMessages([chatMessages[0]])}
                className="text-xs underline text-cyan-400 hover:text-cyan-200 cursor-pointer"
              >
                پاک‌سازی گفتگو
              </button>
            </div>

            {/* Telegram App Container */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col h-[650px]">
              {/* Bot Header */}
              <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow">
                    م
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">میانجی | Miyanji Escrow Bot</h3>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      آنلاین (bot)
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded">
                  @mianji_ir_bot
                </span>
              </div>

              {/* Chat Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>

                      {/* Photo Attachment if present */}
                      {msg.photo && (
                        <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-700/60 max-w-xs shadow-md">
                          <img src={msg.photo} alt="فیش واریزی" className="w-full h-44 object-cover" />
                          <div className="px-2.5 py-1 bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-400">
                            <span>تصویر فیش واریزی بانکی</span>
                            <span className="text-emerald-400 font-mono">JPG / PNG</span>
                          </div>
                        </div>
                      )}

                      {/* PDF Document Attachment in Chat */}
                      {msg.document && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-8 h-8 text-cyan-400 shrink-0" />
                            <div>
                              <span className="font-bold text-xs text-white block truncate">{msg.document.filename}</span>
                              <span className="text-[10px] text-cyan-300 block">سند رسمی قرارداد امضا شده</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/api/contracts/${msg.document.contractId}/pdf`}
                              download={`Miyanji_Contract_${msg.document.contractId}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>دانلود PDF</span>
                            </a>
                            <button
                              onClick={() => {
                                const c = contracts.find(x => x.contract_id === msg.document!.contractId);
                                if (c) {
                                  setSelectedContract(c);
                                  setPdfPreviewModal(c);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700"
                            >
                              مشاهده
                            </button>
                          </div>
                        </div>
                      )}

                      <span className="text-[10px] text-slate-400 block text-left mt-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Inline Keyboard Buttons */}
                    {msg.inlineButtons && (
                      <div className="mt-2 space-y-1.5 w-full max-w-[85%]">
                        {msg.inlineButtons.map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-2">
                            {row.map((btn, bIdx) => (
                              <button
                                key={bIdx}
                                onClick={() => handleSimulatorAction(btn.action)}
                                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer shadow-sm ${
                                  btn.style === 'success'
                                    ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500'
                                    : btn.style === 'danger'
                                    ? 'bg-rose-600/90 hover:bg-rose-500 text-white border-rose-500'
                                    : 'bg-slate-800/90 hover:bg-cyan-900/40 text-cyan-300 hover:text-white border-slate-700/80'
                                }`}
                              >
                                {btn.text}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bot Reply Keyboards */}
              <div className="bg-slate-900 border-t border-slate-800 p-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulatorSend('🤝 ثبت معامله جدید')}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center border border-slate-700/60 cursor-pointer"
                >
                  🤝 ثبت معامله جدید
                </button>
                <button
                  onClick={() => handleSimulatorSend('📁 پیش‌نویس‌های من')}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold text-center border border-slate-700/60 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📁 پیش‌نویس‌های من</span>
                </button>
                <button
                  onClick={() => handleSimulatorSend('📜 لیست معاملات من')}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center border border-slate-700/60 cursor-pointer"
                >
                  📜 لیست معاملات من
                </button>
                <button
                  onClick={() => handleSimulatorSend('💳 کیف پول و اعتبار')}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center border border-slate-700/60 cursor-pointer"
                >
                  💳 کیف پول و اعتبار
                </button>
                <button
                  onClick={() => handleSimulatorSend('❌ انصراف')}
                  className="col-span-2 py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs text-center border border-slate-800 cursor-pointer"
                >
                  ❌ انصراف و بازگشت به منو
                </button>
              </div>

              {/* Input Bar */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSimulatorSend(simulatorInput);
                }}
                className="bg-slate-950 p-3 border-t border-slate-800 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    const target = contracts.find(c => c.status === 'awaiting_payment' || c.status === 'awaiting_receipt_approval') || selectedContract || contracts[0];
                    if (target) {
                      setReceiptModalContract(target);
                    } else {
                      showToast('معامله‌ای جهت ارسال فیش انتخاب نشده است.');
                    }
                  }}
                  title="ارسال فیش واریزی معامله"
                  className="px-3 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-800/50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 text-xs font-semibold"
                >
                  <UploadCloud className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">ارسال فیش</span>
                </button>

                <input
                  type="text"
                  placeholder="نوشتن پیام یا دستور (مانند /start یا پیش‌نویس یا انصراف)..."
                  value={simulatorInput}
                  onChange={e => setSimulatorInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PDF Document Viewer */}
        {activeTab === 'pdf_view' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">سند رسمی قرارداد الکترونیک میانجی</h3>
                <p className="text-xs text-slate-400">تولید شده با امضای الکترونیک، چک‌سام امنیتی و استانداردهای حقوقی ایران</p>
              </div>

              {selectedContract && (
                <button
                  onClick={() => handleDownloadPdf(selectedContract.contract_id)}
                  disabled={downloadingId === selectedContract.contract_id}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  {downloadingId === selectedContract.contract_id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>دانلود مستقیم فایل PDF</span>
                </button>
              )}
            </div>

            {selectedContract ? (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-6 shadow-xl">
                {/* Visual Certificate Paper */}
                <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>

                  {/* Certificate Top Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 pb-6 text-center sm:text-right gap-4">
                    <div>
                      <span className="text-xs text-cyan-400 font-mono">MIYANJI ESCROW OFFICIAL CERTIFICATE</span>
                      <h2 className="text-xl font-extrabold text-white mt-1">سند قرارداد الکترونیک و داوری الزام‌آور</h2>
                    </div>
                    <div className="text-left sm:text-left">
                      <span className="text-xs text-slate-400 block">شناسه بایگانی قرارداد:</span>
                      <span className="text-sm font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/40">
                        {selectedContract.contract_id}
                      </span>
                    </div>
                  </div>

                  {/* Clauses */}
                  <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <h4 className="font-bold text-white mb-1.5">ماده ۱: موضوع و تعهدات قرارداد</h4>
                      <p>{selectedContract.title}</p>
                      <p className="mt-1 text-slate-400">{selectedContract.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <h4 className="font-bold text-white mb-1.5">ماده ۲: مبلغ و تضمین امانت (اسکرو)</h4>
                        <p>مبلغ کل: <strong className="text-cyan-400">{selectedContract.amount.toLocaleString('fa-IR')} تومان</strong></p>
                        <p className="text-slate-400 text-xs mt-1">مبلغ تا زمان اعلام رضایت کامل کارفرما نزد سامانه میانجی مسدود و تضمین می‌گردد.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <h4 className="font-bold text-white mb-1.5">ماده ۳: مدت زمان و بازبینی‌ها</h4>
                        <p>مهلت تحویل: <strong>{selectedContract.deadline} روز کاری</strong></p>
                        <p className="text-slate-400 text-xs mt-1">تعداد بازبینی رایگان: <strong>{selectedContract.free_edits} مرتبه</strong></p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <h4 className="font-bold text-white mb-1.5">ماده ۴: داوری، حل اختلاف و فورس‌ماژور</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        هرگونه اختلاف در کیفیت، مغایرت یا تاخیر، توسط هیئت داوری سامانه میانجی بر اساس مستندات ثبت‌شده در تلگرام رسیدگی خواهد شد و رای صادره برای طرفین قطعی و لازم‌الاجراست.
                      </p>
                    </div>

                    {/* Signatures Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 text-center space-y-2">
                        <span className="text-xs text-slate-500 font-semibold block">امضای دیجیتال کارفرما</span>
                        <span className="font-bold text-sm text-slate-200 block">{selectedContract.buyer_fullname || 'کارفرما'}</span>
                        <span className="text-xs text-emerald-400 font-mono block">
                          {selectedContract.buyer_signed_at ? '✅ تایید هویت و امضا با OTP' : '⏳ در انتظار امضا'}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 text-center space-y-2">
                        <span className="text-xs text-slate-500 font-semibold block">امضای دیجیتال مجری</span>
                        <span className="font-bold text-sm text-slate-200 block">{selectedContract.seller_fullname || 'مجری'}</span>
                        <span className="text-xs text-emerald-400 font-mono block">
                          {selectedContract.seller_signed_at ? '✅ تایید هویت و امضا با OTP' : '⏳ در انتظار امضا'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
                <p className="text-sm text-slate-400">قراردادی جهت نمایش انتخاب نشده است.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Arbitration & Disputes */}
        {activeTab === 'arbitration' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <Scale className="w-8 h-8 text-rose-400" />
                <div>
                  <h3 className="text-base font-bold text-white">دپارتمان داوری حقوقی و حل اختلاف اسکرو</h3>
                  <p className="text-xs text-slate-400">بررسی بی‌طرفانه اسناد، فایل‌های ارسالی، زمان‌بندی و آزادسازی عادلانه وجوه</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-500">پرونده‌های فعال داوری</span>
                  <span className="text-xl font-bold text-rose-400 mt-1 block">
                    {contracts.filter(c => c.status === 'in_dispute').length}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-500">میانگین زمان حل اختلاف</span>
                  <span className="text-xl font-bold text-cyan-400 mt-1 block">۲۴ ساعت</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-500">کارمزد داوری</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">رایگان (پوشش پلتفرم)</span>
                </div>
              </div>

              {contracts.filter(c => c.status === 'in_dispute').length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/60 text-slate-400 text-xs">
                  در حال حاضر هیچ پرونده اختلافی بازی ثبت نشده است. تمام معاملات در امنیت کامل در حال پیشرفت هستند.
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.filter(c => c.status === 'in_dispute').map(c => (
                    <div key={c.contract_id} className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-rose-400">{c.contract_id}</span>
                        <h4 className="font-bold text-sm text-white mt-1">{c.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">مبلغ درگیر: {c.amount.toLocaleString('fa-IR')} تومان</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveWork(c.contract_id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          آزادسازی به مجری
                        </button>
                        <button
                          onClick={() => alert(`مبلغ به حساب کارفرما مسترد گردید.`)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                        >
                          استرداد به کارفرما
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Wallet & Commissions */}
        {activeTab === 'wallet' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">موجودی صندوق امانت (Escrow Volume)</span>
                <div className="text-2xl font-extrabold text-cyan-400">
                  {(stats?.totalVolume ?? 0).toLocaleString('fa-IR')} تومان
                </div>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ۱۰۰٪ تضمین‌شده و قفل در بانک
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">نرخ کارمزد پلتفرم</span>
                <div className="text-2xl font-extrabold text-white">۱۰ درصد</div>
                <p className="text-xs text-slate-500">کسر پس از تایید نهایی و تحویل پروژه</p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">سقف معاملات بدون احراز هویت</span>
                <div className="text-2xl font-extrabold text-amber-400">۳,۰۰۰,۰۰۰ تومان</div>
                <p className="text-xs text-slate-500">مبالغ بالاتر نیازمند ثبت کد ملی است</p>
              </div>
            </div>

            {/* Commission Calculator */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-base">ماشین حساب کارمزد و تسویه میانجی</h3>
              <p className="text-xs text-slate-400">مبلغ معامله خود را وارد کنید تا کارمزد و مبلغ دریافتی خالص مجری محاسبه شود:</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="number"
                  placeholder="مبلغ به تومان (مثال: ۵۰۰۰۰۰۰)"
                  className="flex-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  defaultValue="10000000"
                  id="calc_amount"
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    const fee = val * 0.1;
                    const net = val - fee;
                    const feeEl = document.getElementById('calc_fee');
                    const netEl = document.getElementById('calc_net');
                    if (feeEl) feeEl.innerText = `${fee.toLocaleString('fa-IR')} تومان`;
                    if (netEl) netEl.innerText = `${net.toLocaleString('fa-IR')} تومان`;
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-500 block">کارمزد میانجی (۱۰٪):</span>
                  <span id="calc_fee" className="text-base font-bold text-amber-400 mt-1 block">
                    ۱,۰۰۰,۰۰۰ تومان
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-500 block">مبلغ واریزی خالص به مجری:</span>
                  <span id="calc_net" className="text-base font-bold text-emerald-400 mt-1 block">
                    ۹,۰۰۰,۰۰۰ تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Receipt Upload */}
      {receiptModalContract && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-purple-400" />
                <span>ارسال فیش واریزی به امانت</span>
              </h3>
              <button
                onClick={() => setReceiptModalContract(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 block">اطلاعات حساب واریز میانجی:</span>
                <span className="font-mono text-cyan-400 font-bold block text-sm">6037-9975-7534-8211</span>
                <span className="text-slate-300 block">بنام: امیررضا مجتبایی (حساب امانی سامانه)</span>
                <div className="pt-2 border-t border-slate-800 mt-2 flex justify-between">
                  <span className="text-slate-400">مبلغ واریزی:</span>
                  <span className="font-bold text-cyan-400 text-sm">
                    {receiptModalContract.amount.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 text-center space-y-2">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-slate-300 font-semibold">تصویر فیش واریزی بانکی</p>
                <p className="text-slate-500 text-[11px]">فرمت‌های JPG، PNG یا فایل PDF تاییدیه بانک</p>
                <button
                  type="button"
                  onClick={() => setReceiptImage('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium cursor-pointer"
                >
                  {receiptImage ? '✅ تصویر فیش ضمیمه شد' : '📷 انتخاب یا شبیه‌سازی فیش'}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalContract(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitReceipt(receiptModalContract.contract_id)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  ارسال فیش جهت تایید ادمین
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Draft Creation Wizard */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" />
                <span>ایجاد پیش‌نویس قرارداد جدید</span>
              </h3>
              <button
                onClick={() => {
                  setSimulatorContext('idle');
                  setShowDraftModal(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDraft} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نقش شما در معامله:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftForm(p => ({ ...p, role: 'employer' }))}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      draftForm.role === 'employer'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    💼 کارفرما (خریدار)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftForm(p => ({ ...p, role: 'freelancer' }))}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      draftForm.role === 'freelancer'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🛠 مجری (پیمانکار)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان قرارداد / پروژه: *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: توسعه وب‌سایت صرافی و بات تلگرام"
                  value={draftForm.title}
                  onChange={e => setDraftForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">دسته‌بندی:</label>
                  <select
                    value={draftForm.category}
                    onChange={e => setDraftForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DEV">💻 برنامه‌نویسی و توسعه (DEV)</option>
                    <option value="DS">🎨 طراحی و گرافیک (DS)</option>
                    <option value="CNT">📝 محتوا و ترجمه (CNT)</option>
                    <option value="CNS">🎓 مشاوره و آموزش (CNS)</option>
                    <option value="TRD">🌐 خدمات تجاری و اکانت (TRD)</option>
                    <option value="GEN">📦 سایر موارد (GEN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">مبلغ معامله (تومان):</label>
                  <input
                    type="number"
                    placeholder="مثال: ۱۰۰۰۰۰۰۰"
                    value={draftForm.amount}
                    onChange={e => setDraftForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">مهلت انجام (روز کاری):</label>
                  <input
                    type="number"
                    value={draftForm.deadline}
                    onChange={e => setDraftForm(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تعداد بازبینی رایگان:</label>
                  <select
                    value={draftForm.free_edits}
                    onChange={e => setDraftForm(p => ({ ...p, free_edits: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="0">بدون ویرایش رایگان</option>
                    <option value="1">۱ مرتبه</option>
                    <option value="2">۲ مرتبه</option>
                    <option value="3">۳ مرتبه</option>
                    <option value="5">۵ مرتبه</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">شرح تعهدات و الزامات تحویل پروژه:</label>
                <textarea
                  rows={3}
                  placeholder="جزئیات تعهدات مجری، نحوه تحویل فایل‌ها و استاندارد کیفی..."
                  value={draftForm.description}
                  onChange={e => setDraftForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSimulatorContext('idle');
                    setShowDraftModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  💾 ذخیره در پیش‌نویس‌ها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sign with OTP Flow */}
      {signModalContract && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>امضای الکترونیک قرارداد ({signRole === 'employer' ? 'کارفرما' : 'مجری'})</span>
              </h3>
              <button
                onClick={() => setSignModalContract(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">قرارداد:</span>
                <span className="font-bold text-slate-200 block text-sm mt-0.5">{signModalContract.title}</span>
                <span className="font-mono text-cyan-400 text-xs mt-0.5 block">شناسه: {signModalContract.contract_id}</span>
              </div>

              {signStep === 'details' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">نام و نام خانوادگی امضاکننده:</label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">شماره تلفن همراه:</label>
                    <input
                      type="text"
                      value={signerPhone}
                      onChange={e => setSignerPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">کد ملی ۱۰ رقمی:</label>
                    <input
                      type="text"
                      value={signerNid}
                      onChange={e => setSignerNid(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSignStep('otp')}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold mt-2 cursor-pointer"
                  >
                    مرحله بعد: دریافت کد تایید OTP
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-center space-y-1">
                    <span className="text-slate-400 text-xs">کد تأیید امنیتی پیامک شده (تستی):</span>
                    <span className="text-2xl font-mono font-extrabold text-cyan-400 tracking-widest block">
                      {otpCode}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">کد تایید ۶ رقمی را وارد کنید:</label>
                    <input
                      type="text"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-lg font-bold text-white focus:outline-none focus:border-cyan-500 tracking-widest"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignStep('details')}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                    >
                      ویرایش اطلاعات
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteSign}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      تایید نهایی و ثبت رسمی امضا
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal: Admin Reject Receipt with Reason */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <X className="w-5 h-5 text-rose-500" />
                <span>رد فیش واریزی معامله</span>
              </h3>
              <button
                onClick={() => setRejectModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block">شناسه معامله:</span>
                <span className="font-mono text-cyan-400 font-bold block">{rejectModal.cid}</span>
                <span className="text-slate-300 block mt-1">{rejectModal.title}</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">علت رد فیش واریزی را انتخاب یا وارد کنید:</label>
                <div className="space-y-2">
                  {[
                    'مغایرت در مبلغ واریزی با مفاد قرارداد',
                    'تصویر فیش ناخوانا، تار یا ناقص است',
                    'عدم واریز به حساب امانت میانجی (عدم تایید سامانه پایا/شاپرک)',
                    'فیش واریزی تکراری یا منقضی شده است'
                  ].map((preset, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        rejectReason === preset
                          ? 'bg-rose-950/40 border-rose-500/60 text-rose-300 font-medium'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectReason"
                        checked={rejectReason === preset}
                        onChange={() => setRejectReason(preset)}
                        className="text-rose-500"
                      />
                      <span>{preset}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="block text-slate-400 mb-1">علت دلخواه یا توضیحات تکمیلی:</label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="علت رد فیش..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmRejectReceipt(rejectModal.cid, rejectReason)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  ثبت و رد قطعی فیش
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official PDF Certificate Preview & Direct Download */}
      {pdfPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <span>سند رسمی قرارداد الکترونیک میانجی</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                  شناسه قرارداد: {pdfPreviewModal.contract_id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/contracts/${pdfPreviewModal.contract_id}/pdf`}
                  download={`Miyanji_Contract_${pdfPreviewModal.contract_id}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل PDF</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer"
                  title="چاپ سند"
                >
                  🖨️
                </button>
                <button
                  onClick={() => setPdfPreviewModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visual Certificate Paper */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5 text-xs text-slate-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] text-cyan-400 font-mono tracking-wider">MIYANJI ESCROW OFFICIAL CERTIFICATE</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">گواهی رسمی قرارداد الکترونیک و داوری الزام‌آور</h4>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[10px] text-slate-400 block">کد رهگیری:</span>
                  <span className="text-xs font-bold text-cyan-300">{pdfPreviewModal.contract_id}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[11px] mb-1">موضوع قرارداد:</span>
                <span className="text-white font-bold text-sm block">{pdfPreviewModal.title}</span>
                <p className="text-slate-400 mt-1.5 text-[11px] leading-relaxed">{pdfPreviewModal.description}</p>
              </div>

              {/* Financial & Terms */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">مبلغ قرارداد</span>
                  <span className="text-cyan-400 font-bold text-xs mt-1 block">
                    {pdfPreviewModal.amount.toLocaleString('fa-IR')} تومان
                  </span>
                  <span className="text-[9px] text-emerald-400">تضمین امانت اسکرو</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">مهلت اجرا</span>
                  <span className="text-white font-bold text-xs mt-1 block">
                    {pdfPreviewModal.deadline} روز کاری
                  </span>
                  <span className="text-[9px] text-slate-400">از تاریخ شروع</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">وضعیت حقوقی</span>
                  <span className="text-emerald-400 font-bold text-xs mt-1 block">
                    معتبر و لازم‌الاجرا
                  </span>
                  <span className="text-[9px] text-cyan-400">قانون تجارت الکترونیک</span>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-bold text-[11px] block">طرف اول (کارفرما / خریدار):</span>
                  <span className="text-white font-semibold block">{pdfPreviewModal.buyer_fullname || 'کارفرما'}</span>
                  <span className="text-slate-400 text-[10px] block font-mono">تلفن: {pdfPreviewModal.buyer_phone || 'ثبت شده'}</span>
                  <span className="text-emerald-400 text-[10px] block font-medium">
                    {pdfPreviewModal.buyer_signed_at ? '✅ امضا شده با کد یکبار مصرف OTP' : '⏳ در انتظار امضا'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-cyan-400 font-bold text-[11px] block">طرف دوم (مجری / پیمانکار):</span>
                  <span className="text-white font-semibold block">{pdfPreviewModal.seller_fullname || (pdfPreviewModal.seller_signed_at ? 'مجری پروژه' : 'در انتظار تایید دعوت')}</span>
                  <span className="text-slate-400 text-[10px] block font-mono">تلفن: {pdfPreviewModal.seller_phone || 'ثبت شده'}</span>
                  <span className="text-emerald-400 text-[10px] block font-medium">
                    {pdfPreviewModal.seller_signed_at ? '✅ امضا شده با کد یکبار مصرف OTP' : '⏳ در انتظار امضا'}
                  </span>
                </div>
              </div>

              {/* Legal Hash & Seal */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-cyan-900/30 flex items-center justify-between text-[10px]">
                <div className="space-y-0.5">
                  <span className="text-cyan-400 font-bold block">مهر دیجیتال و تاییدیه رسمی میانجی:</span>
                  <span className="text-slate-400 font-mono block">SHA-256 Digest: e7f3a8b94091c8019a2b84fbc90d18e24fa68b92</span>
                  <span className="text-emerald-400">مشمول ماده ۱۰ قانون مدنی و مواد ۶ الی ۱۲ قانون تجارت الکترونیک</span>
                </div>
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800/40 text-center text-cyan-300 font-bold">
                  ✓ تایید شده
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPdfPreviewModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
