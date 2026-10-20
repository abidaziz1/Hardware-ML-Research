/*
 * catalog.js
 * The 24-paper reading list for Computer Architecture for AI and Hardware/Software Co-design.
 * To publish a lesson, set `lesson` to its folder (for example 'papers/01-horowitz/') and `id` to
 * the id used inside that lesson's lesson.js. `starter: true` marks the "if you can only read 10" list.
 * Areas: memory | dataflow | accel | inference | mapping
 */
(function () {
  'use strict';
  window.MLS = window.MLS || {};

  window.MLS.foundations = {
    memory: 'Memory and data movement',
    dataflow: 'Dataflow',
    accel: 'Accelerators',
    inference: 'Efficient inference',
    mapping: 'Mapping and runtime'
  };

  window.MLS.tiers = [
    { id: 't1', title: 'Tier 1: Core papers', blurb: 'Twelve papers on energy, dataflow, accelerators and modeling tools. Start here.' },
    { id: 't2', title: 'Tier 2: Efficient inference on small devices', blurb: 'Fit a model into a chip that has kilobytes, not gigabytes.' },
    { id: 't3', title: 'Tier 3: Memory-aware LLM work', blurb: 'The same data movement ideas, applied to attention and LLM serving.' },
    { id: 't4', title: 'Tier 4: Modern accelerators and offloading', blurb: 'Pods of accelerators, and running models bigger than one GPU.' },
    { id: 't5', title: 'Tier 5: 2026 frontier (read last)', blurb: 'Recent work. Read these after the foundations.' }
  ];

  window.MLS.papers = [
    { n: 1, tier: 't1', f: 'memory', starter: true, title: 'Computing\'s Energy Problem (and What We Can Do About It)', authors: 'Horowitz', venue: 'ISSCC 2014', id: 'horowitz-isscc14', lesson: 'papers/01-horowitz/' },
    { n: 2, tier: 't1', f: 'accel', starter: true, title: 'Efficient Processing of Deep Neural Networks: A Tutorial and Survey', authors: 'Sze, Chen, Yang, Emer', venue: 'Proc. IEEE 2017', id: 'sze-survey-proc17', lesson: 'papers/02-sze-survey/' },
    { n: 3, tier: 't1', f: 'memory', starter: true, title: 'Roofline: An Insightful Visual Performance Model for Multicore Architectures', authors: 'Williams, Waterman, Patterson', venue: 'CACM 2009', id: 'roofline-cacm09', lesson: 'papers/03-roofline/' },
    { n: 4, tier: 't1', f: 'dataflow', starter: true, title: 'Eyeriss: A Spatial Architecture for Energy-Efficient Dataflow for Convolutional Neural Networks', authors: 'Chen, Emer, Sze', venue: 'ISCA 2016', id: 'eyeriss-isca16', lesson: 'papers/04-eyeriss/' },
    { n: 5, tier: 't1', f: 'accel', starter: true, title: 'In-Datacenter Performance Analysis of a Tensor Processing Unit', authors: 'Jouppi et al.', venue: 'ISCA 2017', id: 'tpu-isca17', lesson: 'papers/05-tpu/' },
    { n: 6, tier: 't1', f: 'inference', title: 'EIE: Efficient Inference Engine on Compressed Deep Neural Network', authors: 'Han et al.', venue: 'ISCA 2016' },
    { n: 7, tier: 't1', f: 'dataflow', title: 'SCNN: An Accelerator for Compressed-Sparse Convolutional Neural Networks', authors: 'Parashar et al.', venue: 'ISCA 2017' },
    { n: 8, tier: 't1', f: 'mapping', starter: true, title: 'Timeloop: A Systematic Approach to DNN Accelerator Evaluation', authors: 'Parashar et al.', venue: 'ISPASS 2019' },
    { n: 9, tier: 't1', f: 'mapping', starter: true, title: 'MAESTRO: A Data-Centric Approach to Understand Reuse, Performance, and Hardware Cost of DNN Mappings', authors: 'Kwon et al.', venue: 'MICRO 2019' },
    { n: 10, tier: 't1', f: 'mapping', title: 'Accelergy: An Architecture-Level Energy Estimation Methodology for Accelerator Designs', authors: 'Wu, Emer, Sze', venue: 'ICCAD 2019' },
    { n: 11, tier: 't1', f: 'inference', title: 'How to Evaluate Deep Neural Network Processors: TOPS/W (Alone) Considered Harmful', authors: 'Sze et al.', venue: 'IEEE SSCS Magazine 2020' },
    { n: 12, tier: 't1', f: 'memory', title: 'TETRIS: Scalable and Efficient Neural Network Acceleration with 3D Memory', authors: 'Gao et al.', venue: 'ASPLOS 2017' },
    { n: 13, tier: 't2', f: 'inference', title: 'HAQ: Hardware-Aware Automated Quantization with Mixed Precision', authors: 'Wang et al.', venue: 'CVPR 2019' },
    { n: 14, tier: 't2', f: 'inference', title: 'Once-for-All: Train One Network and Specialize it for Efficient Deployment', authors: 'Cai et al.', venue: 'ICLR 2020' },
    { n: 15, tier: 't2', f: 'inference', starter: true, title: 'MCUNet: Tiny Deep Learning on IoT Devices', authors: 'Lin et al.', venue: 'NeurIPS 2020' },
    { n: 16, tier: 't2', f: 'inference', starter: true, title: 'MCUNetV2: Memory-Efficient Patch-based Inference for Tiny Deep Learning', authors: 'Lin et al.', venue: 'NeurIPS 2021' },
    { n: 17, tier: 't2', f: 'accel', title: 'FINN: A Framework for Fast, Scalable Binarized Neural Network Inference', authors: 'Umuroglu et al.', venue: 'FPGA 2017' },
    { n: 18, tier: 't3', f: 'memory', starter: true, title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', authors: 'Dao et al.', venue: 'NeurIPS 2022' },
    { n: 19, tier: 't3', f: 'memory', title: 'Efficient Memory Management for Large Language Model Serving with PagedAttention', authors: 'Kwon et al.', venue: 'SOSP 2023' },
    { n: 20, tier: 't3', f: 'mapping', title: 'LLMCompass: Enabling Efficient Hardware Design for Large Language Model Inference', authors: 'Zhang et al.', venue: 'ISCA 2024' },
    { n: 21, tier: 't4', f: 'accel', title: 'TPU v4: An Optically Reconfigurable Supercomputer for Machine Learning with Hardware Support for Embeddings', authors: 'Jouppi et al.', venue: 'ISCA 2023' },
    { n: 22, tier: 't4', f: 'memory', title: 'FlexGen: High-Throughput Generative Inference of Large Language Models with a Single GPU', authors: 'Sheng et al.', venue: 'ICML 2023' },
    { n: 23, tier: 't5', f: 'accel', title: 'DIAMoND (full title to be added)', authors: '', venue: 'ISCA 2026' },
    { n: 24, tier: 't5', f: 'inference', title: 'MoEBlaze (full title to be added)', authors: '', venue: 'MLSys 2026' }
  ];
})();
