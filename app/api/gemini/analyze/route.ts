import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt, context } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "GEMINI_API_KEY is not configured. Please add your key in the AI Studio settings.",
          fallback: true
        },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are the lead architect and research scientist behind KV-Memory (kvmem-qw3-hardening-rc40), a hierarchical 3-tier KV cache management and Coherent DeltaNet retrieval architecture for long-context LLMs (specifically Qwen 2.5/3, DeepSWE, and large-scale autonomous agent reasoning up to 2M tokens).

Key Technical Foundations:
- Tier 0 (GPU VRAM HBM): Active working set, FlashInfer decode/prefill, FP8/NVFP4 scaled matmuls, 32K-64K tokens budget.
- Tier 1 (Host Pinned DRAM): Lock-free ring buffer, PCIe 5.0 DMA staging, 128GB-512GB host capacity.
- Tier 2 (NVMe SSD Block Store): Slot-scoped direct I/O, asynchronous proactive writeback overlapping generation.
- Retrieval Mechanism: Gated Delta Net (GDN) linear recurrent state for associative memory lookup, ranking top-k relevant KV blocks without full quadratic attention.
- Transactional Coherence (RC40): Evidence-gated restore promotion, cryptographic verification receipts, rollback on prefill faults, zero degradation (KL divergence < 0.0015).
- Profiles: agent-fast (max speed), agent-safe (frequent validated checkpoints), deepswe-1m (multi-turn tool calling), server-throughput (continuous batching + MTP).

Provide precise, mathematically grounded, and actionable architectural answers. Use clean formatting, bold key metrics, and concise bullet points.`;

    const fullPrompt = `${systemInstruction}\n\nContext Data:\n${JSON.stringify(context || {})}\n\nUser Question/Analysis Request:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    return NextResponse.json(
      { 
        error: error?.message || "Failed to generate analysis",
        fallback: true 
      },
      { status: 500 }
    );
  }
}
