# Paper 3 Roofline Model Tutorial: Step-by-Step Interactive Guide

**Paper Reference:** Williams, Waterman & Patterson (CACM 2009), *"Roofline: An Insightful Visual Performance Model for Multicore Architectures"*

---

## Part 1: Why Peak GFLOPs/s Lies & Bound & Bottleneck Analysis

### 1.1 The Fallacy of Advertised Peak GFLOPs/s
Hardware manufacturers frequently promote processors based on theoretical peak floating-point performance ($\text{GFLOP/s} = \text{Cores} \times \text{Clock Frequency} \times \text{SIMD Width} \times \text{FMA Ops/Cycle}$). However, real-world application performance is strictly bounded by hardware bottlenecks—most notably the memory wall.

### 1.2 Bound & Bottleneck Analysis
Performance is constrained by either:
1. **Compute Bound:** Execution rate limited by core arithmetic capability.
2. **Memory Bound:** Execution rate limited by memory system bandwidth transferring data between DRAM and processor cache/registers.

### 1.3 The 3Cs Cache Model Analogy
- **Compulsory Misses:** First-time access to data (cold start).
- **Capacity Misses:** Working set exceeds cache capacity.
- **Conflict Misses:** Multiple memory lines map to the same set in set-associative cache.

### 1.4 The Master Chef vs. Dumbwaiter Elevator Analogy
Imagine a **Master Chef** (CPU Core) who can chop vegetables at 100 slices per second (Peak GFLOPs/s). However, ingredients are delivered from the basement pantry (DRAM) via a single **Dumbwaiter Elevator** (Memory Bus). If the elevator can only deliver 5 vegetables per minute, the chef spends most of their time waiting idle. Increasing the chef's knife speed does not yield a single additional dish per hour; only widening the elevator shaft (increasing memory bandwidth) or reusing ingredients already on the counter (increasing operational intensity) speeds up production.

<details>
<summary>Click to Reveal Answer: Part 1 Research Mastery Checkpoint</summary>

**Question:** Why does doubling the clock frequency of a processor result in almost zero speedup for a memory-bound algorithm?

**Answer:** A memory-bound kernel is bottlenecked by the data transfer rate between DRAM and LLC (Last-Level Cache). Doubling the core clock speed allows the processor to execute instructions faster, but it spends those saved cycles waiting for memory transactions to complete. Unless memory bandwidth or operational intensity is increased, peak performance remains unchanged.
</details>

---

## Part 2: Operational Intensity & Memory Traffic Mechanics

### 2.1 Operational Intensity Definition
Operational Intensity ($I$) measures algorithm arithmetic density:
$$I = \frac{\text{Floating Point Operations (FLOPs)}}{\text{DRAM Bytes Transferred}}$$
Unit: $\text{FLOPs / Byte}$.

### 2.2 Why LLC-to-DRAM Traffic Matters
Operational Intensity is defined by traffic between **Last-Level Cache (LLC) and DRAM**, NOT traffic between registers and L1 cache. Cache hits filter out memory traffic before it reaches DRAM. DRAM access requires off-chip pin transfer, which consumes orders of magnitude more energy and time.

### 2.3 How Cache Misses & Store Allocation Shift Operational Intensity
- **Cache Misses (Compulsory, Capacity, Conflict):** Increase DRAM bytes fetched, reducing $I$.
- **No-Allocate Stores / Write-Allocate Behavior:** Standard cache architectures use Write-Allocate with Write-Back. A write miss causes a "Read-for-Ownership" fetch of the full cache line from DRAM before overwriting it. This doubles DRAM traffic for store-heavy kernels, cutting $I$ in half. Using Streaming non-temporal stores (No-Allocate Stores) bypasses cache, avoiding the extra read fetch.

<details>
<summary>Click to Reveal Answer: Part 2 Research Mastery Checkpoint</summary>

**Question:** If an algorithm performs 8 FLOPs per 8-byte double-precision float loaded, but experiences write-allocate overhead on store operations, how is $I$ affected?

