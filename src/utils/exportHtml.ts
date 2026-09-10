import { Student } from '../types';

export function downloadStandaloneHtml(students: Student[]): void {
  const currentStudentsJson = JSON.stringify(students);

  const htmlContent = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مدیریت برنامه کلاس شاگردان (نسخه کاملاً آفلاین)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Vazirmatn', Tahoma, sans-serif; }
    body { background-color: #f8fafc; color: #1e293b; padding: 20px; line-height: 1.6; }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { background: #2563eb; color: white; padding: 24px; border-radius: 16px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .header p { font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; margin-top: 8px; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; outline: none; }
    input:focus, select:focus, textarea:focus { border-color: #2563eb; }
    button { cursor: pointer; border: none; font-weight: 600; border-radius: 8px; padding: 10px 16px; font-size: 14px; transition: all 0.2s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-success { background: #16a34a; color: white; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-outline { background: white; border: 1px solid #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f1f5f9; }
    .actions-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; align-items: center; justify-content: space-between; }
    .search-input { min-width: 250px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #f8fafc; color: #475569; font-size: 13px; font-weight: 600; text-align: right; padding: 12px 14px; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
    .actions-cell { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-sm { padding: 6px 10px; font-size: 12px; }
    .sessions-box { background: #f8fafc; padding: 8px 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; white-space: pre-line; max-height: 80px; overflow-y: auto; border: 1px solid #e2e8f0; }
    .empty-state { text-align: center; padding: 40px 20px; color: #64748b; }
    @media print {
      .no-print { display: none !important; }
      body { background: white; padding: 0; }
      .card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header no-print">
      <h1>📚 سامانه مدیریت برنامه کلاس شاگردان (آفلاین کامل)</h1>
      <p>این فایل کامپیوتر یا گوشی شما بدون نیاز به اینترنت و بدون هاست اجرا می‌شود و اطلاعات در مرورگر ذخیره می‌ماند.</p>
      <div class="badge">وضعیت: کاملاً آفلاین و آماده به کار ✓</div>
    </div>

    <!-- فرم افزودن شاگرد -->
    <div class="card no-print" id="formCard">
      <h2 style="font-size: 16px; margin-bottom: 14px; color: #1e293b;" id="formTitle">➕ ثبت شاگرد جدید</h2>
      <input type="hidden" id="editStudentId" value="">
      <div class="form-grid">
        <div>
          <label>نام و نام‌خانوادگی شاگرد:</label>
          <input type="text" id="stdName" placeholder="مثال: بهروز خان احمدلو">
        </div>
        <div>
          <label>شماره تماس:</label>
          <input type="tel" id="stdPhone" placeholder="مثال: 09123456789">
        </div>
        <div>
          <label>ماه کلاس:</label>
          <input type="text" id="stdMonth" placeholder="مثال: مهر یا آبان" value="مهر">
        </div>
        <div>
          <label>تعداد جلسات در ماه:</label>
          <input type="number" id="stdSessionsCount" placeholder="مثال: 8" value="8">
        </div>
        <div>
          <label>وضعیت پرداخت مالی:</label>
          <select id="stdPaymentStatus">
            <option value="پرداخت شده">پرداخت شده</option>
            <option value="بدهکار">بدهکار</option>
            <option value="تسویه">تسویه</option>
            <option value="در انتظار پرداخت">در انتظار پرداخت</option>
            <option value="پیش‌پرداخت">پیش‌پرداخت</option>
          </select>
        </div>
      </div>
      <div style="margin-top: 14px;">
        <label>روزها و ساعت‌های کلاس (هر جلسه در یک سطر):</label>
        <textarea id="stdSessionsText" rows="4" placeholder="مثال:
شنبه ۱ مهر ساعت ۱۶:۰۰
دوشنبه ۳ مهر ساعت ۱۶:۰۰
شنبه ۸ مهر ساعت ۱۶:۰۰"></textarea>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 10px;">
        <button class="btn-primary" onclick="saveStudent()">💾 ثبت شاگرد</button>
        <button class="btn-outline" id="cancelEditBtn" style="display: none;" onclick="cancelEdit()">انصراف</button>
      </div>
    </div>

    <!-- جدول شاگردان -->
    <div class="card">
      <div class="actions-bar no-print">
        <h2 style="font-size: 16px; color: #1e293b;">📋 لیست شاگردان ثبت شده</h2>
        <input type="text" id="searchInput" class="search-input" placeholder="🔍 جستجوی نام، تلفن یا ماه..." oninput="renderTable()">
      </div>
      <div style="overflow-x: auto;">
        <table>
          <thead>
            <tr>
              <th>نام شاگرد</th>
              <th>ماه</th>
              <th>تعداد</th>
              <th>وضعیت پرداخت</th>
              <th>روزها و ساعات</th>
              <th class="no-print">عملیات</th>
            </tr>
          </thead>
          <tbody id="studentTbody"></tbody>
        </table>
      </div>
      <div id="emptyMsg" class="empty-state" style="display: none;">هنوز شاگردی ثبت نشده است.</div>
    </div>
  </div>

  <script>
    const STORAGE_KEY = 'my_class_data';
    let students = [];

    // بارگذاری اطلاعات
    function init() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { students = JSON.parse(saved); } catch(e) { students = []; }
      } else {
        students = ${currentStudentsJson};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      }
      renderTable();
    }

    function saveStudent() {
      const id = document.getElementById('editStudentId').value;
      const name = document.getElementById('stdName').value.trim();
      const phone = document.getElementById('stdPhone').value.trim();
      const month = document.getElementById('stdMonth').value.trim();
      const count = document.getElementById('stdSessionsCount').value.trim();
      const paymentStatus = document.getElementById('stdPaymentStatus').value;
      const text = document.getElementById('stdSessionsText').value.trim();

      if (!name) { alert('لطفاً نام شاگرد را وارد کنید'); return; }

      if (id) {
        // ویرایش
        const idx = students.findIndex(s => String(s.id) === String(id));
        if (idx !== -1) {
          students[idx].name = name;
          students[idx].phone = phone;
          students[idx].month = month;
          students[idx].totalSessions = count;
          students[idx].paymentStatus = paymentStatus;
          students[idx].sessionsText = text;
        }
      } else {
        // جدید
        students.push({
          id: 'std_' + Date.now(),
          name: name,
          phone: phone,
          month: month || 'ماه جاری',
          totalSessions: count || '0',
          paymentStatus: paymentStatus || 'در انتظار پرداخت',
          sessionsText: text,
          createdAt: Date.now()
        });
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      cancelEdit();
      renderTable();
      alert('با موفقیت ثبت شد.');
    }

    function editStudent(id) {
      const s = students.find(item => String(item.id) === String(id));
      if (!s) return;
      document.getElementById('editStudentId').value = s.id;
      document.getElementById('stdName').value = s.name;
      document.getElementById('stdPhone').value = s.phone || '';
      document.getElementById('stdMonth').value = s.month || '';
      document.getElementById('stdSessionsCount').value = s.totalSessions || '';
      document.getElementById('stdPaymentStatus').value = s.paymentStatus || 'در انتظار پرداخت';
      document.getElementById('stdSessionsText').value = s.sessionsText || '';

      document.getElementById('formTitle').innerText = '✏️ ویرایش اطلاعات: ' + s.name;
      document.getElementById('cancelEditBtn').style.display = 'inline-block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function cancelEdit() {
      document.getElementById('editStudentId').value = '';
      document.getElementById('stdName').value = '';
      document.getElementById('stdPhone').value = '';
      document.getElementById('stdMonth').value = 'مهر';
      document.getElementById('stdSessionsCount').value = '8';
      document.getElementById('stdPaymentStatus').value = 'در انتظار پرداخت';
      document.getElementById('stdSessionsText').value = '';
      document.getElementById('formTitle').innerText = '➕ ثبت شاگرد جدید';
      document.getElementById('cancelEditBtn').style.display = 'none';
    }

    function deleteStudent(id) {
      if (!confirm('آیا از حذف این شاگرد اطمینان دارید؟')) return;
      students = students.filter(s => String(s.id) !== String(id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
      renderTable();
    }

    function sendWhatsApp(id) {
      const s = students.find(item => String(item.id) === String(id));
      if (!s) return;
      let msg = 'سلام ' + s.name + ' عزیز\\n';
      msg += 'برنامه کلاس‌های شما برای ماه ' + s.month + ' (' + s.totalSessions + ' جلسه):\\n\\n';
      msg += s.sessionsText + '\\n\\nبا آرزوی موفقیت ✨';

      let phone = (s.phone || '').replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) phone = '98' + phone.substring(1);

      const url = phone ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg) : 'https://wa.me/?text=' + encodeURIComponent(msg);
      window.open(url, '_blank');
    }

    function printStudent(id) {
      const s = students.find(item => String(item.id) === String(id));
      if (!s) return;
      const today = new Date().toLocaleDateString('fa-IR');
      const w = window.open('', '_blank', 'width=650,height=700');
      w.document.write(\`
        <html dir="rtl" lang="fa">
        <head>
          <title>برنامه کلاسی \${s.name}</title>
          <style>
            body { font-family: Tahoma, sans-serif; padding: 25px; line-height: 1.8; color: #1e293b; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
            .badge { background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; }
            .sessions { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; white-space: pre-line; margin-top: 14px; font-size: 14px; }
            .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 14px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><strong>کارت برنامه کلاس شاگرد</strong></div>
            <div class="badge">تاریخ صدور: \${today}</div>
          </div>
          <p><strong>نام شاگرد:</strong> \${s.name}</p>
          <p><strong>ماه کلاس:</strong> \${s.month} | <strong>تعداد جلسات:</strong> \${s.totalSessions} جلسه</p>
          <div class="sessions"><strong>📅 برنامه زمانبندی جلسات:</strong><br>\${s.sessionsText || 'برنامه‌ای ثبت نشده'}</div>
          <div class="footer">این برگه معتبر و جهت اطلاع شاگرد و هماهنگی کلاس می‌باشد.</div>
          <script>window.onload = function() { window.print(); }<\\/script>
        </body>
        </html>
      \`);
      w.document.close();
    }

    function renderTable() {
      const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
      const tbody = document.getElementById('studentTbody');
      tbody.innerHTML = '';

      const filtered = students.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.month && s.month.includes(q))
      );

      if (filtered.length === 0) {
        document.getElementById('emptyMsg').style.display = 'block';
        return;
      }
      document.getElementById('emptyMsg').style.display = 'none';

      filtered.forEach(s => {
        const tr = document.createElement('tr');
        const st = s.paymentStatus || 'در انتظار پرداخت';
        let stColor = '#b45309';
        let stBg = '#fef3c7';
        if (st === 'پرداخت شده' || st === 'تسویه') { stColor = '#047857'; stBg = '#d1fae5'; }
        else if (st === 'بدهکار') { stColor = '#b91c1c'; stBg = '#ffe4e6'; }

        tr.innerHTML = \`
          <td><strong>\${s.name}</strong><br><small style="color:#64748b">\${s.phone || '-'}</small></td>
          <td><span style="background:#eff6ff; color:#2563eb; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:600">\${s.month}</span></td>
          <td><strong>\${s.totalSessions}</strong> جلسه</td>
          <td><span style="background:\${stBg}; color:\${stColor}; padding:3px 10px; border-radius:9999px; font-size:12px; font-weight:bold;">\${st}</span></td>
          <td><div class="sessions-box">\${s.sessionsText || '-'}</div></td>
          <td class="no-print">
            <div class="actions-cell">
              <button class="btn-sm btn-success" onclick="sendWhatsApp('\${s.id}')">واتساپ</button>
              <button class="btn-sm btn-outline" onclick="printStudent('\${s.id}')">🖨️ چاپ</button>
              <button class="btn-sm btn-outline" onclick="editStudent('\${s.id}')">✏️ ویرایش</button>
              <button class="btn-sm btn-danger" onclick="deleteStudent('\${s.id}')">🗑️ حذف</button>
            </div>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    window.onload = init;
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-class-manager-offline.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
