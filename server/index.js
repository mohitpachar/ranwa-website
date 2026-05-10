require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, err => {
  if (err) console.error('DB error:', err);
  else console.log('✅ Database connected');
});

const run = (sql, p=[]) => new Promise((res,rej) =>
  db.run(sql, p, function(e){ e ? rej(e) : res({lastID:this.lastID,changes:this.changes}); }));
const all = (sql, p=[]) => new Promise((res,rej) =>
  db.all(sql, p, (e,r) => e ? rej(e) : res(r)));
const get = (sql, p=[]) => new Promise((res,rej) =>
  db.get(sql, p, (e,r) => e ? rej(e) : res(r)));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL,
    email TEXT, event_type TEXT NOT NULL, event_date TEXT NOT NULL,
    venue TEXT, guests INTEGER, services TEXT, message TEXT,
    status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  db.run(`CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, event_type TEXT,
    rating INTEGER DEFAULT 5, message TEXT NOT NULL, is_approved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL,
    email TEXT, subject TEXT, message TEXT NOT NULL, is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT,
    price_range TEXT, icon TEXT, is_active INTEGER DEFAULT 1)`);

  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, category TEXT DEFAULT 'wedding',
    image_url TEXT NOT NULL, description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  db.run(`CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT,
    device TEXT, os TEXT, browser TEXT,
    page TEXT, referrer TEXT, user_agent TEXT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  db.get('SELECT COUNT(*) as c FROM services', (err, row) => {
    if (!err && row && row.c === 0) {
      const s = db.prepare('INSERT INTO services (name,description,price_range,icon) VALUES (?,?,?,?)');
      [['Wedding Decoration','Complete shaadi decoration including mandap, stage, flower arrangements, lighting, and more.','Rs.50,000 - Rs.5,00,000','💍'],
       ['Tent & Shamiana','Premium quality tents and shamianas for all outdoor events — weddings, parties, and functions.','Rs.10,000 - Rs.1,00,000','⛺'],
       ['Birthday Parties','Fun and colorful decoration for birthday celebrations of all ages.','Rs.5,000 - Rs.50,000','🎂'],
       ['Corporate Events','Professional setup for seminars, conferences, product launches, and corporate gatherings.','Rs.20,000 - Rs.2,00,000','🏢'],
       ['Flower Decoration','Fresh and artificial flower arrangements — rangoli, mandap, stage, and car decoration.','Rs.8,000 - Rs.80,000','🌸'],
       ['Lighting & Sound','LED lighting, fairy lights, DJ sound system and complete audio-visual setup.','Rs.15,000 - Rs.1,50,000','✨'],
       ['Catering Setup','Complete catering arrangement including furniture, crockery, and serving staff.','Rs.25,000 - Rs.3,00,000','🍽️'],
       ['Photography Backdrop','Custom photo booths, backdrops, and props for memorable photo moments.','Rs.5,000 - Rs.30,000','📸'],
      ].forEach(x => s.run(...x));
      s.finalize();
    }
  });

  db.get('SELECT COUNT(*) as c FROM testimonials', (err, row) => {
    if (!err && row && row.c === 0) {
      const t = db.prepare('INSERT INTO testimonials (name,event_type,rating,message,is_approved) VALUES (?,?,?,?,1)');
      t.run('Ramesh Sharma','Wedding',5,'Ranwa Tent House ne hamari shaadi ko sapnon ki shaadi bana diya. Decoration ekdum zabardast thi. Churu mein sabse best!');
      t.run('Priya Agarwal','Birthday Party',5,'Meri beti ki birthday party ke liye bahut hi sundar decoration ki. Sab ne bahut tarif ki. Prices bhi reasonable hain.');
      t.run('Sunil Joshi','Corporate Event',5,'Very professional team and excellent execution. Highly recommended!');
      t.run('Kavita Devi','Wedding',5,'Hamari beti ki shaadi mein itna achha kaam kiya. Poora parivaar impressed tha. Thank you Ranwa ji!');
      t.finalize();
    }
  });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 500 }));

function parseUA(ua) {
  ua = ua || '';
  let device = 'Desktop';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) device = 'Mobile';
  else if (/iPad|Tablet/i.test(ua)) device = 'Tablet';

  let os = 'Unknown';
  if      (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android ([\d.]+)/i.test(ua)) os = 'Android ' + ua.match(/Android ([\d.]+)/i)[1];
  else if (/iPhone OS ([\d_]+)/i.test(ua)) os = 'iOS ' + ua.match(/iPhone OS ([\d_]+)/i)[1].replace(/_/g,'.');
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if      (/Edg\/([\d]+)/i.test(ua))    browser = 'Edge '    + ua.match(/Edg\/([\d]+)/i)[1];
  else if (/OPR\//i.test(ua))           browser = 'Opera';
  else if (/Chrome\/([\d]+)/i.test(ua)) browser = 'Chrome '  + ua.match(/Chrome\/([\d]+)/i)[1];
  else if (/Firefox\/([\d]+)/i.test(ua))browser = 'Firefox ' + ua.match(/Firefox\/([\d]+)/i)[1];
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

  return { device, os, browser };
}

// Visitor tracking endpoint (called from frontend)
app.post('/api/track', async (req, res) => {
  try {
    const ua = req.headers['user-agent'] || '';
    if (/bot|crawler|spider|curl|wget/i.test(ua)) return res.json({ ok: true });
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();
    const { page, referrer } = req.body || {};
    const { device, os, browser } = parseUA(ua);
    await run(
      'INSERT INTO visitors (ip,device,os,browser,page,referrer,user_agent) VALUES (?,?,?,?,?,?,?)',
      [ip, device, os, browser, page||'/', referrer||'Direct', ua.substring(0,400)]
    );
    res.json({ ok: true });
  } catch(e) { res.json({ ok: true }); }
});

const ADMIN_KEY = () => process.env.ADMIN_KEY || 'ranwa2024admin';
const checkAdmin = (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY()) { res.status(403).json({ error: 'Unauthorized' }); return false; }
  return true;
};

// ── Public APIs ──
app.get('/api/services', async (req, res) => {
  try { res.json({ success:true, data: await all('SELECT * FROM services WHERE is_active=1') }); }
  catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

app.get('/api/testimonials', async (req, res) => {
  try { res.json({ success:true, data: await all('SELECT * FROM testimonials WHERE is_approved=1 ORDER BY created_at DESC') }); }
  catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// Public gallery — metadata only (images fetched by ID)
app.get('/api/gallery', async (req, res) => {
  try {
    const rows = await all('SELECT id,title,category,description,created_at FROM gallery ORDER BY created_at DESC');
    res.json({ success:true, data: rows });
  } catch(e) { res.json({ success:true, data:[] }); }
});

// Serve image binary by ID
app.get('/api/gallery/image/:id', async (req, res) => {
  try {
    const row = await get('SELECT image_url FROM gallery WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).send('Not found');
    const match = row.image_url.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return res.status(400).send('Bad data');
    res.set('Content-Type', match[1]);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(match[2], 'base64'));
  } catch(e) { res.status(500).send('Error'); }
});

app.post('/api/bookings', async (req, res) => {
  const { name, phone, event_type, event_date } = req.body;
  if (!name || !phone || !event_type || !event_date)
    return res.status(400).json({ success:false, error:'Required fields missing.' });
  const cleanPhone = String(phone).replace(/[\s\-\(\)\+]/g,'');
  if (!/^\d{7,15}$/.test(cleanPhone))
    return res.status(400).json({ success:false, error:'Valid phone number required.' });
  try {
    const { email, venue, guests, services, message } = req.body;
    const svc = Array.isArray(services) ? JSON.stringify(services) : (services||'[]');
    const r = await run(
      'INSERT INTO bookings (name,phone,email,event_type,event_date,venue,guests,services,message) VALUES (?,?,?,?,?,?,?,?,?)',
      [name, phone, email||null, event_type, event_date, venue||null, guests||null, svc, message||null]
    );
    console.log('✅ Booking #' + r.lastID, name, phone, event_type);
    res.json({ success:true, message:'Booking mili! Hum 24 ghante mein call karenge. ✅', id:r.lastID });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

app.post('/api/contact', async (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone || !message)
    return res.status(400).json({ success:false, error:'Naam, phone aur message required.' });
  try {
    const { email, subject } = req.body;
    await run('INSERT INTO contacts (name,phone,email,subject,message) VALUES (?,?,?,?,?)',
      [name, phone, email||null, subject||null, message]);
    res.json({ success:true, message:'Message bhej diya! Jald reply karenge. ✅' });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

app.post('/api/testimonials', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) return res.status(400).json({ success:false, error:'Naam aur review required.' });
  try {
    const { event_type, rating } = req.body;
    await run('INSERT INTO testimonials (name,event_type,rating,message,is_approved) VALUES (?,?,?,?,0)',
      [name, event_type||null, rating||5, message]);
    res.json({ success:true, message:'Review mili! Approval ke baad publish hogi. ✅' });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

// ── Admin APIs ──
app.get('/api/admin/stats', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try {
    const [tb,pb,cb,tc,uc,pr,tv,tg] = await Promise.all([
      get('SELECT COUNT(*) as c FROM bookings'),
      get("SELECT COUNT(*) as c FROM bookings WHERE status='pending'"),
      get("SELECT COUNT(*) as c FROM bookings WHERE status='confirmed'"),
      get('SELECT COUNT(*) as c FROM contacts'),
      get('SELECT COUNT(*) as c FROM contacts WHERE is_read=0'),
      get('SELECT COUNT(*) as c FROM testimonials WHERE is_approved=0'),
      get('SELECT COUNT(*) as c FROM visitors'),
      get('SELECT COUNT(*) as c FROM gallery'),
    ]);
    res.json({ success:true, data:{
      total_bookings:tb.c, pending_bookings:pb.c, confirmed_bookings:cb.c,
      total_contacts:tc.c, unread_contacts:uc.c, pending_reviews:pr.c,
      total_visitors:tv.c, gallery_count:tg.c,
    }});
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

app.get('/api/admin/bookings', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try { res.json({ success:true, data: await all('SELECT * FROM bookings ORDER BY created_at DESC') }); }
  catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

app.patch('/api/admin/bookings/:id', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try { await run('UPDATE bookings SET status=? WHERE id=?',[req.body.status,req.params.id]); res.json({success:true}); }
  catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.get('/api/admin/contacts', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try {
    const data = await all('SELECT * FROM contacts ORDER BY created_at DESC');
    await run('UPDATE contacts SET is_read=1');
    res.json({ success:true, data });
  } catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.get('/api/admin/testimonials', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try { res.json({ success:true, data: await all('SELECT * FROM testimonials ORDER BY is_approved ASC, created_at DESC') }); }
  catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.patch('/api/admin/testimonials/:id', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try { await run('UPDATE testimonials SET is_approved=? WHERE id=?',[req.body.is_approved,req.params.id]); res.json({success:true}); }
  catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.post('/api/admin/gallery', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  const { title, category, image_url, description } = req.body;
  if (!image_url) return res.status(400).json({ success:false, error:'Image required.' });
  if (image_url.length > 15000000) return res.status(400).json({ success:false, error:'Image too large. Resize to under 2MB.' });
  try {
    const r = await run('INSERT INTO gallery (title,category,image_url,description) VALUES (?,?,?,?)',
      [title||'Gallery Image', category||'wedding', image_url, description||'']);
    console.log('🖼️ Gallery image uploaded, ID:', r.lastID);
    res.json({ success:true, id:r.lastID, message:'Image upload ho gayi! ✅' });
  } catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.get('/api/admin/gallery', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try { res.json({ success:true, data: await all('SELECT id,title,category,description,created_at FROM gallery ORDER BY created_at DESC') }); }
  catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.delete('/api/admin/gallery/:id', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try { await run('DELETE FROM gallery WHERE id=?',[req.params.id]); res.json({success:true}); }
  catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.get('/api/admin/visitors', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try { res.json({ success:true, data: await all('SELECT * FROM visitors ORDER BY visited_at DESC LIMIT 500') }); }
  catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.get('/api/admin/visitor-stats', async (req, res) => {
  if (!checkAdmin(req,res)) return;
  try {
    const [total, today, thisWeek, devices, browsers, pages, recent] = await Promise.all([
      get('SELECT COUNT(*) as c FROM visitors'),
      get("SELECT COUNT(*) as c FROM visitors WHERE date(visited_at)=date('now','localtime')"),
      get("SELECT COUNT(*) as c FROM visitors WHERE visited_at >= datetime('now','-7 days')"),
      all('SELECT device, COUNT(*) as c FROM visitors GROUP BY device ORDER BY c DESC'),
      all('SELECT browser, COUNT(*) as c FROM visitors GROUP BY browser ORDER BY c DESC LIMIT 6'),
      all('SELECT page, COUNT(*) as c FROM visitors GROUP BY page ORDER BY c DESC LIMIT 6'),
      all('SELECT ip,device,os,browser,page,referrer,visited_at FROM visitors ORDER BY visited_at DESC LIMIT 50'),
    ]);
    res.json({ success:true, data:{ total:total.c, today:today.c, thisWeek:thisWeek.c, devices, browsers, pages, recent } });
  } catch(e) { res.status(500).json({success:false,error:e.message}); }
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) res.sendFile(path.join(__dirname,'../public/admin.html'));
  else res.sendFile(path.join(__dirname,'../public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🎪 Ranwa Tent House: http://localhost:' + PORT);
  console.log('📊 Admin: http://localhost:' + PORT + '/admin');
  console.log('🔑 Key: ' + (process.env.ADMIN_KEY || 'ranwa2024admin') + '\n');
});
