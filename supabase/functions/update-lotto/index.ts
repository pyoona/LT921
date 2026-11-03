// @ts-nocheck
// Supabase Edge Function: update-lotto
// แทน updateAll() ใน Apps Script เดิม: ดึงผลหวยจากเว็บต้นทาง แล้วบันทึกลงตาราง results
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONFIG = {
  XOSOHD_THREE_FROM: 'prize_1st',          // ฮานอย HD: เลข 3 ตัว = 3 ตัวท้ายของ prize_1st
  LOTTOSUPERRICH_THREE_FROM: 'prize_1st',  // รัสเซีย VIP
  OVERWRITE_EXISTING: false,               // false = ไม่ทับเลขที่มีอยู่แล้ว (เหมือนเดิม)

  EXCLUDED_ITEMS: ['รัสเซีย VIP', 'ดาวน์โจนส์ VISA', 'ดาวน์โจนส์ VIP', 'หุ้นดาวน์โจนส์'],

  NAME_ALIASES: {
    // ------------------- API: waii.site & อื่นๆ -------------------
    'หวยลาวเช้า': 'ลาวเช้า',
    'ลาว(EXTRA)': 'ลาว EXTRA',
    'ลาว TV': 'ลาว TV',
    'ลาวพิเศษ': 'ลาวพิเศษ',
    'หวยลาวสตาร์': 'ลาว Star',
    'หวยลาวสามัคคี': 'ลาวสามัคคี',
    'หวยลาว (ลาวพัฒนา)': 'ลาวพัฒนา',
    'หวยลาวพัฒนา': 'ลาวพัฒนา', // เพิ่มชื่อดักเผื่อไว้
    'หวยลาว': 'ลาวพัฒนา',
    'หวยลาวสามัคคี(VIP)': 'ลาวสามัคคี VIP',
    'หวยลาวสตาร์(VIP)': 'ลาวสตาร์ VIP',
    'ลาวกาชาด': 'ลาวกาชาด',
    'ฮานอยสตาร์': 'ฮานอย Star',
    'ฮานอยกาชาด': 'ฮานอยกาชาด',
    'ฮานอยพิเศษ': 'ฮานอยพิเศษ',
    'หวยฮานอย': 'ฮานอยปกติ',
    'ฮานอย(VIP)': 'ฮานอย VIP',
    'หุ้นนิเคอิรอบเช้า': 'หุ้นนิเคอิ เช้า',
    'จีนรอบเช้า': 'หุ้นจีน เช้า',
    'ฮั่งเส็งรอบเช้า': 'หุ้นฮั่งเส็ง เช้า',
    'หุ้นไต้หวัน': 'หุ้นไต้หวัน',
    'นิเคอิปิดบ่าย': 'หุ้นนิเคอิ บ่าย',
    'หุ้นเกาหลี': 'หุ้นเกาหลี',
    'จีนปิดรอบบ่าย': 'หุ้นจีน บ่าย',
    'ฮั่งเส็งปิดบ่าย': 'หุ้นฮั่งเส็ง บ่าย',
    'หุ้นสิงคโปร์': 'หุ้นสิงคโปร์',
    'หุ้นไทยปิดเย็น': 'หุ้นไทย เย็น',
    'หุ้นอินเดีย': 'หุ้นอินเดีย',
    'หุ้นอิยิปต์': 'หุ้นอิยิปต์',
    'หุ้นเยอรมัน': 'หุ้นเยอรมัน',
    'หุ้นอังกฤษ': 'หุ้นอังกฤษ',
    'หุ้นรัสเซีย': 'หุ้นรัสเซีย',
    'หุ้นดาวโจนส์': 'หุ้นดาวน์โจนส์',
    'นิเคอิ VIP เช้า': 'นิเคอิ VIP เช้า',
    'จีน VIP เช้า': 'จีน VIP เช้า',
    'ฮั่งเส็ง VIP เช้า': 'ฮั่งเส็ง VIP เช้า',
    'ไต้หวัน VIP': 'ไต้หวัน VIP',
    'เกาหลี VIP': 'เกาหลี VIP',
    'นิเคอิ VIP บ่าย': 'นิเคอิ VIP บ่าย',
    'จีน VIP บ่าย': 'จีน VIP บ่าย',
    'ฮั่งเส็ง VIP บ่าย': 'ฮั่งเส็ง VIP บ่าย',
    'สิงคโปร์ VIP': 'สิงค์โปร VIP',
    'ดาวโจนส์ VIP': 'ดาวน์โจนส์ VIP',

    // --- เพิ่มชื่อดักสำหรับ 3 รายการ (รองรับทั้งเว็บ masure และ waii) ---
    'สาละวัน VISA': 'สาละวัน VISA',
    'หวยสาละวัน VISA': 'สาละวัน VISA',
    'หลวงพระบาง VISA': 'หลวงพระบาง VISA',
    'หวยหลวงพระบาง VISA': 'หลวงพระบาง VISA',
    'เวียงจันทร์ VISA': 'เวียงจันทร์ VISA',
    'หวยเวียงจันทร์ VISA': 'เวียงจันทร์ VISA',
    'เวียงจันทน์ VISA': 'เวียงจันทร์ VISA',
    'หวยเวียงจันทน์ VISA': 'เวียงจันทร์ VISA',
    // --------------------------------------------------------

    'ลาว VISA': 'ลาว VISA',
    'นิเคอิ VISA (เช้า)': 'นิเคอิ VISA เช้า',
    'จีน VISA (เช้า)': 'จีน VISA เช้า',
    'ฮั่งเส็ง VISA (เช้า)': 'ฮั่งเส็ง VISA เช้า',
    'ฮ่องกง VISA': 'ฮ่องกง VISA',
    'นิเคอิ VISA (บ่าย)': 'นิเคอิ VISA บ่าย',
    'จีน VISA (บ่าย)': 'จีน VISA บ่าย',
    'ฮั่งเส็ง VISA (บ่าย)': 'ฮั่งเส็ง VISA บ่าย',
    'ฮานอย VISA': 'ฮานอย VISA',
    'อังกฤษ VISA': 'อังกฤษ VISA',
    'เยอรมัน VISA': 'เยอรมัน VISA',
    'รัสเซีย VISA': 'รัสเซีย VISA',
    'ดาวโจนส์ VISA': 'ดาวน์โจนส์ VISA',
    'หวยมาเลย์': 'มาเลย์',
    'หวยรัฐบาล': 'หวยรัฐบาล',

    // ------------------- API: masurebet.biz -------------------
    'หวยลาวประตูชัย': 'ลาวประตูชัย',
    'หวยลาวสันติภาพ': 'ลาวสันติภาพ',
    'หวยประชาชนลาว': 'ประชาชนลาว',
    'หวยลาวHD': 'ลาว HD',
    'หวยลาว(VIP)': 'ลาว VIP',
    'ฮานอยTV': 'ฮานอย TV',
    'ฮานอยพัฒนา': 'ฮานอยพัฒนา',
    'ฮานอย(EXTRA)': 'ฮานอย Extra',
    'อังกฤษ(VIP)': 'อังกฤษ VIP',
    'เยอรมัน(VIP)': 'เยอรมัน VIP',
    'รัสเซีย(VIP)': 'รัสเซีย VIP',
    'เวียดนาม VIP (เช้า)': 'เวียดนาม VIP เช้า',
    'เวียดนาม VIP (บ่าย)': 'เวียดนาม VIP บ่าย',
    'เวียดนาม VIP (เย็น)': 'เวียดนาม VIP เย็น',
    'ดาวน์โจนส์ MIDNIGHT': 'ดาวน์โจนส์ MIDNIGHT',
    'ดาวน์โจนส์ EXTRA': 'ดาวน์โจนส์ EXTRA',
    'ดาวน์โจนส์ TV': 'ดาวน์โจนส์ TV',

    // ------------------- API: lottosuperrich.com -------------------
    'RUSSIA VIP': 'รัสเซีย VIP'
  },

  // บังคับดึงเฉพาะแหล่ง
  SOURCE_ONLY: {
    waii: [
      'หวยลาวเช้า', 'ลาว(EXTRA)', 'ลาว TV', 'ลาวพิเศษ', 'หวยลาวสตาร์', 'หวยลาวสามัคคี',
      'หวยลาวสามัคคี(VIP)', 'หวยลาวสตาร์(VIP)', 'ลาวกาชาด',
      'ฮานอยสตาร์', 'ฮานอยกาชาด', 'ฮานอยพิเศษ', 'หวยฮานอย', 'ฮานอย(VIP)', 'หุ้นนิเคอิรอบเช้า',
      'จีนรอบเช้า', 'ฮั่งเส็งรอบเช้า', 'หุ้นไต้หวัน', 'นิเคอิปิดบ่าย', 'หุ้นเกาหลี',
      'จีนปิดรอบบ่าย', 'ฮั่งเส็งปิดบ่าย', 'หุ้นสิงคโปร์', 'หุ้นไทยปิดเย็น', 'หุ้นอินเดีย',
      'หุ้นอิยิปต์', 'หุ้นเยอรมัน', 'หุ้นอังกฤษ', 'หุ้นรัสเซีย', 'หุ้นดาวโจนส์',
      'นิเคอิ VIP เช้า', 'จีน VIP เช้า', 'ฮั่งเส็ง VIP เช้า', 'ไต้หวัน VIP', 'เกาหลี VIP',
      'นิเคอิ VIP บ่าย', 'จีน VIP บ่าย', 'ฮั่งเส็ง VIP บ่าย', 'สิงคโปร์ VIP', 'ดาวโจนส์ VIP',
      'ลาว VISA', 'นิเคอิ VISA (เช้า)',
      'จีน VISA (เช้า)', 'ฮั่งเส็ง VISA (เช้า)', 'ฮ่องกง VISA', 'นิเคอิ VISA (บ่าย)',
      'จีน VISA (บ่าย)', 'ฮั่งเส็ง VISA (บ่าย)', 'ฮานอย VISA', 'อังกฤษ VISA',
      'เยอรมัน VISA', 'รัสเซีย VISA', 'ดาวโจนส์ VISA', 'หวยมาเลย์', 'หวยรัฐบาล'
    ],
    masure: [
      'หวยลาวประตูชัย', 'หวยลาวสันติภาพ', 'หวยประชาชนลาว', 'หวยลาวHD', 'หวยลาว(VIP)',
      'ฮานอยTV', 'ฮานอยพัฒนา', 'ฮานอย(EXTRA)', 'อังกฤษ(VIP)', 'เยอรมัน(VIP)',
      'เวียดนาม VIP (เช้า)', 'เวียดนาม VIP (บ่าย)', 'เวียดนาม VIP (เย็น)',
      'ดาวน์โจนส์ MIDNIGHT', 'ดาวน์โจนส์ EXTRA', 'ดาวน์โจนส์ TV'
    ],
    superrich: [
      'RUSSIA VIP', 'รัสเซีย VIP'
    ]
  },

};

