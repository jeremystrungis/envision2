
'use client';

import React, { useState } from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { assessProjectRisk, ProjectRiskInput, ProjectRiskOutput } from '@/ai/flows/risk-assessment-flow';
import { AlertCircle, Bot, Cpu, Lightbulb, TriangleAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function RiskAssessmentPage() {
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
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> Risk Assessment AI Agent
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
            <div className="max-w-4xl mx-auto mt-6">
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

