# 🎪 Ranwa Tent House & Events — Website

**Churu, Rajasthan** | Contact: 9414776826 | Instagram: @ranwa_events_churu_

---

## ✅ Features

- Beautiful website with golden Rajasthani theme
- Online booking form with database storage
- Contact/enquiry form
- Customer reviews & testimonials
- Services showcase
- Gallery section (link to Instagram)
- WhatsApp chat button
- Admin dashboard to manage everything
- SQLite database (no separate server needed)
- Mobile responsive

---

## 🚀 Setup & Run (Step by Step)

### Step 1: Install Node.js
Download from: https://nodejs.org (choose LTS version)

### Step 2: Install dependencies
Open terminal/command prompt in the project folder and run:
```
npm install
```

### Step 3: Configure (optional)
```
copy .env.example .env
```
Then open `.env` file and change the `ADMIN_KEY` password.

### Step 4: Start the website
```
npm start
```

### Step 5: Open in browser
Go to: **http://localhost:3000**

Admin panel: **http://localhost:3000/admin**
Admin password: `ranwa2024admin` (change this in .env!)

---

## 📁 Project Structure

```
ranwa-website/
├── public/
│   ├── index.html      ← Main website
│   └── admin.html      ← Admin dashboard
├── server/
│   └── index.js        ← Backend server + API
├── database.db         ← Auto-created on first run
├── package.json
├── .env.example        ← Copy to .env
└── README.md
```

---

## 🌐 Hosting (Free Options)

### Option 1: Railway.app (Recommended - Free)
1. Go to https://railway.app
2. Sign up with GitHub
3. Upload this folder to GitHub
4. Connect repo to Railway
5. Set environment variable: `ADMIN_KEY=yourpassword`
6. Deploy! You get a free URL

### Option 2: Render.com (Free)
1. Go to https://render.com
2. New Web Service
3. Connect your GitHub repo
4. Build command: `npm install`
5. Start command: `npm start`

### Option 3: VPS/Hostinger
1. Upload files via FTP
2. Run `npm install && npm start`
3. Use PM2 for always-on: `npm install -g pm2 && pm2 start server/index.js`

---

## 📊 Admin Panel Features

- View all booking requests with customer details
- Confirm / Cancel / Mark Done bookings
- Direct call & WhatsApp buttons for each booking
- Read contact messages
- Approve/reject customer reviews
- Dashboard with key stats

Admin URL: `/admin`
Password: Set in `.env` file as `ADMIN_KEY`

---

## 📞 Support

For website help, contact the developer.
For business queries: **9414776826**