const SOURCES = [
  { key: 'masure',    url: 'https://api.masurebet.biz/api/home' },
  { key: 'waii',      url: 'https://api.waii.site/api/home' },
  { key: 'xosohd',    url: 'https://api.xosohd.com/result',         parser: parseXosoHd_ },
  { key: 'superrich', url: 'https://gcp.lottosuperrich.com/result', parser: parseLottoSuperRich_ },
  { key: 'plus999',   url: 'https://api.999plus.xyz/api/home' },
  { key: 'setteebet', url: 'https://api.setteebet.bet/api/home' },
];

/* =============================== MAIN =============================== */

// เรียกได้ 3 แบบ:
//   .../update-lotto                 → updateAll() สคริปต์หลัก (ปุ่ม "อัปเดตข้อมูล" บนเว็บ)
//   .../update-lotto?task=windowed   → รันงานเฉพาะที่อยู่ในช่วงเวลา (cron เรียกทุก 5 นาที)
//   .../update-lotto?task=<ชื่องาน>&force=1 → รันงานนั้นทันทีไม่สนเวลา (ไว้ทดสอบ)
//       ชื่องาน: djvip, russiavip, stockdj, djvisa, stockslate
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = new URL(req.url);
    const task = url.searchParams.get('task') || 'main';
    const force = url.searchParams.get('force') === '1';

    if (task === 'main') {
      const result = await updateAll();
      return json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ', ...result });
    }
    const ran = await runWindowed(task === 'windowed' ? null : task, force);
    return json({ success: true, ran });
  } catch (e) {
    return json({ success: false, error: String(e?.message || e) }, 500);
  }
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function updateAll() {
  // service_role key ถูกใส่ให้อัตโนมัติใน Edge Function (ไม่ต้องตั้งเอง และไม่หลุดไปฝั่งเว็บ)
  const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

  const sources = await Promise.all(SOURCES.map(loadOne_));
  if (!sources.some(s => s.ok)) throw new Error('ดึงข้อมูลจากทุกแหล่งไม่สำเร็จ');

  const { data: lots, error } = await db.from('lotteries').select('id, name');
  if (error) throw new Error(error.message);

  const rows = [], pending = [], noData = [];
  for (const l of lots) {
    const pick = pickRecord_(sources, normName_(l.name));
    if (!pick) { noData.push(l.name); continue; }
    if (!pick.rec.three || !pick.rec.date) { pending.push(l.name); continue; }
    rows.push({ draw_date: pick.rec.date, lottery_id: l.id, result: pick.rec.three });
  }

  if (rows.length) {
    const { error: e2 } = await db.from('results').upsert(rows, {
      onConflict: 'draw_date,lottery_id',
      ignoreDuplicates: !CONFIG.OVERWRITE_EXISTING,
    });
    if (e2) throw new Error(e2.message);
  }

  const summary = {
    written: rows.length, pending: pending.length, noData,
    sources: sources.map(s => ({ key: s.key, ok: s.ok, total: s.total, ready: s.ready, error: s.error })),
  };
  console.log(JSON.stringify(summary));
  return summary;
}

