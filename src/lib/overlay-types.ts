import type { DomainClassification } from "$lib/api";

/**
 * Safety Context Builder (extension variant — no threat-scan data)
 *
 * Three independent dimensions:
 * 1. TRUST  — Do we trust this platform? (rank + age)
 * 2. RISKS  — Inherent platform risks (functions) — informational only
 * 3. SAFETY — Combined safety level for the UI
 *
 * Logic ported from urlert.com/safety-context.ts (minus threat-scan paths).
 *
 * Key design decision: platform risks (UGC, file hosting, etc.) do NOT
 * affect the safety level. Only admin notes, potentially_malicious,
 * registrar_parking, and very-new + low-trust escalate.
 */

// ── Exported types ─────────────────────────────────────────────────────────────

export type TrustLevel  = "high" | "moderate" | "low";
export type SafetyLevel = "standard" | "caution" | "high-risk";
export type ThreatLevel = "safe" | "danger" | "warn" | "neutral"; // icon dot colour

export interface TrustSignal {
  text: string;
  sentiment: "positive" | "neutral" | "warning";
}

export interface RiskFactor {
  type: string;
  label: string;
  description: string;
}

export interface TrustAssessment {
  level: TrustLevel;
  label: string;
  reason: string;
  signals: TrustSignal[];
}

export interface OverlaySafetyContext {
  trustLevel: TrustLevel;
  trustLabel: string;
  trustSignals: TrustSignal[];
  /** Plain-English summary of why trust is what it is. */
  trustSummary: string;
  safetyLevel: SafetyLevel;
  /** Short headline for the badge — trust label or special override. */
  safetyLabel: string;
  risks: RiskFactor[];
  threatLevel: ThreatLevel;
}

// ── Internal helpers ───────────────────────────────────────────────────────────

type RankTier = "elite" | "high" | "moderate" | "low";
type AgeTier  = "established" | "young" | "new" | "very_new" | "unknown";

function calculateDomainAgeInDays(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (isNaN(created.getTime())) return null;
  const ageMs = Date.now() - created.getTime();
  if (ageMs < 0) return null;
  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

function formatAge(days: number): string {
  if (days < 1) {
    return "less than 1 day old";
  }
  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"} old`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    if (months <= 1) return "1 month old";
    return `${months} months old`;
  }
  const years = Math.floor(days / 365.25);
  if (years === 1) return "1 year old";
  return `${years} years old`;
}

function getRankTier(rank: number | null | undefined): RankTier {
  if (!rank) return "low";
  if (rank <= 1_000)     return "elite";
  if (rank <= 100_000)   return "high";
  if (rank <= 1_000_000) return "moderate";
  return "low";
}

/**
 * Classify age into tiers.
 * Established: ≥3y, Young: 1-3y, New: 3mo-1y, Very New: ≤3mo, Unknown: null
 */
function getAgeTier(ageDays: number | null): AgeTier {
  if (ageDays === null) return "unknown";
  if (ageDays <= 90)           return "very_new";
  if (ageDays >= 3 * 365.25)   return "established";
  if (ageDays >= 365.25)       return "young";
  return "new";
}

// ── Trust assessment ──────────────────────────────────────────────────────────

/**
 * Trust Matrix (matches urlert.com):
 * | Rank     | Age         | → Trust   | → Label              |
 * |----------|-------------|-----------|----------------------|
 * | Elite    | Any         | high      | Major Website        |
 * | High     | Established | high      | Well-Known Website   |
 * | High     | Young       | high      | Popular Website      |
 * | High     | New/VNew    | moderate  | Popular Website      |
 * | High     | Unknown     | moderate  | Popular Website      |
 * | Moderate | Established | moderate  | Established Website  |
 * | Moderate | Young       | low       | Growing Website      |
 * | Moderate | New         | low       | Newer Website        |
 * | Moderate | Very New    | low       | Recently Created     |
 * | Moderate | Unknown     | low       | Known Website        |
 * | Low      | Established | low       | Small Website        |
 * | Low      | Young       | low       | Small Website        |
 * | Low      | New         | low       | New Website          |
 * | Low      | Very New    | low       | Recently Created     |
 * | Low      | Unknown     | low       | Unknown Website      |
 */
