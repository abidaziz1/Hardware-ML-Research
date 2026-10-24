/*
 * Paper 6 widgets, Part 3: the chip.
 *   eieZero    a zero input makes its whole column unnecessary
 *   eiePeMap   how the rows of the book are dealt out to four cooks
 *   eieSim     race the cooks, with a queue of waiting orders in front of each
 *   eieEnergy  rebuild the abstract's four savings from Paper 1's energy numbers
 * EIE.drawResults draws the headline results chart. The models live in sim.js.
 */
(function () {
  'use strict';
  var MLS = window.MLS;
  var h = MLS.h;
  var s = MLS.s;
  var ui = MLS.ui;
  var fmt = MLS.fmt;
  var hw = MLS.hw;
  var EIE = window.EIE;

  function small(text) {
    return h('p', { style: { fontSize: '0.84rem', color: 'var(--ink-3)' }, html: MLS.rich(text) });
  }

  /* ======================================================================
   * eieZero
   * ==================================================================== */
  EIE.zeroToy = {
    inputs: [2.4, -1.8, -0.4, 0.7, -3.1, -0.9, 1.6, -2.2, 3.2, -0.5, -1.1, -0.9],
    entries: [10, 7, 12, 9, 6, 11, 8, 10, 7, 12, 9, 8]
  };
  MLS.widgets.eieZero = function (host) {
    var vals = EIE.zeroToy.inputs.slice();
    var entries = EIE.zeroToy.entries;
    var total = entries.reduce(function (a, b) {
      return a + b;
    }, 0);
    var relu = false;
    var tiles = [];
    var sCols = ui.stat('Columns you read', '');
    var sEnt = ui.stat('Stored entries you read', '');
    var say = ui.msg('');
    var reluBtn = h('button.btn.small', { type: 'button', 'aria-pressed': 'false' }, 'Apply ReLU');
    var resetBtn = h('button.btn.small', { type: 'button' }, 'Reset the numbers');

    var row = h('div.eie-ztiles');
    vals.forEach(function (v, j) {
      var num = h('button.zin', { type: 'button', 'aria-label': 'Input ' + j + '. Click to flip its sign.' }, '');
      num.addEventListener('click', function () {
        vals[j] = -vals[j];
        paint();
      });
      var bar = h('i.zbar');
      bar.style.height = entries[j] * 3 + 'px';
      var t = h('div.zt', num, bar, h('span.zn', String(entries[j])));
      tiles.push({ num: num, bar: bar, el: t });
      row.appendChild(t);
    });

    reluBtn.addEventListener('click', function () {
      relu = !relu;
      paint();
    });
    resetBtn.addEventListener('click', function () {
      vals = EIE.zeroToy.inputs.slice();
      relu = false;
      paint();
    });

    function paint() {
      reluBtn.setAttribute('aria-pressed', relu ? 'true' : 'false');
      reluBtn.textContent = relu ? 'Undo ReLU' : 'Apply ReLU';
      var cols = 0;
      var ent = 0;
      vals.forEach(function (v, j) {
        var shown = relu ? Math.max(0, v) : v;
        var zero = relu && v <= 0;
        tiles[j].num.textContent = fmt(shown, 1);
        tiles[j].el.classList.toggle('skip', zero);
        tiles[j].num.classList.toggle('neg', !relu && v < 0);
        if (!zero) {
          cols++;
          ent += entries[j];
        }
      });
      sCols.set(cols + ' of ' + vals.length, cols === vals.length ? 'bad' : 'good');
      sEnt.set(ent + ' of ' + total + ' (' + fmt((ent / total) * 100, 0) + '%)', ent === total ? 'bad' : 'good');
      if (!relu) say.set('Before ReLU, every number is non-zero, so you must read every column.');
      else if (cols === vals.length) say.set('Every input is positive, so nothing can be skipped.');
      else say.set('**' + (vals.length - cols) + ' orders are zero.** You skip their columns and read only ' + fmt((ent / total) * 100, 0) + '% of the stored entries.');
    }

    host.appendChild(h('div.btnrow', reluBtn, resetBtn));
    host.appendChild(h('div.scroll', row));
    host.appendChild(h('div.readout', sCols.el, sEnt.el));
    host.appendChild(say.el);
    host.appendChild(small('Each tile is one input. The bar under it is that input\'s column of the book, and the small number is how many entries it stores. Click a number to flip its sign.'));
    paint();
  };

  /* ======================================================================
   * eiePeMap: 16 rows dealt out to 4 cooks.
   * ==================================================================== */
  EIE.peMapToy = { rows: 16, cols: 8, density: 0.3, seed: 16, cooks: 4 };
  MLS.widgets.eiePeMap = function (host) {
    var t = EIE.peMapToy;
    var book = EIE.makeBook(t.rows, t.cols, t.density, t.seed);
    var sel = 3;
    var cellEls = [];
    var heads = [];
    var bars = [];
    var say = ui.msg('');

    var grid = h('div.cgrid.eie-pe-grid');
    grid.style.gridTemplateColumns = 'auto auto repeat(' + t.cols + ', auto)';
    grid.appendChild(h('div.cell.plain', ''));
    grid.appendChild(h('div.cell.plain', ''));
    for (var j = 0; j < t.cols; j++) {
      (function (jj) {
        var b = h('button.cell.hd', { type: 'button', 'aria-label': 'Select column ' + jj }, String(jj));
        b.addEventListener('click', function () {
          sel = jj;
          paint();
        });
        heads.push(b);
        grid.appendChild(b);
        cellEls.push([]);
      })(j);
    }
    for (var r = 0; r < t.rows; r++) {
      grid.appendChild(h('div.cell.plain.rl', String(r)));
      grid.appendChild(h('div.cell.plain.cook.c' + (r % t.cooks), 'c' + (r % t.cooks)));
      for (var k = 0; k < t.cols; k++) {
        var on = book[k].indexOf(r) >= 0;
        var c = h('div.cell' + (on ? '.full.c' + (r % t.cooks) : '.empty'), on ? '•' : '');
        cellEls[k][r] = c;
        grid.appendChild(c);
      }
    }

    var side = h('div.eie-pe-side', h('div.k', 'Entries each cook must read in the chosen column'));
    for (var p = 0; p < t.cooks; p++) {
      var fill = h('i.f.c' + p);
      var num = h('span.n', '0');
      bars.push({ fill: fill, num: num });
      side.appendChild(h('div.brow', h('span.nm', 'Cook ' + p), h('div.btrack', fill), num));
    }

    function paint() {
      heads.forEach(function (b, jj) {
        b.classList.toggle('win', jj === sel);
        b.setAttribute('aria-pressed', jj === sel ? 'true' : 'false');
      });
      cellEls.forEach(function (col, jj) {
        col.forEach(function (c) {
          c.classList.toggle('sel', jj === sel);
        });
      });
      var counts = EIE.split(book[sel], t.cooks);
      var max = Math.max.apply(null, counts);
      counts.forEach(function (cnt, pp) {
        bars[pp].fill.style.width = (max ? (cnt / max) * 100 : 0) + '%';
        bars[pp].num.textContent = String(cnt);
      });
      var busiest = [];
      counts.forEach(function (cnt, pp) {
        if (cnt === max) busiest.push(pp);
      });
      say.set('**Column ' + sel + '** has ' + book[sel].length + ' entries. ' + (busiest.length === 1 ? 'Cook ' + busiest[0] + ' has the most work (' + max + ').' : 'Cooks ' + busiest.join(' and ') + ' share the most work (' + max + ' each).') + ' The busiest cook changes as you pick other columns.');
    }

    host.appendChild(h('div.eie-pe', h('div.eie-pe-l', h('div.k', 'The book. Colors show which cook owns each row.'), h('div.scroll', grid)), side));
    host.appendChild(say.el);
    host.appendChild(small('Toy book: 16 rows and 8 columns with about 30% of the entries stored. Row i belongs to cook i mod 4.'));
    paint();
  };

  /* ======================================================================
   * eieSim: the race
   *   Book: 16 rows per cook, 64 dishes, 10% of entries stored, about half the orders are zero.
   *   The book for each cook count is the one whose results sit closest to the average of 200 random books.
   * ==================================================================== */
  EIE.simSeeds = { 2: 3, 4: 103, 8: 60 };
  EIE.simBook = function (n) {
    var seed = EIE.simSeeds[n];
    return { book: EIE.makeBook(16 * n, 64, 0.1, seed), orders: EIE.makeOrders(64, 0.5, 1000 + seed) };
  };
  var typicalCache = {};
  EIE.typicalCycles = function (n, depth, books) {
    var key = n + ':' + depth + ':' + books;
    if (typicalCache[key] === undefined) {
      var sum = 0;
      for (var seed = 1; seed <= books; seed++) {
        var book = EIE.makeBook(16 * n, 64, 0.1, seed);
        var orders = EIE.makeOrders(64, 0.5, 1000 + seed);
        sum += EIE.race(book, orders, n, depth).t;
      }
      typicalCache[key] = sum / books;
    }
    return typicalCache[key];
  };

  MLS.widgets.eieSim = function (host, opts, ctx) {
    var cfg = { n: 4, depth: 1 };
    var sim = null;
    var timer = null;
    var lanes = [];
    var history = [];
    var prevBusy = [];
    var didWork = [];

    var segN = ui.seg(
      [2, 4, 8].map(function (v) {
        return { label: v + ' cooks', value: v };
      }),
      cfg.n,
      function (v) {
        cfg.n = v;
        build();
      },
      'Number of cooks'
    );
    var segD = ui.seg(
      [1, 2, 4, 8].map(function (v) {
        return { label: String(v), value: v };
      }),
      cfg.depth,
      function (v) {
        cfg.depth = v;
        build();
      },
      'Queue depth'
    );
    var btnStep = ui.btn('Step', function () {
      stop();
      advance();
    });
    var btnPlay = ui.btn('Play', function () {
      if (timer) stop();
      else play();
    });
    var btnRun = ui.btn('Run to the end', function () {
      stop();
      var guard = 0;
      while (!sim.done && guard++ < 10000) advance(true);
      paint();
    });
    var btnReset = ui.btn('Reset', function () {
      build();
    });
    var central = h('div.eie-central');
    var laneBox = h('div.eie-lanes');
    var svg = s('svg', { class: 'eie-gantt', role: 'img', 'aria-label': 'Timeline. Green blocks are cycles when a cook was busy and gray blocks are idle cycles.' });
    var sT = ui.stat('Cycles so far', '');
    var sIdeal = ui.stat('If work were shared perfectly', '');
    var sBusy = ui.stat('Cooks busy', '');
    var status = h('div.msg');
    var say = ui.msg('');
    var typical = h('p', { style: { fontSize: '0.84rem', color: 'var(--ink-3)' } });

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      btnPlay.textContent = 'Play';
    }
    function play() {
      if (sim.done) build();
      btnPlay.textContent = 'Pause';
      timer = setInterval(function () {
        advance();
        if (sim.done) stop();
      }, 130);
    }
    ctx.onCleanup(stop);

    function build() {
      stop();
      var b = EIE.simBook(cfg.n);
      sim = EIE.createSim(b.book, b.orders, cfg.n, cfg.depth);
      history = [];
      prevBusy = [];
      didWork = [];
      for (var p = 0; p < cfg.n; p++) {
        history.push([]);
        prevBusy.push(0);
        didWork.push(false);
      }
      laneBox.innerHTML = '';
      lanes = [];
      for (var q = 0; q < cfg.n; q++) {
        var slots = [];
        var slotBox = h('span.qs');
        for (var i = 0; i < cfg.depth; i++) {
          var sl = h('i.slot.empty');
          slots.push(sl);
          slotBox.appendChild(sl);
        }
        var work = h('span.work');
        var pct = h('span.pct');
        var lane = h('div.lane', h('span.who', 'Cook ' + q), slotBox, work, pct);
        lanes.push({ el: lane, slots: slots, work: work, pct: pct });
        laneBox.appendChild(lane);
      }
      drawGantt(true);
      say.set('');
      paint();
    }

    function advance(quiet) {
      if (sim.done) return;
      sim.step();
      for (var p = 0; p < cfg.n; p++) {
        var worked = sim.busy[p] > prevBusy[p];
        didWork[p] = worked;
        prevBusy[p] = sim.busy[p];
        history[p].push(worked ? 1 : 0);
      }
      if (!quiet) paint();
    }

    var CW = 8;
    var CH = 14;
    var GAP = 3;
    var LEFT = 52;
    function drawGantt(reset) {
      var n = cfg.n;
      var cycles = Math.max(110, history[0].length + 6);
      var width = LEFT + cycles * CW + 20;
      var height = n * (CH + GAP) + 22;
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
      svg.setAttribute('width', width);
      svg.setAttribute('height', height);
      svg.innerHTML = '';
      for (var p = 0; p < n; p++) {
        svg.appendChild(s('text', { x: 0, y: p * (CH + GAP) + CH - 2, class: 'gl' }, 'Cook ' + p));
        if (reset) continue;
        for (var t = 0; t < history[p].length; t++) {
          svg.appendChild(s('rect', { x: LEFT + t * CW, y: p * (CH + GAP), width: CW - 1, height: CH, class: history[p][t] ? 'busy' : 'idle' }));
        }
      }
      for (var tick = 0; tick <= cycles; tick += 10) {
        svg.appendChild(s('text', { x: LEFT + tick * CW, y: height - 4, class: 'gt', 'text-anchor': 'middle' }, String(tick)));
      }
    }

    function paint() {
      var n = cfg.n;
      for (var p = 0; p < n; p++) {
        var L = lanes[p];
        for (var i = 0; i < cfg.depth; i++) {
          var item = sim.queues[p][i];
          var sl = L.slots[i];
          if (item === undefined) {
            sl.textContent = '';
            sl.className = 'slot empty';
            sl.removeAttribute('title');
          } else {
            var c = sim.counts[item][p];
            sl.textContent = String(c);
            sl.className = 'slot ' + (c === 0 ? 'zero' : 'full');
            sl.title = 'Dish ' + item + ': ' + c + ' entries for this cook';
          }
        }
        L.work.innerHTML = '';
        var w = sim.work[p];
        var cooking = didWork[p] && !sim.done;
        if (cooking) {
          L.work.appendChild(h('span.cooking', 'cooking'));
          var left = w ? w.left : 0;
          for (var k = 0; k < left; k++) L.work.appendChild(h('i.sq'));
        } else {
          L.work.appendChild(h('span.idlelab', sim.done ? 'done' : sim.t ? 'idle' : 'ready'));
        }
        L.pct.textContent = sim.t ? Math.round((sim.busy[p] / sim.t) * 100) + '% busy' : '';
        L.el.classList.toggle('on', cooking);
      }
      drawGantt(false);
      if (sim.done) central.textContent = 'All ' + sim.active.length + ' orders sent and cooked.';
      else if (sim.stalled) central.innerHTML = MLS.rich('**Central unit waits.** A queue is full, so dish ' + sim.active[sim.next] + ' cannot go out yet. Sent ' + sim.next + ' of ' + sim.active.length + '.');
      else central.innerHTML = MLS.rich('**Central unit** has sent ' + sim.next + ' of ' + sim.active.length + ' non-zero orders.' + (sim.next < sim.active.length ? ' Next: dish ' + sim.active[sim.next] + '.' : ''));
      sT.set(String(sim.t));
      sIdeal.set(String(sim.ideal));
      var u = sim.utilization();
      sBusy.set(sim.t ? fmt(u * 100, 0) + '%' : '-', sim.t && sim.done ? (u > 0.8 ? 'good' : u > 0.65 ? 'warn' : 'bad') : '');
      if (sim.done) {
        say.set('**Done in ' + sim.t + ' cycles.** Shared perfectly it would take ' + sim.ideal + '. The cooks were busy ' + fmt(u * 100, 0) + '% of the time, and the central unit waited on a full queue for ' + sim.stalledCycles + ' cycles.');
      }
      typical.textContent =
        'Average over 200 random books of the same shape: ' + fmt(EIE.typicalCycles(cfg.n, cfg.depth, 200), 0) + ' cycles at depth ' + cfg.depth + ', against ' + fmt(EIE.typicalCycles(cfg.n, 8, 200), 0) + ' at depth 8.';
    }

    host.appendChild(h('div.controls', h('div.ctrl', h('span.lab', 'Cooks'), segN.el), h('div.ctrl', h('span.lab', 'Queue depth'), segD.el)));
    host.appendChild(h('div.btnrow', btnStep, btnPlay, btnRun, btnReset));
    host.appendChild(central);
    host.appendChild(laneBox);
    host.appendChild(h('div.k2', 'Timeline: green is a cycle spent cooking, gray is a cycle spent waiting'));
    host.appendChild(h('div.scroll', svg));
    host.appendChild(h('div.readout', sT.el, sIdeal.el, sBusy.el));
    host.appendChild(say.el);
    host.appendChild(typical);
    host.appendChild(small('Toy model, not the paper\'s simulator. Each cook spends one cycle per stored entry it owns in an order\'s column, and skips an order with none. The numbers in the queue boxes are how many entries each waiting order needs from that cook.'));
    build();
  };

  /* ======================================================================
   * eieEnergy: the abstract's four savings, rebuilt from Paper 1's energies.
   *   Log scale between 0.001 pJ and 1,000 pJ per original 32-bit weight.
   * ==================================================================== */
  MLS.widgets.eieEnergy = function (host) {
    var dramPj = hw.wordPj.dram;
    var sramPj = hw.wordPj.sram8k;
    var math = hw.energy.fmul32 + hw.energy.fadd32;
    var st = { density: 10, code: 4, index: 4, nz: 33 };
    var labels = ['Dense book, read from DRAM', 'Same book, read from on-chip SRAM', 'Prune: read only the weights that are left', 'Share: read short codes and skip counts', 'Skip zero inputs: read only the needed columns'];
    var paperSays = ['', '120 times', '10 times', '8 times', '3 times'];
    var LO = -3;
    var SPAN = 6;
    var rows = [];

    function sl(label, key, min, max, unit) {
      return ui.slider({
        label: label,
        min: min,
        max: max,
        step: 1,
        value: st[key],
        format: function (v) {
          return v + unit;
        },
        onInput: function (v) {
          st[key] = v;
          paint();
        }
      });
    }
    var slDens = sl('Weights kept', 'density', 1, 100, '%');
    var slCode = sl('Bits per code', 'code', 1, 8, '');
    var slIdx = sl('Bits per skip count', 'index', 0, 8, '');
    var slNz = sl('Inputs that are not zero', 'nz', 5, 100, '%');

    var list = h('div.eie-erows');
    labels.forEach(function (lab, i) {
      var fill = h('i.ef');
      var mark = h('i.emark');
      var track = h('div.etrack', fill, mark);
      var val = h('span.ev');
      var fac = h('span.efac');
      var row = h('div.erow', h('div.elab', lab, paperSays[i] ? h('small', 'Paper: ' + paperSays[i]) : null), track, val, fac);
      rows.push({ fill: fill, mark: mark, val: val, fac: fac });
      list.appendChild(row);
    });

    var sTotal = ui.stat('All four together (our accounting)', '');
    var sMath = ui.stat('Math on a kept weight and a needed input', '');
    var say = ui.msg('');

    function pos(v) {
      return MLS.clamp((Math.log(v) / Math.LN10 - LO) / SPAN, 0.005, 1);
    }

    function paint() {
      var e = EIE.energyStages({ dramPj: dramPj, sramPj: sramPj, density: st.density / 100, codeBits: st.code, indexBits: st.index, inputShare: st.nz / 100 });
      var mathPer = math * (st.density / 100) * (st.nz / 100);
      e.forEach(function (v, i) {
        rows[i].fill.style.width = pos(v) * 100 + '%';
        rows[i].mark.style.left = pos(mathPer) * 100 + '%';
        rows[i].val.textContent = hw.pj(v);
        rows[i].fac.textContent = i === 0 ? '' : fmt(e[i - 1] / v, e[i - 1] / v >= 100 ? 0 : 1) + ' times';
      });
      sTotal.set(hw.int(e[0] / e[4]) + ' times');
      sMath.set(hw.pj(mathPer) + ' per original weight');
      if (e[4] < mathPer) say.set('At the end, reading a weight (' + hw.pj(e[4]) + ') costs **less than the math** on it (' + hw.pj(mathPer) + '). The bottleneck has moved.');
      else say.set('Reading a weight (' + hw.pj(e[4]) + ') still costs more than the math on it (' + hw.pj(mathPer) + ').');
    }

    host.appendChild(h('div.controls', slDens.el, slCode.el, slIdx.el, slNz.el));
    host.appendChild(list);
    host.appendChild(h('div.readout', sTotal.el, sMath.el));
    host.appendChild(say.el);
    host.appendChild(small('Energy per original 32-bit weight, on a log scale between 0.001 pJ and 1,000 pJ. The dashed line is the math. Assumes a read costs energy in proportion to the bits read. Numbers: 650 pJ DRAM and 5 pJ SRAM per 32-bit word, 4.6 pJ to multiply and add (Paper 1).'));
    paint();
  };

  /* ======================================================================
   * Results chart: four ratios from the paper's abstract, on a log axis.
   * ==================================================================== */
  EIE.drawResults = function (host) {
    var rows = [
      { label: 'Faster than a CPU', v: 189, cls: 'sp' },
      { label: 'Faster than a GPU', v: 13, cls: 'sp' },
      { label: 'Less energy than a CPU', v: 24000, cls: 'en' },
      { label: 'Less energy than a GPU', v: 3400, cls: 'en' }
    ];
    var W = 640;
    var left = 190;
    var right = 40;
    var top = 14;
    var rh = 38;
    var H = top + rows.length * rh + 34;
    var x = function (v) {
      return left + (Math.log(v) / Math.LN10 / 5) * (W - left - right);
    };
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'eie-results', role: 'img', 'aria-label': 'Bar chart on a log axis. EIE is 189 times faster than a CPU, 13 times faster than a GPU, 24,000 times more energy efficient than a CPU, and 3,400 times more than a GPU.' });
    [1, 10, 100, 1000, 10000, 100000].forEach(function (t) {
      svg.appendChild(s('line', { x1: x(t), y1: top - 4, x2: x(t), y2: H - 26, class: 'grid' }));
      svg.appendChild(s('text', { x: x(t), y: H - 10, 'text-anchor': 'middle', class: 'tk' }, t >= 1000 ? hw.int(t) : String(t)));
    });
    rows.forEach(function (r, i) {
      var y = top + i * rh;
      svg.appendChild(s('text', { x: left - 10, y: y + rh / 2 - 2, 'text-anchor': 'end', class: 'rl' }, r.label));
      svg.appendChild(s('rect', { x: left, y: y + 5, width: x(r.v) - left, height: rh - 14, rx: 5, class: 'bar ' + r.cls }));
      svg.appendChild(s('text', { x: x(r.v) + 6, y: y + rh / 2 - 2, class: 'val' }, hw.int(r.v) + 'x'));
    });
    host.appendChild(svg);
  };
})();