/* ============================== FETCH =============================== */

async function fetchText_(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status !== 200) throw new Error('HTTP ' + res.status + ' จาก ' + url);
  return await res.text();
}

function parseBody_(text) {
  try { return JSON.parse(text); } catch (_) { /* ลองแบบ SSE ต่อ */ }
  const payloads = [];
  String(text).split(/\r?\n/).forEach(line => {
    const m = line.match(/^data:\s*(.+)$/);
    if (m) { try { payloads.push(JSON.parse(m[1])); } catch (_) { /* ข้าม */ } }
  });
  if (payloads.length) return payloads.length === 1 ? payloads[0] : payloads;
  throw new Error('อ่านข้อมูลเป็น JSON ไม่ได้: ' + String(text).substring(0, 200));
}

async function loadOne_(s) {
  const out = { key: s.key, ok: false, map: {}, total: 0, ready: 0, error: '' };
  try {
    const parsed = parseBody_(await fetchText_(s.url));
    const records = s.parser ? s.parser(parsed) : extractRecords_(parsed);
    const excluded = getExcludedKeys_();
    out.total = records.length;
    records.forEach(r => {
      const k = normName_(r.name);
      if (excluded.has(k)) return;
      if (r.three && r.date) out.ready++;
      const cur = out.map[k];
      if (!cur || (!(cur.three && cur.date) && r.three && r.date)) out.map[k] = r;
    });
    out.ok = true;
  } catch (e) {
    out.error = e.message;
    console.log('[' + s.key + '] ดึงข้อมูลไม่สำเร็จ: ' + e.message);
  }
  return out;
}

