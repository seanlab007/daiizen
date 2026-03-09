import { invokeLLM } from "./_core/llm";

export type SubmissionType = "wechat_moments" | "community_trade" | "social_media" | "referral_signup";

export interface SocialSubmission {
  submissionType: SubmissionType;
  platform?: string;
  contentUrl?: string;
  screenshotUrl?: string;
  description?: string;
  claimedViews?: number;
  claimedEngagement?: number;
  claimedTradeAmount?: number;
}

export interface AIDistributionReview {
  approved: boolean;
  score: number;
  darkReward: number;
  reason: string;
  category: string;
}

function calculateBaseReward(submission: SocialSubmission): number {
  const { submissionType, claimedViews = 0, claimedTradeAmount = 0 } = submission;

  switch (submissionType) {
    case "wechat_moments": return 10;
    case "community_trade":
      if (claimedTradeAmount >= 2000) return 200;
      if (claimedTradeAmount >= 500)  return 80;
      if (claimedTradeAmount >= 100)  return 30;
      if (claimedTradeAmount >= 10)   return 10;
      return 5;
    case "social_media":
      if (claimedViews >= 100_000) return 300;
      if (claimedViews >= 10_000)  return 100;
      if (claimedViews >= 1_000)   return 30;
      if (claimedViews >= 100)     return 10;
      return 5;
    case "referral_signup": return 50;
    default: return 5;
  }
}

const TYPE_LABELS: Record<SubmissionType, string> = {
  wechat_moments: "WeChat Moments brand mention",
  community_trade: "Community group trade referral",
  social_media: "Social media post",
  referral_signup: "Referral signup",
};

export async function reviewSocialDistribution(submission: SocialSubmission): Promise<AIDistributionReview> {
  const baseReward = calculateBaseReward(submission);
  const typeLabel = TYPE_LABELS[submission.submissionType] || submission.submissionType;

  const evidenceParts: string[] = [];
  if (submission.platform) evidenceParts.push(`Platform: ${submission.platform}`);
  if (submission.contentUrl) evidenceParts.push(`Content URL: ${submission.contentUrl}`);
  if (submission.screenshotUrl) evidenceParts.push(`Screenshot provided: yes`);
  if (submission.description) evidenceParts.push(`User description: ${submission.description}`);
  if (submission.claimedViews) evidenceParts.push(`Claimed views: ${submission.claimedViews.toLocaleString()}`);
  if (submission.claimedTradeAmount) evidenceParts.push(`Claimed trade amount: $${submission.claimedTradeAmount}`);
  const evidenceDesc = evidenceParts.join("\n") || "No additional evidence provided";

  const hasAnyEvidence = !!(submission.contentUrl || submission.screenshotUrl || submission.description);
  if (!hasAnyEvidence) {
    return { approved: false, score: 10, darkReward: 0, reason: "No evidence provided. Please upload a screenshot or provide a content URL.", category: typeLabel };
  }

  let aiScore = 60;
  let aiReason = "";
  let aiApproved = true;
  let finalReward = baseReward;

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an AI content reviewer for Daiizen's Creator Reward Program. Users earn DARK tokens by sharing Daiizen content on social media. Evaluate authenticity and quality of submitted social proof. Respond ONLY with valid JSON.`,
        },
        {
          role: "user",
          content: `Review this submission:\nType: ${typeLabel}\nEvidence:\n${evidenceDesc}\nBase reward: ${baseReward} DARK\n\nRespond with: {"score": 0-100, "approved": boolean, "reward_multiplier": 0.0-1.5, "reason": "max 2 sentences"}`,
        },
      ],
    });

    const content = result.choices?.[0]?.message?.content;
    if (content) {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      aiScore = Math.min(100, Math.max(0, Math.round(parsed.score ?? 60)));
      aiApproved = parsed.approved ?? true;
      aiReason = parsed.reason ?? "";
      const multiplier = Math.min(1.5, Math.max(0, parsed.reward_multiplier ?? 1.0));
      finalReward = Math.round(baseReward * multiplier * 10) / 10;
    }
  } catch (err) {
    console.warn("[SocialDistributionAI] LLM review failed, using rule-based fallback:", err);
    aiApproved = hasAnyEvidence;
    aiScore = hasAnyEvidence ? 65 : 20;
    aiReason = hasAnyEvidence ? `Rule-based approval: evidence provided for ${typeLabel}.` : `Insufficient evidence.`;
    finalReward = hasAnyEvidence ? baseReward : 0;
  }

  return {
    approved: aiApproved,
    score: aiScore,
    darkReward: aiApproved ? Math.max(0, finalReward) : 0,
    reason: aiReason || (aiApproved ? `Approved: ${typeLabel} verified.` : `Rejected: insufficient evidence.`),
    category: typeLabel,
  };
}
