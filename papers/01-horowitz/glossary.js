/* Glossary for Paper 1. Keys are used in lesson text as {{key}} or {{key|shown text}}. */
(function () {
  'use strict';
  window.HOR = window.HOR || {};
  window.HOR.glossary = {
    joule: {
      t: 'Joule (J)',
      d: 'The unit of energy. Lifting a small apple one meter takes about one joule. A phone battery holds tens of thousands of joules.'
    },
    watt: {
      t: 'Watt (W)',
      d: 'The unit of power: one joule per second. A chip that uses 2 W spends 2 joules of energy every second. Cooling limits how many watts a chip can use.'
    },
    energy: {
      t: 'Energy',
      d: 'The total amount of work a battery has to supply, in joules. Doing something once costs a fixed amount of energy, however slowly or quickly you do it.'
    },
    power: {
      t: 'Power',
      d: 'Energy per second, in watts. Power = energy per operation x operations per second. It decides how much heat a chip makes.'
    },
    'dynamic-power': {
      t: 'Dynamic (switching) power',
      d: 'The power a chip uses when its transistors switch. Roughly: activity x capacitance x voltage squared x clock frequency.'
    },
    'dark-silicon': {
      t: 'Dark silicon',
      d: 'The part of a chip that must stay switched off at any moment because turning on every transistor would use more power than the chip can cool. The term came after this paper.'
    },
    'instruction-overhead': {
      t: 'Instruction overhead',
      d: 'The energy a processor spends around the arithmetic: fetching the instruction, decoding it, reading registers, scheduling and control. In a general-purpose core it can be many times the energy of the arithmetic itself.'
    },
    amortize: {
      t: 'Amortize',
      d: 'Spread a fixed cost over many uses. If an instruction costs 60 pJ to fetch and decode and then does 64 operations, each operation carries less than 1 pJ of that cost.'
    },
    specialization: {
      t: 'Specialization',
      d: 'Designing hardware for one kind of work so it can skip the overhead that general-purpose hardware pays. Gains are large. Flexibility is lost.'
    },
    nre: {
      t: 'NRE (non-recurring engineering cost)',
      d: 'The one-time cost of designing a chip and making its masks, anywhere from millions to hundreds of millions of dollars depending on the chip and the manufacturing process. It is spread over every chip sold, so custom chips need big volumes.'
    },
    'switching-event': {
      t: 'Switching event',
      d: 'A transistor or wire changing between 0 and 1. Each event draws a small packet of energy from the supply. Chips do billions of them per second.'
    },
    'word-access': {
      t: 'Word access',
      d: 'One read or write of a fixed-size piece of data (for example 32 or 64 bits) from a memory. Energy tables quote the cost of one word access.'
    }
  };
})();
