/* Stackly demo auth + data layer (browser localStorage, no server) */
(function (w) {
  var K = 'stk_db_v1', S = 'stk_session_v1', mem = null;
  function iso(n) { return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); }
  function seed() {
    var t = Date.now();
    return {
      seq: 1100,
      admins: [{ id: 'ADMIN01', name: 'Priya Nair', email: 'admin@stackly.in', pass: 'admin123' }],
      clients: [
        { id: 'CL1001', name: 'Rohan Mehta', email: 'rohan@example.com', phone: '98450 11223', pass: 'client123', score: 648, plan: 'Growth', status: 'Active', joined: iso(-60) },
        { id: 'CL1002', name: 'Ananya Rao', email: 'ananya@example.com', phone: '99001 22334', pass: 'client123', score: 702, plan: 'Starter', status: 'Active', joined: iso(-35) },
        { id: 'CL1003', name: 'Imran Khan', email: 'imran@example.com', phone: '97400 55667', pass: 'client123', score: 590, plan: 'Premium', status: 'Active', joined: iso(-12) },
        { id: 'CL1004', name: 'Sneha Iyer', email: 'sneha@example.com', phone: '98860 77889', pass: 'client123', score: 676, plan: 'Growth', status: 'Paused', joined: iso(-90) }
      ],
      disputes: [
        { id: 'D1001', cid: 'CL1001', bureau: 'CIBIL', type: 'Incorrect late payment', item: 'HDFC credit card - Mar 2025 late mark', reason: 'Payment was made on time; bank statement attached.', date: iso(-20), status: 'In review' },
        { id: 'D1002', cid: 'CL1001', bureau: 'Experian', type: 'Duplicate account', item: 'Personal loan listed twice', reason: 'Same loan appears as two accounts.', date: iso(-45), status: 'Resolved', credited: true },
        { id: 'D1003', cid: 'CL1002', bureau: 'Equifax', type: 'Wrong balance', item: 'Auto loan outstanding amount', reason: 'Loan closed in 2024 but still shows balance.', date: iso(-8), status: 'Submitted' },
        { id: 'D1004', cid: 'CL1003', bureau: 'CIBIL', type: 'Account not mine', item: 'Unknown card from ICICI', reason: 'I never applied for this card.', date: iso(-5), status: 'In review' },
        { id: 'D1005', cid: 'CL1004', bureau: 'CRIF High Mark', type: 'Settled account shown as open', item: 'Bajaj personal loan', reason: 'Settled in full, NOC available.', date: iso(-70), status: 'Rejected' }
      ],
      docs: [
        { id: 'F1001', cid: 'CL1001', name: 'HDFC-statement-Mar2025.pdf', size: 245760, date: iso(-19) }
      ],
      appts: [
        { id: 'A1001', cid: 'CL1001', date: iso(3), time: '11:00 AM', topic: 'Dispute strategy call', status: 'Approved' },
        { id: 'A1002', cid: 'CL1002', date: iso(5), time: '03:00 PM', topic: 'Free credit review', status: 'Pending' },
        { id: 'A1003', cid: 'CL1003', date: iso(2), time: '10:00 AM', topic: 'Debt settlement advice', status: 'Pending' }
      ],
      msgs: [
        { id: 'M1001', cid: 'CL1001', from: 'admin', text: 'Welcome to Stackly, Rohan! Your CIBIL dispute is now in review. We will update you within 7 working days.', ts: t - 864e5 * 5, read: false },
        { id: 'M1002', cid: 'CL1003', from: 'client', text: 'Hi, how long will the unknown-card dispute take?', ts: t - 36e5 * 6, read: false }
      ]
    };
  }
  function db() {
    var d = null;
    try { var r = localStorage.getItem(K); if (r) d = JSON.parse(r); } catch (e) { d = mem; }
    if (!d) { d = seed(); save(d); }
    return d;
  }
  function save(d) { mem = d; try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {} }
  function reset() { var d = seed(); save(d); return d; }
  function next(d, p) { d.seq = (d.seq || 1100) + 1; return p + d.seq; }

  function getSession() {
    var r = null;
    try { r = sessionStorage.getItem(S) || localStorage.getItem(S); } catch (e) {}
    try { return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function login(role, id, pass, remember) {
    id = String(id || '').trim(); pass = String(pass || '');
    if (!id || !pass) return { ok: false, msg: 'Enter your email or Login ID and a password.' };
    var d = db(), list = role === 'admin' ? d.admins : d.clients, key = id.toLowerCase();
    var u = list.filter(function (x) { return x.id.toLowerCase() === key || (x.email || '').toLowerCase() === key; })[0];
    if (u && role === 'client' && u.status === 'Suspended') return { ok: false, msg: 'This account is suspended. Please contact support.' };
    if (!u) {
      /* open demo login: any email/ID + password creates an account on the fly */
      var email = id.indexOf('@') > 0 ? id : id.replace(/\s+/g, '').toLowerCase() + '@example.com';
      var nm = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) || 'New User';
      if (role === 'admin') {
        u = { id: next(d, 'AD'), name: nm, email: email, pass: pass };
        d.admins.push(u);
      } else {
        u = { id: next(d, 'CL'), name: nm, email: email, phone: '-', pass: pass, score: 600, plan: 'Starter', status: 'Active', joined: today() };
        d.clients.push(u);
        d.msgs.push({ id: next(d, 'M'), cid: u.id, from: 'admin', text: 'Welcome to Stackly! Upload your credit report and book a free review call to get started.', ts: Date.now(), read: false });
      }
      save(d);
    }
    var s = JSON.stringify({ id: u.id, role: role, at: Date.now() });
    try { sessionStorage.removeItem(S); localStorage.removeItem(S); (remember ? localStorage : sessionStorage).setItem(S, s); } catch (e) {}
    return { ok: true, user: u };
  }
  function logout() {
    try { sessionStorage.removeItem(S); localStorage.removeItem(S); } catch (e) {}
    location.href = 'login.html';
  }
  function guard(role) {
    var s = getSession();
    if (!s) { location.replace('login.html?next=' + role); return null; }
    if (s.role !== role) { location.replace(s.role === 'admin' ? 'admin-dashboard.html' : 'client-dashboard.html'); return null; }
    var d = db(), list = role === 'admin' ? d.admins : d.clients;
    if (!list.some(function (x) { return x.id === s.id; })) { logout(); return null; }
    return s;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(s) { if (!s) return '-'; var d = new Date(s.length === 10 ? s + 'T00:00:00' : s); return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function fmtTime(ts) { return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function today() { return iso(0); }

  function toast(msg, type) {
    var box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    var t = document.createElement('div'); t.className = 'toast ' + (type || 'ok'); t.textContent = msg; box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  }
  function modal(title, html, wide) {
    var m = document.createElement('div'); m.className = 'mdl';
    m.innerHTML = '<div class="mbox' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="mhead"><h3>' + esc(title) + '</h3><button class="mx" type="button" aria-label="Close">&times;</button></div><div class="mbody">' + html + '</div></div>';
    document.body.appendChild(m); document.body.style.overflow = 'hidden';
    function close() { m.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.classList.contains('mx') || e.target.hasAttribute('data-x')) close(); });
    var f = m.querySelector('input,select,textarea,button.btn'); if (f) setTimeout(function () { f.focus(); }, 30);
    return { el: m, close: close };
  }
  function confirmBox(msg, ok, label) {
    var m = modal('Please confirm', '<p class="cm">' + esc(msg) + '</p><div class="mfoot"><button class="btn btn-line" type="button" data-x>Cancel</button><button class="btn btn-danger" type="button" id="cmok">' + esc(label || 'Yes, continue') + '</button></div>');
    m.el.querySelector('#cmok').onclick = function () { m.close(); ok(); };
  }
  function download(name, text, type) {
    var b = new Blob([text], { type: type || 'text/csv' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function initials(n) { return String(n || '?').split(/\s+/).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase(); }
  function slug(s) { return String(s).toLowerCase().replace(/\s+/g, ''); }

  function labelTables(root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('table'), function (t) {
      var h = Array.prototype.map.call(t.querySelectorAll('thead th'), function (x) { return x.textContent.trim(); });
      Array.prototype.forEach.call(t.querySelectorAll('tbody tr'), function (r) {
        Array.prototype.forEach.call(r.children, function (c, i) { if (h[i] && !c.hasAttribute('colspan')) c.setAttribute('data-label', h[i]); });
      });
    });
  }
  document.addEventListener('DOMContentLoaded', function () {
    labelTables();
    var busy = false;
    new MutationObserver(function () {
      if (busy) return; busy = true;
      requestAnimationFrame(function () { labelTables(); busy = false; });
    }).observe(document.body, { childList: true, subtree: true });
  });

  w.Stk = { db: db, save: save, reset: reset, next: next, session: getSession, login: login, logout: logout, guard: guard, esc: esc, fmtDate: fmtDate, fmtTime: fmtTime, size: size, today: today, toast: toast, modal: modal, confirm: confirmBox, download: download, initials: initials, slug: slug };
})(window);