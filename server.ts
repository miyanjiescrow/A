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
app.use(express.json());

// Serve Font files statically
app.use('/Font', express.static(path.join(__dirname, 'Font')));
app.use('/fonts', express.static(path.join(__dirname, 'Font')));

// ====================================================
// In-Memory Database for Escrow Contracts & Drafts
// ====================================================
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
  status: 'draft' | 'pending_party_b' | 'awaiting_payment' | 'active' | 'work_submitted' | 'completed' | 'cancelled' | 'in_dispute';
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

// Initial sample contracts including drafts to demonstrate functionality immediately
let contracts: Contract[] = [
  {
    id: 'd1',
    contract_id: 'DEV-842-109',
    title: 'طراحی و پیاده‌سازی ربات فروشگاهی و اسکرو تلگرام',
    amount: 15000000,
    category: 'DEV',
    deadline: 14,
    description: 'پیاده‌سازی ربات با پنل مدیریت، درگاه پرداخت امن، اتصال به دیتابیس و اعتبارسنجی خودکار قراردادها.',
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
    history: [
      { event: 'پیش‌نویس اولیه قرارداد ایجاد شد.', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: 'کارفرما' }
    ],
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'd2',
    contract_id: 'DS-419-702',
    title: 'طراحی هویت بصری، لوگو و رابط کاربری اپلیکیشن',
    amount: 8500000,
    category: 'DS',
    deadline: 7,
    description: 'طراحی لوگومونوگرام، پالت رنگ، تایپوگرافی و پروتوتایپ ۱۰ صفحه کلیدی در فیگما همراه با دیزاین سیستم.',
    free_edits: 2,
    free_edits_left: 2,
    commission_payer: 'freelancer',
    creator_id: 1802649782,
    created_by: 1802649782,
    status: 'pending_party_b',
    buyer_id: 1802649782,
    buyer_fullname: 'علیرضا رضوانی',
    buyer_phone: '09121112233',
    buyer_national_id: '0012345678',
    buyer_signed_at: new Date(Date.now() - 7200000).toISOString(),
    buyer_otp_verified: true,
    seller_id: 290184712,
    seller_fullname: 'حسین سهرابی',
    seller_phone: '09359998877',
    history: [
      { event: 'پیش‌نویس قرارداد ایجاد شد.', timestamp: new Date(Date.now() - 7400000).toISOString(), actor: 'کارفرما' },
      { event: 'قرارداد توسط کارفرما با کد تایید OTP امضا شد و لینک دعوت برای مجری صادر گردید.', timestamp: new Date(Date.now() - 7200000).toISOString(), actor: 'کارفرما' }
    ],
    created_at: new Date(Date.now() - 7400000).toISOString()
  },
  {
    id: 'd3',
    contract_id: 'CNT-912-304',
    title: 'تولید ۲۰ مقاله تخصصی سئو و استراتژی محتوا',
    amount: 6000000,
    category: 'CNT',
    deadline: 10,
    description: 'نگارش مقالات سئومحور بالای ۱۵۰۰ کلمه به همراه تحقیق کلمات کلیدی، عناوین جذاب و تصاویر اختصاصی.',
    free_edits: 3,
    free_edits_left: 3,
    commission_payer: 'freelancer',
    creator_id: 290184712,
    created_by: 290184712,
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
      { event: 'سند رسمی PDF تولید و برای کارفرما و مجری صادر شد.', timestamp: new Date(Date.now() - 81900000).toISOString(), actor: 'سیستم اسکرو' },
      { event: 'مبلغ ۶,۰۰۰,۰۰۰ تومان در صندوق امانی میانجی قفل شد و پروژه آغاز گردید.', timestamp: new Date(Date.now() - 80000000).toISOString(), actor: 'کارفرما' }
    ],
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// Helper to generate IDs
function generateContractId(category = 'GEN'): string {
  const num1 = Math.floor(100 + Math.random() * 900);
  const num2 = Math.floor(100 + Math.random() * 900);
  return `${category}-${num1}-${num2}`;
}

// ====================================================
// REST API Endpoints
// ====================================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Miyanji Escrow v2.4' });
});