function extractRecords_(root) {
  const out = [];
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (Array.isArray(node.lists)) {
      node.lists.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const name = item.GAME_NAME || item.GAME_NAME_SHORT;
        if (!name) return;
        const raw = item.RESULT_3UP == null ? '' : String(item.RESULT_3UP).trim();
        out.push({
          name: String(name).trim(),
          three: /^\d{3}$/.test(raw) ? raw : null,
          date: gameCodeDate_(item.GAME_CODE) || parseDate_(node.DATE_GAME),
        });
      });
    }
    Object.keys(node).forEach(k => { if (k !== 'lists') walk(node[k]); });
  })(root);
  return out;
}

function parseXosoHd_(j) {
  const d = j && j.data;
  if (!d || !d.results) return [];
  const raw = String(d.results[CONFIG.XOSOHD_THREE_FROM] ?? '').trim();
  let three = /^\d{5}$/.test(raw) ? raw.slice(-3) : null;
  if (three && d.show_1st && String(d.show_1st).substring(0, 16) > nowBkk_()) three = null;
  return [{ name: 'ฮานอย HD', three, date: parseDate_(d.lotto_date) }];
}

function parseLottoSuperRich_(j) {
  if (!j) return [];
  const d = j.data || j;
  const date = parseDate_(d.lotto_date) || parseDate_(d.date) || nowBkk_().slice(0, 10);
  const results = d.results || d;
  const raw = String(results[CONFIG.LOTTOSUPERRICH_THREE_FROM] ?? '').trim();
  return [{ name: 'รัสเซีย VIP', three: raw.length >= 3 ? raw.slice(-3) : null, date }];
}

// เวลาไทยปัจจุบัน รูปแบบ 'yyyy-MM-dd HH:mm'
function nowBkk_() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 16);
}

function gameCodeDate_(code) {
  const m = String(code || '').match(/(\d{4})(\d{2})(\d{2})$/);
  return m ? parseDate_(m[1] + '-' + m[2] + '-' + m[3]) : null;
}

let sourceOnlyMap_ = null;
function getSourceOnly_() {
  if (!sourceOnlyMap_) {
    sourceOnlyMap_ = {};
    Object.keys(CONFIG.SOURCE_ONLY).forEach(src => {
      CONFIG.SOURCE_ONLY[src].forEach(name => { sourceOnlyMap_[normName_(name)] = src; });
    });
  }
  return sourceOnlyMap_;
}

let excludedKeys_ = null;
function getExcludedKeys_() {
  if (!excludedKeys_) excludedKeys_ = new Set(CONFIG.EXCLUDED_ITEMS.map(baseNorm_));
  return excludedKeys_;
}

// เลือกผลจากแหล่งที่กำหนดใน SOURCE_ONLY ก่อน ถ้าไม่ได้กำหนด ใช้แหล่งแรกที่มีผลครบ
function pickRecord_(sources, key) {
  const onlySrc = getSourceOnly_()[key];
  let fallback = null;
  for (const s of sources) {
    if (onlySrc && s.key !== onlySrc) continue;
    const r = s.ok && s.map[key];
    if (!r) continue;
    if (r.three && r.date) return { rec: r, source: s.key };
    if (!fallback) fallback = { rec: r, source: s.key };
  }
  return fallback;
}

/* ============================= HELPERS ============================== */

const MONTHS_ = [
  ['มกรา', 'ม.ค', 'jan'], ['กุมภา', 'ก.พ', 'feb'], ['มีนา', 'มี.ค', 'mar'],
  ['เมษา', 'เม.ย', 'apr'], ['พฤษภา', 'พ.ค', 'may'], ['มิถุนา', 'มิ.ย', 'jun'],
  ['กรกฎา', 'ก.ค', 'jul'], ['สิงหา', 'ส.ค', 'aug'], ['กันยา', 'ก.ย', 'sep'],
  ['ตุลา', 'ต.ค', 'oct'], ['พฤศจิกา', 'พ.ย', 'nov'], ['ธันวา', 'ธ.ค', 'dec'],
];