**Answer:** For each 8-byte float read and written back with Write-Allocate, the hardware transfers 8 bytes (read) + 8 bytes (read-for-ownership on write miss) + 8 bytes (dirty line writeback) = 24 bytes from/to DRAM. Thus $I = 8 \text{ FLOPs} / 24 \text{ Bytes} = 0.33 \text{ FLOP/Byte}$, whereas with streaming non-temporal stores, DRAM traffic is 16 bytes ($I = 0.50 \text{ FLOP/Byte}$).
</details>

---

## Part 3: Constructing the Naive Roofline Model

### 3.1 Log-Log Plot Mechanics
The Roofline model plots:
- **X-axis:** Operational Intensity ($I$, FLOP/Byte) on a logarithmic scale.
- **Y-axis:** Attainable Performance (GFLOP/s) on a logarithmic scale.

### 3.2 The Fundamental Roofline Equation
$$\text{Attainable GFLOP/s} = \min\left(\text{Peak FP Performance}, \text{Peak Memory Bandwidth} \times I\right)$$

### 3.3 The Ridge Point ($I_{\text{ridge}}$)
$$I_{\text{ridge}} = \frac{\text{Peak Floating Point Performance (GFLOP/s)}}{\text{Peak Memory Bandwidth (GB/s)}}$$
- **$I < I_{\text{ridge}}$:** Memory-bound region (sloped roofline).
- **$I \ge I_{\text{ridge}}$:** Compute-bound region (flat ceiling).

### 3.4 Hardware Comparison: AMD Opteron X2 vs Opteron X4 (Figure 1a vs 1b)
- **AMD Opteron X2 (Dual-Core):** Lower peak compute (16 GFLOP/s), lower memory bandwidth (5.5 GB/s), $I_{\text{ridge}} \approx 2.91 \text{ FLOP/Byte}$.
- **AMD Opteron X4 (Barcelona Quad-Core):** Higher peak compute (74 GFLOP/s), higher memory bandwidth (16.6 GB/s), $I_{\text{ridge}} \approx 4.46 \text{ FLOP/Byte}$.

<details>
<summary>Click to Reveal Answer: Part 3 Research Mastery Checkpoint</summary>

**Question:** Calculate $I_{\text{ridge}}$ for a system with 100 GFLOP/s Peak Compute and 25 GB/s Peak Memory Bandwidth. Where does a kernel with $I = 2.0 \text{ FLOP/Byte}$ land?

**Answer:** $I_{\text{ridge}} = 100 / 25 = 4.0 \text{ FLOP/Byte}$. Since $I = 2.0 < 4.0$, the kernel lands in the memory-bound region. Its maximum attainable performance is $25 \text{ GB/s} \times 2.0 \text{ FLOP/Byte} = 50 \text{ GFLOP/s}$.
</details>

---

## Part 4: Adding Ceilings to the Model

### 4.1 Concept of Performance Ceilings (Figure 2)
In practice, applications rarely hit absolute peak compute or peak bandwidth without specific code optimizations. Ceilings represent intermediate performance limits.

### 4.2 Bandwidth Ceilings
1. **Unit Stride vs. Non-unit Stride Access:** Strided or random accesses waste cache line transfers.
2. **NUMA Memory Affinity:** Accessing remote socket memory severely penalizes bandwidth.
3. **Software Prefetching:** Explicit prefetch instructions hide DRAM latency and saturate bus bandwidth.

### 4.3 In-Core Compute Ceilings
1. **ILP & SIMD Vectorization:** Without SIMD AVX/NEON vector instructions, attainable compute drops by a factor equal to the vector length (e.g., $4\times$ or $8\times$).
2. **Multiply-Add Balance:** Without fused multiply-add (FMA) instructions, peak floating point capability drops by $50\%$.

### 4.4 The 3 Optimization Regions
- **Yellow Region (Memory-bound only):** Below lowest bandwidth ceiling; require memory layout optimizations (tiling, prefetching, NUMA binding).
- **Green Region (Overlap region):** Near $I_{\text{ridge}}$; requires both memory bandwidth and compute optimizations.
- **Blue Region (Compute-bound only):** Above $I_{\text{ridge}}$; requires SIMD vectorization, instruction unrolling, and FMA utilization.

