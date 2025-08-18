
'use server';
/**
 * @fileOverview A portfolio-level project, task, and resource analysis AI agent.
 *
 * - assessPortfolioHealth - A function that handles the portfolio health assessment.
 * - PortfolioHealthInput - The input type for the assessPortfolioHealth function.
 * - PortfolioHealthOutput - The return type for the assessPortfolioHealth function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { differenceInBusinessDays } from 'date-fns';

// Define Zod schemas that match the data structures
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  capacity: z.number().describe('Hours per day'),
});

const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectId: z.string(),
  assigneeIds: z.array(z.string()),
  startDate: z.string().describe('The start date of the task in ISO format.'),
  endDate: z.string().describe('The end date of the task in ISO format.'),
  hours: z.number().describe('The total estimated hours for the task.'),
});

const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
});


const PortfolioHealthInputSchema = z.object({
  projects: z.array(ProjectSchema),
  tasks: z.array(TaskSchema),
  users: z.array(UserSchema),
});
export type PortfolioHealthInput = z.infer<typeof PortfolioHealthInputSchema>;


const PortfolioHealthOutputSchema = z.object({
  overallSummary: z.string().describe("A brief, high-level summary of the portfolio's health, mentioning key strengths and weaknesses."),
  resourceHotspots: z.array(z.object({
    userName: z.string(),
    hotspotDescription: z.string().describe("A description of why this user is a hotspot, mentioning their workload vs. capacity and the projects they are involved in."),
  })).describe("A list of team members who are significantly overloaded or are critical dependencies for multiple projects."),
  scheduleConflicts: z.array(z.object({
    conflictDescription: z.string().describe("A description of the schedule conflict, mentioning the tasks and projects involved and the nature of the conflict (e.g., dependency issues, resource clashes)."),
  })).describe("A list of potential cross-project schedule conflicts or major bottleneck tasks."),
  strategicRecommendations: z.array(z.string().describe("A concrete, actionable recommendation to improve portfolio health.")).describe("A list of high-level strategic recommendations for the project manager to consider."),
});
export type PortfolioHealthOutput = z.infer<typeof PortfolioHealthOutputSchema>;


export async function assessPortfolioHealth(input: PortfolioHealthInput): Promise<PortfolioHealthOutput> {
  return await portfolioHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'portfolioHealthPrompt',
  input: { schema: PortfolioHealthInputSchema },
  output: { schema: PortfolioHealthOutputSchema },
  prompt: `You are an expert Program Manager overseeing a portfolio of complex engineering projects. Your task is to conduct a holistic risk and health assessment of the entire portfolio based on the provided data. The current date is ${new Date().toISOString()}.

Analyze the projects, tasks, and team members to identify systemic risks, resource contention, and potential bottlenecks. The daily hour commitment for a task is its total hours divided by the number of business days in its duration. Dates are provided in ISO 8601 format.

- Project Data: {{{json projects}}}
- Task Data: {{{json tasks}}}
- Team & Resource Data: {{{json users}}}

Your analysis should focus on the following areas:

1.  **Resource Hotspots:** Identify team members who are overloaded (their total daily hour commitment from all assigned tasks exceeds their daily capacity) or who represent a single point of failure (critical path for multiple high-priority projects).
2.  **Schedule Conflicts:** Look for cross-project dependencies, tasks that are likely to be delayed due to resource constraints, and potential bottlenecks that could impact the entire portfolio.
3.  **Overall Summary:** Provide a high-level executive summary of the portfolio's health.
4.  **Strategic Recommendations:** Offer concrete, actionable advice for the project manager to de-risk the portfolio and improve overall health.

Structure your entire response according to the output schema.
`,
});

const portfolioHealthFlow = ai.defineFlow(
  {
    name: 'portfolioHealthFlow',
    inputSchema: PortfolioHealthInputSchema,
    outputSchema: PortfolioHealthOutputSchema,
  },
  async (input) => {

    const augmentedInput = {
        ...input,
        tasks: input.tasks.map(task => {
            const startDate = new Date(task.startDate);
            const endDate = new Date(task.endDate);
            const duration = differenceInBusinessDays(endDate, startDate) + 1;
            const dailyHours = duration > 0 ? task.hours / duration : task.hours;
            return {...task, dailyHours};
        })
    };

    const { output } = await prompt(augmentedInput);
    return output!;
  }
);