export function assessTrust(
  rank: number | null | undefined,
  ageDays: number | null,
  isVerified: boolean = false,
): TrustAssessment {
  const rankTier = getRankTier(rank);
  const ageTier  = getAgeTier(ageDays);
  const signals: TrustSignal[] = [];

  // Rank signal
  if (rankTier === "elite") {
    signals.push({ text: "Top 1,000 global website", sentiment: "positive" });
  } else if (rankTier === "high") {
    signals.push({ text: "Top 100,000 global website", sentiment: "positive" });
  } else if (rankTier === "moderate" && rank) {
    signals.push({ text: `Ranked #${rank.toLocaleString()} globally`, sentiment: "neutral" });
  } else {
    signals.push({ text: "No significant traffic ranking", sentiment: "warning" });
  }

  // Age signal
  if (ageTier === "established") {
    signals.push({ text: formatAge(ageDays!), sentiment: "positive" });
  } else if (ageTier === "young") {
    signals.push({ text: formatAge(ageDays!), sentiment: "neutral" });
  } else if (ageTier === "new") {
    signals.push({ text: formatAge(ageDays!), sentiment: "neutral" });
  } else if (ageTier === "very_new") {
    signals.push({ text: formatAge(ageDays!), sentiment: "warning" });
  } else {
    signals.push({ text: "Unknown registration date", sentiment: "neutral" });
  }

  const reason = signals.map((s) => s.text).join(", ");

  // === TRUST LEVEL + LABEL DETERMINATION ===

  // Elite: Always high trust
  if (rankTier === "elite") {
    return { level: "high", label: "Major Website", reason, signals };
  }

  // High rank (1k-100k)
  if (rankTier === "high") {
    if (ageTier === "established" || ageTier === "young") {
      return {
        level: "high",
        label: ageTier === "established" ? "Well-Known Website" : "Popular Website",
        reason,
        signals,
      };
    }
    return { level: "moderate", label: "Popular Website", reason, signals };
  }

  // Moderate rank (100k-1M)
  if (rankTier === "moderate") {
    if (ageTier === "established") {
      return { level: isVerified ? "moderate" : "moderate", label: "Established Website", reason, signals };
    }
    if (ageTier === "young") {
      return { level: isVerified ? "moderate" : "low", label: "Growing Website", reason, signals };
    }
    if (ageTier === "new") {
      return { level: isVerified ? "moderate" : "low", label: "Newer Website", reason, signals };
    }
    if (ageTier === "very_new") {
      return { level: isVerified ? "moderate" : "low", label: "Recently Created", reason, signals };
    }
    return { level: isVerified ? "moderate" : "low", label: "Known Website", reason, signals };
  }

  // Low rank or unranked
  if (ageTier === "very_new") {
    return { level: isVerified ? "moderate" : "low", label: "Recently Created", reason, signals };
  }
  if (ageTier === "new") {
    return { level: isVerified ? "moderate" : "low", label: "New Website", reason, signals };
  }
  if (ageTier === "established" || ageTier === "young") {
    return { level: isVerified ? "moderate" : "low", label: "Small Website", reason, signals };
  }

  return {
    level: isVerified ? "moderate" : "low",
    label: "Unknown Website",
    reason: reason || "Limited public information available",
    signals,
  };
}

// ── Risk factors ──────────────────────────────────────────────────────────────

export function collectRisks(
  domain: string,
  operator: string,
  f: DomainClassification["functions"],
): RiskFactor[] {
  if (!f) return [];
  const risks: RiskFactor[] = [];

  if (f.is_crypto_platform) risks.push({
    type: "crypto", label: "Cryptocurrency Platform",
    description: "handles cryptocurrency transactions. Crypto transfers cannot be reversed once sent, making these platforms prime targets for phishing. Always verify you're on the exact official URL before entering credentials or approving transactions.",
  });
  if (f.is_url_shortener) risks.push({
    type: "url-shortener", label: "URL Shortener",
    description: "converts URLs into short codes that hide the actual destination. Before clicking shortened links, use a URL expander tool or hover to preview where the link actually leads.",
  });
  if (f.is_file_host) risks.push({
    type: "file-host", label: "File Hosting",
    description: "allows users to upload and share files. Any file you download was uploaded by another user—not the platform operator. Scan downloads with antivirus software and only download from sources you trust.",
  });
  if (f.is_form_builder) risks.push({
    type: "form-builder", label: "Form Builder",
    description: "enables anyone to create forms that collect user data. Attackers use this to create fake login pages or payment forms. Never enter passwords or financial information on forms hosted here unless you initiated the process yourself.",
  });
  if (f.is_public_idp) risks.push({
    type: "idp", label: "Identity Provider",
    description: `provides "Sign in with..." authentication for third-party websites. Attackers create fake login pages that look identical to the real one. Always check the URL bar shows the exact correct domain before entering your password.`,
  });
  if (f.is_document_host) risks.push({
    type: "document-host", label: "Document Hosting",
    description: "hosts documents and pages shared via links. Because the domain is trusted, links pass through email spam filters easily. Attackers exploit this to host fake invoices, login pages, or malware download prompts.",
  });
  if (f.is_ugc_platform) risks.push({
    type: "ugc", label: "User-Generated Content",
    description: "hosts content created by its users, not the platform operator. Individual posts, profiles, or pages may contain scams, misinformation, or phishing attempts that the platform hasn't yet detected or removed.",
  });
  if (f.allows_user_subdomains) risks.push({
    type: "subdomains", label: "Custom Subdomains",
    description: `allows users to create custom addresses like "anything.${domain}". An address like "paypal-secure.${domain}" may look official but is actually controlled by whoever registered that subdomain—not ${operator}.`,
  });

  return risks;
}

