/* Haytame El Atraoui — The Lab: six interactive engineering simulations.
   All data is synthetic; each module mirrors the logic of a real project. */
(function () {
  'use strict';

  var stage = document.getElementById('labStage');
  var pathEl = document.getElementById('labPath');
  if (!stage) return;

  var doc = document.documentElement;
  function fr() { return doc.lang === 'fr'; }
  function t(en, frs) { return fr() ? frs : en; }
  function $(sel, root) { return (root || stage).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || stage).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clock() { var d = new Date(); return d.toTimeString().slice(0, 8); }
  function num(n) { return n.toLocaleString(fr() ? 'fr-FR' : 'en-US'); }
  function log(ul, cls, msg) {
    if (!ul) return;
    var li = document.createElement('li');
    li.innerHTML = '<time>' + clock() + '</time><span class="' + cls + '">' + msg + '</span>';
    ul.insertBefore(li, ul.firstChild);
    while (ul.children.length > 40) ul.removeChild(ul.lastChild);
  }

  /* timers scoped to the active module */
  var timers = [];
  function after(fn, ms) { var id = setTimeout(fn, ms); timers.push(['t', id]); return id; }
  function every(fn, ms) { var id = setInterval(fn, ms); timers.push(['i', id]); return id; }
  function clearTimers() { timers.forEach(function (x) { (x[0] === 't' ? clearTimeout : clearInterval)(x[1]); }); timers = []; }
  function sleep(ms) { return new Promise(function (res) { after(res, ms); }); }

  /* run live simulations only while the lab is on screen */
  function active() {
    if (document.hidden) return false;
    var r = stage.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || doc.clientHeight);
  }

  function head(title, desc, ref) {
    return '<div class="sim-head"><div><h3>' + title + '</h3><p>' + desc + '</p></div><span class="sim-ref">' + ref + '</span></div>';
  }
  function kpi(id, label, val, cls) {
    return '<div class="kpi"><span>' + label + '</span><b id="' + id + '" class="' + (cls || '') + '">' + val + '</b></div>';
  }

  /* =========================================================
     01 — CYBER RISK ENGINE (ISO 27005 → Jira)
     ========================================================= */
  var risk = { reg: [], seq: 1, ticket: 101, dup: 0, a: 0, th: 0, L: 4, I: 4 };
  var ASSETS = [
    ['ERP server (SAP)', 'Serveur ERP (SAP)'],
    ['SCADA / MES gateway', 'Passerelle SCADA / MES'],
    ['Engineering laptops', 'Postes ingénierie'],
    ['Customer database', 'Base de données clients'],
    ['Azure VM (web front)', 'VM Azure (front web)']
  ];
  var THREATS = [
    ['Ransomware', 'Rançongiciel'],
    ['Phishing / credential theft', 'Hameçonnage / vol d\'identifiants'],
    ['SQL injection', 'Injection SQL'],
    ['Insider misuse', 'Abus interne'],
    ['Unpatched vulnerability', 'Vulnérabilité non corrigée']
  ];
  function lvl(s) {
    if (s >= 15) return { k: 'crit', en: 'Critical', fr: 'Critique', tr: ['Mitigate — immediate', 'Réduire — immédiat'] };
    if (s >= 10) return { k: 'high', en: 'High', fr: 'Élevé', tr: ['Mitigate', 'Réduire'] };
    if (s >= 5) return { k: 'med', en: 'Medium', fr: 'Moyen', tr: ['Monitor & reduce', 'Surveiller & réduire'] };
    return { k: 'low', en: 'Low', fr: 'Faible', tr: ['Accept', 'Accepter'] };
  }
  function cellLv(s) { return s >= 15 ? 4 : s >= 10 ? 3 : s >= 5 ? 2 : 1; }

  function renderRisk() {
    var i = fr() ? 1 : 0;
    stage.innerHTML =
      head(t('Cyber Risk Engine', 'Moteur de risque cyber'),
        t('Score a risk the ISO 27005 way (likelihood × impact). Critical risks automatically open a Jira remediation ticket — with duplicate prevention.',
          'Évaluez un risque selon ISO 27005 (vraisemblance × impact). Les risques critiques ouvrent automatiquement un ticket Jira de remédiation — avec anti-doublons.'),
        'PROJECT · RISK AUTOMATION') +
      '<div class="sim-grid">' +
        '<div class="panel">' +
          '<p class="panel__t">' + t('Risk assessment', 'Évaluation du risque') + '</p>' +
          '<div class="field"><label for="rA">' + t('Asset', 'Actif') + '</label><select id="rA" class="sel">' +
            ASSETS.map(function (a, k) { return '<option value="' + k + '"' + (k === risk.a ? ' selected' : '') + '>' + a[i] + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="rT">' + t('Threat', 'Menace') + '</label><select id="rT" class="sel">' +
            THREATS.map(function (a, k) { return '<option value="' + k + '"' + (k === risk.th ? ' selected' : '') + '>' + a[i] + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="rL">' + t('Likelihood', 'Vraisemblance') + ' <b id="rLv">' + risk.L + '</b></label><input id="rL" type="range" min="1" max="5" value="' + risk.L + '"></div>' +
          '<div class="field"><label for="rI">' + t('Impact', 'Impact') + ' <b id="rIv">' + risk.I + '</b></label><input id="rI" type="range" min="1" max="5" value="' + risk.I + '"></div>' +
          '<div class="score-out"><b id="rS"></b><span id="rB" class="badge"></span></div>' +
          '<button class="go" id="rGo">' + t('Register risk →', 'Enregistrer le risque →') + '</button>' +
        '</div>' +
        '<div class="panel">' +
          '<p class="panel__t"><span>' + t('Risk matrix 5×5', 'Matrice de risque 5×5') + '</span><span>L × I</span></p>' +
          '<div class="matrix" id="rM"></div>' +
          '<div class="matrix-cap"><span>↑ ' + t('Likelihood', 'Vraisemblance') + '</span><span>' + t('Impact', 'Impact') + ' →</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="kpis">' +
        kpi('kR', t('Risks', 'Risques'), risk.reg.length) +
        kpi('kC', t('Critical', 'Critiques'), 0, 'crit') +
        kpi('kJ', t('Jira tickets', 'Tickets Jira'), risk.ticket - 101) +
        kpi('kD', t('Duplicates blocked', 'Doublons bloqués'), risk.dup, 'ok') +
      '</div>' +
      '<div class="sim-grid sim-grid--a" style="margin-top:18px">' +
        '<div class="panel"><p class="panel__t">' + t('Risk register', 'Registre des risques') + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>' + t('Asset / threat', 'Actif / menace') + '</th><th>L×I</th><th>' + t('Level', 'Niveau') + '</th><th>Jira</th></tr></thead><tbody id="rReg"></tbody></table></div></div>' +
        '<div class="panel"><p class="panel__t">' + t('Automation log (Apps Script → Jira REST)', 'Journal d\'automatisation (Apps Script → Jira REST)') + '</p><ul class="log" id="rLog"></ul></div>' +
      '</div>';

    var M = $('#rM');
    var html = '';
    for (var L = 5; L >= 1; L--) {
      html += '<div class="ax">' + L + '</div>';
      for (var I = 1; I <= 5; I++) html += '<div class="cell lv' + cellLv(L * I) + '" data-lk="' + L + '" data-i="' + I + '">' + (L * I) + '</div>';
    }
    html += '<div></div>';
    for (var k = 1; k <= 5; k++) html += '<div class="ax">' + k + '</div>';
    M.innerHTML = html;

    function update() {
      var s = risk.L * risk.I, v = lvl(s);
      $('#rLv').textContent = risk.L; $('#rIv').textContent = risk.I;
      $('#rS').textContent = s;
      var b = $('#rB'); b.className = 'badge b-' + v.k; b.textContent = (fr() ? v.fr : v.en).toUpperCase() + ' · ' + v.tr[fr() ? 1 : 0];
      $$('.cell', M).forEach(function (c) {
        c.classList.toggle('on', +c.dataset.lk === risk.L && +c.dataset.i === risk.I);
        var has = risk.reg.some(function (r) { return r.L === +c.dataset.lk && r.I === +c.dataset.i; });
        var pin = c.querySelector('.pin');
        if (has && !pin) { pin = document.createElement('span'); pin.className = 'pin'; c.appendChild(pin); }
        if (!has && pin) pin.remove();
      });
    }
    function drawReg(newId) {
      var i2 = fr() ? 1 : 0;
      $('#rReg').innerHTML = risk.reg.slice().reverse().map(function (r) {
        var v = lvl(r.L * r.I);
        return '<tr' + (r.id === newId ? ' class="new"' : '') + '><td class="m">' + r.id + '</td><td style="white-space:normal;line-height:1.35">' + ASSETS[r.a][i2] + '<br><span style="color:#7D8CA3">' + THREATS[r.th][i2] + '</span></td><td class="m">' + r.L + '×' + r.I + '=' + (r.L * r.I) + '</td><td><span class="badge b-' + v.k + '">' + (fr() ? v.fr : v.en) + '</span></td><td class="m">' + (r.jira || '—') + '</td></tr>';
      }).join('') || '<tr><td colspan="5" style="color:#5B6A82;white-space:normal">' + t('No risk registered yet — try a critical one (L4 × I4).', 'Aucun risque — essayez un risque critique (V4 × I4).') + '</td></tr>';
      $('#kR').textContent = risk.reg.length;
      $('#kC').textContent = risk.reg.filter(function (r) { return r.L * r.I >= 15; }).length;
      $('#kJ').textContent = risk.ticket - 101;
      $('#kD').textContent = risk.dup;
    }

    $('#rA').onchange = function (e) { risk.a = +e.target.value; };
    $('#rT').onchange = function (e) { risk.th = +e.target.value; };
    $('#rL').oninput = function (e) { risk.L = +e.target.value; update(); };
    $('#rI').oninput = function (e) { risk.I = +e.target.value; update(); };
    $('#rGo').onclick = function () {
      var lg = $('#rLog'), i2 = fr() ? 1 : 0;
      var s = risk.L * risk.I, crit = s >= 15;
      var ex = risk.reg.filter(function (r) { return r.a === risk.a && r.th === risk.th; })[0];
      var label = ASSETS[risk.a][i2] + ' / ' + THREATS[risk.th][i2];
      if (ex) {
        ex.L = risk.L; ex.I = risk.I;
        log(lg, 't-info', ex.id + ' ' + t('updated', 'mis à jour') + ' → ' + t('score', 'score') + ' ' + s);
        if (crit && ex.jira) {
          risk.dup++;
          log(lg, 't-ok', t('Duplicate prevented — ', 'Doublon évité — ') + ex.jira + t(' already open for this risk', ' déjà ouvert pour ce risque'));
        } else if (crit) {
          ex.jira = 'SEC-' + (risk.ticket++);
          log(lg, 't-crit', 'POST /rest/api/3/issue → 201 · ' + ex.jira + ' ' + t('created', 'créé'));
        }
        drawReg(ex.id);
      } else {
        var r = { id: 'R-' + String(risk.seq++).padStart(3, '0'), a: risk.a, th: risk.th, L: risk.L, I: risk.I, jira: null };
        risk.reg.push(r);
        log(lg, 't-info', r.id + ' ' + t('registered', 'enregistré') + ' · ' + esc(label) + ' · ' + s);
        if (crit) {
          r.jira = 'SEC-' + (risk.ticket++);
          after(function () {
            log(lg, 't-crit', 'POST /rest/api/3/issue → 201 · ' + r.jira + ' ' + t('created · priority Highest', 'créé · priorité Highest'));
            log(lg, 't-ok', t('Jira key written back to register (traceability)', 'Clé Jira réécrite dans le registre (traçabilité)'));
          }, 350);
        } else {
          log(lg, 't-ok', t('Not critical — tracked in treatment plan, no ticket', 'Non critique — suivi dans le plan de traitement, sans ticket'));
        }
        drawReg(r.id);
      }
      update();
    };
    update(); drawReg();
    if (!risk.reg.length) log($('#rLog'), 't-info', t('Engine ready. Waiting for a risk…', 'Moteur prêt. En attente d\'un risque…'));
  }

  /* =========================================================
     02 — SAP DATA PIPELINE (ERP export → standardized AD/SB)
     ========================================================= */
  var RAW = [
    { doc: '4500018231', pn: ' 3214-a77 ', ref: 'AD 2025-0142', date: '12/03/2026', st: 'open' },
    { doc: '4500018232', pn: '3214-A77', ref: 'sb-72-0031', date: '2026-03-14', st: 'OPEN ' },
    { doc: '4500018231', pn: ' 3214-a77 ', ref: 'AD 2025-0142', date: '12/03/2026', st: 'open' },
    { doc: '4500018240', pn: '5520-C02', ref: '', date: '15.03.2026', st: 'closed' },
    { doc: '4500018245', pn: '5520c02', ref: 'AD2026-0007', date: '2026/03/16', st: 'Open' },
    { doc: '4500018251', pn: '7781-B10', ref: 'SB 72-0044 R1', date: '17-03-2026', st: 'closed' },
    { doc: '4500018260', pn: '7781-B10', ref: 'XX-000', date: '18/03/2026', st: 'open' },
    { doc: '4500018262', pn: '3310-d05', ref: 'sb 05-0012', date: '2026-03-19', st: 'in review' }
  ];
  var sap = { rules: { norm: true, dedup: true, valid: true, cls: true }, busy: false };

  function normDate(d) {
    var m = d.match(/^(\d{4})[-\/.](\d{2})[-\/.](\d{2})$/);
    if (m) return m[1] + '-' + m[2] + '-' + m[3];
    m = d.match(/^(\d{2})[-\/.](\d{2})[-\/.](\d{4})$/);
    if (m) return m[3] + '-' + m[2] + '-' + m[1];
    return d;
  }
  function normPN(p) { var s = p.trim().toUpperCase(); if (/^\d{4}[A-Z]\d{2}$/.test(s)) s = s.slice(0, 4) + '-' + s.slice(4); return s; }
  function normRef(r) {
    var s = r.trim().toUpperCase().replace(/^(AD|SB)[\s-]*/, '$1 ');
    return s;
  }
  function processRow(row, rules, seen) {
    var o = { doc: row.doc, pn: row.pn, ref: row.ref, date: row.date, st: row.st, type: '—', status: 'valid' };
    if (rules.norm) { o.pn = normPN(row.pn); o.ref = normRef(row.ref); o.date = normDate(row.date); o.st = row.st.trim().toUpperCase(); }
    var key = row.doc + '|' + row.ref.trim().toUpperCase();
    if (rules.dedup) { if (seen[key]) { o.status = 'dup'; return o; } seen[key] = 1; }
    var isAD = /^AD\s?\d{4}-\d{4}$/i.test(o.ref.trim()), isSB = /^SB\s?\d{2}-\d{4}(\sR\d+)?$/i.test(o.ref.trim());
    if (rules.valid && !(isAD || isSB)) { o.status = 'rej'; return o; }
    if (!rules.valid && !(isAD || isSB)) o.status = 'unchecked';
    if (rules.cls) o.type = isAD ? 'AD' : isSB ? 'SB' : '?';
    return o;
  }

  function renderSap() {
    var R = sap.rules; sap.busy = false;
    function ruleBtn(k, en, frs) { return '<button data-r="' + k + '" class="' + (R[k] ? 'on' : '') + '">' + (R[k] ? '■ ' : '□ ') + t(en, frs) + '</button>'; }
    stage.innerHTML =
      head(t('SAP Data Pipeline', 'Pipeline de données SAP'),
        t('The approach behind my Safran tool: take a messy ERP export, apply configurable business rules, and produce a standardized AD/SB output you can trust.',
          'La démarche de mon outil Safran : partir d\'un export ERP hétérogène, appliquer des règles métier configurables et produire une sortie AD/SB standardisée et fiable.'),
        'SAFRAN · PYTHON') +
      '<p class="panel__t">' + t('Configurable rules', 'Règles configurables') + '</p>' +
      '<div class="seg" id="sR" style="margin-bottom:16px">' +
        ruleBtn('norm', 'Normalize', 'Normaliser') + ruleBtn('dedup', 'Deduplicate', 'Dédoublonner') +
        ruleBtn('valid', 'Validate references', 'Valider les références') + ruleBtn('cls', 'Classify AD/SB', 'Classer AD/SB') +
      '</div>' +
      '<div class="sim-grid">' +
        '<div class="panel"><p class="panel__t"><span>' + t('SAP export — raw', 'Export SAP — brut') + '</span><span>' + RAW.length + ' rows</span></p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Doc</th><th>P/N</th><th>Ref</th><th>Date</th></tr></thead><tbody id="sIn">' +
          RAW.map(function (r, k) {
            var dirtyPn = r.pn !== normPN(r.pn), dirtyRef = r.ref !== normRef(r.ref) || !r.ref, dirtyDate = r.date !== normDate(r.date);
            return '<tr data-k="' + k + '"><td class="m">' + r.doc + '</td><td class="m' + (dirtyPn ? ' dirty' : '') + '">' + esc(r.pn.replace(/ /g, '·')) + '</td><td class="m' + (dirtyRef ? ' dirty' : '') + '">' + (esc(r.ref) || '∅') + '</td><td class="m' + (dirtyDate ? ' dirty' : '') + '">' + r.date + '</td></tr>';
          }).join('') + '</tbody></table></div></div>' +
        '<div class="panel"><p class="panel__t"><span>' + t('Standardized output', 'Sortie standardisée') + '</span><span id="sCnt">0 / ' + RAW.length + '</span></p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>P/N</th><th>Ref</th><th>Type</th><th>Date</th><th>' + t('Check', 'Contrôle') + '</th></tr></thead><tbody id="sOut"><tr><td colspan="5" style="color:#5B6A82">' + t('Run the pipeline to generate the output.', 'Lancez le pipeline pour générer la sortie.') + '</td></tr></tbody></table></div></div>' +
      '</div>' +
      '<div class="go-row" style="margin-top:16px"><button class="go" id="sGo">▶ ' + t('Run pipeline', 'Lancer le pipeline') + '</button><button class="go go--ghost" id="sScale">' + t('Scale test · 4,500 records', 'Test de charge · 4 500 enregistrements') + '</button></div>' +
      '<div class="kpis">' + kpi('sP', t('Processed', 'Traités'), 0) + kpi('sV', t('Valid', 'Valides'), 0, 'ok') + kpi('sRj', t('Rejected', 'Rejetés'), 0, 'crit') + kpi('sD', t('Duplicates', 'Doublons'), 0) + kpi('sAD', 'AD', 0) + kpi('sSB', 'SB', 0) + '</div>' +
      '<div class="panel" style="margin-top:18px"><p class="panel__t">' + t('Run log', 'Journal d\'exécution') + '</p><ul class="log" id="sLog"></ul></div>';

    $$('#sR button').forEach(function (b) {
      b.onclick = function () { if (sap.busy) return; R[b.dataset.r] = !R[b.dataset.r]; renderSap(); };
    });
    function setK(c) {
      $('#sP').textContent = num(c.p); $('#sV').textContent = num(c.v); $('#sRj').textContent = num(c.r);
      $('#sD').textContent = num(c.d); $('#sAD').textContent = num(c.ad); $('#sSB').textContent = num(c.sb);
    }
    function tally(c, o) {
      c.p++;
      if (o.status === 'dup') c.d++; else if (o.status === 'rej') c.r++; else c.v++;
      if (o.status !== 'dup' && o.status !== 'rej') { if (o.type === 'AD') c.ad++; if (o.type === 'SB') c.sb++; }
    }
    $('#sGo').onclick = function () {
      if (sap.busy) return; sap.busy = true;
      var out = $('#sOut'), lg = $('#sLog'), seen = {}, c = { p: 0, v: 0, r: 0, d: 0, ad: 0, sb: 0 };
      out.innerHTML = ''; setK(c);
      log(lg, 't-info', t('Reading SAP export (8 rows)…', 'Lecture de l\'export SAP (8 lignes)…'));
      (async function () {
        for (var k = 0; k < RAW.length; k++) {
          var tr = $('#sIn tr[data-k="' + k + '"]');
          $$('#sIn tr').forEach(function (x) { x.classList.remove('scan'); });
          if (tr) tr.classList.add('scan');
          await sleep(380);
          if (!stage.contains(out)) return;
          var o = processRow(RAW[k], R, seen); tally(c, o);
          var st = { valid: ['b-low', 'OK'], dup: ['b-med', 'DUP'], rej: ['b-crit', 'REJ'], unchecked: ['b-high', 'N/C'] }[o.status];
          var row = document.createElement('tr');
          row.className = 'new ' + (o.status === 'dup' || o.status === 'rej' ? 'rej' : 'fix');
          row.innerHTML = '<td class="m">' + esc(o.pn.replace(/ /g, '·')) + '</td><td class="m">' + (esc(o.ref) || '∅') + '</td><td class="m">' + o.type + '</td><td class="m">' + o.date + '</td><td><span class="badge ' + st[0] + '">' + st[1] + '</span></td>';
          out.appendChild(row);
          $('#sCnt').textContent = (k + 1) + ' / ' + RAW.length; setK(c);
          if (o.status === 'rej') log(lg, 't-crit', RAW[k].doc + ' — ' + t('invalid or missing AD/SB reference', 'référence AD/SB invalide ou manquante'));
          if (o.status === 'dup') log(lg, 't-warn', RAW[k].doc + ' — ' + t('duplicate removed', 'doublon supprimé'));
        }
        $$('#sIn tr').forEach(function (x) { x.classList.remove('scan'); });
        log(lg, 't-ok', t('Output generated · ', 'Sortie générée · ') + c.v + t(' valid rows, documented rules applied', ' lignes valides, règles documentées appliquées'));
        sap.busy = false;
      })();
    };
    $('#sScale').onclick = function () {
      if (sap.busy) return;
      var lg = $('#sLog'), N = 4500, rows = [], k;
      for (k = 0; k < N; k++) {
        var r = RAW[k % RAW.length];
        var id = String(4500020000 + k);
        var ref = r.ref;
        if (r.ref && r.ref !== 'XX-000') ref = r.ref.replace(/\d{4}$/, String(1000 + (k % 8999)).padStart(4, '0'));
        rows.push({ doc: k % 50 === 7 ? String(4500020000 + k - 1) : id, pn: r.pn, ref: k % 50 === 7 ? rows[k - 1].ref : ref, date: r.date, st: r.st });
      }
      var t0 = performance.now(), seen = {}, c = { p: 0, v: 0, r: 0, d: 0, ad: 0, sb: 0 };
      rows.forEach(function (row) { tally(c, processRow(row, R, seen)); });
      var ms = (performance.now() - t0).toFixed(1);
      setK(c);
      $('#sCnt').textContent = num(N) + ' / ' + num(N);
      log(lg, 't-ok', num(N) + t(' synthetic records processed in ', ' enregistrements fictifs traités en ') + ms + ' ms — ' + t('same rules, same output format', 'mêmes règles, même format de sortie'));
    };
    log($('#sLog'), 't-info', t('Pipeline idle. Toggle rules, then run.', 'Pipeline au repos. Réglez les règles puis lancez.'));
  }

  /* =========================================================
     03 — MACHINE ALERTING (IIoT telemetry → n8n workflow)
     ========================================================= */
  var iot = { data: [], thr: 80, fault: 0, failNext: false, runs: 0, alerts: 0, logs: 0, handled: 0, cool: 0, tick: 0 };
  for (var q = 0; q < 70; q++) iot.data.push(66 + Math.sin(q / 6) * 2 + Math.random() * 1.5);

  function renderIot() {
    stage.innerHTML =
      head(t('Machine Alerting', 'Alerte machine critique'),
        t('Live spindle-temperature telemetry from a CNC machine. A scheduled workflow normalizes the data, evaluates the threshold, emails maintenance on critical states, logs the rest — and survives API failures.',
          'Télémétrie en direct de la température broche d\'une machine CNC. Un workflow planifié normalise la donnée, évalue le seuil, alerte la maintenance par e-mail en cas d\'état critique, journalise le reste — et résiste aux pannes d\'API.'),
        'n8n · REST · MONGODB · SMTP') +
      '<div class="pipe" id="iP">' +
        pn('p0', 'CRON', t('Every 5 s', 'Toutes les 5 s')) + '<i class="pwire"></i>' +
        pn('p1', 'HTTP', t('Fetch data', 'Lire données')) + '<i class="pwire"></i>' +
        pn('p2', 'CODE', t('Normalize', 'Normaliser')) + '<i class="pwire"></i>' +
        pn('p3', 'IF', 'T > ' + '<span id="iThr2">' + iot.thr + '</span>°C') + '<i class="pwire"></i>' +
        '<div style="display:flex;flex-direction:column;gap:6px">' + pn('p4', 'SMTP', t('Email alert', 'Alerte e-mail')) + pn('p5', 'MONGODB', t('Log state', 'Journaliser')) + '</div>' +
      '</div>' +
      '<div class="sim-grid sim-grid--b">' +
        '<div class="panel"><p class="panel__t"><span>CNC-04 · ' + t('spindle temp.', 'temp. broche') + '</span><span id="iNow">—</span></p><canvas class="chart" id="iC"></canvas>' +
          '<div class="field" style="margin:14px 0 12px"><label for="iT">' + t('Critical threshold', 'Seuil critique') + ' <b><span id="iTv">' + iot.thr + '</span> °C</b></label><input id="iT" type="range" min="70" max="95" value="' + iot.thr + '"></div>' +
          '<div class="go-row"><button class="go" id="iF">⚡ ' + t('Inject overheating', 'Simuler une surchauffe') + '</button><button class="go go--ghost" id="iE">' + t('Break the API once', 'Faire tomber l\'API') + '</button></div>' +
        '</div>' +
        '<div class="panel"><p class="panel__t">' + t('Workflow executions', 'Exécutions du workflow') + '</p><ul class="log" id="iLog" style="max-height:330px"></ul></div>' +
      '</div>' +
      '<div class="kpis">' + kpi('iR', t('Runs', 'Exécutions'), iot.runs) + kpi('iA', t('Alerts sent', 'Alertes envoyées'), iot.alerts, 'crit') + kpi('iL', t('States logged', 'États journalisés'), iot.logs, 'ok') + kpi('iH', t('Failures handled', 'Pannes gérées'), iot.handled) + '</div>';

    function pn(id, k, v) { return '<div class="pnode" id="' + id + '"><span>' + k + '</span><b>' + v + '</b></div>'; }

    var cv = $('#iC'), ctx = cv.getContext('2d');
    function size() {
      var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    var ro = window.ResizeObserver ? new ResizeObserver(function () { size(); draw(); }) : null;
    if (ro) ro.observe(cv);

    function draw() {
      var w = cv.clientWidth, h = cv.clientHeight, pad = 26, min = 55, max = 100;
      ctx.clearRect(0, 0, w, h);
      function Y(v) { return h - pad - (v - min) / (max - min) * (h - pad * 2); }
      ctx.font = '10px JetBrains Mono, monospace'; ctx.fillStyle = '#4F607A'; ctx.strokeStyle = 'rgba(160,190,230,.08)'; ctx.lineWidth = 1;
      [60, 70, 80, 90, 100].forEach(function (v) { ctx.beginPath(); ctx.moveTo(30, Y(v)); ctx.lineTo(w, Y(v)); ctx.stroke(); ctx.fillText(v + '°', 0, Y(v) + 3); });
      var ty = Y(iot.thr);
      ctx.fillStyle = 'rgba(255,79,26,.07)'; ctx.fillRect(30, 0, w - 30, ty);
      ctx.setLineDash([5, 5]); ctx.strokeStyle = '#FF4F1A'; ctx.beginPath(); ctx.moveTo(30, ty); ctx.lineTo(w, ty); ctx.stroke(); ctx.setLineDash([]);
      var n = iot.data.length, dx = (w - 30) / (n - 1);
      var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(108,182,255,.28)'); g.addColorStop(1, 'rgba(108,182,255,0)');
      ctx.beginPath();
      iot.data.forEach(function (v, k) { var x = 30 + k * dx, y = Y(v); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.lineTo(w, h - pad); ctx.lineTo(30, h - pad); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = '#6CB6FF';
      iot.data.forEach(function (v, k) { var x = 30 + k * dx, y = Y(v); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      var last = iot.data[n - 1], lx = w - 1, ly = Y(last);
      ctx.fillStyle = last > iot.thr ? '#FF4F1A' : '#3DDC97'; ctx.beginPath(); ctx.arc(lx - 3, ly, 4, 0, 7); ctx.fill();
      var now = $('#iNow'); if (now) { now.textContent = last.toFixed(1) + ' °C'; now.style.color = last > iot.thr ? '#FF6A3D' : '#3DDC97'; }
    }

    function light(ids, cls) { ids.forEach(function (id) { var e = $('#' + id); if (e) e.className = 'pnode ' + cls; }); }
    function wires(nOn) { $$('#iP .pwire').forEach(function (w, k) { w.classList.toggle('lit', k < nOn); }); }
    function resetNodes() { light(['p0', 'p1', 'p2', 'p3', 'p4', 'p5'], ''); wires(0); }

    function sample() {
      iot.tick++;
      var base = 67 + Math.sin(iot.tick / 7) * 2.2 + (Math.random() - .5) * 1.8;
      if (iot.fault > 0) { iot.fault--; var p = iot.fault > 14 ? (26 - iot.fault) / 12 : iot.fault / 14; base += 26 * Math.max(0, Math.min(1, p)); }
      iot.data.push(base); if (iot.data.length > 70) iot.data.shift();
      draw();
    }
    function run() {
      var lg = $('#iLog'); if (!lg) return;
      iot.runs++; resetNodes();
      var val = iot.data[iot.data.length - 1];
      light(['p0'], 'pass'); wires(1);
      after(function () {
        if (!$('#iLog')) return;
        if (iot.failNext) {
          iot.failNext = false; light(['p1'], 'fail');
          log(lg, 't-warn', t('HTTP 503 from machine API — retry 1/3 in 2 s', 'HTTP 503 de l\'API machine — nouvelle tentative 1/3 dans 2 s'));
          after(function () {
            if (!$('#iLog')) return;
            iot.handled++; light(['p1'], 'pass');
            log(lg, 't-ok', t('Retry succeeded — error branch closed, admin notified', 'Nouvelle tentative réussie — branche d\'erreur fermée, admin notifié'));
            finish();
          }, 1200);
          return;
        }
        light(['p1'], 'pass'); finish();
      }, 350);
      function finish() {
        light(['p2'], 'pass'); wires(3);
        after(function () {
          if (!$('#iLog')) return;
          light(['p3'], 'pass'); wires(4);
          if (val > iot.thr) {
            light(['p4'], 'fail'); light(['p5'], 'skip');
            if (iot.cool > 0) { log(lg, 't-warn', t('Critical ', 'Critique ') + val.toFixed(1) + '°C — ' + t('alert already sent, cooldown active', 'alerte déjà envoyée, anti-spam actif')); }
            else { iot.alerts++; iot.cool = 3; log(lg, 't-crit', 'CRITICAL CNC-04 ' + val.toFixed(1) + '°C > ' + iot.thr + '°C — ' + t('email sent to maintenance', 'e-mail envoyé à la maintenance')); }
          } else {
            light(['p5'], 'pass'); light(['p4'], 'skip'); iot.logs++;
            if (iot.cool > 0) iot.cool--;
            log(lg, 't-ok', t('Normal ', 'Normal ') + val.toFixed(1) + '°C — ' + t('state logged to MongoDB', 'état journalisé dans MongoDB'));
          }
          $('#iR').textContent = iot.runs; $('#iA').textContent = iot.alerts; $('#iL').textContent = iot.logs; $('#iH').textContent = iot.handled;
        }, 300);
      }
    }

    $('#iT').oninput = function (e) { iot.thr = +e.target.value; $('#iTv').textContent = iot.thr; $('#iThr2').textContent = iot.thr; draw(); };
    $('#iF').onclick = function () { iot.fault = 26; log($('#iLog'), 't-info', t('Fault injected: coolant flow reduced', 'Défaut injecté : débit de refroidissement réduit')); };
    $('#iE').onclick = function () { iot.failNext = true; log($('#iLog'), 't-info', t('Next API call will fail', 'Le prochain appel API échouera')); };

    draw();
    var k = 0;
    every(function () { if (!active()) return; sample(); if (++k % 5 === 0) run(); }, 700);
    if (!iot.runs) log($('#iLog'), 't-info', t('Workflow active · schedule: every 5 s', 'Workflow actif · planification : toutes les 5 s'));
    return function () { if (ro) ro.disconnect(); };
  }

  /* =========================================================
     04 — CONTAINER STACK (Docker Compose, cloud)
     ========================================================= */
  var cloud = {
    svc: { nginx: 'up', api: 'up', db: 'up', pgadmin: 'up' },
    restart: true, req: 0, ok: 0, restarts: 0, sel: 'api'
  };
  var SVC = {
    nginx: { x: 150, y: 150, name: 'nginx', sub: ':80 → api', img: 'nginx:1.27-alpine' },
    api: { x: 330, y: 88, name: 'api', sub: 'fastapi :8000', img: 'app/api:1.4' },
    pgadmin: { x: 330, y: 218, name: 'pgadmin', sub: ':5050', img: 'dpage/pgadmin4' },
    db: { x: 510, y: 150, name: 'postgres', sub: ':5432', img: 'postgres:16' }
  };
  var YAML = {
    nginx: ['nginx:', '  image: nginx:1.27-alpine', '  ports: ["80:80"]', '  depends_on: [api]', '  networks: [frontend]'],
    api: ['api:', '  build: ./api', '  environment:', '    DATABASE_URL: postgres://…@db/app', '  depends_on:', '    db: { condition: service_healthy }', '  networks: [frontend, backend]'],
    db: ['db:', '  image: postgres:16', '  volumes: [pgdata:/var/lib/postgresql/data]', '  healthcheck:', '    test: ["CMD", "pg_isready"]', '  networks: [backend]'],
    pgadmin: ['pgadmin:', '  image: dpage/pgadmin4', '  ports: ["5050:80"]', '  networks: [backend]']
  };

  function renderCloud() {
    stage.innerHTML =
      head(t('Container Stack', 'Stack conteneurisée'),
        t('A multi-service Docker Compose stack like the ones I deploy on Azure VMs: Nginx reverse proxy, API, PostgreSQL with a persistent volume, pgAdmin — on isolated networks. Click a container to crash it and watch the system react.',
          'Une stack Docker Compose multi-services comme celles que je déploie sur des VM Azure : reverse proxy Nginx, API, PostgreSQL avec volume persistant, pgAdmin — sur des réseaux isolés. Cliquez sur un conteneur pour le faire tomber et observez la réaction du système.'),
        'DOCKER · AZURE IaaS') +
      '<div class="sim-grid sim-grid--c">' +
        '<div class="panel"><p class="panel__t"><span>docker compose ps</span><span id="cSt"></span></p>' +
          '<svg class="topo" id="cT" viewBox="0 0 640 330" role="img" aria-label="Container topology"></svg>' +
          '<div class="go-row" style="margin-top:12px"><button class="go" id="cCurl">$ curl localhost/api/health</button><button class="go go--ghost" id="cR">restart: ' + (cloud.restart ? 'always' : 'no') + '</button></div>' +
        '</div>' +
        '<div class="panel"><p class="panel__t"><span>docker-compose.yml</span><span id="cSel">' + cloud.sel + '</span></p><pre class="yaml" id="cY"></pre></div>' +
      '</div>' +
      '<div class="sim-grid" style="margin-top:18px">' +
        '<div class="panel"><p class="panel__t">' + t('Last response', 'Dernière réponse') + '</p><pre class="resp" id="cResp">' + t('Traffic is generated every 2 s…', 'Du trafic est généré toutes les 2 s…') + '</pre></div>' +
        '<div class="panel"><p class="panel__t">' + t('Events', 'Événements') + '</p><ul class="log" id="cLog"></ul></div>' +
      '</div>' +
      '<div class="kpis">' + kpi('cQ', t('Requests', 'Requêtes'), cloud.req) + kpi('cA', t('Availability', 'Disponibilité'), '100%', 'ok') + kpi('cRs', t('Auto-restarts', 'Redémarrages auto'), cloud.restarts) + '</div>';

    function drawTopo(lit) {
      var s = cloud.svc, T = $('#cT'); if (!T) return;
      function edge(x1, y1, x2, y2, state) { return '<path class="edge ' + state + '" d="M' + x1 + ' ' + y1 + ' C ' + ((x1 + x2) / 2) + ' ' + y1 + ', ' + ((x1 + x2) / 2) + ' ' + y2 + ', ' + x2 + ' ' + y2 + '"/>'; }
      function st(a, b) { return s[a] !== 'up' || s[b] !== 'up' ? 'dead' : (lit ? 'live' : ''); }
      var h = '';
      h += '<rect class="net" x="100" y="100" width="120" height="100" rx="10"/><text class="netl" x="108" y="94">NET · FRONTEND</text>';
      h += '<rect class="net" x="270" y="30" width="330" height="250" rx="10"/><text class="netl" x="278" y="24">NET · BACKEND</text>';
      h += '<g><rect x="6" y="128" width="64" height="44" rx="6" fill="none" stroke="rgba(160,190,230,.3)"/><text x="38" y="154" text-anchor="middle">client</text></g>';
      h += edge(70, 150, 110, 150, s.nginx === 'up' ? (lit ? 'live' : '') : 'dead');
      h += edge(210, 150, 270, 88, st('nginx', 'api'));
      h += edge(410, 88, 450, 150, st('api', 'db'));
      h += edge(410, 218, 450, 150, st('pgadmin', 'db'));
      h += '<path class="edge" d="M510 175 V 250"/>';
      h += '<g><ellipse cx="510" cy="258" rx="34" ry="8" fill="#0A1320" stroke="rgba(160,190,230,.35)"/><rect x="476" y="258" width="68" height="26" fill="#0A1320" stroke="none"/><path d="M476 258 V284 M544 258 V284" stroke="rgba(160,190,230,.35)"/><ellipse cx="510" cy="284" rx="34" ry="8" fill="#0A1320" stroke="rgba(160,190,230,.35)"/><text x="510" y="276" text-anchor="middle" class="sub">pgdata</text></g>';
      Object.keys(SVC).forEach(function (k) {
        var v = SVC[k], state = s[k], col = { up: '#3DDC97', down: '#FF4F1A', starting: '#6CB6FF', degraded: '#FFB020' }[state];
        var label = { up: 'healthy', down: 'exited (1)', starting: 'starting…', degraded: 'unhealthy' }[state];
        h += '<g class="svc ' + state + '" data-s="' + k + '" tabindex="0" role="button" aria-label="' + v.name + ' ' + label + '">' +
          '<rect x="' + (v.x - 60) + '" y="' + (v.y - 26) + '" width="120" height="52" rx="7"/>' +
          '<circle cx="' + (v.x - 46) + '" cy="' + (v.y - 10) + '" r="4" fill="' + col + '"/>' +
          '<text x="' + (v.x - 36) + '" y="' + (v.y - 6) + '">' + v.name + '</text>' +
          '<text class="sub" x="' + (v.x - 50) + '" y="' + (v.y + 10) + '">' + v.sub + '</text>' +
          '<text class="st" x="' + (v.x - 50) + '" y="' + (v.y + 21) + '" fill="' + col + '">' + label + '</text></g>';
      });
      T.innerHTML = h;
      $$('.svc', T).forEach(function (g) {
        function act() { crash(g.dataset.s); }
        g.onclick = act; g.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } };
      });
      var up = Object.keys(s).filter(function (k) { return s[k] === 'up'; }).length;
      $('#cSt').textContent = up + '/4 running';
    }
    function drawYaml() {
      var lines = ['services:'];
      ['nginx', 'api', 'db', 'pgadmin'].forEach(function (k) {
        YAML[k].forEach(function (l) {
          var m = l.match(/^(\s*)([\w_]+:)(.*)$/);
          var html = m ? m[1] + '<span class="y-k">' + m[2] + '</span><span class="y-v">' + esc(m[3]) + '</span>' : '<span class="y-v">' + esc(l) + '</span>';
          if (/^\s*(nginx|api|db|pgadmin):$/.test(l)) { /* service header */ }
          lines.push((k === cloud.sel ? '<span class="y-hl">' : '') + '  ' + html + (k === cloud.sel ? '</span>' : ''));
        });
      });
      lines.push('<span class="y-k">volumes:</span>', '  <span class="y-k">pgdata:</span> {}');
      lines.push('<span class="y-k">networks:</span>', '  <span class="y-k">frontend:</span> {}', '  <span class="y-k">backend:</span> { <span class="y-k">internal:</span> true }');
      $('#cY').innerHTML = lines.join('\n');
      $('#cSel').textContent = cloud.sel;
    }
    function crash(k) {
      cloud.sel = k; drawYaml();
      var lg = $('#cLog');
      if (cloud.svc[k] !== 'up') { log(lg, 't-info', SVC[k].name + ' ' + t('is already restarting / down', 'redémarre déjà / est arrêté')); return; }
      cloud.svc[k] = 'down';
      if (k === 'db' && cloud.svc.api === 'up') cloud.svc.api = 'degraded';
      log(lg, 't-crit', 'container ' + SVC[k].name + ' exited with code 1');
      drawTopo();
      if (cloud.restart) after(function () { revive(k); }, 1800);
      else log(lg, 't-warn', t('restart: no — the container stays down until the policy is re-enabled', 'restart: no — le conteneur reste arrêté jusqu\'à réactivation de la politique'));
    }
    function revive(k) {
      var lg = $('#cLog');
      if (!lg || cloud.svc[k] !== 'down') return;
      cloud.svc[k] = 'starting'; drawTopo(); log(lg, 't-info', 'restart policy → ' + SVC[k].name + ' starting');
      after(function () {
        if (!$('#cT')) return;
        cloud.svc[k] = 'up'; cloud.restarts++;
        if (k === 'db' && cloud.svc.api === 'degraded') { cloud.svc.api = 'up'; log(lg, 't-ok', 'db healthcheck pg_isready → OK · api healthy again'); }
        else log(lg, 't-ok', SVC[k].name + ' healthy');
        if (k === 'db') log(lg, 't-ok', t('Data intact — persisted in volume pgdata', 'Données intactes — persistées dans le volume pgdata'));
        $('#cRs').textContent = cloud.restarts; drawTopo();
      }, 1500);
    }
    function request() {
      var s = cloud.svc, code, body;
      cloud.req++;
      if (s.nginx !== 'up') { code = 0; body = '<span class="e">curl: (7) Failed to connect to localhost port 80: Connection refused</span>'; }
      else if (s.api === 'down' || s.api === 'starting') { code = 502; body = '<span class="e">HTTP/1.1 502 Bad Gateway</span>\n<span class="k">server:</span> nginx\n\n' + t('upstream api:8000 unavailable', 'upstream api:8000 indisponible'); }
      else if (s.db !== 'up' || s.api === 'degraded') { code = 503; body = '<span class="e">HTTP/1.1 503 Service Unavailable</span>\n\n{ <span class="k">"status"</span>: <span class="e">"degraded"</span>, <span class="k">"db"</span>: <span class="e">"unreachable"</span> }'; }
      else { code = 200; body = '<span class="s">HTTP/1.1 200 OK</span>\n<span class="k">content-type:</span> application/json\n\n{ <span class="k">"status"</span>: <span class="s">"ok"</span>, <span class="k">"db"</span>: <span class="s">"connected"</span>, <span class="k">"latency_ms"</span>: ' + (8 + Math.round(Math.random() * 9)) + ' }'; }
      if (code === 200) cloud.ok++;
      $('#cResp').innerHTML = '<span class="k">$</span> curl -i http://localhost/api/health\n\n' + body;
      $('#cQ').textContent = cloud.req;
      var a = Math.round(cloud.ok / cloud.req * 1000) / 10, el = $('#cA');
      el.textContent = a + '%'; el.className = a >= 99 ? 'ok' : a >= 90 ? '' : 'crit';
      drawTopo(code === 200);
      after(function () { if ($('#cT')) drawTopo(false); }, 700);
    }
    $('#cCurl').onclick = request;
    $('#cR').onclick = function () {
      cloud.restart = !cloud.restart; this.textContent = 'restart: ' + (cloud.restart ? 'always' : 'no');
      log($('#cLog'), 't-info', 'restart policy set to ' + (cloud.restart ? 'always' : 'no'));
      if (cloud.restart) Object.keys(cloud.svc).forEach(function (k) { if (cloud.svc[k] === 'down') revive(k); });
    };
    // resume any restart interrupted by switching modules
    Object.keys(cloud.svc).forEach(function (k) {
      if (cloud.svc[k] === 'starting') cloud.svc[k] = 'down';
      if (cloud.svc[k] === 'down' && cloud.restart) after(function () { revive(k); }, 600);
    });
    drawTopo(); drawYaml();
    if (!cloud.req) log($('#cLog'), 't-ok', 'docker compose up -d · 4 containers healthy');
    every(function () { if (active()) request(); }, 2000);
  }

  /* =========================================================
     05 — SECURE REST API (JWT + RBAC, GMPP)
     ========================================================= */
  var api = { role: 'TECHNICIAN', ep: 0, tok: 'valid', n: 0, ok: 0, e401: 0, e403: 0 };
  var EPS = [
    { m: 'GET', p: '/api/equipment', roles: ['TECHNICIAN', 'MANAGER', 'ADMIN'], code: 200, body: '[\n  { "id": 42, "name": "Press P-12", "status": "RUNNING" },\n  { "id": 43, "name": "CNC-04", "status": "MAINTENANCE" }\n]' },
    { m: 'POST', p: '/api/interventions', roles: ['TECHNICIAN', 'MANAGER', 'ADMIN'], code: 201, body: '{ "id": 1087, "equipmentId": 43, "type": "CORRECTIVE",\n  "status": "OPEN", "createdBy": "{user}" }' },
    { m: 'GET', p: '/api/reports/kpi', roles: ['MANAGER', 'ADMIN'], code: 200, body: '{ "mtbf_h": 212.4, "mttr_h": 3.1,\n  "openInterventions": 7 }' },
    { m: 'DELETE', p: '/api/equipment/42', roles: ['ADMIN'], code: 204, body: '' }
  ];
  var USERS = { TECHNICIAN: 'y.tech', MANAGER: 'm.manager', ADMIN: 'a.admin' };

  function renderApi() {
    function seg(id, items, cur) { return '<div class="seg" id="' + id + '">' + items.map(function (x) { return '<button data-v="' + x[0] + '" class="' + (String(x[0]) === String(cur) ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
    stage.innerHTML =
      head(t('Secure REST API', 'API REST sécurisée'),
        t('How a request travels through the maintenance platform I built (GMPP, Spring Boot): gateway, JWT verification, role-based access control, then the database. Change the role or break the token.',
          'Le parcours d\'une requête dans la plateforme de maintenance que j\'ai développée (GMPP, Spring Boot) : passerelle, vérification JWT, contrôle d\'accès par rôle, puis base de données. Changez le rôle ou cassez le jeton.'),
        'GMPP · SPRING BOOT') +
      '<div class="sim-grid">' +
        '<div class="panel">' +
          '<div class="field"><span class="lbl">' + t('Signed-in role', 'Rôle connecté') + '</span>' + seg('aR', [['TECHNICIAN', 'TECHNICIAN'], ['MANAGER', 'MANAGER'], ['ADMIN', 'ADMIN']], api.role) + '</div>' +
          '<div class="field"><span class="lbl">Endpoint</span>' + seg('aE', EPS.map(function (e, k) { return [k, e.m + ' ' + e.p]; }), api.ep) + '</div>' +
          '<div class="field"><span class="lbl">' + t('Token', 'Jeton') + '</span>' + seg('aT', [['valid', t('valid', 'valide')], ['expired', t('expired', 'expiré')], ['tampered', t('tampered', 'falsifié')], ['none', t('missing', 'absent')]], api.tok) + '</div>' +
          '<button class="go" id="aGo">' + t('Send request →', 'Envoyer la requête →') + '</button>' +
        '</div>' +
        '<div class="panel"><p class="panel__t">' + t('Decoded JWT', 'JWT décodé') + '</p><pre class="resp" id="aJ" style="min-height:0"></pre></div>' +
      '</div>' +
      '<div class="pipe" id="aP" style="margin-top:18px">' +
        ['GATEWAY|CORS · rate limit', 'JWT FILTER|' + t('signature · exp', 'signature · exp'), 'RBAC|@PreAuthorize', 'CONTROLLER|REST', 'POSTGRESQL|JPA'].map(function (x, k) {
          var p = x.split('|'); return (k ? '<i class="pwire"></i>' : '') + '<div class="pnode" data-k="' + k + '"><span>' + p[0] + '</span><b>' + p[1] + '</b></div>';
        }).join('') +
      '</div>' +
      '<div class="sim-grid">' +
        '<div class="panel"><p class="panel__t"><span>' + t('Response', 'Réponse') + '</span><span class="code-st" id="aC"></span></p><pre class="resp" id="aB">' + t('Send a request to see the response.', 'Envoyez une requête pour voir la réponse.') + '</pre></div>' +
        '<div class="panel"><p class="panel__t">' + t('Access log', 'Journal d\'accès') + '</p><ul class="log" id="aLog"></ul></div>' +
      '</div>' +
      '<div class="kpis">' + kpi('aN', t('Requests', 'Requêtes'), api.n) + kpi('aOk', '2xx', api.ok, 'ok') + kpi('a401', '401', api.e401, 'crit') + kpi('a403', '403', api.e403, 'crit') + '</div>';

    function bind(id, key, conv) {
      $$('#' + id + ' button').forEach(function (b) {
        b.onclick = function () { api[key] = conv ? conv(b.dataset.v) : b.dataset.v; $$('#' + id + ' button').forEach(function (x) { x.classList.toggle('on', x === b); }); jwt(); };
      });
    }
    bind('aR', 'role'); bind('aE', 'ep', Number); bind('aT', 'tok');

    function jwt() {
      var J = $('#aJ');
      if (api.tok === 'none') { J.innerHTML = '<span class="e">Authorization header: —</span>'; return; }
      var exp = api.tok === 'expired' ? '1767225600  <span class="e">// ' + t('in the past', 'dans le passé') + '</span>' : '1798761600';
      var sig = api.tok === 'tampered' ? '<span class="e">x9Qm…Tz (' + t('payload edited → signature mismatch', 'payload modifié → signature invalide') + ')</span>' : '<span class="s">HMACSHA256(…) ✓</span>';
      var role = api.tok === 'tampered' ? '"ADMIN"  <span class="e">// ' + t('forged', 'falsifié') + '</span>' : '"' + api.role + '"';
      J.innerHTML = '<span class="k">header</span>  { "alg": "HS256", "typ": "JWT" }\n<span class="k">payload</span> { "sub": "' + USERS[api.role] + '",\n          "role": ' + role + ',\n          "exp": ' + exp + ' }\n<span class="k">sig</span>     ' + sig;
    }
    jwt();

    var busy = false;
    $('#aGo').onclick = function () {
      if (busy) return; busy = true;
      var e = EPS[api.ep], nodes = $$('#aP .pnode'), ws = $$('#aP .pwire');
      nodes.forEach(function (n) { n.className = 'pnode'; }); ws.forEach(function (w) { w.classList.remove('lit'); });
      $('#aC').textContent = ''; $('#aB').innerHTML = '<span class="k">' + e.m + '</span> ' + e.p + '  …';
      var failAt = -1, code = e.code, msg = '';
      if (api.tok === 'none') { failAt = 1; code = 401; msg = 'Missing bearer token'; }
      else if (api.tok === 'expired') { failAt = 1; code = 401; msg = 'JWT expired'; }
      else if (api.tok === 'tampered') { failAt = 1; code = 401; msg = 'Invalid JWT signature'; }
      else if (e.roles.indexOf(api.role) < 0) { failAt = 2; code = 403; msg = 'Access denied: requires ' + e.roles.join(' or '); }
      var k = 0;
      (function step() {
        if (!$('#aP')) return;
        if (k > 0) ws[k - 1].classList.add('lit');
        nodes[k].className = 'pnode run';
        after(function () {
          if (!$('#aP')) return;
          if (k === failAt) { nodes[k].className = 'pnode fail'; for (var j = k + 1; j < nodes.length; j++) nodes[j].className = 'pnode skip'; done(); return; }
          nodes[k].className = 'pnode pass'; k++;
          if (k < nodes.length) step(); else done();
        }, 330);
      })();
      function done() {
        api.n++;
        var cls = code < 300 ? 's' : 'e';
        $('#aC').innerHTML = '<span style="color:' + (code < 300 ? '#3DDC97' : '#FF6A3D') + '">' + code + '</span>';
        var reason = { 200: 'OK', 201: 'Created', 204: 'No Content', 401: 'Unauthorized', 403: 'Forbidden' }[code];
        var body = code >= 400 ? '{ <span class="k">"status"</span>: ' + code + ', <span class="k">"error"</span>: <span class="e">"' + reason + '"</span>,\n  <span class="k">"message"</span>: <span class="e">"' + msg + '"</span> }' : esc(e.body.replace('{user}', USERS[api.role])) || '<span class="k">(' + t('empty body', 'corps vide') + ')</span>';
        $('#aB').innerHTML = '<span class="' + cls + '">HTTP/1.1 ' + code + ' ' + reason + '</span>\n\n' + body;
        if (code < 300) api.ok++; else if (code === 401) api.e401++; else api.e403++;
        $('#aN').textContent = api.n; $('#aOk').textContent = api.ok; $('#a401').textContent = api.e401; $('#a403').textContent = api.e403;
        log($('#aLog'), code < 300 ? 't-ok' : 't-crit', code + ' ' + e.m + ' ' + e.p + ' · ' + (api.tok === 'none' ? 'anonymous' : USERS[api.role]));
        busy = false;
      }
    };
  }

  /* =========================================================
     06 — WAREHOUSE OPTIMIZER (pick-route, OR)
     ========================================================= */
  var AISLES = 4, SLOTS = 8, TOP = 36, BOT = 322, Y0 = 60, SH = 30, DOCK = { x: 22, y: BOT };
  function aisleX(a) { return 70 + a * 150 + 30; }
  var opt = { picks: [], res: null };
  (function seed() {
    var pre = [[0, 1, 2], [3, 0, 6], [1, 1, 1], [5, 0, 4], [2, 1, 7], [6, 0, 0], [7, 1, 3], [4, 1, 5]];
    // [rackIndex(0..7), side, slot]
    opt.picks = pre.map(function (p) { return pickFrom(p[0], p[2]); });
  })();
  function pickFrom(rack, slot) {
    var a = Math.floor(rack / 2);
    return { rack: rack, slot: slot, a: a, x: aisleX(a), y: Y0 + slot * SH + SH / 2, id: 'R' + (rack + 1) + '-' + String(slot + 1).padStart(2, '0') };
  }
  function d(p, q) {
    if (p.x === q.x) return Math.abs(p.y - q.y);
    var dx = Math.abs(p.x - q.x);
    return Math.min(Math.abs(p.y - TOP) + dx + Math.abs(q.y - TOP), Math.abs(p.y - BOT) + dx + Math.abs(q.y - BOT));
  }
  function seg(p, q) {
    if (p.x === q.x) return [[q.x, q.y]];
    var yc = (Math.abs(p.y - TOP) + Math.abs(q.y - TOP)) <= (Math.abs(p.y - BOT) + Math.abs(q.y - BOT)) ? TOP : BOT;
    return [[p.x, yc], [q.x, yc], [q.x, q.y]];
  }
  function tourLen(t) { var s = 0; for (var i = 0; i < t.length - 1; i++) s += d(t[i], t[i + 1]); return s; }
  function solve(picks) {
    var un = picks.slice(), cur = DOCK, tour = [DOCK];
    while (un.length) {
      var bi = 0, bd = Infinity;
      un.forEach(function (p, i) { var x = d(cur, p); if (x < bd) { bd = x; bi = i; } });
      cur = un.splice(bi, 1)[0]; tour.push(cur);
    }
    tour.push(DOCK);
    var improved = true, guard = 0;
    while (improved && guard++ < 200) {
      improved = false;
      for (var i = 1; i < tour.length - 2; i++) for (var j = i + 1; j < tour.length - 1; j++) {
        var cand = tour.slice(0, i).concat(tour.slice(i, j + 1).reverse(), tour.slice(j + 1));
        if (tourLen(cand) < tourLen(tour) - .01) { tour = cand; improved = true; }
      }
    }
    return tour;
  }
  function pathD(tour) {
    var pts = [[tour[0].x, tour[0].y]];
    for (var i = 0; i < tour.length - 1; i++) pts = pts.concat(seg(tour[i], tour[i + 1]));
    return 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
  }
  var PX_M = 0.1; // 1 px = 0.1 m

  function renderOpt() {
    stage.innerHTML =
      head(t('Warehouse Optimizer', 'Optimiseur d\'entrepôt'),
        t('Decision support in the spirit of OptiStock: click rack slots to build a pick list, then compute the shortest picking route through the aisles (nearest-neighbour + 2-opt) and compare it with the naive order.',
          'Aide à la décision dans l\'esprit d\'OptiStock : cliquez sur des emplacements pour créer une liste de préparation, puis calculez la tournée la plus courte dans les allées (plus proche voisin + 2-opt) et comparez-la à l\'ordre naïf.'),
        'OPTISTOCK · OR') +
      '<div class="panel"><p class="panel__t"><span>' + t('Warehouse layout · 8 racks · 4 aisles', 'Plan d\'entrepôt · 8 racks · 4 allées') + '</span><span id="oN"></span></p>' +
        '<svg class="wh" id="oW" viewBox="0 0 640 350" role="img" aria-label="Warehouse layout"></svg>' +
        '<div class="legend"><span><i style="background:rgba(255,176,32,.7)"></i>' + t('Naive order (as listed)', 'Ordre naïf (liste)') + '</span><span><i style="background:#3DDC97"></i>' + t('Optimized route', 'Tournée optimisée') + '</span><span><i style="background:#3DDC97;height:8px;width:8px;border-radius:50%"></i>' + t('Dock', 'Quai') + '</span></div>' +
      '</div>' +
      '<div class="go-row" style="margin-top:14px"><button class="go" id="oGo">' + t('Optimize route', 'Optimiser la tournée') + '</button><button class="go go--ghost" id="oRnd">' + t('Random order', 'Commande aléatoire') + '</button><button class="go go--ghost" id="oClr">' + t('Clear', 'Vider') + '</button></div>' +
      '<div class="kpis">' + kpi('oA', t('Naive distance', 'Distance naïve'), '—') + kpi('oB', t('Optimized', 'Optimisée'), '—', 'ok') + kpi('oS', t('Walking saved', 'Marche économisée'), '—', 'ok') + kpi('oT', t('Solve time', 'Temps de calcul'), '—') + '</div>';

    var W = $('#oW');
    function draw() {
      var h = '';
      h += '<text class="lbl" x="8" y="' + (TOP - 8) + '">' + t('CROSS-AISLE', 'ALLÉE TRANSV.') + '</text>';
      for (var r = 0; r < 8; r++) {
        var a = Math.floor(r / 2), side = r % 2, x = aisleX(a) + (side ? 18 : -48);
        h += '<rect class="rack" x="' + x + '" y="' + Y0 + '" width="30" height="' + (SLOTS * SH) + '" rx="2"/>';
        h += '<text class="lbl" x="' + (x + 6) + '" y="' + (Y0 + SLOTS * SH + 14) + '">R' + (r + 1) + '</text>';
        for (var s = 0; s < SLOTS; s++) {
          h += '<rect class="slot" data-r="' + r + '" data-s="' + s + '" x="' + x + '" y="' + (Y0 + s * SH + 1) + '" width="30" height="' + (SH - 2) + '"/>';
          h += '<line x1="' + x + '" x2="' + (x + 30) + '" y1="' + (Y0 + s * SH) + '" y2="' + (Y0 + s * SH) + '" stroke="#0A1320"/>';
        }
      }
      if (opt.res) {
        h += '<path class="route-naive" transform="translate(5 5)" d="' + pathD(opt.res.naive) + '"/>';
        h += '<path class="route-opt" id="oPath" d="' + pathD(opt.res.best) + '"/>';
      }
      opt.picks.forEach(function (p, i) {
        var side = p.rack % 2, x = aisleX(p.a) + (side ? 18 : -48);
        var order = opt.res ? opt.res.best.indexOf(p) : i + 1;
        h += '<rect class="pick" x="' + (x + 3) + '" y="' + (Y0 + p.slot * SH + 4) + '" width="24" height="' + (SH - 8) + '" rx="3" pointer-events="none"/>';
        h += '<text class="pick-t" x="' + (x + 15) + '" y="' + (Y0 + p.slot * SH + SH / 2 + 3) + '" text-anchor="middle" pointer-events="none">' + order + '</text>';
      });
      h += '<circle class="dock" cx="' + DOCK.x + '" cy="' + DOCK.y + '" r="7"/><text class="lbl" x="8" y="' + (DOCK.y + 22) + '">' + t('DOCK', 'QUAI') + '</text>';
      if (opt.res) h += '<circle class="walker" id="oWk" r="5" cx="' + DOCK.x + '" cy="' + DOCK.y + '"/>';
      W.innerHTML = h;
      $('#oN').textContent = opt.picks.length + ' picks';
      $$('.slot', W).forEach(function (el) {
        el.onclick = function () {
          var r = +el.dataset.r, s = +el.dataset.s;
          var ix = -1; opt.picks.forEach(function (p, i) { if (p.rack === r && p.slot === s) ix = i; });
          if (ix >= 0) opt.picks.splice(ix, 1); else if (opt.picks.length < 14) opt.picks.push(pickFrom(r, s));
          opt.res = null; resetK(); draw();
        };
      });
      if (opt.res) walk();
    }
    function resetK() { ['oA', 'oB', 'oS', 'oT'].forEach(function (id) { $('#' + id).textContent = '—'; }); }
    function walk() {
      var path = $('#oPath'), wk = $('#oWk'); if (!path || !wk || !path.getTotalLength) return;
      var L = path.getTotalLength(), t0 = null, dur = Math.min(6000, 1400 + L * 2.2);
      function f(ts) {
        if (!$('#oWk') || !opt.res) return;
        if (!t0) t0 = ts;
        var p = ((ts - t0) % (dur + 800)) / dur;
        var pt = path.getPointAtLength(Math.min(1, p) * L);
        wk.setAttribute('cx', pt.x); wk.setAttribute('cy', pt.y);
        requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    }
    $('#oGo').onclick = function () {
      if (opt.picks.length < 2) return;
      var t0 = performance.now();
      var best = solve(opt.picks);
      var ms = (performance.now() - t0).toFixed(2);
      var naive = [DOCK].concat(opt.picks, [DOCK]);
      var a = tourLen(naive), b = tourLen(best);
      opt.res = { naive: naive, best: best };
      $('#oA').textContent = Math.round(a * PX_M) + ' m';
      $('#oB').textContent = Math.round(b * PX_M) + ' m';
      $('#oS').textContent = Math.max(0, Math.round((1 - b / a) * 100)) + '%';
      $('#oT').textContent = ms + ' ms';
      draw();
    };
    $('#oRnd').onclick = function () {
      var n = 6 + Math.floor(Math.random() * 6), seen = {};
      opt.picks = [];
      while (opt.picks.length < n) {
        var r = Math.floor(Math.random() * 8), s = Math.floor(Math.random() * SLOTS);
        if (seen[r + '-' + s]) continue; seen[r + '-' + s] = 1; opt.picks.push(pickFrom(r, s));
      }
      opt.res = null; resetK(); draw();
    };
    $('#oClr').onclick = function () { opt.picks = []; opt.res = null; resetK(); draw(); };
    draw();
  }

  /* =========================================================
     router
     ========================================================= */
  var MODS = {
    risk: { path: 'risk-engine', fn: renderRisk },
    sap: { path: 'sap-pipeline', fn: renderSap },
    iot: { path: 'machine-alerting', fn: renderIot },
    cloud: { path: 'container-stack', fn: renderCloud },
    api: { path: 'secure-api', fn: renderApi },
    opt: { path: 'warehouse-optimizer', fn: renderOpt }
  };
  var current = null, cleanup = null;
  function open(m) {
    if (!MODS[m]) return;
    clearTimers();
    if (typeof cleanup === 'function') cleanup();
    current = m;
    $$('.module', document).forEach(function (b) {
      var on = b.dataset.mod === m; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && b.scrollIntoView && b.parentNode.scrollWidth > b.parentNode.clientWidth) b.parentNode.scrollLeft = b.offsetLeft - 10;
    });
    pathEl.textContent = 'haytame@lab:~/modules/' + MODS[m].path;
    cleanup = MODS[m].fn();
  }
  $$('.module', document).forEach(function (b) { b.addEventListener('click', function () { open(b.dataset.mod); }); });
  document.addEventListener('langchange', function () { if (current) open(current); });
  window.HELab = { open: open };
  open('risk');
})();
