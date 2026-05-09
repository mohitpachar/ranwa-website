require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');


const app = express();
app.use(express.static(path.join(__dirname, '../public')));
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('DB error:', err);
  else console.log('✅ Database connected');
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes }); });
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL,
    email TEXT, event_type TEXT NOT NULL, event_date TEXT NOT NULL, venue TEXT NOT NULL,guests INTEGER, services TEXT, message TEXT, status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
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
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, category TEXT,
    image_url TEXT NOT NULL, description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  db.get('SELECT COUNT(*) as c FROM services', (err, row) => {
    if (!err && row && row.c === 0) {
      const s = db.prepare('INSERT INTO services (name, description, price_range, icon) VALUES (?, ?, ?, ?)');
      [['Wedding Decoration','Complete shaadi decoration including mandap, stage, flower arrangements, lighting, and more.','₹50,000 - ₹5,00,000','💍'],
       ['Tent & Shamiana','Premium quality tents and shamianas for all outdoor events — weddings, parties, and functions.','₹10,000 - ₹1,00,000','⛺'],
       ['Birthday Parties','Fun and colorful decoration for birthday celebrations of all ages.','₹5,000 - ₹50,000','🎂'],
       ['Corporate Events','Professional setup for seminars, conferences, product launches, and corporate gatherings.','₹20,000 - ₹2,00,000','🏢'],
       ['Flower Decoration','Fresh and artificial flower arrangements — rangoli, mandap, stage, and car decoration.','₹8,000 - ₹80,000','🌸'],
       ['Lighting & Sound','LED lighting, fairy lights, DJ sound system and complete audio-visual setup.','₹15,000 - ₹1,50,000','✨'],
       ['Catering Setup','Complete catering arrangement including furniture, crockery, and serving staff.','₹25,000 - ₹3,00,000','🍽️'],
       ['Photography Backdrop','Custom photo booths, backdrops, and props for memorable photo moments.','₹5,000 - ₹30,000','📸'],
      ].forEach(x => s.run(...x));
      s.finalize();
    }
  });

  db.get('SELECT COUNT(*) as c FROM testimonials', (err, row) => {
    if (!err && row && row.c === 0) {
      const t = db.prepare('INSERT INTO testimonials (name, event_type, rating, message, is_approved) VALUES (?, ?, ?, ?, 1)');
      t.run('Ramesh Sharma','Wedding',5,'Ranwa Tent House ne hamari shaadi ko sapnon ki shaadi bana diya. Decoration ekdum zabardast thi. Churu mein sabse best!');
      t.run('Priya Agarwal','Birthday Party',5,'Meri beti ki birthday party ke liye bahut hi sundar decoration ki. Sab ne bahut tarif ki. Prices bhi reasonable hain.');
      t.run('Sunil Joshi','Corporate Event',5,'We organized our company annual function with Ranwa Events. Very professional team and excellent execution. Highly recommended!');
      t.run('Kavita Devi','Wedding',5,'Hamari beti ki shaadi mein itna achha kaam kiya ki hum bahut khush hain. Poora parivaar impressed tha. Thank you Ranwa ji!');
      t.finalize();
    }
  });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

const ADMIN_KEY = () => process.env.ADMIN_KEY || 'ranwa2024admin';
const checkAdmin = (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY()) { res.status(403).json({ error: 'Unauthorized' }); return false; }
  return true;
};

