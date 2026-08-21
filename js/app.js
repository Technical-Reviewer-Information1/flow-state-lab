(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

  /* ===================== STEP 1 ログイン処理のフローチャート ===================== */
  /* 本文 図1 と同じ構成。ア=判断「認証情報は正しいか」 イ=処理「認証エラーメッセージを2秒間表示する」
     ウ=判断「10回目の認証エラーか」 エ=処理「パスワード変更要求メールを送信する」            */
  const FC = [
    { id: 'start', k: 'term', x: 175, y: 14, w: 150, h: 34, t: ['開始'] },
    { id: 'input', k: 'proc', x: 150, y: 68, w: 200, h: 42, t: ['アカウント情報', '入力画面を表示'] },
    { id: 'auth', k: 'dec', x: 150, y: 130, w: 200, h: 62, t: ['【ア】認証情報は', '正しいか'] },
    { id: 'okv', k: 'proc', x: 388, y: 138, w: 170, h: 42, t: ['ログイン成功', '画面を表示'] },
    { id: 'cnt', k: 'proc', x: 150, y: 212, w: 200, h: 42, t: ['認証エラー回数を', '1増やす'] },
    { id: 'msg', k: 'proc', x: 150, y: 274, w: 200, h: 42, t: ['【イ】認証エラーメッセージ', 'を2秒間表示する'] },
    { id: 'ten', k: 'dec', x: 150, y: 336, w: 200, h: 62, t: ['【ウ】10回目の', '認証エラーか'] },
    { id: 'mail', k: 'proc', x: 150, y: 418, w: 200, h: 42, t: ['【エ】パスワード変更', '要求メールを送信する'] },
    { id: 'end', k: 'term', x: 175, y: 480, w: 150, h: 34, t: ['終了'] }
  ];
  const FCLINE = [
    { f: 'start', t: 'input', d: 'M250,48 L250,68' },
    { f: 'input', t: 'auth', d: 'M250,110 L250,130' },
    { f: 'auth', t: 'okv', d: 'M350,161 L388,161', lab: 'Yes', lx: 369, ly: 153 },
    { f: 'okv', t: 'end', d: 'M473,180 L473,497 L325,497' },
    { f: 'auth', t: 'cnt', d: 'M250,192 L250,212', lab: 'No', lx: 266, ly: 205 },
    { f: 'cnt', t: 'msg', d: 'M250,254 L250,274' },
    { f: 'msg', t: 'ten', d: 'M250,316 L250,336' },
    { f: 'ten', t: 'mail', d: 'M250,398 L250,418', lab: 'Yes', lx: 268, ly: 411 },
    { f: 'ten', t: 'input', d: 'M150,367 L92,367 L92,89 L150,89', lab: 'No', lx: 120, ly: 359 },
    { f: 'mail', t: 'end', d: 'M250,460 L250,480' }
  ];
  const FCST = { cnt: 0, now: null, done: false, log: [] };

  function fcSvg() {
    let s = '<svg viewBox="0 0 570 525" width="100%" style="max-width:570px" role="img" aria-label="ログイン処理のフローチャート">' +
      '<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="#5b616b"/></marker>' +
      '<marker id="fao" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="#8a5a00"/></marker></defs>';
    FCLINE.forEach(function (l) {
      const on = FCST.path && FCST.path.indexOf(l.f + '>' + l.t) >= 0;
      s += '<path class="fc-line' + (on ? ' on' : '') + '" marker-end="url(#' + (on ? 'fao' : 'fa') + ')" d="' + l.d + '"/>';
      if (l.lab) s += '<text class="fc-lab" x="' + l.lx + '" y="' + l.ly + '">' + l.lab + '</text>';
    });
    FC.forEach(function (b) {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const cls = 'fc-box' + (FCST.now === b.id ? ' on' : (FCST.seen && FCST.seen.indexOf(b.id) >= 0 ? ' past' : ''));
      if (b.k === 'dec') {
        s += '<polygon class="' + cls + '" points="' + [
          [cx, b.y], [b.x + b.w, cy], [cx, b.y + b.h], [b.x, cy]].map(p => p.join(',')).join(' ') + '"/>';
      } else if (b.k === 'term') {
        s += '<rect class="' + cls + '" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="17"/>';
      } else {
        s += '<rect class="' + cls + '" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '"/>';
      }
      b.t.forEach(function (line, i) {
        const dy = cy + (i - (b.t.length - 1) / 2) * 15 + 4;
        s += '<text class="fc-t' + (b.k === 'dec' ? ' b' : '') + '" x="' + cx + '" y="' + dy + '" text-anchor="middle">' + esc(line) + '</text>';
      });
    });
    $('fcSvg').innerHTML = s + '</svg>';
  }

  function fcLog(t) { FCST.log.unshift(t); $('fcLog').innerHTML = FCST.log.slice(0, 30).map(x => '<div>' + x + '</div>').join(''); }

  function fcRun(kind) {
    if (kind === 'reset') {
      FCST.cnt = 0; FCST.now = null; FCST.done = false; FCST.log = []; FCST.seen = []; FCST.path = [];
      $('fcCnt').textContent = 0; $('fcNow').textContent = '開始前'; $('fcLog').innerHTML = '';
      const n = $('fcNote'); n.className = 'note info';
      n.textContent = 'ボタンを押すと、フローチャートの上を実際に進みます。';
      fcSvg(); return;
    }
    if (FCST.done) { fcRun('reset'); }
    const times = kind === 'ng10' ? 10 - FCST.cnt : 1;
    if (kind === 'ok') {
      FCST.seen = ['start', 'input', 'auth']; FCST.path = ['start>input', 'input>auth', 'auth>okv', 'okv>end'];
      FCST.now = 'okv'; FCST.done = true;
      $('fcNow').textContent = 'ログイン成功画面を表示';
      fcLog('パスワード正しい → ログイン成功');
      const n = $('fcNote'); n.className = 'note ok';
      n.innerHTML = '判断【ア】で <strong>Yes</strong> に進み、そのまま終了しました。' +
        '<strong>ひし形からは必ず Yes と No の2本</strong>が出ていきます。どちらに進むかで、その後がまったく変わります。';
      fcSvg(); return;
    }
    for (let k = 0; k < Math.max(1, times); k++) {
      if (FCST.cnt >= 10) break;
      FCST.cnt++;
      fcLog('エラー ' + FCST.cnt + ' 回目：メッセージを2秒間表示' + (FCST.cnt >= 10 ? ' → メール送信' : ' → 入力画面に戻る'));
    }
    $('fcCnt').textContent = FCST.cnt;
    const last = FCST.cnt >= 10;
    FCST.seen = ['start', 'input', 'auth', 'cnt', 'msg', 'ten'];
    FCST.path = ['start>input', 'input>auth', 'auth>cnt', 'cnt>msg', 'msg>ten'].concat(
      last ? ['ten>mail', 'mail>end'] : ['ten>input']);
    FCST.now = last ? 'mail' : 'ten';
    FCST.done = last;
    $('fcNow').textContent = last ? 'パスワード変更要求メールを送信する' : '【ウ】10回目の認証エラーか';
    const n = $('fcNote');
    if (last) {
      n.className = 'note warn';
      n.innerHTML = '<strong>10回目でループを抜けました。</strong>判断【ウ】で Yes に進み、【エ】メールを送って終了します。' +
        '<br>くり返しは、<strong>矢印が前に戻ってくる</strong>形（【ウ】→入力画面）で表されていました。' +
        'その戻る矢印がループの正体です。';
    } else {
      n.className = 'note ng';
      n.innerHTML = 'エラー <strong>' + FCST.cnt + ' 回目</strong>。判断【ウ】は <strong>No</strong> なので、' +
        '矢印が<strong>入力画面まで戻り</strong>、もう一度やり直しになります。あと ' + (10 - FCST.cnt) + ' 回間違えると…？';
    }
    fcSvg();
  }

  /* ===================== STEP 2 記号 ===================== */
  const SYM = [
    { id: 'term', t: '端子', d: '処理の<strong>始まりと終わり</strong>を表します。フローチャートは必ず「開始」で始まり「終了」で終わります。' +
      '本問では「開始」と「終了」がこの形です。' },
    { id: 'proc', t: '処理', d: '<strong>何かをする</strong>ことを表します。「認証エラー回数を1増やす」「メッセージを2秒間表示する」など。' +
      '出ていく矢印は<strong>1本だけ</strong>です。' },
    { id: 'dec', t: '判断', d: '<strong>条件で道が分かれる</strong>ことを表します。出ていく矢印は <strong>Yes と No の2本</strong>。' +
      '中身は「認証情報は正しいか」のように<strong>問いの形</strong>で書きます。' },
    { id: 'io', t: '入出力', d: 'データを<strong>読みこむ・書き出す</strong>ことを表します。画面への表示やキーボードからの入力など。' },
    { id: 'loop', t: '繰り返し', d: 'くり返しの<strong>始まりと終わり</strong>をはさんで表す書き方です。本問のように、' +
      '<strong>判断と戻る矢印</strong>でくり返しを表すこともあります。' }
  ];
  function symSvg() {
    const W = 110, y = 20, h = 46;
    let s = '<svg viewBox="0 0 570 118" width="100%" style="max-width:570px">';
    SYM.forEach(function (m, i) {
      const x = 6 + i * (W + 3), cx = x + W / 2, cy = y + h / 2;
      const on = SYM.pick === m.id ? ' on' : '';
      if (m.id === 'term') s += '<rect class="fc-box' + on + '" x="' + x + '" y="' + y + '" width="' + W + '" height="' + h + '" rx="22" data-s="' + m.id + '"/>';
      else if (m.id === 'dec') s += '<polygon class="fc-box' + on + '" data-s="' + m.id + '" points="' + [[cx, y], [x + W, cy], [cx, y + h], [x, cy]].map(p => p.join(',')).join(' ') + '"/>';
      else if (m.id === 'io') s += '<polygon class="fc-box' + on + '" data-s="' + m.id + '" points="' + [[x + 16, y], [x + W, y], [x + W - 16, y + h], [x, y + h]].map(p => p.join(',')).join(' ') + '"/>';
      else if (m.id === 'loop') s += '<polygon class="fc-box' + on + '" data-s="' + m.id + '" points="' + [[x + 12, y], [x + W - 12, y], [x + W, y + 12], [x + W, y + h], [x, y + h], [x, y + 12]].map(p => p.join(',')).join(' ') + '"/>';
      else s += '<rect class="fc-box' + on + '" data-s="' + m.id + '" x="' + x + '" y="' + y + '" width="' + W + '" height="' + h + '"/>';
      s += '<text class="fc-t b" x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" style="pointer-events:none">' + m.t + '</text>';
      s += '<text class="fc-lab" x="' + cx + '" y="' + (y + h + 16) + '" text-anchor="middle" style="pointer-events:none">クリック</text>';
    });
    $('symSvg').innerHTML = s + '</svg>';
    $('symSvg').querySelectorAll('[data-s]').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function () {
        SYM.pick = el.dataset.s; symSvg();
        const m = SYM.find(x => x.id === SYM.pick);
        const n = $('symNote'); n.className = 'note ok';
        n.innerHTML = '<strong>' + m.t + '</strong>：' + m.d;
      });
    });
  }

  /* ===================== STEP 3 状態遷移図 ===================== */
  const ST = {
    init: { t: '初期状態', cx: 140, cy: 230, rx: 76, ry: 36 },
    ring: { t: 'アラームが鳴る', cx: 520, cy: 100, rx: 92, ry: 36 },
    snz: { t: 'スヌーズ状態', cx: 520, cy: 340, rx: 86, ry: 36 }
  };
  /* 本文の答え：ア=③設定した時刻になる イ=⓪Aボタン ウ=①Bボタン エ=④5分が経過する オ=⓪Aボタン カ=⑤アラームをセットする */
  const TR = [
    { id: 'a', f: 'init', t: 'ring', ev: 'time', lab: '【ア】設定した時刻になる' },
    { id: 'b', f: 'ring', t: 'init', ev: 'A', lab: '【イ】Aボタンを押す' },
    { id: 'c', f: 'ring', t: 'snz', ev: 'B', lab: '【ウ】Bボタンを押す' },
    { id: 'd', f: 'snz', t: 'ring', ev: 'min5', lab: '【エ】5分が経過する' },
    { id: 'e', f: 'snz', t: 'init', ev: 'A', lab: '【オ】Aボタンを押す' },
    { id: 'f', f: 'init', t: 'init', ev: 'set', lab: '【カ】アラームをセットする' }
  ];
  const EVNAME = { time: '設定時刻になる', min5: '5分が経過する', A: 'Aボタンを押す', B: 'Bボタンを押す', set: 'アラームをセットする' };
  const S = { now: 'init', fire: null, log: [], min: 419 };  /* 6:59 */

  function stSvg() {
    const path = {
      f: 'M104,200 C 78,138 202,138 176,200',
      a: 'M202,200 C 300,142 400,110 424,104',
      b: 'M438,130 C 380,192 262,232 216,236',
      d: 'M486,306 C 466,242 466,198 486,138',
      c: 'M556,138 C 582,198 582,244 556,302',
      e: 'M436,356 C 330,356 232,300 192,264'
    };
    const lp = { f: [140, 126], a: [320, 170], b: [330, 224], d: [392, 268], c: [648, 222], e: [300, 384] };
    let s = '<svg viewBox="0 0 760 420" width="100%" style="max-width:760px" role="img" aria-label="目覚まし時計の状態遷移図">' +
      '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="#5b616b"/></marker>' +
      '<marker id="arf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="#123a6b"/></marker></defs>';
    TR.forEach(function (t) {
      const on = S.fire === t.id;
      s += '<path class="st-e' + (on ? ' fire' : '') + '" marker-end="url(#' + (on ? 'arf' : 'ar') + ')" d="' + path[t.id] + '"/>';
    });
    Object.keys(ST).forEach(function (k) {
      const n = ST[k];
      s += '<ellipse class="st-c' + (S.now === k ? ' now' : '') + '" cx="' + n.cx + '" cy="' + n.cy + '" rx="' + n.rx + '" ry="' + n.ry + '"/>';
      s += '<text class="st-t" x="' + n.cx + '" y="' + (n.cy + 5) + '">' + n.t + '</text>';
    });
    TR.forEach(function (t) {
      const on = S.fire === t.id, p = lp[t.id];
      const w = t.lab.length * 11.2;
      s += '<rect x="' + (p[0] - w / 2 - 4) + '" y="' + (p[1] - 13) + '" width="' + (w + 8) + '" height="18" fill="#f7f8f9" opacity=".95"/>';
      s += '<text class="st-el' + (on ? ' fire' : '') + '" x="' + p[0] + '" y="' + p[1] + '">' + esc(t.lab) + '</text>';
    });
    $('stSvg').innerHTML = s + '</svg>';
    const h = Math.floor(S.min / 60) % 24, m = S.min % 60;
    $('stClock').textContent = h + ':' + String(m).padStart(2, '0') + (S.now === 'ring' ? ' ♪♪' : '');
  }

  function stLog(t) { S.log.unshift(t); $('stLog').innerHTML = S.log.slice(0, 30).map(x => '<div>' + x + '</div>').join(''); }

  function stFire(ev) {
    if (ev === 'reset') {
      S.now = 'init'; S.fire = null; S.log = []; S.min = 419;
      $('stLog').innerHTML = '';
      const n = $('stNote'); n.className = 'note info';
      n.textContent = 'いまは初期状態（アラームがセットされている）です。ボタンを押してみましょう。';
      stSvg(); return;
    }
    const t = TR.find(x => x.f === S.now && x.ev === ev);
    const n = $('stNote');
    if (!t) {
      S.fire = null; stSvg();
      n.className = 'note ng';
      n.innerHTML = '<strong>何も起こりません。</strong>いまの状態「' + ST[S.now].t + '」から、' +
        '「' + EVNAME[ev] + '」の矢印は<strong>出ていない</strong>からです。' +
        '<br>状態遷移図では、<strong>その状態から出ている矢印のことしか起こりません</strong>。これが図を読むときのいちばん大事なきまりです。';
      stLog('×  ' + ST[S.now].t + ' で「' + EVNAME[ev] + '」→ 変化なし');
      return;
    }
    if (ev === 'time') S.min = 420;
    if (ev === 'min5') S.min += 5;
    const from = S.now;
    S.now = t.t; S.fire = t.id;
    stSvg();
    stLog('○  ' + ST[from].t + ' →〔' + EVNAME[ev] + '〕→ ' + ST[t.t].t);
    n.className = 'note ok';
    if (t.id === 'f') {
      n.innerHTML = '<strong>同じ状態に戻りました（自己ループ）。</strong>矢印が自分自身に戻る形です。' +
        'アラームをセットし直しても、状態は「初期状態」のままだからです。';
    } else if (t.id === 'c') {
      n.innerHTML = '<strong>スヌーズ状態になりました。</strong>ここから <strong>5分が経過する</strong>と、また「アラームが鳴る」に戻ります。' +
        'Aボタンなら初期状態に戻ります。2本の出口があることを図で確かめてください。';
    } else {
      n.innerHTML = '<strong>' + ST[from].t + '</strong> から〔' + EVNAME[ev] + '〕で <strong>' + ST[t.t].t + '</strong> に移りました。' +
        'まるが<strong>状態</strong>、矢印が<strong>きっかけ（イベント）</strong>です。';
    }
  }

  /* ===================== STEP 4 状態遷移表 ===================== */
  const TRROWS = ['init', 'ring', 'snz'];
  const TREVS = ['time', 'min5', 'A', 'B', 'set'];
  const STOPT = [['init', '初期状態'], ['ring', 'アラームが鳴る'], ['snz', 'スヌーズ状態'], ['none', '何も起こらない']];
  function trAnswer(st, ev) { const t = TR.find(x => x.f === st && x.ev === ev); return t ? t.t : 'none'; }
  function drawTr() {
    let h = '<thead><tr><th>いまの状態＼できごと</th>' + TREVS.map(e => '<th>' + EVNAME[e] + '</th>').join('') + '</tr></thead><tbody>';
    TRROWS.forEach(function (st) {
      h += '<tr><th>' + ST[st].t + '</th>' + TREVS.map(function (ev) {
        return '<td><select class="sel" data-st="' + st + '" data-ev="' + ev + '"><option value="">えらぶ</option>' +
          STOPT.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('') + '</select></td>';
      }).join('') + '</tr>';
    });
    $('trTable').innerHTML = h + '</tbody>';
  }
  function checkTr() {
    let ok = 0, all = 0, blank = 0;
    $('trTable').querySelectorAll('select').forEach(function (s) {
      all++;
      const want = trAnswer(s.dataset.st, s.dataset.ev);
      const td = s.parentNode;
      if (!s.value) { blank++; td.style.background = ''; return; }
      const good = s.value === want;
      td.style.background = good ? 'var(--ok-bg)' : 'var(--ng-bg)';
      if (good) ok++; else s.value = '';
    });
    const n = $('trNote');
    if (blank) {
      n.className = 'note warn';
      n.innerHTML = '空らんが <strong>' + blank + '</strong> あります。' +
        '「何も起こらない」も答えのひとつです。<strong>矢印が出ていないところ</strong>がそれにあたります。';
      return;
    }
    n.className = 'note ' + (ok === all ? 'ok' : 'ng');
    n.innerHTML = '<strong>' + ok + ' / ' + all + ' 正解。</strong>' +
      (ok === all
        ? '状態遷移図と状態遷移表は<strong>同じことを別の書き方で表したもの</strong>です。' +
          '表にすると「何も起こらない」がはっきり見えるので、抜けを見つけやすくなります。'
        : 'まちがえたところは空らんに戻しました。STEP 3 で実際にボタンを押して確かめてから、もう一度どうぞ。');
  }

  function init() {
    document.querySelectorAll('[data-fc]').forEach(b => b.addEventListener('click', () => fcRun(b.dataset.fc)));
    fcRun('reset');
    symSvg();
    document.querySelectorAll('[data-ev]').forEach(b => b.addEventListener('click', () => stFire(b.dataset.ev)));
    stFire('reset');
    drawTr();
    $('trCheck').addEventListener('click', checkTr);
    $('trClear').addEventListener('click', function () {
      drawTr(); const n = $('trNote'); n.className = 'note info'; n.textContent = '消しました。';
    });

    Predict.make('pd1', {
      q: '判断（ひし形）から出ていく矢印は、ふつう何本ですか。',
      type: 'num', unit: '本', placeholder: '本数',
      answer: function () { return 2; },
      show: function () { return 'Yes と No の2本です。STEP 1 の【ア】と【ウ】で確かめられます。'; },
      why: '処理（長方形）は<strong>1本</strong>、判断（ひし形）は<strong>2本</strong>。これだけで図がずいぶん読みやすくなります。'
    });

    Predict.make('pd2', {
      q: 'パスワードを9回まちがえた次の1回（10回目）で、画面には何が起きますか。',
      type: 'pick',
      ch: ['入力画面に戻る', 'パスワード変更要求メールが送られて終了する', 'ログイン成功画面が出る', '何も起こらない'],
      answer: function () { return 1; },
      show: function () { return 'STEP 1 の「10回まとめて間違える」で実際に確かめられます。'; },
      why: '判断【ウ】「10回目の認証エラーか」が <strong>Yes</strong> になり、ループを抜けて【エ】へ進みます。' +
           '9回目までは No なので、矢印が入力画面まで戻ります。'
    });

    Predict.make('pd3', {
      q: '「初期状態」でBボタンを押すと、どうなりますか。',
      type: 'pick',
      ch: ['スヌーズ状態になる', 'アラームが鳴る', '何も起こらない', '初期状態に戻る'],
      answer: function () { return 2; },
      show: function () { return 'STEP 3 で実際に押すと、ログに「変化なし」と出ます。'; },
      why: '図で初期状態から出ている矢印は「設定した時刻になる」と「アラームをセットする」だけです。' +
           '<strong>Bボタンの矢印は「アラームが鳴る」からしか出ていません。</strong>' +
           'その状態から出ていない矢印のことは起こらない——これが状態遷移図の読み方です。'
    });

    Quiz.choice('bookBox', 'bookNote', [
      { k: '2-1 ア', q: 'Yes に進むと「ログイン成功画面を表示」になる、ひし形の中身は。',
        ch: ['パスワード変更要求メールを送信する', '認証情報は正しいか', '認証エラーメッセージを2秒間表示する', '10回目の認証エラーか'], a: 1,
        why: '<strong>ひし形は判断</strong>なので「〜か」という問いの形が入ります。⓪と②は処理（長方形）の中身です。' },
      { k: '2-1 イ', q: '「認証エラー回数を1増やす」の次に来る処理は。',
        ch: ['パスワード変更要求メールを送信する', '認証情報は正しいか', '認証エラーメッセージを2秒間表示する', '10回目の認証エラーか'], a: 2,
        why: '【ログイン処理】に「認証エラー回数をカウントし、『認証エラー』メッセージを2秒間表示する」とあります。順番どおりです。' },
      { k: '2-1 ウ', q: 'Yes なら【エ】へ、No なら入力画面へ戻る、ひし形の中身は。',
        ch: ['パスワード変更要求メールを送信する', '認証情報は正しいか', '認証エラーメッセージを2秒間表示する', '10回目の認証エラーか'], a: 3,
        why: '「これを最大10回まで繰り返し」の部分です。<strong>No で前に戻る矢印</strong>があることが、くり返しの目印になります。' },
      { k: '2-1 エ', q: '10回目の認証エラーのあとに実行される処理は。',
        ch: ['パスワード変更要求メールを送信する', '認証情報は正しいか', '認証エラーメッセージを2秒間表示する', '10回目の認証エラーか'], a: 0,
        why: '「10回目の認証エラーの後には、パスワード変更を促すメールを送信して処理を終了する」とあります。' },
      { k: '2-2 ア', q: '「初期状態」から「アラームが鳴る」への矢印は。',
        ch: ['Aボタンを押す', 'Bボタンを押す', 'AボタンとBボタンを同時に押す', '設定した時刻になる', '5分が経過する', 'アラームをセットする'], a: 3,
        why: '「設定した時刻になるとアラームが鳴る」より。STEP 3 の「設定時刻になる」で確かめられます。' },
      { k: '2-2 イ', q: '「アラームが鳴る」から「初期状態」へ戻る矢印は。',
        ch: ['Aボタンを押す', 'Bボタンを押す', 'AボタンとBボタンを同時に押す', '設定した時刻になる', '5分が経過する', 'アラームをセットする'], a: 0,
        why: '「アラームが鳴っている状態でAボタンを押すと初期状態に戻る」より。' },
      { k: '2-2 ウ', q: '「アラームが鳴る」から「スヌーズ状態」への矢印は。',
        ch: ['Aボタンを押す', 'Bボタンを押す', 'AボタンとBボタンを同時に押す', '設定した時刻になる', '5分が経過する', 'アラームをセットする'], a: 1,
        why: '「Bボタンを押すとスヌーズ状態になり」より。' },
      { k: '2-2 エ', q: '「スヌーズ状態」から「アラームが鳴る」へ戻る矢印は。',
        ch: ['Aボタンを押す', 'Bボタンを押す', 'AボタンとBボタンを同時に押す', '設定した時刻になる', '5分が経過する', 'アラームをセットする'], a: 4,
        why: '「5分後に再度アラームが鳴る」より。ボタン操作ではなく<strong>時間の経過</strong>がきっかけになる矢印です。' },
      { k: '2-2 オ', q: '「スヌーズ状態」から「初期状態」へ戻る矢印は。',
        ch: ['Aボタンを押す', 'Bボタンを押す', 'AボタンとBボタンを同時に押す', '設定した時刻になる', '5分が経過する', 'アラームをセットする'], a: 0,
        why: '「スヌーズ状態でもAボタンを押すと初期状態に戻る」より。イと同じ選択肢を2回使います。' },
      { k: '2-2 カ', q: '「初期状態」から「初期状態」へ戻る矢印（自己ループ）は。',
        ch: ['Aボタンを押す', 'Bボタンを押す', 'AボタンとBボタンを同時に押す', '設定した時刻になる', '5分が経過する', 'アラームをセットする'], a: 5,
        why: '「アラームを再びセットすると初期状態に戻る」より。<strong>同じ状態に戻る矢印</strong>もあることを覚えておきましょう。' }
    ], '本文の答えは、2-1【ア】①【イ】②【ウ】③【エ】⓪　2-2【ア】③【イ】⓪【ウ】①【エ】④【オ】⓪【カ】⑤ です。');

    window.Terms.glossary($('glossBox'), ['アルゴリズム', 'フローチャート', '状態遷移図', '変数', 'トレース']);
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
