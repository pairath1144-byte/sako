ระบบนิเทศออนไลน์ โรงเรียนบ้านสากอ - Mobile App Responsive

ไฟล์สำคัญ
1) index.html = หน้าแอปมือถือ
2) app.js = ตั้งค่า Google Sheets / Apps Script URL
3) google_apps_script.gs = โค้ดสำหรับวางใน Google Apps Script
4) manifest.json + service-worker.js = ทำให้ติดตั้งเป็น PWA บนมือถือได้

วิธีเชื่อม Google Sheets
1. เปิด Google Sheet ของโรงเรียน
2. ตรวจให้มีชีตชื่อ Sheet1
3. เปิด Extensions > Apps Script
4. วางโค้ดจากไฟล์ google_apps_script.gs
5. กด Run ฟังก์ชัน setupHeader 1 ครั้ง เพื่อสร้างหัวตาราง
6. Deploy > New deployment > Web app
   - Execute as: Me
   - Who has access: Anyone
7. คัดลอก Web app URL
8. เปิดไฟล์ app.js แล้วนำ URL ไปแทน YOUR_GOOGLE_APPS_SCRIPT_URL

วิธีเปิดใช้งาน
- อัปโหลดโฟลเดอร์นี้ขึ้น GitHub Pages / Netlify / Firebase Hosting
- เปิดผ่านมือถือ แล้วกด Add to Home Screen