function parseDate_(input) {
  if (input == null) return null;
  const s = String(input).trim();
  if (!s) return null;
  let y, m, d, mt;
  if ((mt = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) {
    y = +mt[1]; m = +mt[2]; d = +mt[3];
  } else if ((mt = s.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/))) {
    d = +mt[1]; m = +mt[2]; y = +mt[3];
  } else if ((mt = s.match(/(\d{1,2})\s*([^\d\s][^\d]*?)\s*(\d{4})/))) {
    d = +mt[1]; y = +mt[3];
    const name = mt[2].toLowerCase().replace(/\s+/g, '');
    m = 0;
    for (let i = 0; i < 12; i++) {
      if (MONTHS_[i].some(p => name.indexOf(p) !== -1)) { m = i + 1; break; }
    }
    if (!m) return null;
  } else {
    return null;
  }
  if (y > 2400) y -= 543;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  const p = x => (x < 10 ? '0' + x : '' + x);
  return y + '-' + p(m) + '-' + p(d);
}

function baseNorm_(s) {
  let t = String(s ?? '').toLowerCase();
  t = t.replace(/[็-๎]/g, '');
  t = t.replace(/ดาวนโจนส|ดาวโจนส/g, 'dj').replace(/จันทร/g, 'จันทน').replace(/สตาร/g, 'star');
  t = t.replace(/[\s\-_()\[\]{}.:,]+/g, '');
  if (t.length > 3 && t.indexOf('หวย') === 0) t = t.slice(3);
  return t;
}

let aliasMap_ = null;
function normName_(s) {
  if (!aliasMap_) {
    aliasMap_ = {};
    Object.keys(CONFIG.NAME_ALIASES).forEach(k => { aliasMap_[baseNorm_(k)] = baseNorm_(CONFIG.NAME_ALIASES[k]); });
  }
  const t = baseNorm_(s);
  return Object.prototype.hasOwnProperty.call(aliasMap_, t) ? aliasMap_[t] : t;
}

/* ===================================================================
 * งานตามช่วงเวลา (ย้ายมาจาก Code.gs อีก 3 ไฟล์)
 *   djvip      ดาวน์โจนส์ VIP   00:30–01:00   (ทับค่าเดิม เหมือนเดิม)
 *   russiavip  รัสเซีย VIP      23:50–00:15   (ทับค่าเดิม)
 *   stockdj    หุ้นดาวน์โจนส์    04:30–06:00   (ทับค่าเดิม)
 *   djvisa     ดาวน์โจนส์ VISA  00:15–00:20   (ใส่ในวันที่ล่าสุดที่มีในฐานข้อมูล, ทับค่าเดิม)
 *   stockslate หุ้นอังกฤษ/เยอรมัน 23:50–01:30, หุ้นรัสเซีย 03:00–08:30 (ไม่ทับ)
 * =================================================================== */

const TASKS = {
  djvip:      { window: ['00:30', '01:00', 'excl'], fn: taskDowJonesVip_ },
  russiavip:  { window: ['23:50', '00:15', 'excl'], fn: taskRussiaVip_ },
  stockdj:    { window: ['04:30', '06:00', 'excl'], fn: taskStockDowJones_ },
  djvisa:     { window: ['00:15', '00:20', 'incl'], fn: taskDowJonesVisa_ },
  index:      { window: null,                       fn: taskIndex_ },       // ดัชนีจริง (GoogleFinance.gs) เช็กช่วงเวลาเองข้างใน
  stockslate: { window: null,                       fn: taskStocksLate_ },  // เช็กช่วงเวลาเองข้างใน
};

const STOCK_LATE = {
  SOURCES: [
    { key: 'waii',      url: 'https://api.waii.site/api/home' },
    { key: 'plus999',   url: 'https://api.999plus.xyz/api/home' },
    { key: 'setteebet', url: 'https://api.setteebet.bet/api/home' },
    { key: 'masure',    url: 'https://api.masurebet.biz/api/home' },
  ],
  WINDOWS: [
    { from: '23:50', to: '01:30', items: ['หุ้นอังกฤษ', 'หุ้นเยอรมัน'] },
    { from: '03:00', to: '08:30', items: ['หุ้นรัสเซีย'] },
  ],
  MAX_AGE_DAYS: 1,
};

const STOCK_HUN_SOURCES = [
  { url: 'https://api.masurebet.biz/api/home', name: 'masurebet.biz' },
  { url: 'https://api.waii.site/api/home',     name: 'waii.site' },
  { url: 'https://api.999plus.xyz/api/home',   name: '999plus.xyz' },
  { url: 'https://api.setteebet.bet/api/home', name: 'setteebet.bet' },
];
const STOCK_HUN_GAME_CODE_PREFIX = 'L03-03-020000';

async function runWindowed(only, force) {
  const db = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const hm = nowBkk_().slice(11, 16);
  const ran = {};
  for (const [name, t] of Object.entries(TASKS)) {
    if (only && name !== only) continue;
    if (!force && t.window && !inWindow_(hm, ...t.window)) continue;
    try {
      ran[name] = await t.fn(db, force);
    } catch (e) {
      ran[name] = 'ผิดพลาด: ' + e.message;
    }
    console.log('[' + name + '] ' + JSON.stringify(ran[name]));
  }
  if (only && !TASKS[only]) throw new Error('ไม่รู้จักงาน: ' + only);
  return ran;
}

