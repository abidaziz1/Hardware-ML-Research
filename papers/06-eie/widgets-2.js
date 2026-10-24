/*
 * Paper 6 widgets, Part 2: shrinking the book.
 *   eiePrune     cross out the smallest weights and see what is left
 *   eieCodebook  round weights to a table of shared values
 *   eieCSC       store only what is left, with a skip count and a pointer per column
 *   eieCompress  how small the stored book gets, and whether it fits on the chip
 * The numbers behind them live in sim.js so experiments/numbers.cjs can rerun them.
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
   * eiePrune: 16 x 16 toy weights, sizes drawn from an exponential curve.
   * ==================================================================== */
  EIE.pruneToy = { n: 16, seed: 7 };
  MLS.widgets.eiePrune = function (host) {
    var n = EIE.pruneToy.n;
    var w = EIE.laplace(n * n, EIE.pruneToy.seed);
    var pct = 0;
    var cells = w.map(function (v) {
      var c = h('i.pc');
      c.style.opacity = String(MLS.clamp(0.18 + Math.abs(v) / 2.6, 0.18, 1));
      return c;
    });
    var grid = h('div.eie-pgrid', { role: 'img', 'aria-label': 'A 16 by 16 grid of weights. Dark squares are large weights. Crossed-out squares are pruned.' }, cells);
    grid.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';

    var slider = ui.slider({
      label: 'Cross out the smallest',
      min: 0,
      max: 95,
      step: 5,
      value: 0,
      format: function (v) {
        return v + '%';
      },
      onInput: function (v) {
        pct = v;
        paint();
      }
    });
    var sLeft = ui.stat('Weights left', '');
    var sChange = ui.stat('Output change before retraining', '');
    var say = ui.msg('');

    function paint() {
      var r = EIE.prune(w, pct);
      cells.forEach(function (c, i) {
        c.classList.toggle('off', !r.keep[i]);
      });
      sLeft.set(r.kept + ' of ' + w.length);
      var ch = r.change * 100;
      sChange.set(fmt(ch, 0) + '%', ch < 10 ? 'good' : ch < 30 ? 'warn' : 'bad');
      if (pct === 0) say.set('Nothing is crossed out yet. Slide to the right.');
      else if (pct < 60) say.set('Cheap so far. The weights you removed were tiny.');
      else say.set('This toy never retrains, so this is the damage you would have to repair. Real networks are retrained after pruning, and that lets them go this far.');
    }

    host.appendChild(h('div.eie-prune', h('div.eie-pwrap', grid), h('div.eie-pside', h('div.controls', slider.el), h('div.readout', sLeft.el, sChange.el))));
    host.appendChild(say.el);
    host.appendChild(small('Toy numbers: 256 random weights with many tiny ones and a few large ones. The output change is the typical relative change for random inputs, computed as the square root of the removed squared weights over the total.'));
    paint();
  };

  /* ======================================================================
   * eieCodebook: 80 toy weights, rounded to the nearest of 2, 4, 8 or 16 shared values.
   * ==================================================================== */
  EIE.codebookToy = { count: 80, seed: 11 };
  MLS.widgets.eieCodebook = function (host) {
    var values = EIE.laplace(EIE.codebookToy.count, EIE.codebookToy.seed);
    var bits = 2;
    var W = 560;
    var H = 150;
    var x = function (v) {
      return W / 2 + v * 56;
    };

    var svg = s('svg', { class: 'eie-line', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Weights on a number line, with the shared values marked below them' });
    svg.appendChild(s('line', { x1: x(-4.8), y1: 78, x2: x(4.8), y2: 78, class: 'axis' }));
    svg.appendChild(s('line', { x1: x(0), y1: 40, x2: x(0), y2: 86, class: 'zero' }));
    svg.appendChild(s('text', { x: x(0), y: 32, 'text-anchor': 'middle', class: 'lab' }, '0'));
    values.forEach(function (v, i) {
      svg.appendChild(s('circle', { cx: x(v), cy: 48 + (i % 4) * 7, r: 3.2, class: 'dot' }));
    });
    var ticks = s('g');
    svg.appendChild(ticks);
    svg.appendChild(s('text', { x: 6, y: 20, class: 'lab', 'text-anchor': 'start' }, 'Each dot is one weight'));
    svg.appendChild(s('text', { x: 6, y: H - 8, class: 'lab', 'text-anchor': 'start' }, 'Each tick is one shared value in the table'));

    var segBits = ui.seg(
      [1, 2, 3, 4].map(function (b) {
        return { label: b + (b === 1 ? ' bit' : ' bits'), value: b };
      }),
      bits,
      function (v) {
        bits = v;
        paint();
      },
      'Bits per weight'
    );
    var sBits = ui.stat('Table holds', '');
    var sSmall = ui.stat('Each weight is', '');
    var sErr = ui.stat('Average error', '');
    var say = ui.msg('');
    var body = h('tbody');
    var tableWrap = h(
      'div.tablewrap',
      h('table.eie-mini', h('thead', h('tr', ['Weight', 'Stored code', 'Shared value', 'Error'].map(function (c) { return h('th', { scope: 'col' }, c); }))), body)
    );

    function paint() {
      var k = 1 << bits;
      var r = EIE.kmeans1d(values, k);
      ticks.innerHTML = '';
      r.table.forEach(function (t) {
        ticks.appendChild(s('line', { x1: x(t), y1: 74, x2: x(t), y2: 112, class: 'tick' }));
      });
      sBits.set(k + ' values');
      sSmall.set(fmt(32 / bits, 0) + ' times smaller');
      sErr.set(fmt(r.error * 100, 0) + '%', r.error < 0.1 ? 'good' : r.error < 0.3 ? 'warn' : 'bad');
      body.innerHTML = '';
      for (var i = 0; i < 5; i++) {
        var v = values[i];
        var t = r.table[r.codes[i]];
        body.appendChild(
          h('tr', h('td', fmt(v, 2)), h('td', 'code ' + r.codes[i]), h('td', fmt(t, 2)), h('td', fmt(Math.abs(v - t), 2)))
        );
      }
      say.set(bits === 4 ? 'Four bits gives 16 shared values. Most weights land very close to one of them.' : bits === 1 ? 'One bit gives only 2 values. Every weight becomes one of two numbers, so the error is large.' : 'The table has ' + k + ' values. More bits means a finer table and less error, but a bigger code.');
    }

    host.appendChild(h('div.controls', h('div.ctrl', h('span.lab', 'Bits per weight'), segBits.el)));
    host.appendChild(h('div.scroll', svg));
    host.appendChild(h('div.readout', sBits.el, sSmall.el, sErr.el));
    host.appendChild(tableWrap);
    host.appendChild(say.el);
    host.appendChild(small('Toy numbers: 80 random weights. The table values come from k-means, which groups nearby weights and uses each group\'s average. Error is the average gap as a share of the average weight size.'));
    paint();
  };

  /* ======================================================================
   * eieCSC: an 8 x 8 book with 17 stored entries.
   *   cols[j] lists [row, code]. A skip counts the empty rows since the previous entry.
   * ==================================================================== */
  EIE.cscToy = {
    cols: [
      [[1, 3], [4, 9]],
      [],
      [[0, 7], [2, 12], [3, 1], [7, 5]],
      [[5, 8]],
      [[2, 4], [6, 14]],
      [[0, 10], [1, 6], [4, 2]],
      [[3, 11], [7, 0]],
      [[1, 13], [5, 15], [6, 9]]
    ],
    rows: 8
  };
  MLS.widgets.eieCSC = function (host) {
    var cols = EIE.cscToy.cols;
    var rows = EIE.cscToy.rows;
    var enc = EIE.cscEncode(cols);
    var sel = 2;
    var gridCells = []; // [col][row]
    var heads = [];
    var ptrChips = [];
    var groups = [];
    var lines = h('ol.eie-rebuild');
    var say = ui.msg('');

    var grid = h('div.cgrid.eie-csc-grid');
    grid.style.gridTemplateColumns = 'auto repeat(' + cols.length + ', auto)';
    grid.appendChild(h('div.cell.plain', ''));
    cols.forEach(function (_, j) {
      var b = h('button.cell.hd', { type: 'button', 'aria-label': 'Select column ' + j }, String(j));
      b.addEventListener('click', function () {
        sel = j;
        paint();
      });
      heads.push(b);
      grid.appendChild(b);
      gridCells.push([]);
    });
    for (var r = 0; r < rows; r++) {
      grid.appendChild(h('div.cell.plain.rl', String(r)));
      for (var j = 0; j < cols.length; j++) {
        var hit = cols[j].filter(function (e) {
          return e[0] === r;
        })[0];
        var c = h('div.cell' + (hit ? '.full' : '.empty'), hit ? String(hit[1]) : '');
        gridCells[j][r] = c;
        grid.appendChild(c);
      }
    }

    var ptrRow = h('div.eie-chips');
    enc.ptr.forEach(function (p) {
      var c = h('span.chip2', String(p));
      ptrChips.push(c);
      ptrRow.appendChild(c);
    });
    var entRow = h('div.eie-groups');
    cols.forEach(function (col, j) {
      var g = h('div.grp', h('span.gl', 'col ' + j));
      if (!col.length) g.appendChild(h('span.none', 'empty'));
      for (var k = enc.ptr[j]; k < enc.ptr[j + 1]; k++) {
        g.appendChild(h('span.chip2', '(' + enc.entries[k].code + ', ' + enc.entries[k].skip + ')'));
      }
      groups.push(g);
      entRow.appendChild(g);
    });

    var sDense = ui.stat('Dense book', '');
    var sStored = ui.stat('Stored entries', '');
    var sSmall = ui.stat('Smaller by (before pointers)', '');
    var total = enc.entries.length;
    sDense.set(rows * cols.length + ' × 32 bits = ' + hw.int(rows * cols.length * 32));
    sStored.set(total + ' × 8 bits = ' + hw.int(total * 8));
    sSmall.set(fmt((rows * cols.length * 32) / (total * 8), 0) + ' times');

    function paint() {
      heads.forEach(function (b, j) {
        b.classList.toggle('win', j === sel);
        b.setAttribute('aria-pressed', j === sel ? 'true' : 'false');
      });
      gridCells.forEach(function (colCells, j) {
        colCells.forEach(function (c) {
          c.classList.toggle('sel', j === sel);
        });
      });
      ptrChips.forEach(function (c, i) {
        c.classList.toggle('on', i === sel || i === sel + 1);
      });
      groups.forEach(function (g, j) {
        g.classList.toggle('on', j === sel);
      });
      lines.innerHTML = '';
      var rowNow = -1;
      var a = enc.ptr[sel];
      var z = enc.ptr[sel + 1];
      if (a === z) {
        lines.appendChild(h('li', 'Pointer ' + sel + ' and pointer ' + (sel + 1) + ' are both ' + a + '. The column has no entries, so there is nothing to read.'));
      }
      for (var k = a; k < z; k++) {
        var e = enc.entries[k];
        var next = rowNow + e.skip + 1;
        lines.appendChild(h('li', 'Entry (' + e.code + ', ' + e.skip + '): row = ' + rowNow + ' + ' + e.skip + ' + 1 = ' + next));
        rowNow = next;
      }
      say.set('**Column ' + sel + '** starts at entry ' + a + ' and ends before entry ' + z + ', so it has **' + (z - a) + ' entries**. Start above the top (row −1), then add the skip and 1 each time.');
    }

    host.appendChild(
      h(
        'div.eie-csc',
        h('div.eie-cscl', h('div.k', 'The book (code of each stored weight)'), h('div.scroll', grid)),
        h('div.eie-cscr', h('div.k', 'Pointers (where each column starts)'), ptrRow, h('div.k', 'Entries (code, skip)'), entRow)
      )
    );
    host.appendChild(say.el);
    host.appendChild(lines);
    host.appendChild(h('div.readout', sDense.el, sStored.el, sSmall.el));
    host.appendChild(small('Each stored entry is a 4-bit code plus a 4-bit skip count. Pointers add a little more. The codes point into a table of 16 shared values.'));
    paint();
  };

  /* ======================================================================
   * eieCompress: storage after pruning and sharing, against the chip's memory.
   * ==================================================================== */
  MLS.widgets.eieCompress = function (host) {
    var presets = [
      { label: 'AlexNet FC6, FC7, FC8', ids: ['a6', 'a7', 'a8'] },
      { label: 'VGG-16 FC6, FC7, FC8', ids: ['v6', 'v7', 'v8'] }
    ];
    var which = 0;
    var kept = 10;
    var code = 4;
    var skip = 4;

    var segSet = ui.seg(
      presets.map(function (p, i) {
        return { label: p.label, value: i };
      }),
      0,
      function (v) {
        which = v;
        paint();
      },
      'Which layers'
    );
    var slKept = ui.slider({ label: 'Weights kept after pruning', min: 1, max: 100, step: 1, value: kept, format: function (v) { return v + '%'; }, onInput: function (v) { kept = v; paint(); } });
    var slCode = ui.slider({ label: 'Bits in each shared-value code', min: 1, max: 8, step: 1, value: code, format: function (v) { return String(v); }, onInput: function (v) { code = v; paint(); } });
    var slSkip = ui.slider({ label: 'Bits in each skip count', min: 0, max: 8, step: 1, value: skip, format: function (v) { return String(v); }, onInput: function (v) { skip = v; paint(); } });

    var sDense = ui.stat('Dense, 32 bits', '');
    var sStored = ui.stat('Stored', '');
    var sSmall = ui.stat('Smaller by', '');
    var meter = ui.meterRow('Fills EIE memory');
    var say = ui.msg('');

    function paint() {
      var weights = EIE.sumWeights(presets[which].ids);
      var r = EIE.compress(weights, kept, code, skip);
      var cap = EIE.chip.capacityBytes;
      sDense.set(fmt(r.denseBytes / 1e6, 1) + ' MB');
      sStored.set(fmt(r.bytes / 1e6, 1) + ' MB');
      sSmall.set(fmt(r.ratio, 0) + ' times');
      var frac = r.bytes / cap;
      meter.set(frac, fmt(frac * 100, 0) + '%', r.fits ? 'var(--good)' : 'var(--bad)');
      if (r.fits) say.set('**Fits.** The stored book is ' + fmt(r.bytes / 1e6, 1) + ' MB. EIE\'s 64 PEs hold ' + fmt(cap / 1e6, 1) + ' MB of entries.');
      else say.set('**Does not fit.** You need ' + fmt(r.bytes / 1e6, 1) + ' MB, and the 64 PEs hold ' + fmt(cap / 1e6, 1) + ' MB. Keep fewer weights or use fewer bits.');
    }

    host.appendChild(h('div.controls', h('div.ctrl', h('span.lab', 'Layers'), segSet.el)));
    host.appendChild(h('div.controls', slKept.el, slCode.el, slSkip.el));
    host.appendChild(h('div.readout', sDense.el, sStored.el, sSmall.el));
    host.appendChild(h('div.meters', meter.el));
    host.appendChild(say.el);
    host.appendChild(small('Memory: 64 PEs with 131,072 one-byte entries each. Pointers and any filler entries need a little extra room. The paper\'s own results also use Huffman coding, which this calculator leaves out.'));
    paint();
  };
})();
