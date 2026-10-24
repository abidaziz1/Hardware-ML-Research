/*
 * sim.js
 * The toy models behind the Paper 6 widgets. Plain JavaScript that runs in the browser and in Node,
 * so experiments/numbers.cjs can rerun exactly what the lesson shows.
 *
 * Nothing here is taken from the EIE paper's own simulator. It is a small model of the idea:
 * a central unit broadcasts the next non-zero input to every cook (processing element), each cook
 * keeps a short queue of waiting inputs, and each cook spends one cycle per stored weight it has
 * in that input's column. A cook with no stored weights for an input skips it at no cost.
 */
(function (root) {
  'use strict';
  var EIE = (root.EIE = root.EIE || {});

  /* mulberry32, the same generator as MLS.rng, so Node and the browser agree. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  EIE.rng = rng;

  /* A sparse book: for each of `cols` dish columns, the sorted list of rows that hold a stored weight. */
  EIE.makeBook = function (rows, cols, density, seed) {
    var r = rng(seed);
    var book = [];
    for (var j = 0; j < cols; j++) {
      var col = [];
      for (var i = 0; i < rows; i++) if (r() < density) col.push(i);
      book.push(col);
    }
    return book;
  };

  /* Orders for each dish: 0 with probability zeroShare, otherwise 1 to 9. */
  EIE.makeOrders = function (cols, zeroShare, seed) {
    var r = rng(seed);
    var out = [];
    for (var j = 0; j < cols; j++) {
      var zero = r() < zeroShare;
      var q = 1 + Math.floor(r() * 9);
      out.push(zero ? 0 : q);
    }
    return out;
  };

  /* Row i belongs to cook (i mod n). How many stored weights of one column does each cook own? */
  EIE.split = function (colRows, n) {
    var counts = [];
    for (var p = 0; p < n; p++) counts.push(0);
    colRows.forEach(function (i) {
      counts[i % n]++;
    });
    return counts;
  };

  /*
   * One race. Cycle order: cooks work or take the next waiting input, then the central unit tries to
   * broadcast the next non-zero input. It can only do so when every cook's queue has room.
   * A cook with no stored weights for an input skips it at no cost and moves to the next one.
   */
  EIE.createSim = function (book, orders, n, depth) {
    var active = [];
    orders.forEach(function (q, j) {
      if (q !== 0) active.push(j);
    });
    var counts = {};
    var totalMacs = 0;
    active.forEach(function (j) {
      counts[j] = EIE.split(book[j], n);
      totalMacs += book[j].length;
    });
    var s = {
      n: n,
      depth: depth,
      active: active,
      counts: counts,
      totalMacs: totalMacs,
      ideal: Math.ceil(totalMacs / n),
      t: 0,
      next: 0,
      queues: [],
      work: [],
      busy: [],
      stalledCycles: 0,
      stalled: false,
      done: active.length === 0
    };
    for (var p = 0; p < n; p++) {
      s.queues.push([]);
      s.work.push(null);
      s.busy.push(0);
    }

    s.step = function () {
      if (s.done) return s;
      var p;
      for (p = 0; p < n; p++) {
        var w = s.work[p];
        while (!w && s.queues[p].length) {
          var col = s.queues[p].shift();
          var c = s.counts[col][p];
          if (c > 0) w = { col: col, left: c };
        }
        if (w) {
          w.left--;
          s.busy[p]++;
          s.work[p] = w.left > 0 ? w : null;
        } else {
          s.work[p] = null;
        }
      }
      s.stalled = false;
      if (s.next < s.active.length) {
        var room = s.queues.every(function (q) {
          return q.length < s.depth;
        });
        if (room) {
          var col2 = s.active[s.next++];
          s.queues.forEach(function (q) {
            q.push(col2);
          });
        } else {
          s.stalled = true;
          s.stalledCycles++;
        }
      }
      s.t++;
      s.done = s.next >= s.active.length && s.queues.every(function (q) { return !q.length; }) && s.work.every(function (w) { return !w; });
      return s;
    };

    s.run = function () {
      var guard = 0;
      while (!s.done && guard++ < 100000) s.step();
      return s;
    };

    s.utilization = function () {
      if (!s.t) return 0;
      var sum = 0;
      s.busy.forEach(function (b) {
        sum += b;
      });
      return sum / (s.t * n);
    };
    return s;
  };

  EIE.race = function (book, orders, n, depth) {
    return EIE.createSim(book, orders, n, depth).run();
  };

  /* ------------------------------------------------------------------
   * Layers used in the lesson. Shapes of AlexNet and VGG-16 fully connected layers.
   * ---------------------------------------------------------------- */
  EIE.layers = [
    { id: 'a6', name: 'AlexNet FC6', ins: 9216, outs: 4096 },
    { id: 'a7', name: 'AlexNet FC7', ins: 4096, outs: 4096 },
    { id: 'a8', name: 'AlexNet FC8', ins: 4096, outs: 1000 },
    { id: 'v6', name: 'VGG-16 FC6', ins: 25088, outs: 4096 },
    { id: 'v7', name: 'VGG-16 FC7', ins: 4096, outs: 4096 },
    { id: 'v8', name: 'VGG-16 FC8', ins: 4096, outs: 1000 }
  ];
  EIE.layerWeights = function (l) {
    return l.ins * l.outs;
  };
  EIE.sumWeights = function (ids) {
    var total = 0;
    EIE.layers.forEach(function (l) {
      if (ids.indexOf(l.id) >= 0) total += EIE.layerWeights(l);
    });
    return total;
  };

  /* EIE's sparse-matrix memory as the lesson uses it: 64 PEs with 131,072 one-byte entries each. */
  EIE.chip = { pes: 64, entriesPerPe: 131072, bytesPerEntry: 1 };
  EIE.chip.capacityBytes = EIE.chip.pes * EIE.chip.entriesPerPe * EIE.chip.bytesPerEntry;

  /* Storage after pruning (keep densityPct %) and storing (codeBits + skipBits) per kept weight. */
  EIE.compress = function (weights, densityPct, codeBits, skipBits) {
    var entries = Math.round((weights * densityPct) / 100);
    var bytes = (entries * (codeBits + skipBits)) / 8;
    var dense = weights * 4;
    return { entries: entries, bytes: bytes, denseBytes: dense, ratio: dense / bytes, fits: bytes <= EIE.chip.capacityBytes };
  };

  /* ------------------------------------------------------------------
   * Pruning widget
   * ---------------------------------------------------------------- */
  /* Signed weights whose sizes follow an exponential curve: many tiny, a few large. */
  EIE.laplace = function (count, seed) {
    var r = rng(seed);
    var out = [];
    for (var i = 0; i < count; i++) {
      var m = -Math.log(1 - r());
      out.push((r() < 0.5 ? -1 : 1) * m);
    }
    return out;
  };

  /* Drop the smallest prunePct percent. change = share of the book's size that was removed, as a
   * typical relative change of the layer output before any retraining: sqrt(removed energy / total). */
  EIE.prune = function (w, prunePct) {
    var n = w.length;
    var drop = Math.round((n * prunePct) / 100);
    var order = w
      .map(function (v, i) {
        return i;
      })
      .sort(function (a, b) {
        return Math.abs(w[a]) - Math.abs(w[b]) || a - b;
      });
    var keep = w.map(function () {
      return true;
    });
    var removed = 0;
    var total = 0;
    w.forEach(function (v) {
      total += v * v;
    });
    for (var k = 0; k < drop; k++) {
      keep[order[k]] = false;
      removed += w[order[k]] * w[order[k]];
    }
    return { keep: keep, kept: n - drop, change: Math.sqrt(removed / total) };
  };

  /* ------------------------------------------------------------------
   * Weight sharing widget: 1-D k-means with evenly spaced starting points.
   * ---------------------------------------------------------------- */
  EIE.kmeans1d = function (values, k) {
    var sorted = values.slice().sort(function (a, b) {
      return a - b;
    });
    var cents = [];
    var i;
    for (i = 0; i < k; i++) cents.push(sorted[Math.min(sorted.length - 1, Math.floor(((i + 0.5) * sorted.length) / k))]);
    var assign = [];
    for (var iter = 0; iter < 60; iter++) {
      var sum = cents.map(function () {
        return 0;
      });
      var cnt = cents.map(function () {
        return 0;
      });
      values.forEach(function (v, vi) {
        var best = 0;
        for (var c = 1; c < k; c++) if (Math.abs(v - cents[c]) < Math.abs(v - cents[best])) best = c;
        assign[vi] = best;
        sum[best] += v;
        cnt[best]++;
      });
      var moved = 0;
      for (i = 0; i < k; i++) {
        if (cnt[i]) {
          var nc = sum[i] / cnt[i];
          moved += Math.abs(nc - cents[i]);
          cents[i] = nc;
        }
      }
      if (moved < 1e-9) break;
    }
    /* Number the shared values in order, most negative first. */
    var order = cents
      .map(function (c, ci) {
        return ci;
      })
      .sort(function (a, b) {
        return cents[a] - cents[b];
      });
    var rank = [];
    order.forEach(function (ci, r) {
      rank[ci] = r;
    });
    var table = order.map(function (ci) {
      return cents[ci];
    });
    var codes = values.map(function (v, vi) {
      return rank[assign[vi]];
    });
    var err = 0;
    var mag = 0;
    values.forEach(function (v, vi) {
      err += Math.abs(v - table[codes[vi]]);
      mag += Math.abs(v);
    });
    return { table: table, codes: codes, error: err / mag };
  };

  /* ------------------------------------------------------------------
   * Compressed sparse column (CSC) with skip counts.
   * cols[j] is a list of [row, code] sorted by row.
   * ---------------------------------------------------------------- */
  EIE.cscEncode = function (cols) {
    var entries = [];
    var ptr = [0];
    cols.forEach(function (col) {
      var prev = -1;
      col.forEach(function (e) {
        entries.push({ code: e[1], skip: e[0] - prev - 1, row: e[0] });
        prev = e[0];
      });
      ptr.push(entries.length);
    });
    return { entries: entries, ptr: ptr };
  };
  /* Rebuild the rows of column j using only ptr, skip and code. */
  EIE.cscDecode = function (enc, j) {
    var out = [];
    var row = -1;
    for (var k = enc.ptr[j]; k < enc.ptr[j + 1]; k++) {
      row = row + enc.entries[k].skip + 1;
      out.push([row, enc.entries[k].code]);
    }
    return out;
  };

  /* The numbers for the Paper 6 energy waterfall (pJ per original 32-bit weight). */
  EIE.energyStages = function (o) {
    var dram = o.dramPj;
    var sram = o.sramPj;
    var e1 = sram;
    var e2 = e1 * o.density;
    var e3 = e2 * ((o.codeBits + o.indexBits) / 32);
    var e4 = e3 * o.inputShare;
    return [dram, e1, e2, e3, e4];
  };
})(typeof window !== 'undefined' ? window : globalThis);