// mode 'excl' = [start, end)  (แบบสคริปต์ VIP),  'incl' = [start, end]
function inWindow_(hm, from, to, mode = 'incl') {
  const beforeEnd = mode === 'excl' ? hm < to : hm <= to;
  return from <= to ? (hm >= from && beforeEnd) : (hm >= from || beforeEnd);
}

function dateBkk_(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86400000)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).slice(0, 10);
}

const last3_ = v => String(v ?? '').replace(/[^0-9]/g, '').padStart(3, '0').slice(-3);

async function lotteryId_(db, name) {
  const { data, error } = await db.from('lotteries').select('id').eq('name', name).single();
  if (error || !data) throw new Error('ไม่พบหวยชื่อ "' + name + '" ในตาราง lotteries');
  return data.id;
}

async function save_(db, name, date, result, overwrite) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('วันที่ไม่ถูกต้อง: ' + date);
  const row = { draw_date: date, lottery_id: await lotteryId_(db, name), result };
  const { error } = await db.from('results').upsert(row, {
    onConflict: 'draw_date,lottery_id', ignoreDuplicates: !overwrite,
  });
  if (error) throw new Error(error.message);
  return name + ' ' + date + ' = ' + result;
}

async function getJson_(url) {
  return parseBody_(await fetchText_(url));
}

/* ---------- ดาวน์โจนส์ VIP ---------- */
async function taskDowJonesVip_(db) {
  const j = await getJson_('https://api.dowjonespowerball.com/result?draw=');
  return save_(db, 'ดาวน์โจนส์ VIP', parseDate_(j.data.lotto_date), last3_(j.data.results.prize_1st), true);
}

/* ---------- รัสเซีย VIP ---------- */
async function taskRussiaVip_(db) {
  const j = await getJson_('https://gcp.lottosuperrich.com/result');
  const ru = j.data && j.data.ru;
  if (!ru) throw new Error('ไม่พบข้อมูล lotto_type: ru จาก API รัสเซีย VIP');
  return save_(db, 'รัสเซีย VIP', parseDate_(ru.lotto_date), last3_(ru.results.prize_1st), true);
}

/* ---------- หุ้นดาวน์โจนส์ ---------- */
async function taskStockDowJones_(db) {
  for (const src of STOCK_HUN_SOURCES) {
    try {
      const j = await getJson_(src.url);
      const lists = j?.settrandNoInt?.lists || [];
      const item = lists.find(x => String(x.GAME_CODE || '').startsWith(STOCK_HUN_GAME_CODE_PREFIX));
      if (item && typeof item.RESULT_3UP === 'string' && /^[0-9]{1,4}$/.test(item.RESULT_3UP.trim())) {
        const date = parseDate_(j.settrandNoInt.DATE_GAME) || dateBkk_();
        return (await save_(db, 'หุ้นดาวน์โจนส์', date, item.RESULT_3UP.trim(), true)) + ' (จาก ' + src.name + ')';
      }
    } catch (e) {
      console.log('[หุ้นดาวน์โจนส์] ดึงจาก ' + src.name + ' ไม่สำเร็จ: ' + e.message);
    }
  }
  return 'ยังไม่มีผลจากทุก API';
}

/* ---------- ดาวน์โจนส์ VISA ---------- */
async function taskDowJonesVisa_(db) {
  const data = await getJson_('https://api-tvs.com/list-v2/10');
  if (!Array.isArray(data) || !data.length) throw new Error('API ไม่มีข้อมูล');
  const latest = data.reduce((a, b) => (new Date(b.datetime) > new Date(a.datetime) ? b : a));
  const digits = String(latest.threeall || '').replace(/[^0-9]/g, '');
  if (digits.length < 3) throw new Error('ค่า threeall ไม่ถูกต้อง: ' + latest.threeall);

  // เหมือนเดิม: ใส่ในวันที่ล่าสุดที่มีอยู่แล้ว (ไม่สร้างวันใหม่)
  const { data: d } = await db.from('draw_dates').select('draw_date')
    .order('draw_date', { ascending: false }).limit(1);
  const target = d?.[0]?.draw_date;
  if (!target) throw new Error('ยังไม่มีวันที่ในฐานข้อมูล');
  const apiDate = parseDate_(latest.datetime);
  if (apiDate && apiDate !== target) {
    console.log('คำเตือน: วันที่ API (' + apiDate + ') ไม่ตรงกับวันที่ล่าสุด (' + target + ') ใส่ตามวันที่ล่าสุดเหมือนเดิม');
  }
  return save_(db, 'ดาวน์โจนส์ VISA', target, digits.slice(-3), true);
}

