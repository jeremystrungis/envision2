
'use client';

import React, { useState, useEffect } from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assessProjectRisk, ProjectRiskInput, ProjectRiskOutput } from '@/ai/flows/risk-assessment-flow';
import { assessPortfolioHealth, PortfolioHealthInput, PortfolioHealthOutput } from '@/ai/flows/portfolio-health-flow';
import { AlertCircle, Bot, Cpu, Lightbulb, TriangleAlert, Users, GanttChartSquare, Package, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useUsers } from '@/hooks/use-users';

function ProjectPlanAnalyzer() {
  const [projectDescription, setProjectDescription] = useState('');
  const [projectPlanFile, setProjectPlanFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<ProjectRiskOutput | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setProjectPlanFile(event.target.files[0]);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!projectDescription || !projectPlanFile) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a project description and a plan file.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAssessmentResult(null);

    try {
      const projectPlanDataUri = await fileToDataUri(projectPlanFile);
      const input: ProjectRiskInput = { projectDescription, projectPlanDataUri };
      const result = await assessProjectRisk(input);
      setAssessmentResult(result);
    } catch (error) {
      console.error('Risk assessment failed:', error);
      toast({
        title: 'Assessment Failed',
        description: 'The AI agent could not complete the risk assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

   const getBadgeClass = (level: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High') => {
    switch (level) {
        case 'Very Low': return 'bg-sky-600/80';
        case 'Low': return 'bg-green-600/80';
        case 'Medium': return 'bg-yellow-600/80 text-foreground';
        case 'High': return 'bg-orange-600/80';
        case 'Very High': return 'bg-red-600/80';
        default: return 'bg-muted';
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Analyze a Project Plan
          </CardTitle>
          <CardDescription>
            Provide a project description and upload a plan file (e.g., .txt, .md, .pdf) for an AI-powered risk analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="project-description">Project Description</Label>
              <Textarea
                id="project-description"
                placeholder="Describe your project, its goals, and key deliverables..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={4}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-plan">Project Plan File</Label>
              <Input
                id="project-plan"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Cpu className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Risks...
                </>
              ) : (
                'Assess Project Risks'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {assessmentResult && (
        <Card>
            <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TriangleAlert /> Assessment Results
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Overall Risk Summary</AlertTitle>
                    <AlertDescription>{assessmentResult.overallRiskSummary}</AlertDescription>
                </Alert>
                <Separator />
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Identified Risks & Mitigations</h3>
                      {assessmentResult.risks.map((item, index) => (
                        <Card key={index} className="bg-background/50">
                            <CardHeader>
                                <CardTitle className="text-base">{item.risk}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-4 items-center">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Likelihood</h4>
                                        <Badge className={cn('text-xs', getBadgeClass(item.likelihood))}>{item.likelihood}</Badge>
                                    </div>
                                      <div>
                                        <h4 className="text-sm font-semibold mb-1">Impact</h4>
                                        <Badge className={cn('text-xs', getBadgeClass(item.impact))}>{item.impact}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-1"><Lightbulb /> Mitigation Strategy</h4>
                                    <p className="text-sm text-muted-foreground">{item.mitigation}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

function PortfolioHealthAnalyzer() {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { users } = useUsers();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<PortfolioHealthOutput | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const analyze = async () => {
      // Only run analysis if we have all data points.
      if (projects.length === 0 || tasks.length === 0 || users.length === 0) {
        setIsLoading(false);
        setResult(null);
        return;
      }

      setIsLoading(true);
      try {
        const input: PortfolioHealthInput = {
            projects: projects.map(p => ({...p})),
            tasks: tasks.map(t => ({
                ...t,
                startDate: t.startDate.toDate().toISOString(),
                endDate: t.endDate.toDate().toISOString(),
                assigneeIds: t.assignments.map(a => a.assigneeId)
            })),
            users: users.map(u => ({...u, team: u.teams ? u.teams.join(', ') : ''}))
        };
        const analysisResult = await assessPortfolioHealth(input);
        setResult(analysisResult);
      } catch (error) {
        console.error("Portfolio health assessment failed:", error);
        toast({
          title: "Analysis Failed",
          description: "The AI agent could not complete the portfolio analysis.",
          variant: "destructive",
        });
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    analyze();

  }, [projects, tasks, users, toast]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Portfolio Health Analysis</CardTitle>
                <CardDescription>The AI agent is analyzing the entire portfolio for systemic risks and opportunities...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-32 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (!result) {
    return (
        <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Data for Analysis</AlertTitle>
            <AlertDescription>Add projects, tasks, and users to enable the portfolio health analysis.</AlertDescription>
        </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Health Analysis</CardTitle>
        <CardDescription>A real-time, AI-driven analysis of your entire project portfolio, automatically updated when data changes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Alert>
          <Package className="h-4 w-4" />
          <AlertTitle>Overall Portfolio Summary</AlertTitle>
          <AlertDescription>{result.overallSummary}</AlertDescription>
        </Alert>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="text-destructive"/> Resource Hotspots</h3>
            {result.resourceHotspots.length > 0 ? (
                result.resourceHotspots.map((item, index) => (
                    <Card key={index} className="bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-base">{item.userName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{item.hotspotDescription}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <p className="text-sm text-muted-foreground">No significant resource hotspots identified. Allocation appears balanced.</p>
            )}
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><GanttChartSquare className="text-orange-500" /> Schedule Conflicts & Bottlenecks</h3>
             {result.scheduleConflicts.length > 0 ? (
                result.scheduleConflicts.map((item, index) => (
                    <Card key={index} className="bg-orange-500/5">
                         <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">{item.conflictDescription}</p>
                        </CardContent>
                    </Card>
                ))
             ) : (
                <p className="text-sm text-muted-foreground">No major cross-project schedule conflicts detected.</p>
             )}
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Lightbulb className="text-primary"/> Strategic Recommendations</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {result.strategicRecommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>

      </CardContent>
    </Card>
  );
}


export default function RiskAssessmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
             <div className="mb-6 text-center">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">
                        Risk & Portfolio Analysis
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">Leverage AI to analyze individual plans or assess overall portfolio health.</p>
            </div>
            <Tabs defaultValue="portfolio">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="portfolio">
                  <Bot className="mr-2" /> Portfolio Health Analysis
                </TabsTrigger>
                <TabsTrigger value="project">
                  <Cpu className="mr-2" /> Project Plan Analyzer
                </TabsTrigger>
              </TabsList>
              <TabsContent value="portfolio" className="mt-6">
                <PortfolioHealthAnalyzer />
              </TabsContent>
              <TabsContent value="project" className="mt-6">
                <ProjectPlanAnalyzer />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