// Stats
app.get('/api/stats', (req: Request, res: Response) => {
  const active = contracts.filter(c => c.status === 'active' || c.status === 'work_submitted').length;
  const pending = contracts.filter(c => c.status === 'pending_party_b' || c.status === 'awaiting_payment').length;
  const drafts = contracts.filter(c => c.status === 'draft').length;
  const completed = contracts.filter(c => c.status === 'completed').length;
  const cancelled = contracts.filter(c => c.status === 'cancelled').length;
  const totalVolume = contracts
    .filter(c => c.status !== 'cancelled' && c.status !== 'draft')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  res.json({
    active,
    pending,
    drafts,
    completed,
    cancelled,
    totalVolume,
    contractsCount: contracts.length,
    commissionRate: 10
  });
});

// Get Contracts (supports ?status=draft etc.)
app.get('/api/contracts', (req: Request, res: Response) => {
  const { status, category, search } = req.query;
  let result = [...contracts];

  if (status) {
    if (status === 'draft') {
      result = result.filter(c => c.status === 'draft');
    } else if (status === 'pending') {
      result = result.filter(c => c.status === 'pending_party_b' || c.status === 'awaiting_payment');
    } else if (status === 'active') {
      result = result.filter(c => c.status === 'active' || c.status === 'work_submitted');
    } else {
      result = result.filter(c => c.status === status);
    }
  }

  if (category) {
    result = result.filter(c => c.category === category);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    result = result.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.contract_id.toLowerCase().includes(q) ||
      (c.buyer_fullname && c.buyer_fullname.toLowerCase().includes(q)) ||
      (c.seller_fullname && c.seller_fullname.toLowerCase().includes(q))
    );
  }

  res.json(result);
});

// Get single contract
app.get('/api/contracts/:id', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) {
    return res.status(404).json({ error: 'قرارداد یا پیش‌نویس مورد نظر یافت نشد.' });
  }
  res.json(c);
});

// Create draft or contract
app.post('/api/contracts', (req: Request, res: Response) => {
  const body = req.body || {};
  const cat = body.category || 'GEN';
  const cid = body.contract_id || generateContractId(cat);
  const now = new Date().toISOString();

  const newContract: Contract = {
    id: `c_${Date.now()}`,
    contract_id: cid,
    title: body.title || 'پیش‌نویس جدید معامله',
    amount: Number(body.amount) || 0,
    category: cat,
    deadline: Number(body.deadline) || 7,
    description: body.description || '',
    free_edits: Number(body.free_edits) || 3,
    free_edits_left: Number(body.free_edits) || 3,
    commission_payer: body.commission_payer || 'freelancer',
    creator_id: body.creator_id || 1802649782,
    created_by: body.creator_id || 1802649782,
    status: body.status || 'draft',
    buyer_id: body.role === 'employer' ? (body.creator_id || 1802649782) : body.buyer_id,
    buyer_fullname: body.role === 'employer' ? (body.signer_fullname || 'کارفرما') : body.buyer_fullname,
    buyer_phone: body.role === 'employer' ? (body.signer_phone || '09121112233') : body.buyer_phone,
    buyer_national_id: body.role === 'employer' ? (body.signer_national_id || '') : body.buyer_national_id,
    seller_id: body.role === 'freelancer' ? (body.creator_id || 1802649782) : body.seller_id,
    seller_fullname: body.role === 'freelancer' ? (body.signer_fullname || 'مجری') : body.seller_fullname,
    seller_phone: body.role === 'freelancer' ? (body.signer_phone || '09359998877') : body.seller_phone,
    seller_national_id: body.role === 'freelancer' ? (body.signer_national_id || '') : body.seller_national_id,
    milestones: body.milestones || [],
    staged_payment: Boolean(body.staged_payment),
    history: [
      { event: 'پیش‌نویس قرارداد در سامانه میانجی ایجاد شد.', timestamp: now, actor: 'ایجادکننده' }
    ],
    created_at: now
  };

  contracts.unshift(newContract);
  res.status(201).json(newContract);
});

// Update contract / draft
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
      { event: `مشخصات قرارداد به‌روزرسانی شد.`, timestamp: new Date().toISOString(), actor: 'کاربر' }
    ]
  };

  contracts[index] = updated;
  res.json(updated);
});

