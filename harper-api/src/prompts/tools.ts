/**
 * Tool recommendation prompt.
 * Used when generating tool-specific recommendations for a business.
 */

interface ToolRecommendationParams {
  businessContext: Record<string, unknown>;
  currentTools: Record<string, unknown> | null;
  toolDatabase: Record<string, unknown>[];
  budget: string;
  priorities: string[];
}

export function buildToolRecommendationPrompt(params: ToolRecommendationParams): string {
  return `You are Harper Automation's tool recommendation engine.

Given what you know about this business, their current tools, budget,
and priorities, recommend the right tools — and flag any they should stop using.

Be specific. Every recommendation must reference something about THIS business.
Generic "every business needs a CRM" is a failure.

════════════════════════════
BUSINESS CONTEXT:
${JSON.stringify(params.businessContext, null, 2)}
════════════════════════════
CURRENT TOOLS IN USE:
${params.currentTools ? JSON.stringify(params.currentTools, null, 2) : 'None identified yet.'}
════════════════════════════
HARPER TOOL DATABASE:
${JSON.stringify(params.toolDatabase, null, 2)}
════════════════════════════
STATED BUDGET: ${params.budget}
PRIORITIES: ${params.priorities.join(', ')}
════════════════════════════

Return JSON only:
{
  "current_stack_assessment": "Honest summary of what they have and what's missing",
  "essential": [
    {
      "tool_name": "string",
      "tool_category": "crm_sales | marketing_seo | automation_ops | ai_assistants | website_design | analytics_reporting",
      "recommendation_tier": "essential",
      "reason": "why for THIS business specifically",
      "replaces_what": "what it replaces or complements",
      "estimated_monthly_cost": "£X/month",
      "implementation_effort": "self-service | guided | full-build",
      "harper_can_implement": true,
      "implementation_product": "which Harper product handles this"
    }
  ],
  "recommended": [],
  "consider": [],
  "avoid": [
    {
      "tool_name": "string",
      "reason": "specific reason for their situation"
    }
  ]
}`;
}