<details>
<summary>Click to Reveal Answer: Part 4 Research Mastery Checkpoint</summary>

**Question:** If a code lacks SIMD vectorization on a processor with 4-way SIMD units, what ceiling bounds its maximum compute performance?

**Answer:** The in-core compute ceiling drops to $25\%$ of peak performance ($\text{Peak GFLOP/s} / 4$), creating a lower horizontal ceiling in the blue/green regions.
</details>

---

## Part 5: Paper Empirical Data & The 4 Dwarfs

### 5.1 System Comparison (Table 1)
| Architecture | Peak Double Precision (GFLOP/s) | Stream DRAM Bandwidth (GB/s) | Ridge Point $I_{\text{ridge}}$ (FLOP/Byte) | Architectural Features |
| --- | --- | --- | --- | --- |
| **Intel Xeon e5345 (Clovertown)** | 75.0 | 5.9 | 12.71 (Stream) / 6.7 | Dual FSB, Quad-core |
| **AMD Opteron 2356 (Barcelona X4)** | 74.0 | 16.6 | 4.46 | Integrated Memory Controller, NUMA |
| **Sun UltraSPARC T2+ (Niagara 2)** | 19.0 | 26.0 | 0.73 / 0.33 | 128 hardware threads, high memory bandwidth |
| **IBM Cell QS20** | 29.1 (DP) | 47.0 | 0.62 / 0.65 | Heterogeneous SPEs with explicit DMA local stores |

### 5.2 The 4 Dwarfs Characterization (Tables 2 & 3)
| Kernel / Dwarf | Operational Intensity $I$ (FLOP/Byte) | Primary Bottleneck | Optimization Strategy |
| --- | --- | --- | --- |
| **SpMV (Sparse Matrix-Vector)** | 0.17 to 0.25 | Extreme Memory Bound | Format compression (CSR/ELLPACK), index packing |
| **LBMHD (Lattice Boltzmann)** | 0.70 to 1.07 | Memory Bound / Write Traffic | Bypassing cache with streaming stores, spatial tiling |
| **Stencil 7-point 3D** | 0.33 to 0.50 | Memory Bound | 2D/3D Cache Tiling, domain decomposition |
| **3-D FFT** | 1.09 to 1.64 | Balanced / Transpose Bottleneck | Communication minimization, SIMD vectorization |

<details>
<summary>Click to Reveal Answer: Part 5 Research Mastery Checkpoint</summary>

**Question:** Why does IBM Cell QS20 achieve a low $I_{\text{ridge}}$ (0.65) compared to Intel Clovertown (6.7)?

**Answer:** IBM Cell was designed with extremely high memory bandwidth (47.0 GB/s XDR memory with DMA engines) relative to its double-precision float rate (29.1 GFLOP/s). A low $I_{\text{ridge}}$ means algorithms become compute-bound much earlier, making Cell far more suitable for memory-heavy workload dwarfs like SpMV and Stencils.
</details>

---

## Part 6: Fallacies & Modern AI Architecture Connections

### 6.1 Section 7 Fallacies Debunked
1. **Fallacy 1:** *"Peak performance is a useful metric for comparing processors."*
   - **Debunked:** Peak compute is unachievable for memory-bound applications. Memory bandwidth and $I_{\text{ridge}}$ determine real performance.
2. **Fallacy 2:** *"Optimizing compute code always improves performance."*
   - **Debunked:** If an algorithm lies in the memory-bound region, arithmetic code tuning yields zero performance improvement.
3. **Fallacy 3:** *"Memory bandwidth is a single fixed constant."*
   - **Debunked:** Bandwidth depends heavily on access patterns, striding, NUMA node placement, and active thread count.
4. **Fallacy 4:** *"Increasing core clock rate proportionally improves application execution speed."*
   - **Debunked:** Memory-bound applications are constrained by memory bus frequencies, not core clocks.
5. **Fallacy 5:** *"Hardware caches automatically solve memory throughput bottlenecks."*
   - **Debunked:** Caches only help if temporal or spatial locality exists. Without tiling or high operational intensity, cache overhead provides no throughput benefit.

