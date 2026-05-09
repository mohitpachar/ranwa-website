# 🚀 Ranwa Website - Deployment Guide

## ✅ Is the site ready to deploy?

**HAAN! Bilkul ready hai.** The site can handle many users at once.
- SQLite database works fine for small-medium traffic
- Express.js is production-ready
- All forms validated front-end + back-end

---

## 🆓 FREE HOSTING — Railway.app (Sabse Aasaan)

### Step 1: GitHub pe upload karein
1. Go to https://github.com and create free account
2. Click "New Repository" → name it `ranwa-website` → Create
3. On your PC, open folder in terminal and run:
```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/AAPKA_USERNAME/ranwa-website.git
git push -u origin main
```

### Step 2: Railway pe deploy karein
1. Go to https://railway.app
2. "Login with GitHub" karein
3. "New Project" → "Deploy from GitHub repo"
4. Apna `ranwa-website` repo select karein
5. Railway automatically detect karega ki yeh Node.js project hai
6. "Deploy" click karein

### Step 3: Environment variable set karein
Railway dashboard mein:
- Variables tab → Add variable:
  - `ADMIN_KEY` = `koi_bhi_strong_password`
  - `PORT` = `3000`

### Step 4: Domain milega
Railway free `.railway.app` subdomain dega jaise:
`ranwa-website-production.railway.app`

**Total time: 15-20 minutes. Cost: FREE** ✅

---

## 💰 PAID HOSTING — Custom Domain ke saath (Best Option)

### Option A: Hostinger (₹99/month)
1. https://hostinger.in pe jaein
2. "Business Hosting" plan lein
3. cPanel mein "Node.js" section dhundein
4. Files upload karein via File Manager
5. `npm install` aur `npm start` run karein
6. Custom domain connect karein (ranwaevents.com)

### Option B: DigitalOcean Droplet (₹600/month)
Best for high traffic. Full control.

---

## 🌐 Custom Domain (ranwaevents.com)

Domain register karein:
- https://godaddy.com (~₹800/year)
- https://namecheap.com (~₹700/year)
- https://hostinger.in (~₹600/year)

Suggested domain names:
- ranwaevents.com
- ranwatenthousse.com  
- ranwachuru.com
- ranwaevents.in

---

## 🔒 Security Checklist Before Going Live

1. Change admin password in `.env`:
   ```
   ADMIN_KEY=RanwaAdmin@2024#Churu
   ```
2. The site already has:
   - ✅ Rate limiting (spam protection)
   - ✅ Helmet.js (security headers)
   - ✅ Input validation
   - ✅ SQL injection protection

---

## 📱 After Deployment

Share these with customers:
- Website: `your-domain.com`
- Booking: `your-domain.com/#booking`
- Admin: `your-domain.com/admin`

---

## ❓ Common Issues

**"Cannot find module sqlite3"**
→ Run `npm install` again

**"Port already in use"**
→ Change PORT in `.env` to 3001

**Site not loading after deploy**
→ Check that START command is `npm start` in hosting dashboard