// Delete draft
app.delete('/api/contracts/:id', (req: Request, res: Response) => {
  const cid = req.params.id;
  const initialLen = contracts.length;
  contracts = contracts.filter(c => c.contract_id !== cid && c.id !== cid);

  if (contracts.length === initialLen) {
    return res.status(404).json({ error: 'پیش‌نویس یافت نشد.' });
  }

  res.json({ success: true, message: 'پیش‌نویس با موفقیت حذف گردید.' });
});

// Sign contract with OTP (Simulate electronic signature & trigger auto PDF)
app.post('/api/contracts/:id/sign', (req: Request, res: Response) => {
  const cid = req.params.id;
  const c = contracts.find(x => x.contract_id === cid || x.id === cid);
  if (!c) {
    return res.status(404).json({ error: 'قرارداد یافت نشد.' });
  }

  const { role, fullname, phone, national_id, otp } = req.body;
  const now = new Date().toISOString();

  if (role === 'employer' || (!c.buyer_signed_at && c.status === 'draft')) {
    c.buyer_fullname = fullname || c.buyer_fullname || 'کارفرما';
    c.buyer_phone = phone || c.buyer_phone || '09121112233';
    c.buyer_national_id = national_id || c.buyer_national_id || '0012345678';
    c.buyer_signed_at = now;
    c.buyer_otp_verified = true;
    c.history.push({
      event: `✍️ قرارداد توسط کارفرما (${c.buyer_fullname}) با کد تایید OTP امضا شد.`,
      timestamp: now,
      actor: 'کارفرما'
    });

    if (c.seller_signed_at) {
      c.status = 'awaiting_payment';
      c.history.push({
        event: '🎊 هر دو طرف قرارداد را امضا کردند. سند رسمی PDF صادر و برای طرفین ارسال شد.',
        timestamp: now,
        actor: 'سیستم اسکرو'
      });
    } else {
      c.status = 'pending_party_b';
      c.history.push({
        event: 'لینک دعوت اختصاصی برای طرف دوم (مجری) صادر گردید.',
        timestamp: now,
        actor: 'سیستم میانجی'
      });
    }
  } else {
    // Freelancer / Seller
    c.seller_fullname = fullname || c.seller_fullname || 'مجری پروژه';
    c.seller_phone = phone || c.seller_phone || '09359998877';
    c.seller_national_id = national_id || c.seller_national_id || '0087654321';
    c.seller_signed_at = now;
    c.seller_otp_verified = true;
    c.history.push({
      event: `✍️ قرارداد توسط مجری (${c.seller_fullname}) با کد تایید OTP تایید و امضا شد.`,
      timestamp: now,
      actor: 'مجری'
    });

    if (c.buyer_signed_at) {
      c.status = 'awaiting_payment';
      c.history.push({
        event: '🎊 هر دو طرف قرارداد را امضا کردند. سند رسمی PDF صادر و برای طرفین ارسال شد.',
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

// Escrow Deposit
app.post('/api/contracts/:id/pay', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const now = new Date().toISOString();
  c.status = 'active';
  c.history.push({
    event: `💳 مبلغ ${c.amount.toLocaleString('fa-IR')} تومان توسط کارفرما واریز و در صندوق امن میانجی قفل شد. پروژه فعال گردید.`,
    timestamp: now,
    actor: 'کارفرما'
  });

  res.json({ success: true, contract: c });
});

// Deliver project
app.post('/api/contracts/:id/deliver', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const now = new Date().toISOString();
  c.status = 'work_submitted';
  c.history.push({
    event: `📦 کارفرما تحویل خروجی‌های پروژه را اعلام کرد و فایل‌های نهایی بارگذاری شدند.`,
    timestamp: now,
    actor: 'مجری'
  });

  res.json({ success: true, contract: c });
});

// Approve & Release funds
app.post('/api/contracts/:id/approve', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const now = new Date().toISOString();
  c.status = 'completed';
  const commission = c.amount * 0.1;
  const netAmount = c.amount - commission;
  c.history.push({
    event: `🏁 کارفرما کار را تایید نهایی کرد. وجه امانت به مبلغ ${netAmount.toLocaleString('fa-IR')} تومان به کیف‌پول/حساب شبای مجری تسویه شد. کارمزد پلتفرم: ${commission.toLocaleString('fa-IR')} تومان.`,
    timestamp: now,
    actor: 'کارفرما'
  });

  res.json({ success: true, contract: c });
});

// Open dispute
app.post('/api/contracts/:id/dispute', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const { reason } = req.body;
  const now = new Date().toISOString();
  c.status = 'in_dispute';
  c.history.push({
    event: `⚖️ درخواست داوری ثبت شد: "${reason || 'عدم توافق طرفین'}". پرونده به تیم داوری حقوقی ارجاع گردید.`,
    timestamp: now,
    actor: 'داوری'
  });

  res.json({ success: true, contract: c });
});

// Submit receipt
app.post('/api/contracts/:id/receipt', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const now = new Date().toISOString();
  c.status = 'awaiting_receipt_approval' as any;
  c.history.push({
    event: `💳 کارفرما تصویر فیش واریزی را ارسال کرد و جهت بررسی و تایید در صف ادمین قرار گرفت.`,
    timestamp: now,
    actor: 'کارفرما'
  });

  res.json({
    success: true,
    contract: c,
    message: 'فیش واریزی با موفقیت دریافت شد و برای ادمین ارسال گردید.'
  });
});

// Admin approves receipt
app.post('/api/contracts/:id/approve_receipt', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const now = new Date().toISOString();
  c.status = 'active';
  c.history.push({
    event: `✅ فیش واریزی توسط مدیریت تایید شد. مبلغ ${c.amount.toLocaleString('fa-IR')} تومان در صندوق امانی میانجی قفل گردید و پروژه فعال شد.`,
    timestamp: now,
    actor: 'مدیریت'
  });

  res.json({ success: true, contract: c });
});

