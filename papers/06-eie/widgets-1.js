/*
 * Paper 6 widgets, Part 1: the kitchen, the size of a layer, and what reading a weight costs.
 *   eieKitchen   a matrix times a vector, as ingredient totals for tonight's orders
 *   eieLayers    how many weights a real fully connected layer holds
 *   eieCost      energy of reading a weight against the math done with it, and what batching does
 */
(function () {
  'use strict';
  var MLS = window.MLS;
  var h = MLS.h;
  var ui = MLS.ui;
  var fmt = MLS.fmt;
  var hw = MLS.hw;
  var EIE = window.EIE;

  function small(text) {
    return h('p', { style: { fontSize: '0.84rem', color: 'var(--ink-3)' }, html: MLS.rich(text) });
  }

  /* ======================================================================
   * eieKitchen
   * ==================================================================== */
  MLS.widgets.eieKitchen = function (host) {
    var dishes = ['Pizza', 'Pasta', 'Soup', 'Salad'];
    var items = ['Flour', 'Cheese', 'Tomato'];
    /* grams per serving: rows are ingredients, columns are dishes */
    var book = [
      [200, 150, 0, 0],
      [100, 50, 0, 30],
      [80, 100, 150, 60]
    ];
    var orders = [3, 2, 0, 4];
    var picked = 0;
    var say = ui.msg('');

    var numEls = [];
    var totalBtns = [];

    function totals() {
      return book.map(function (row) {
        return row.reduce(function (a, g, j) {
          return a + g * orders[j];
        }, 0);
      });
    }

    var thead = h('tr', h('th', { scope: 'col' }, 'Grams'));
    dishes.forEach(function (d) {
      thead.appendChild(h('th', { scope: 'col' }, d));
    });
    thead.appendChild(h('th', { scope: 'col' }, 'Total (g)'));

    var orderRow = h('tr.orders', h('th', { scope: 'row' }, 'Orders'));
    dishes.forEach(function (d, j) {
      var num = h('b', String(orders[j]));
      numEls.push(num);
      function bump(delta) {
        orders[j] = MLS.clamp(orders[j] + delta, 0, 9);
        paint();
      }
      var less = h('button.mini', { type: 'button', 'aria-label': 'One fewer ' + d.toLowerCase() + ' order' }, '−');
      var more = h('button.mini', { type: 'button', 'aria-label': 'One more ' + d.toLowerCase() + ' order' }, '+');
      less.addEventListener('click', function () {
        bump(-1);
      });
      more.addEventListener('click', function () {
        bump(1);
      });
      orderRow.appendChild(h('td', h('div.stepper', num, h('div', less, more))));
    });
    orderRow.appendChild(h('td'));

    var tbody = h('tbody', orderRow);
    items.forEach(function (name, i) {
      var tr = h('tr', h('th', { scope: 'row' }, name));
      book[i].forEach(function (g) {
        tr.appendChild(h('td' + (g === 0 ? '.zero' : ''), String(g)));
      });
      var btn = h('button.totalbtn', { type: 'button', 'aria-pressed': 'false', 'aria-label': 'Show how the ' + name.toLowerCase() + ' total is built' }, '');
      btn.addEventListener('click', function () {
        picked = i;
        paint();
      });
      totalBtns.push(btn);
      tr.appendChild(h('td.total', btn));
      tbody.appendChild(tr);
    });

    function paint() {
      var t = totals();
      orders.forEach(function (q, j) {
        numEls[j].textContent = String(q);
      });
      totalBtns.forEach(function (b, i) {
        b.textContent = String(t[i]);
        b.setAttribute('aria-pressed', i === picked ? 'true' : 'false');
      });
      var parts = book[picked].map(function (g, j) {
        return g + ' × ' + orders[j];
      });
      say.set('**' + items[picked] + ':** ' + parts.join(' + ') + ' = **' + t[picked] + ' g**');
    }

    host.appendChild(h('div.tablewrap', h('table.eie-kt', h('thead', thead), tbody)));
    host.appendChild(say.el);
    host.appendChild(small('Real networks also have negative weights. The arithmetic is the same.'));
    paint();
  };

  /* ======================================================================
   * eieLayers
   * ==================================================================== */
  MLS.widgets.eieLayers = function (host) {
    var net = 'a';
    var which = '6';
    var stats = {
      ins: ui.stat('Inputs (dishes)', ''),
      outs: ui.stat('Outputs (ingredients)', ''),
      w: ui.stat('Weights in the book', ''),
      mb: ui.stat('Size at 32 bits', ''),
      songs: ui.stat('About this many songs', '')
    };
    var say = ui.msg('');

    var segNet = ui.seg(
      [
        { label: 'AlexNet', value: 'a' },
        { label: 'VGG-16', value: 'v' }
      ],
      net,
      function (v) {
        net = v;
        paint();
      },
      'Network'
    );
    var segLayer = ui.seg(
      [
        { label: 'FC6', value: '6' },
        { label: 'FC7', value: '7' },
        { label: 'FC8', value: '8' }
      ],
      which,
      function (v) {
        which = v;
        paint();
      },
      'Layer'
    );

    function layer() {
      return EIE.layers.filter(function (l) {
        return l.id === net + which;
      })[0];
    }
    function paint() {
      var l = layer();
      var w = EIE.layerWeights(l);
      var mb = (w * 4) / 1e6;
      stats.ins.set(hw.int(l.ins));
      stats.outs.set(hw.int(l.outs));
      stats.w.set(fmt(w / 1e6, 1) + ' M');
      stats.mb.set(fmt(mb, 1) + ' MB');
      stats.songs.set('≈ ' + Math.round(mb / 4));
      say.set('**' + l.name + ':** ' + hw.int(l.outs) + ' × ' + hw.int(l.ins) + ' = ' + hw.int(w) + ' weights. One input uses every one of them once.');
    }

    host.appendChild(h('div.controls', h('div.ctrl', h('span.lab', 'Network'), segNet.el), h('div.ctrl', h('span.lab', 'Layer'), segLayer.el)));
    host.appendChild(h('div.readout', stats.ins.el, stats.outs.el, stats.w.el, stats.mb.el, stats.songs.el));
    host.appendChild(say.el);
    host.appendChild(small('Songs assume 4 MB each. The layer shapes are the standard ones for these two image networks.'));
    paint();
  };

  /* ======================================================================
   * eieCost
   *   Energy per multiply-add when one weight read is shared by B inputs.
   * ==================================================================== */
  MLS.widgets.eieCost = function (host) {
    var dram = hw.wordPj.dram;
    var sram = hw.wordPj.sram8k;
    var math = hw.energy.fmul32 + hw.energy.fadd32;
    var sizes = [1, 2, 4, 8, 16, 32, 64, 128, 256];
    var idx = 0;

    var slider = ui.slider({
      label: 'Inputs that share each weight read (batch size)',
      min: 0,
      max: sizes.length - 1,
      step: 1,
      value: 0,
      format: function (i) {
        return String(sizes[i]);
      },
      onInput: function (i) {
        idx = i;
        paint();
      }
    });
    var rDram = ui.meterRow('Read from DRAM');
    var rSram = ui.meterRow('Read from SRAM');
    var rMath = ui.meterRow('Multiply and add');
    var sDram = ui.stat('Per multiply-add, weights in DRAM', '');
    var sSram = ui.stat('Per multiply-add, weights in SRAM', '');
    var sShare = ui.stat('Share spent on reading (DRAM)', '');
    var say = ui.msg('');

    function paint() {
      var b = sizes[idx];
      var readD = dram / b;
      var readS = sram / b;
      var scale = dram;
      rDram.set(readD / scale, hw.pj(readD), 'var(--warn)');
      rSram.set(readS / scale, hw.pj(readS), 'var(--accent)');
      rMath.set(math / scale, hw.pj(math), 'var(--good)');
      sDram.set(hw.pj(readD + math));
      sSram.set(hw.pj(readS + math));
      var share = readD / (readD + math);
      sShare.set(fmt(share * 100, share > 0.99 ? 1 : 0) + '%', share > 0.9 ? 'bad' : share > 0.5 ? 'warn' : 'good');
      if (b === 1) say.set('At batch size 1, reading from DRAM costs **' + fmt(dram / math, 0) + ' times** the math. Moving the weights on chip cuts the read to ' + hw.pj(sram) + '.');
      else if (readD > math) say.set('Sharing each read among ' + b + ' inputs helps, but the DRAM read is still larger than the math.');
      else say.set('With ' + b + ' inputs sharing each read, the math now costs more than the DRAM read. A phone camera cannot wait for ' + b + ' pictures, though.');
    }

    host.appendChild(h('div.controls', slider.el));
    host.appendChild(h('div.meters', rDram.el, rSram.el, rMath.el));
    host.appendChild(h('div.readout', sDram.el, sSram.el, sShare.el));
    host.appendChild(say.el);
    host.appendChild(small('Energies from Paper 1 (45 nm): 650 pJ per 32-bit DRAM read, 5 pJ per 32-bit read from a small SRAM, 3.7 pJ to multiply and 0.9 pJ to add in 32-bit floating point.'));
    paint();
  };
})();
