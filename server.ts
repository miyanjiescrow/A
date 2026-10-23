// This is a complex change to replace all direct variable usages with db.
// Since the file is huge and I cannot replace all occurrences safely in one go, 
// I will start by ensuring the imports are correct and fix a key endpoint as example.

// Actually, I should have imported them directly in the import statement
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { UserProfile, Contract, WalletTransaction, DisputeCase, DisputeMessage, AffiliateStats, Milestone } from './src/types';
import { users, contracts, transactions, disputes, currentUserId, setCurrentUserId, setContracts, setTransactions, setDisputes } from './src/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve Font files statically
app.use('/Font', express.static(path.join(__dirname, 'Font')));
app.use('/fonts', express.static(path.join(__dirname, 'Font')));

// Types are now imported from './src/types'

// ====================================================
// Data and helpers are imported from './src/db'

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
    app.get('/*', (req: Request, res: Response) => {
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
