// frontend/js/voip_engine.js

/**
 * Calculates the Mean Opinion Score (MOS) based on a simplified ITU-T E-model.
 * @param {number} latency - Average latency in ms
 * @param {number} jitter - Average jitter in ms
 * @param {number} packetLoss - Packet loss percentage (0.0 to 100.0)
 * @returns {object} { score: number, label: string, colorClass: string, warning: string }
 */
export function calculateMOS(latency, jitter, packetLoss) {
    // 1. Calculate Effective Latency
    const effectiveLatency = latency + (jitter * 2) + 10;
    
    // 2. Calculate the R-Value (Rating Factor)
    let rValue = 93.2; // Base perfect score

    // Deduct for latency
    if (effectiveLatency < 160) {
        rValue -= (effectiveLatency / 40);
    } else {
        rValue -= ((effectiveLatency - 120) / 10);
    }

    // Deduct for packet loss (loss is highly destructive to voice)
    rValue -= (packetLoss * 2.5);

    // Floor the R-Value
    if (rValue < 0) rValue = 0;

    // 3. Convert R-Value to MOS (1.0 to 5.0 scale)
    let mos = 1.0;
    if (rValue > 0) {
        mos = 1 + (0.035 * rValue) + (rValue * (rValue - 60) * (100 - rValue) * 0.000007);
    }

    // Cap at 1.0 and 5.0
    mos = Math.max(1.0, Math.min(5.0, mos));
    const finalScore = mos.toFixed(2);

    // 4. Determine Labels, Colors, and Plain-Language Warnings
    if (mos >= 4.3) {
        return { score: finalScore, label: "Excellent", colorClass: "text-emerald-400", borderClass: "border-t-emerald-500", warning: "" };
    } else if (mos >= 4.0) {
        return { score: finalScore, label: "Good", colorClass: "text-emerald-400", borderClass: "border-t-emerald-500", warning: "" };
    } else if (mos >= 3.6) {
        let warnText = "Call quality may drop.";
        if (packetLoss > 1.0) warnText = "Packet loss causing audio drops.";
        if (jitter > 30) warnText = "Jitter above 30ms: calls may sound choppy.";
        if (latency > 150) warnText = "High latency causing audio delay.";
        
        return { score: finalScore, label: "Fair", colorClass: "text-amber-400", borderClass: "border-t-amber-500", warning: warnText };
    } else if (mos >= 3.1) {
        return { score: finalScore, label: "Poor", colorClass: "text-rose-400", borderClass: "border-t-rose-500", warning: "Severe degradation. Unsuitable for business calls." };
    } else {
        return { score: finalScore, label: "Bad", colorClass: "text-rose-500", borderClass: "border-t-rose-500", warning: "Network unable to support VoIP." };
    }
}