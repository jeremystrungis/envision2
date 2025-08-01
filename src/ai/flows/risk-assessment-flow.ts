'use server';
/**
 * @fileOverview A project risk assessment AI agent.
 *
 * - assessProjectRisk - A function that handles the project risk assessment process.
 * - ProjectRiskInput - The input type for the assessProjectRisk function.
 * - ProjectRiskOutput - The return type for the assessProjectRisk function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProjectRiskInputSchema = z.object({
  projectDescription: z.string().describe('A general description of the project.'),
  projectPlanDataUri: z
    .string()
    .describe(
      "The project plan file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProjectRiskInput = z.infer<typeof ProjectRiskInputSchema>;

const RiskItemSchema = z.object({
    risk: z.string().describe('A concise description of a single potential risk.'),
    likelihood: z.enum(['Very Low', 'Low', 'Medium', 'High', 'Very High']).describe('The estimated likelihood of the risk occurring.'),
    impact: z.enum(['Very Low', 'Low', 'Medium', 'High', 'Very High']).describe('The potential impact on the project if the risk occurs.'),
    mitigation: z.string().describe('A concrete, actionable step to mitigate this specific risk.'),
});

const ProjectRiskOutputSchema = z.object({
  overallRiskSummary: z.string().describe('A brief, high-level summary of the overall project risk profile.'),
  risks: z.array(RiskItemSchema).describe('A detailed list of identified potential risks and their mitigation strategies.'),
});
export type ProjectRiskOutput = z.infer<typeof ProjectRiskOutputSchema>;


export async function assessProjectRisk(input: ProjectRiskInput): Promise<ProjectRiskOutput> {
  return await riskAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riskAssessmentPrompt',
  input: { schema: ProjectRiskInputSchema },
  output: { schema: ProjectRiskOutputSchema },
  prompt: `You are an expert project manager with 20 years of experience in the power engineering industry. Your task is to conduct a detailed risk assessment based on the provided project description and project plan.

Analyze the following project information:
- Description: {{{projectDescription}}}
- Plan Document: {{media url=projectPlanDataUri}}

Identify potential risks related to schedule, budget, resources, technical challenges, and external dependencies. For each risk you identify, provide its likelihood, its potential impact, and a concrete, actionable mitigation strategy.

Finally, provide a high-level summary of the project's overall risk profile. Structure your entire response according to the output schema.
`,
});

const riskAssessmentFlow = ai.defineFlow(
  {
    name: 'riskAssessmentFlow',
    inputSchema: ProjectRiskInputSchema,
    outputSchema: ProjectRiskOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    // The prompt is powerful enough to handle this in one step.
    // In a more complex scenario, we could add more logic here,
    // like calling other tools or services.
    return output!;
  }
);
