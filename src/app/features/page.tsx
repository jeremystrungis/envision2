
'use client';

import React from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, ClipboardList, GanttChartSquare, LayoutDashboard, TriangleAlert, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Centralized Dashboard',
    description: 'Get a real-time, at-a-glance overview of your entire project landscape. The dashboard is the command center for monitoring project health, resource allocation, and team workload.',
    subFeatures: [
      { title: 'Workload Heatmap', text: 'Visualize weekly workload distribution across team members to prevent burnout and identify underutilized resources. Filter by team for a more focused view.' },
      { title: 'Resource Allocation Chart', text: 'Compare each team member\'s allocated daily workload against their total capacity, ensuring balanced and realistic assignments.' },
      { title: 'Project Status Overview', text: 'Instantly see the health of all projects with a clear breakdown of which are "On Track", "At Risk", or "Off Track".' },
      { title: 'High-Level Gantt Chart', text: 'A compact Gantt view provides a quick look at the timeline for any selected project directly from the dashboard.' },
    ],
  },
  {
    icon: ClipboardList,
    title: 'Project Management',
    description: 'A dedicated space to create, view, and manage all your engineering projects from initiation to completion.',
    subFeatures: [
        { title: 'Project List', text: 'All projects are listed with their current status badge, providing a clear and immediate sense of their condition.' },
        { title: 'Add New Project', text: 'A streamlined dialog allows you to define a new project and add its initial list of tasks, assignees, and dates all in one go.' },
        { title: 'Detailed Project View', text: 'Click on any project to see its dedicated page, listing all associated tasks, their assignees, and start/end dates.' },
        { title: 'Task Management', text: 'Within a project, you can add new tasks, edit existing ones, reassign them to different team members, or delete them as needed.' },
    ],
  },
  {
    icon: Users,
    title: 'Team & Resource Management',
    description: 'Organize your engineering teams and manage individual member details to ensure accurate resource planning.',
    subFeatures: [
        { title: 'Team Member Hub', text: 'View all team members, their assigned team, and their daily work capacity (in hours).' },
        { title: 'Edit Member Details', text: 'Update a team member\'s name, avatar, capacity, or move them to a different team.' },
        { title: 'Dynamic Team Creation', text: 'Create new teams on the fly directly from the "Edit Member" dialog, providing flexibility as your organization grows.' },
    ],
  },
  {
    icon: GanttChartSquare,
    title: 'Advanced Gantt Charting',
    description: 'A powerful, full-page Gantt chart for detailed project scheduling and dependency management.',
    subFeatures: [
        { title: 'Visual Timelines', text: 'Tasks are plotted on a timeline, showing their duration and position relative to other tasks.' },
        { title: 'Dependency Mapping', text: 'Draw and visualize dependencies between tasks to understand critical paths and potential bottlenecks.' },
        { title: 'Today Marker', text: 'A clear line indicates the current day, giving you immediate context for project progress.' },
        { title: 'Isolated Scrolling', text: 'The Gantt chart has its own horizontal scrollbar, ensuring that long-running projects don\'t disrupt the main application layout.' },
    ],
  },
  {
    icon: Bot,
    title: 'AI-Powered Risk Assessment',
    description: 'Leverage generative AI to proactively identify and mitigate potential risks in your project plans.',
    subFeatures: [
        { title: 'AI Agent Analysis', text: 'Submit a project description and a plan document (e.g., .txt, .pdf) to our specialized AI agent.' },
        { title: 'Detailed Risk Breakdown', text: 'The AI analyzes the documents and returns a list of potential risks related to schedule, budget, resources, and technical challenges.' },
        { title: 'Actionable Mitigation Strategies', text: 'For each identified risk, the AI provides a concrete mitigation strategy, its likelihood, and its potential impact on the project.' },
        { title: 'Overall Summary', text: 'Receive a high-level summary of the project\'s overall risk profile to inform strategic decisions.' },
    ],
  },
];


export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">
                        ENTRUST PMvision Features
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground">A comprehensive suite of tools for engineering project and resource management.</p>
                </div>

                <div className="space-y-10">
                    {features.map((feature) => (
                    <Card key={feature.title} className="overflow-hidden">
                        <CardHeader className="bg-background/50">
                            <div className="flex items-start gap-4">
                                <feature.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription className="mt-1">{feature.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {feature.subFeatures.map((sub, index) => (
                                <React.Fragment key={sub.title}>
                                    <div className="flex items-start gap-4">
                                        <div className="h-5 flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-primary/50" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{sub.title}</h4>
                                            <p className="text-sm text-muted-foreground">{sub.text}</p>
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))}
                        </CardContent>
                    </Card>
                    ))}
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
