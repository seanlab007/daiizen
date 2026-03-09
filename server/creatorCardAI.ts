import { invokeLLM } from "./_core/llm";

export interface SocialAccount {
  platform: string;
  handle: string;
  followers: number;
  url?: string;
}

export interface AIReviewResult {
  approved: boolean;
  score: number;
  creditLimit: number;
  cardColor: string;
  reason: string;
  totalFollowers: number;
}

function getTierFromFollowers(totalFollowers: number): { limit: number; color: string } {
  if (totalFollowers >= 2_000_000) return { limit: 10000, color: "black" };
  if (totalFollowers >= 500_000)   return { limit: 5000,  color: "platinum" };
  if (totalFollowers >= 100_000)   return { limit: 2000,  color: "gold" };
  if (totalFollowers >= 10_000)    return { limit: 500,   color: "silver" };
  return { limit: 0, color: "silver" };
}

export async function reviewCreatorCard(accounts: SocialAccount[]): Promise<AIReviewResult> {
  const totalFollowers = accounts.reduce((sum, a) => sum + (a.followers || 0), 0);
  const tier = getTierFromFollowers(totalFollowers);

  const accountsDesc = accounts.map(a =>
    `- ${a.platform}: @${a.handle}, ${a.followers.toLocaleString()} followers${a.url ? ` (${a.url})` : ""}`
  ).join("\n");

  let aiReason = "";
  let aiScore = 0;

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a KOL (Key Opinion Leader) credit analyst for Daiizen's Creator Card program.
Your job is to review influencer social media accounts and determine their creditworthiness for a content-based credit card.
The card allows influencers to purchase products on Daiizen for free, then repay by posting content about the products.
Evaluate based on: follower count, platform diversity, estimated engagement, and content quality potential.
Respond ONLY with a valid JSON object.`,
        },
        {
          role: "user",
          content: `Please review this influencer application for a Creator Card:

Social Media Accounts:
${accountsDesc}

Total Followers: ${totalFollowers.toLocaleString()}

Provide your assessment as JSON with these exact fields:
{
  "score": <integer 0-100>,
  "approved": <boolean>,
  "reason": "<brief explanation in English, max 2 sentences>",
  "engagement_quality": "<low|medium|high>",
  "recommendation": "<brief recommendation>"
}`,
        },
      ],
    });

    const content = result.choices?.[0]?.message?.content;
    if (content) {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      aiScore = Math.min(100, Math.max(0, Math.round(parsed.score ?? 50)));
      aiReason = parsed.reason ?? "";
      if (totalFollowers < 10_000) {
        return {
          approved: false,
          score: aiScore,
          creditLimit: 0,
          cardColor: "silver",
          reason: `Minimum 10,000 followers required across all platforms. Current total: ${totalFollowers.toLocaleString()}. ${aiReason}`,
          totalFollowers,
        };
      }
    }
  } catch (err) {
    console.warn("[CreatorCardAI] LLM review failed, using rule-based fallback:", err);
    aiScore = Math.min(100, Math.round((totalFollowers / 1_000_000) * 80 + accounts.length * 5));
    aiReason = `Rule-based assessment: ${totalFollowers.toLocaleString()} total followers across ${accounts.length} platform(s).`;
  }

  if (totalFollowers < 10_000) {
    return {
      approved: false,
      score: aiScore,
      creditLimit: 0,
      cardColor: "silver",
      reason: `Minimum 10,000 followers required. Current total: ${totalFollowers.toLocaleString()}.`,
      totalFollowers,
    };
  }

  return {
    approved: true,
    score: aiScore,
    creditLimit: tier.limit,
    cardColor: tier.color,
    reason: aiReason || `Approved with ${tier.color} tier. Credit limit: $${tier.limit.toLocaleString()}.`,
    totalFollowers,
  };
}

export function generateCardNumber(): string {
  const digits = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");
  return `${digits.slice(0,4)}-${digits.slice(4,8)}-${digits.slice(8,12)}-${digits.slice(12,16)}`;
}