// ── Safety level ──────────────────────────────────────────────────────────────

/**
 * Calculate overall safety level.
 *
 * Only human-verified signals and extreme domain age escalate:
 * - Admin danger note → high-risk
 * - potentially_malicious category → high-risk
 * - Admin warning note → caution
 * - Parked domains → caution
 * - Verified domains → standard
 * - Very new (≤3mo) + low trust → caution
 * - Everything else → standard
 *
 * Platform risks (UGC, file hosting) do NOT affect the domain-level safety label.
 */
function calculateSafetyLevel(
  trustLevel: TrustLevel,
  isVerified: boolean = false,
  adminNoteLevel?: string | null,
  ageDays: number | null = null,
  purpose?: string | null,
): SafetyLevel {
  // Admin danger = always high-risk
  if (adminNoteLevel === "danger") return "high-risk";

  // Potentially malicious = always high-risk
  if (purpose === "potentially_malicious") return "high-risk";

  // Admin warning = always caution
  if (adminNoteLevel === "warning") return "caution";

  // Parked domains = always caution
  if (purpose === "registrar_parking") return "caution";

  // Verified domains are always standard
  if (isVerified) return "standard";

  // Very new (≤90 days) + low trust = caution
  const isLowTrust = trustLevel === "low";
  if (ageDays !== null && ageDays <= 90 && isLowTrust) return "caution";

  // Everything else is standard
  return "standard";
}

// ── Trust summary ─────────────────────────────────────────────────────────────

function buildTrustSummary(
  domain: string,
  operator: string | null,
  trust: TrustAssessment,
  isVerified: boolean = false,
): string {
  const operatorText = operator
    ? `operated by ${operator}`
    : "with no publicly identified operator";

  if (isVerified) {
    return `${domain} is a known platform ${operatorText}. ${trust.reason}.`;
  }

  const effectiveLevel = trust.level;

  switch (effectiveLevel) {
    case "high":
      return `${domain} is a major website ${operatorText}. ${trust.reason}.`;
    case "moderate":
      return `${domain} is an established website ${operatorText}. ${trust.reason}.`;
    case "low":
      return `${domain} has limited public visibility. ${trust.reason}.`;
  }
}

// ── Safety label ──────────────────────────────────────────────────────────────

/**
 * Build the short headline/label for the safety badge.
 *
 * Only admin notes produce special labels.
 * Everything else uses the trust label directly.
 */
function buildLabel(
  trust: TrustAssessment,
  adminNoteLevel?: string | null,
  purpose?: string | null,
): string {
  if (adminNoteLevel === "danger") {
    return "High Risk";
  }
  if (purpose === "potentially_malicious") {
    return "Potentially Malicious";
  }
  if (adminNoteLevel === "warning") {
    return "Flagged by URLert";
  }
  if (purpose === "registrar_parking") {
    return "Parked Domain";
  }

  // All other cases: just the trust label
  return trust.label;
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function buildOverlaySafetyContext(c: DomainClassification): OverlaySafetyContext {
  const ageDays     = calculateDomainAgeInDays(c.facts?.registered_date);
  const isVerified  = c.verified ?? false;
  const trust       = assessTrust(c.facts?.rank, ageDays, isVerified);
  const operator    = c.identity?.operator ?? c.domain;
  const risks       = collectRisks(c.domain, operator, c.functions);

  const adminNoteLevel = c.admin_note?.level;
  const purpose = c.category?.purpose;

  const safetyLevel = calculateSafetyLevel(
    trust.level,
    isVerified,
    adminNoteLevel,
    ageDays,
    purpose,
  );
  const safetyLabel = buildLabel(trust, adminNoteLevel, purpose);
  let trustSummary = buildTrustSummary(c.domain, operator, trust, isVerified);

  // Low-confidence caveat: classification data may be unreliable
  if (c.confidence === "unknown") {
    trustSummary += " Classification is based on content analysis and may not be fully accurate.";
  }

  // Icon dot colour
  let threatLevel: ThreatLevel = "neutral";
  if (safetyLevel === "high-risk") {
    threatLevel = "danger";
  } else if (safetyLevel === "caution") {
    threatLevel = "warn";
  } else if (isVerified && risks.length === 0) {
    threatLevel = "safe";
  }

  return {
    trustLevel:   trust.level,
    trustLabel:   trust.label,
    trustSignals: trust.signals,
    trustSummary,
    safetyLevel,
    safetyLabel,
    risks,
    threatLevel,
  };
}
