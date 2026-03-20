/**
 * Business intelligence update prompt.
 * Called after every interaction to update the intelligence record.
 */

interface IntelligenceUpdateParams {
  existingIntelligence: Record<string, unknown> | null;
  recentInteractions: Record<string, unknown>[];
  newInteractionType: string;
  newInteractionData: Record<string, unknown>;
}

export function buildIntelligenceUpdatePrompt(params: IntelligenceUpdateParams): string {
  return `You maintain Harper Automation's business intelligence records.

After each client interaction, you update the intelligence record —
reconciling new information with prior knowledge, noting contradictions,
and determining the most valuable next action Harper should take.

Be specific. Note confidence level where uncertain. Return JSON only.

════════════════════════════
EXISTING INTELLIGENCE RECORD:
${params.existingIntelligence ? JSON.stringify(params.existingIntelligence, null, 2) : 'No existing record — this is the first interaction.'}
════════════════════════════
RECENT INTERACTION HISTORY (last 10):
${params.recentInteractions.length > 0 ? JSON.stringify(params.recentInteractions, null, 2) : 'No prior interactions.'}
════════════════════════════
NEW INTERACTION (${params.newInteractionType}):
${JSON.stringify(params.newInteractionData, null, 2)}
════════════════════════════

{
  "fields_to_update": {
    // Only fields that have changed or gained new information
    // Use exact field names from business_intelligence table
  },
  "intelligence_summary": "Updated 3–4 sentence plain English summary of everything known",
  "new_interaction_summary": "2–3 sentence summary of this interaction",
  "new_intelligence_added": ["specific new thing now known"],
  "contradictions_noted": ["something that differs from prior knowledge with explanation"],
  "next_best_action": "Specific recommended next step for Harper to take with this business",
  "next_best_action_reason": "Why, based on accumulated intelligence",
  "icp_fit_score": 0,
  "priority_segment": "hot | warm | nurture | not-a-fit"
}`;
}