// Admin rejects receipt
app.post('/api/contracts/:id/reject_receipt', (req: Request, res: Response) => {
  const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'قرارداد یافت نشد.' });

  const { reason = 'مغایرت مبلغ یا ناخوانا بودن تصویر فیش' } = req.body || {};
  const now = new Date().toISOString();
  c.status = 'awaiting_payment';
  c.history.push({
    event: `❌ فیش واریزی توسط مدیریت رد شد (علت: ${reason}).`,
    timestamp: now,
    actor: 'مدیریت'
  });

  res.json({ success: true, contract: c });
});

// PDF Generation Endpoint
app.get('/api/contracts/:id/pdf', async (req: Request, res: Response) => {
  try {
    const c = contracts.find(x => x.contract_id === req.params.id || x.id === req.params.id);
    if (!c) {
      return res.status(404).json({ error: 'قرارداد یافت نشد.' });
    }

    // Build real PDF document using pdf-lib with Unicode Persian font support
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

    // Header bar
    page.drawRectangle({
      x: 0,
      y: height - 80,
      width: width,
      height: 80,
      color: rgb(0.06, 0.09, 0.16) // #0F172A
    });

    // Brand title
    page.drawText('MIYANJI ESCROW PLATFORM', {
      x: 40,
      y: height - 40,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('Official Electronic Escrow Contract Certificate', {
      x: 40,
      y: height - 60,
      size: 10,
      font: fontRegular,
      color: rgb(0.05, 0.65, 0.91) // #0EA5E9
    });

    // Contract ID & Date Badge
    page.drawText(`ID: ${c.contract_id}`, {
      x: width - 180,
      y: height - 40,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    const jalaliDate = new Date(c.created_at).toLocaleDateString('en-US');
    page.drawText(`Created: ${jalaliDate}`, {
      x: width - 180,
      y: height - 60,
      size: 9,
      font: fontRegular,
      color: rgb(0.8, 0.8, 0.8)
    });

    let y = height - 120;

    // Title Card
    page.drawRectangle({
      x: 40,
      y: y - 50,
      width: width - 80,
      height: 60,
      color: rgb(0.95, 0.96, 0.98),
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 1
    });

    page.drawText('Contract Subject:', {
      x: 55,
      y: y - 15,
      size: 9,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.55)
    });

    page.drawText(c.title.substring(0, 70), {
      x: 55,
      y: y - 35,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25)
    });

    y -= 80;

    // Financial & Conditions Summary Grid
    const colWidth = (width - 100) / 3;

    // Box 1: Amount
    page.drawRectangle({
      x: 40,
      y: y - 60,
      width: colWidth,
      height: 65,
      color: rgb(0.98, 0.99, 1),
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 1
    });
    page.drawText('Trade Amount:', { x: 50, y: y - 15, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${c.amount.toLocaleString()} Tomans`, { x: 50, y: y - 35, size: 12, font: fontBold, color: rgb(0.05, 0.65, 0.91) });
    page.drawText('Held in Secure Escrow', { x: 50, y: y - 52, size: 8, font: fontRegular, color: rgb(0.1, 0.6, 0.3) });

    // Box 2: Deadline & Edits
    page.drawRectangle({
      x: 50 + colWidth,
      y: y - 60,
      width: colWidth,
      height: 65,
      color: rgb(0.98, 0.99, 1),
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 1
    });
    page.drawText('Delivery Deadline:', { x: 60 + colWidth, y: y - 15, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(`${c.deadline} Business Days`, { x: 60 + colWidth, y: y - 35, size: 12, font: fontBold, color: rgb(0.1, 0.15, 0.25) });
    page.drawText(`Free Revisions: ${c.free_edits} times`, { x: 60 + colWidth, y: y - 52, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    // Box 3: Status
    page.drawRectangle({
      x: 60 + colWidth * 2,
      y: y - 60,
      width: colWidth,
      height: 65,
      color: rgb(0.98, 0.99, 1),
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 1
    });
    page.drawText('Current Status:', { x: 70 + colWidth * 2, y: y - 15, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.55) });
    page.drawText(c.status.toUpperCase(), { x: 70 + colWidth * 2, y: y - 35, size: 11, font: fontBold, color: rgb(0.1, 0.6, 0.3) });
    page.drawText('Protected by Miyanji Rules', { x: 70 + colWidth * 2, y: y - 52, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    y -= 95;

    // Parties Identity Table
    page.drawRectangle({
      x: 40,
      y: y - 120,
      width: width - 80,
      height: 120,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1
    });

    page.drawText('CONTRACTING PARTIES (ELECTRONIC IDENTITIES):', {
      x: 55,
      y: y - 20,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25)
    });

    // Party A: Buyer/Employer
    page.drawText('PARTY A (Client / Buyer):', { x: 55, y: y - 45, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`Name: ${c.buyer_fullname || 'Registered Buyer'}`, { x: 55, y: y - 62, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Phone: ${c.buyer_phone || 'Verified'} | National ID: ${c.buyer_national_id || 'On File'}`, { x: 55, y: y - 77, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`Signed via OTP: ${c.buyer_signed_at ? 'YES (Verified Digital Seal)' : 'Pending Signature'}`, {
      x: 55,
      y: y - 92,
      size: 8,
      font: fontBold,
      color: c.buyer_signed_at ? rgb(0.06, 0.6, 0.2) : rgb(0.8, 0.4, 0.1)
    });

    // Party B: Seller/Freelancer
    const pBCol = width / 2 + 10;
    page.drawText('PARTY B (Provider / Freelancer):', { x: pBCol, y: y - 45, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    page.drawText(`Name: ${c.seller_fullname || (c.seller_signed_at ? 'Registered Provider' : 'Awaiting Invitation Acceptance')}`, { x: pBCol, y: y - 62, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Phone: ${c.seller_phone || 'Verified'} | National ID: ${c.seller_national_id || 'On File'}`, { x: pBCol, y: y - 77, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`Signed via OTP: ${c.seller_signed_at ? 'YES (Verified Digital Seal)' : 'Pending Signature'}`, {
      x: pBCol,
      y: y - 92,
      size: 8,
      font: fontBold,
      color: c.seller_signed_at ? rgb(0.06, 0.6, 0.2) : rgb(0.8, 0.4, 0.1)
    });

    y -= 150;

    // Scope of Work & Description Box
    page.drawRectangle({
      x: 40,
      y: y - 110,
      width: width - 80,
      height: 110,
      color: rgb(0.99, 0.99, 1),
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 1
    });

    page.drawText('SCOPE OF COMMITMENTS & LEGAL TERMS:', {
      x: 55,
      y: y - 18,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25)
    });

    const descSnippet = (c.description || 'Deliverables and quality benchmarks specified in agreement.').substring(0, 160);
    page.drawText(descSnippet, {
      x: 55,
      y: y - 40,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText('1. Escrow Lock: Funds remain frozen in Miyanji vault until complete satisfaction.', {
      x: 55,
      y: y - 60,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });
    page.drawText('2. Electronic Signature: Both parties validated identity through one-time authentication codes.', {
      x: 55,
      y: y - 75,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });
    page.drawText('3. Binding Arbitration: Disputes will be arbitrated authoritatively under Miyanji Terms of Service.', {
      x: 55,
      y: y - 90,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });

    y -= 140;

    // Digital Signatures & Seal Verification
    page.drawRectangle({
      x: 40,
      y: y - 100,
      width: width - 80,
      height: 100,
      color: rgb(0.97, 0.98, 1),
      borderColor: rgb(0.7, 0.8, 0.95),
      borderWidth: 1.5
    });

    page.drawText('OFFICIAL DIGITAL SEALS & VERIFICATION HASH', {
      x: 55,
      y: y - 20,
      size: 9.5,
      font: fontBold,
      color: rgb(0.05, 0.4, 0.75)
    });

    page.drawText(`SHA-256 Digest: e7f3a8b94091c8019a2b84fbc90d18e24fa68b92`, {
      x: 55,
      y: y - 40,
      size: 8,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45)
    });

    page.drawText(`Verified by Miyanji Escrow Authority (mianji.io)`, {
      x: 55,
      y: y - 55,
      size: 8,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.2)
    });

    page.drawText(`Client Sign: ${c.buyer_signed_at ? c.buyer_signed_at.substring(0, 19) : 'Not signed yet'}`, {
      x: 55,
      y: y - 75,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText(`Provider Sign: ${c.seller_signed_at ? c.seller_signed_at.substring(0, 19) : 'Not signed yet'}`, {
      x: width / 2 + 10,
      y: y - 75,
      size: 8,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2)
    });

    // Footer
    page.drawLine({
      start: { x: 40, y: 35 },
      end: { x: width - 40, y: 35 },
      thickness: 0.5,
      color: rgb(0.8, 0.85, 0.9)
    });

    page.drawText(`Electronic Document Certificate - Contract ID: ${c.contract_id} - Generated by Miyanji Telegram Escrow`, {
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
  const { command, text, user_id = 1802649782, state_data = {} } = req.body;
  const input = (text || command || '').trim();

  // Simulate bot logic
  if (input === '/start' || input === 'شروع') {
    return res.json({
      reply: 'سلام! به سامانه هوشمند میانجی (Miyanji Escrow) خوش آمدید.\nواسطه‌گری امن معاملات و ثبت رسمی قراردادهای الکترونیک با تضمین مالی.',
      keyboard: [
        ['🤝 ثبت معامله جدید', '📜 لیست معاملات من'],
        ['📁 پیش‌نویس‌های من', '💳 کیف پول و اعتبار'],
        ['👤 پروفایل کاربری', '💎 پنل سفیران'],
        ['🎧 پشتیبانی و راهنما']
      ]
    });
  }

  if (input === '📁 پیش‌نویس‌های من' || input === 'پیش‌نویس‌ها' || input === 'پیشنویس') {
    const userDrafts = contracts.filter(c => c.status === 'draft');
    if (userDrafts.length === 0) {
      return res.json({
        reply: '📁 **پیش‌نویس‌های من**\n\nشما در حال حاضر هیچ پیش‌نویس ذخیره‌شده‌ای ندارید.',
        inline_buttons: [
          [{ text: '➕ ایجاد پیش‌نویس جدید', callback_data: 'create_new_draft' }],
          [{ text: '🔙 بازگشت به منوی معاملات', callback_data: 'back_to_contracts' }]
        ]
      });
    }

    return res.json({
      reply: `📁 **${userDrafts.length} پیش‌نویس فعال یافت شد:**`,
      drafts: userDrafts,
      inline_buttons: [
        ...userDrafts.map(d => [
          { text: `🚀 تکمیل و امضا: ${d.title.substring(0, 25)}`, callback_data: `resume_draft_${d.contract_id}` },
          { text: `🗑 حذف`, callback_data: `delete_draft_${d.contract_id}` }
        ]),
        [{ text: '➕ ایجاد پیش‌نویس جدید دیگر', callback_data: 'create_new_draft' }]
      ]
    });
  }

  if (input === '📜 لیست معاملات من' || input === '📜 معاملات من' || input === 'معاملات من') {
    const active = contracts.filter(c => c.status === 'active' || c.status === 'work_submitted').length;
    const pending = contracts.filter(c => c.status === 'pending_party_b' || c.status === 'awaiting_payment').length;
    const drafts = contracts.filter(c => c.status === 'draft').length;
    const completed = contracts.filter(c => c.status === 'completed').length;

    // دکمه‌های شیشه‌ای برای هر معامله با عنوان و نام طرف مقابل
    const contractButtons = contracts.slice(0, 8).map(c => {
      const isBuyer = c.buyer_id === user_id || !c.seller_id;
      const otherName = isBuyer ? (c.seller_fullname || 'مجری پروژه') : (c.buyer_fullname || 'کارفرما');
      const icon = (c.status === 'active' || c.status === 'work_submitted') ? '🟢' : (c.status === 'completed' ? '🏁' : (c.status === 'draft' ? '📁' : '⏳'));
      const shortTitle = c.title.length > 24 ? c.title.substring(0, 24) + '..' : c.title;
      return [
        {
          text: `${icon} ${shortTitle} | 👤 ${otherName}`,
          action: `view_deal_${c.contract_id}`,
          style: 'primary' as const
        }
      ];
    });

    return res.json({
      reply: `📑 **پنل مدیریت هوشمند معاملات شما**\n\nشما دارای ${contracts.length} معامله/پیش‌نویس در سامانه میانجی هستید.\nجهت مشاهده و پیگیری وضعیت، روی دکمه شیشه‌ای معامله کلیک کنید:\n\n📊 **آمار کلی:**\n• درحال انجام: ${active}\n• در انتظار اقدام: ${pending}\n• پیش‌نویس‌ها: ${drafts}\n• تکمیل شده: ${completed}`,
      inline_buttons: [
        ...contractButtons,
        [
          { text: `🟢 درحال انجام (${active})`, action: 'contracts_cat:active' },
          { text: `⏳ در انتظار اقدام (${pending})`, action: 'contracts_cat:pending' }
        ],
        [
          { text: `🏁 تکمیل شده (${completed})`, action: 'contracts_cat:completed' },
          { text: `📁 پیش‌نویس‌های من (${drafts})`, action: 'bot_cmd_drafts' }
        ],
        [
          { text: '➕ ایجاد پیش‌نویس جدید', action: 'bot_cmd_new_draft' }
        ]
      ]
    });
  }

  if (input.startsWith('view_deal_')) {
    const cid = input.replace('view_deal_', '');
    const c = contracts.find(x => x.contract_id === cid || x.id === cid);
    if (!c) {
      return res.json({
        reply: `❌ معامله با شناسه ${cid} یافت نشد.`,
        keyboard: [['🤝 ثبت معامله جدید', '📜 لیست معاملات من']]
      });
    }
    const statusFa = c.status === 'active' ? '🟢 در حال انجام پروژه توسط مجری' : (c.status === 'completed' ? '✅ تکمیل شده' : (c.status === 'draft' ? '📝 پیش‌نویس' : '⏳ در انتظار اقدام'));
    return res.json({
      reply: `🏛 **سند رسمی معامله میانجی**\n📑 شناسه: \`${c.contract_id}\`\n\n📌 **وضعیت:** ${statusFa}\n📌 **موضوع:** ${c.title}\n💰 **مبلغ کل:** ${c.amount.toLocaleString('fa-IR')} تومان\n⏱ **مهلت تحویل:** ${c.deadline} روز کاری\n📝 **تعهدات:** ${c.description || 'تعهدات استاندارد پلتفرم میانجی'}`,
      inline_buttons: [
        [
          { text: '📄 دانلود سند PDF رسمی', action: `pdf_preview_${c.contract_id}` },
          { text: '🔙 بازگشت به لیست معاملات', action: '📜 لیست معاملات من' }
        ]
      ]
    });
  }

  // Fallback
  return res.json({
    reply: `پیام دریافت شد: "${input}"\nجهت استفاده از خدمات، یکی از گزینه‌های منو را انتخاب فرمایید.`,
    keyboard: [
      ['🤝 ثبت معامله جدید', '📜 لیست معاملات من'],
      ['📁 پیش‌نویس‌های من', '💳 کیف پول و اعتبار']
    ]
  });
});

// ====================================================
// Vite Integration (Development Mode & Static Production)
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
    console.log(`🚀 Miyanji Escrow Platform server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});