app.get('/api/services', async (req, res) => {
  try { res.json({ success: true, data: await all('SELECT * FROM services WHERE is_active = 1') }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/bookings', async (req, res) => {
  console.log('📋 Booking received:', JSON.stringify(req.body));
  const { name, phone, event_type, event_date } = req.body;
  if (!name || !phone || !event_type || !event_date)
    return res.status(400).json({ success: false, error: 'Name, phone, event type, and date are required.' });
  const cleanPhone = String(phone).replace(/[\s\-\(\)\+]/g, '');
  if (!/^\d{7,15}$/.test(cleanPhone))
    return res.status(400).json({ success: false, error: 'Please enter a valid mobile number.' });
  try {
    const { email, venue, guests, services, message } = req.body;
    const servicesStr = Array.isArray(services) ? JSON.stringify(services) : (services || '[]');
    const r = await run(
      'INSERT INTO bookings (name,phone,email,event_type,event_date,venue,guests,services,message) VALUES (?,?,?,?,?,?,?,?,?)',
      [name, phone, email||null, event_type, event_date, venue||null, guests||null, servicesStr, message||null]
    );
    console.log('✅ Booking saved, ID:', r.lastID);
    res.json({ success: true, message: 'Booking request received! Hum 24 ghante mein call karenge. ✅', id: r.lastID });
  } catch (e) {
    console.error('❌ Booking error:', e.message);
    res.status(500).json({ success: false, error: 'Server error: ' + e.message });
  }
});

app.post('/api/contact', async (req, res) => {
  console.log('💬 Contact received:', JSON.stringify(req.body));
  const { name, phone, message } = req.body;
  if (!name || !phone || !message)
    return res.status(400).json({ success: false, error: 'Name, phone, and message are required.' });
  try {
    const { email, subject } = req.body;
    await run('INSERT INTO contacts (name,phone,email,subject,message) VALUES (?,?,?,?,?)',
      [name, phone, email||null, subject||null, message]);
    res.json({ success: true, message: 'Message sent! Hum jald hi contact karenge. ✅' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/testimonials', async (req, res) => {
  try { res.json({ success: true, data: await all('SELECT * FROM testimonials WHERE is_approved=1 ORDER BY created_at DESC') }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/testimonials', async (req, res) => {
  console.log('⭐ Review received:', JSON.stringify(req.body));
  const { name, message } = req.body;
  if (!name || !message) return res.status(400).json({ success: false, error: 'Name and message required.' });
  try {
    const { event_type, rating } = req.body;
    await run('INSERT INTO testimonials (name,event_type,rating,message,is_approved) VALUES (?,?,?,?,0)',
      [name, event_type||null, rating||5, message]);
    res.json({ success: true, message: 'Review submit ho gayi! Approval ke baad publish hogi. ✅' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/gallery', async (req, res) => {
  try { res.json({ success: true, data: await all('SELECT id,title,category,image_url,description,created_at FROM gallery ORDER BY created_at DESC') }); }
  catch (e) { res.status(500).json({ success: false, data: [] }); }
});

app.post('/api/admin/gallery', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { title, category, image_data, description } = req.body;
  if (!image_data) return res.status(400).json({ success: false, error: 'Image required.' });
  try {
    const r = await run('INSERT INTO gallery (title,category,image_url,description) VALUES (?,?,?,?)',
      [title||'Gallery Image', category||'wedding', image_data, description||'']);
    res.json({ success: true, id: r.lastID });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/admin/gallery/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { await run('DELETE FROM gallery WHERE id=?', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/bookings', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { res.json({ success: true, data: await all('SELECT * FROM bookings ORDER BY created_at DESC') }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/admin/bookings/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { await run('UPDATE bookings SET status=? WHERE id=?', [req.body.status, req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/contacts', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { res.json({ success: true, data: await all('SELECT * FROM contacts ORDER BY created_at DESC') }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/testimonials', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { res.json({ success: true, data: await all('SELECT * FROM testimonials ORDER BY is_approved ASC, created_at DESC') }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/admin/testimonials/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { await run('UPDATE testimonials SET is_approved=? WHERE id=?', [req.body.is_approved, req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/admin/stats', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const [tb, pb, cb, tc, uc, pr] = await Promise.all([
      get('SELECT COUNT(*) as c FROM bookings'),
      get("SELECT COUNT(*) as c FROM bookings WHERE status='pending'"),
      get("SELECT COUNT(*) as c FROM bookings WHERE status='confirmed'"),
      get('SELECT COUNT(*) as c FROM contacts'),
      get('SELECT COUNT(*) as c FROM contacts WHERE is_read=0'),
      get('SELECT COUNT(*) as c FROM testimonials WHERE is_approved=0'),
    ]);
    res.json({ success: true, data: {
      total_bookings: tb.c, pending_bookings: pb.c, confirmed_bookings: cb.c,
      total_contacts: tc.c, unread_contacts: uc.c, pending_reviews: pr.c,
    }});
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/health', (req, res) => {
  res.send('OK');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