/* ===================================================================
 * ดัชนีจริง (ย้ายมาจาก GoogleFinance.gs)
 *   หุ้นเยอรมัน -> DAX       (Google Finance  DAX:INDEXDB)   23:50–00:30
 *   หุ้นอังกฤษ -> FTSE 100  (Google Finance  UKX:INDEXFTSE) 23:50–00:30
 *   หุ้นรัสเซีย -> RUSBC     (TradingView     RUS:RUSBC)     04:30–05:30
 *   เลข = 3 ตัวท้ายของค่าดัชนี ไม่เอาจุด (25,981.09 -> 109)
 *   กติกาเหมือนเดิม: ลงวันที่ของรอบตลาด, ข้ามเสาร์-อาทิตย์, ค่าเท่ารอบก่อน = วันหยุด, ไม่ทับเลขเดิม
 *   ทดสอบทันที: ?task=index&force=1  (ไม่สนช่วงเวลา แต่ยังข้ามตอนตลาดเปิด/วันหยุด และไม่ทับเลขเดิม)
 * =================================================================== */

const IDX = {
  ITEMS: [
    // shiftMin = เวลาปิดตลาด (เวลาไทย) เป็นนาที ใช้หาว่าค่าตอนนี้เป็นของรอบวันไหน
    // open = ช่วงที่ตลาดเปิด (เวลาไทย) ตัวเลขยังขยับ จึงไม่ดึงในช่วงนี้
    { name: 'หุ้นเยอรมัน', from: '23:50', to: '00:30', shiftMin: 23 * 60 + 35, open: ['14:00', '23:35'], get: () => googleFinancePrice_('DAX:INDEXDB') },
    { name: 'หุ้นอังกฤษ', from: '23:50', to: '00:30', shiftMin: 23 * 60 + 35, open: ['14:00', '23:35'], get: () => googleFinancePrice_('UKX:INDEXFTSE') },
    { name: 'หุ้นรัสเซีย', from: '04:30', to: '05:30', shiftMin: 28 * 60 + 25, open: ['13:00', '04:25'], get: () => tradingViewPrice_('RUS:RUSBC') },
  ],
};
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

// วันที่ (yyyy-mm-dd) และวันในสัปดาห์ (0=อาทิตย์ ... 6=เสาร์) ตามเวลาไทย ของเวลา ms
function bkkDay_(ms) {
  const d = new Date(ms + 7 * 3600000);
  return { date: d.toISOString().slice(0, 10), dow: d.getUTCDay() };
}

// 3 ตัวท้ายของค่า (ทศนิยม 2 ตำแหน่ง) ไม่เอาจุด: 25981.09 -> "109", 25980.05 -> "005"
const toLast3_ = v => Number(v).toFixed(2).replace('.', '').slice(-3);

async function taskIndex_(db, force) {
  const hm = nowBkk_().slice(11, 16);
  const items = force ? IDX.ITEMS : IDX.ITEMS.filter(it => inWindow_(hm, it.from, it.to, 'excl'));
  if (!items.length) return 'นอกช่วงเวลา';

  const out = [];
  for (const it of items) {
    try {
      if (inWindow_(hm, it.open[0], it.open[1], 'excl')) {
        out.push('… ' + it.name + ' ตลาดยังเปิดอยู่ (' + it.open[0] + '–' + it.open[1] + ') ตัวเลขยังไม่ใช่ราคาปิด -> ข้าม');
        continue;
      }
      // วันที่ของรอบตลาด: ย้อนเวลาไทยตอนนี้ไปเท่ากับเวลาปิดตลาด
      const session = bkkDay_(Date.now() - it.shiftMin * 60000);
      const dateKey = session.date;
      if (session.dow === 0 || session.dow === 6) { out.push('… ' + it.name + ' รอบ ' + dateKey + ' เป็นเสาร์/อาทิตย์ -> ข้าม'); continue; }

      const id = await lotteryId_(db, it.name);
      const { data: ex } = await db.from('results').select('result')
        .eq('draw_date', dateKey).eq('lottery_id', id).maybeSingle();
      const cur = ex ? String(ex.result).trim() : '';
      if (cur !== '' && !force) { out.push('= ' + it.name + ' ' + dateKey + ' มีผลแล้ว (' + cur + ')'); continue; }

      const value = await it.get();
      const three = toLast3_(value);

      // กันวันหยุด: ค่าเท่ากับรอบก่อนเป๊ะ = ตลาดไม่ได้เปิด (เก็บค่าล่าสุดไว้ในตาราง index_cache)
      const { data: last, error: cacheErr } = await db.from('index_cache').select('date, value')
        .eq('name', it.name).maybeSingle();
      if (cacheErr) console.log('[index] อ่าน index_cache ไม่ได้ (ยังไม่ได้สร้างตาราง?): ' + cacheErr.message);
      if (last && last.date !== dateKey && Number(last.value) === Number(value)) {
        out.push('… ' + it.name + ' = ' + value + ' เท่ากับรอบ ' + last.date + ' (ตลาดน่าจะหยุด) -> ไม่เขียน');
        continue;
      }

      if (cur === three) {
        out.push('= ' + it.name + ' ' + dateKey + ' มีเลข ' + three + ' อยู่แล้ว');
      } else if (cur === '') {
        await save_(db, it.name, dateKey, three, false);
        out.push('✓ ' + it.name + ' ' + dateKey + ' = ' + value + ' -> เขียน ' + three);
      } else {
        out.push('! ' + it.name + ' ' + dateKey + ': ในฐานข้อมูล=' + cur + ' ดัชนี=' + three + ' -> ไม่ทับ');
      }
      if (!cacheErr) await db.from('index_cache').upsert({ name: it.name, date: dateKey, value });
    } catch (e) {
      out.push('✗ ' + it.name + ' | ' + e.message);
    }
  }
  return out;
}