### 6.2 Connections to Modern AI Accelerators & Architectures
- **Google TPU v1/v4:** Large Matrix Multiply Units (MXUs / Systolic Arrays) provide high peak TFLOPs. HBM2/HBM3 memory is required to raise the bandwidth ceiling so matrix multiplication kernels stay compute-bound.
- **Eyeriss Accelerator:** Employs Row-Stationary dataflow to reuse weights and activations in local SRAM registers, maximizing operational intensity $I$ before fetching from DRAM.
- **Timeloop & MAESTRO:** Modern spatial mapper tools that calculate operational intensity across loop nest tiling combinations to identify compute/memory ceilings.
- **FlashAttention (Dao et al.):** Restructures Transformer Attention computation using SRAM tiling. By avoiding writing intermediate $N \times N$ attention matrices to GPU High Bandwidth Memory (HBM), FlashAttention increases operational intensity from $O(1)$ to $O(N)$, moving execution from memory-bound to compute-bound on Tensor Cores.
- **MoE Accelerators (DIAMoND ISCA 2026, MoEBlaze MLSys 2026):** Mixture-of-Experts routing exhibits low operational intensity due to sparse expert activation. Modern MoE hardware uses dynamic interconnects and off-chip weight streaming pipelines to overcome memory bandwidth limits.

<details>
<summary>Click to Reveal Answer: Part 6 Research Mastery Checkpoint</summary>

**Question:** How does FlashAttention utilize Roofline principles to accelerate Transformer inference and training?

**Answer:** Standard attention writes $QK^T$ ($O(N^2)$ bytes) to DRAM/HBM, making it memory-bound ($I \approx O(1)$). FlashAttention tiles $Q, K, V$ inside fast GPU SRAM, performing softmax reduction in SRAM without writing $N \times N$ matrices to HBM. This reduces DRAM traffic by $O(N)$, raising operational intensity to $O(N)$ and moving the workload above $I_{\text{ridge}}$ onto the GPU's high-throughput Tensor Cores.
</details>

---

## Part 7: Research Mastery Checkpoints & Questions

<details>
<summary>Click to Reveal Answer: Master Checkpoint 1 - Compute vs. Memory Bound</summary>

**Question:** You run a neural network convolution kernel with $I = 1.5 \text{ FLOP/Byte}$ on an NVIDIA H100 SXM (Peak FP8 Compute = 1979 TFLOP/s, Peak Bandwidth = 3.35 TB/s). Is the kernel compute-bound or memory-bound? What is the theoretical maximum performance?

**Answer:**
1. Compute $I_{\text{ridge}} = \frac{1979 \text{ TFLOP/s}}{3.35 \text{ TB/s}} \approx 590.7 \text{ FLOP/Byte}$.
2. Since $I = 1.5 \ll 590.7$, the kernel is heavily memory-bound.
3. Maximum performance = $3.35 \text{ TB/s} \times 1.5 \text{ FLOP/Byte} = 5.025 \text{ TFLOP/s}$ (less than 0.3% of peak FP8 compute!).
</details>

<details>
<summary>Click to Reveal Answer: Master Checkpoint 2 - Optimization Strategy Selection</summary>

**Question:** If your kernel performance sits in the Yellow Memory-Bound Region, list three hardware-software co-design techniques to move performance upward or rightward.

**Answer:**
1. **Move Upward (Bandwidth Optimization):** Apply software prefetching, enforce NUMA affinity, and eliminate non-unit strided accesses to hit peak memory bandwidth.
2. **Move Rightward (Operational Intensity Optimization):** Apply loop tiling/blocking to keep data in SRAM/L1 cache, use non-temporal streaming stores to remove read-for-ownership traffic, and fuse adjacent operations (e.g., Conv + Bias + ReLU).
3. **Precision Reduction:** Quantize weights/activations from FP32 to INT8/FP8, cutting DRAM bytes in half or by $4\times$, thereby shifting $I$ to the right by $2\times$ or $4\times$.
</details>