/** Google Finance: อ่านราคาหลักจากหน้าเว็บ เช่น 'DAX:INDEXDB' */
async function googleFinancePrice_(symbol) {
  const res = await fetch('https://www.google.com/finance/quote/' + symbol + '?hl=en', {
    headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status !== 200) throw new Error('Google Finance HTTP ' + res.status);
  const html = await res.text();
  const patterns = [
    /class="N6SYTe"[^>]*>\s*<span[^>]*jsname="Pdsbrc"[^>]*>\s*<span[^>]*>\s*([0-9][0-9.,]*)\s*</, // ตัวเลขหลัก
    /class="YMlKec fxKbKc"[^>]*>\s*[^0-9<]*([0-9][0-9.,]*)\s*</,                                     // class เดิม
    /data-last-price="([0-9.,]+)"/,                                                                   // ตัวเลขดิบ
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return Number(m[1].replace(/,/g, ''));
  }
  throw new Error('หาตัวเลขใน Google Finance ไม่เจอ (Google อาจเปลี่ยนหน้าเว็บ หรือขึ้นหน้ายืนยันคุกกี้)');
}

/** TradingView: ลอง scanner API ก่อน แล้วค่อยอ่านจากหน้าเว็บ เช่น 'RUS:RUSBC' */
async function tradingViewPrice_(symbol) {
  try {
    const api = 'https://scanner.tradingview.com/symbol?symbol=' + encodeURIComponent(symbol) + '&fields=close&no_404=true';
    const r = await fetch(api, { headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(20000) });
    const text = await r.text();
    if (r.status === 200) {
      const j = JSON.parse(text);
      if (j && typeof j.close === 'number') return j.close;
    }
    console.log('[TradingView] scanner API ใช้ไม่ได้: HTTP ' + r.status + ' ' + text.slice(0, 120));
  } catch (e) {
    console.log('[TradingView] scanner API ใช้ไม่ได้: ' + e.message);
  }
  const res = await fetch('https://www.tradingview.com/symbols/' + symbol.replace(':', '-') + '/', {
    headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(20000),
  });
  if (res.status !== 200) throw new Error('TradingView HTTP ' + res.status);
  const m = (await res.text()).match(/data-qa-id="symbol-last-value"[^>]*>\s*<span[^>]*>\s*([0-9][0-9.,]*)\s*</);
  if (m) return Number(m[1].replace(/,/g, ''));
  throw new Error('หาตัวเลขใน TradingView ไม่เจอ (โหลดตัวเลขด้วย JavaScript)');
}

/* ---------- หุ้นอังกฤษ / เยอรมัน / รัสเซีย (ประกาศหลังเที่ยงคืน) ---------- */
async function taskStocksLate_(db, force) {
  const hm = nowBkk_().slice(11, 16);
  const items = force
    ? STOCK_LATE.WINDOWS.flatMap(w => w.items)
    : STOCK_LATE.WINDOWS.filter(w => inWindow_(hm, w.from, w.to)).flatMap(w => w.items);
  if (!items.length) return 'นอกช่วงเวลา';

  const today = dateBkk_(), minDate = dateBkk_(-STOCK_LATE.MAX_AGE_DAYS);
  const loaded = await Promise.all(STOCK_LATE.SOURCES.map(loadOne_));   // ลำดับตาม SOURCES
  const out = [];
  for (const name of items) {
    const key = normName_(name);
    let pick = null;
    const seen = [];   // ไว้ดูใน Logs ว่าแต่ละเว็บมีผลอะไร (เหมือน Logger.log ในสคริปต์เดิม)
    for (const src of loaded) {
      if (!src.ok) { seen.push(src.key + ' ใช้ไม่ได้ (' + src.error + ')'); continue; }
      const r = src.map[key];
      if (!r) { seen.push(src.key + ' ไม่พบชื่อนี้'); continue; }
      const usable = r.three && r.date && r.date >= minDate && r.date <= today;
      seen.push(src.key + (r.three ? '=' + r.three : ' รอผล') + ' (' + (r.date || 'ไม่มีวันที่') + ')' +
        (r.three && r.date && !usable ? ' [วันที่ไม่อยู่ในช่วง ' + minDate + '..' + today + ']' : ''));
      if (!pick && usable) pick = { r, src: src.key };
    }
    out.push((pick
      ? (await save_(db, name, pick.r.date, pick.r.three, false)) + ' (จาก ' + pick.src + ')'
      : name + ': ยังไม่มีผล') + ' | พบใน: ' + seen.join(', '));
  }
  return out;
}
