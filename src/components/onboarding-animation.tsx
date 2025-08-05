
'use client';

import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { MoreHorizontal, PlusCircle, CalendarIcon, Users, GanttChartSquare, LayoutDashboard, MousePointer, Edit, ClipboardList } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

const OnboardingAnimation = ({ step }: { step: number }) => {

  const Step1AddProject = () => (
    <div className="w-full h-full bg-muted/40 p-4 font-sans text-sm">
      <MousePointer className="h-5 w-5 text-primary absolute z-20 transition-all duration-500 animate-cursor-add-project" style={{ transformOrigin: 'top left' }}/>
      <div className="flex">
        <div className="w-20 pr-2">
          {/* Simplified Sidebar */}
          <div className="space-y-2">
            <div className="h-8 rounded-md bg-primary/20 text-primary flex items-center justify-center"><ClipboardList className="h-4 w-4"/></div>
            <div className="h-8 rounded-md hover:bg-muted flex items-center justify-center"><Users className="h-4 w-4"/></div>
            <div className="h-8 rounded-md hover:bg-muted flex items-center justify-center"><GanttChartSquare className="h-4 w-4"/></div>
            <div className="h-8 rounded-md hover:bg-muted flex items-center justify-center"><LayoutDashboard className="h-4 w-4"/></div>
          </div>
        </div>
        <div className="flex-1">
          {/* Simplified Project Page */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Manage your projects.</CardDescription>
                </div>
                <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Add New Project</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Substation Expansion</TableCell>
                    <TableCell><Badge className="bg-green-600/80">On Track</Badge></TableCell>
                    <TableCell><MoreHorizontal className="h-4 w-4" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

       {/* Simplified Dialog */}
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-dialog-add-project opacity-0">
          <Card className="w-5/6 max-w-lg">
              <CardHeader>
                  <CardTitle>Add New Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                  <div>
                      <label className="text-xs text-muted-foreground">Project Name</label>
                      <div className="w-full h-8 rounded-md border bg-background mt-1" />
                  </div>
                  <Separator />
                  <h4 className="font-semibold">Tasks</h4>
                  <div className="space-y-2">
                      <div className="w-full h-8 rounded-md border bg-background" />
                      <div className="w-full h-8 rounded-md border bg-background" />
                  </div>
                   <Button variant="outline" size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4" />Add Task</Button>
              </CardContent>
          </Card>
      </div>
    </div>
  );

  const Step2ManageTeam = () => (
    <div className="w-full h-full bg-muted/40 p-4 font-sans text-sm">
        <MousePointer className="h-5 w-5 text-primary absolute z-20 transition-all duration-500 animate-cursor-manage-team" style={{ transformOrigin: 'top left' }}/>
        <div className="flex">
            <div className="w-20 pr-2">
                {/* Simplified Sidebar */}
                <div className="space-y-2">
                    <div className="h-8 rounded-md hover:bg-muted flex items-center justify-center"><ClipboardList className="h-4 w-4"/></div>
                    <div className="h-8 rounded-md bg-primary/20 text-primary flex items-center justify-center"><Users className="h-4 w-4"/></div>
                    <div className="h-8 rounded-md hover:bg-muted flex items-center justify-center"><GanttChartSquare className="h-4 w-4"/></div>
                    <div className="h-8 rounded-md hover:bg-muted flex items-center justify-center"><LayoutDashboard className="h-4 w-4"/></div>
                </div>
            </div>
            <div className="flex-1">
                {/* Simplified Teams Page */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>Manage your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Team</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6"><AvatarFallback>A</AvatarFallback></Avatar>
                                        <span>Alice Johnson</span>
                                    </TableCell>
                                    <TableCell>System Planning</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
        {/* Simplified Edit Dialog */}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-dialog-manage-team opacity-0">
          <Card className="w-5/6 max-w-md">
              <CardHeader><CardTitle>Edit Member</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                  <div>
                      <label className="text-xs text-muted-foreground">Name</label>
                      <div className="w-full h-8 rounded-md border bg-background mt-1 flex items-center px-2">Alice Johnson</div>
                  </div>
                  <div>
                      <label className="text-xs text-muted-foreground">Team</label>
                      <div className="w-full h-8 rounded-md border bg-background mt-1 flex items-center px-2">System Planning</div>
                  </div>
                   <div>
                      <label className="text-xs text-muted-foreground">New Team Name</label>
                      <div className="w-full h-8 rounded-md border bg-background mt-1" />
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );

  const Step3ScheduleGantt = () => (
    <div className="w-full h-full bg-muted/40 p-4 font-sans text-sm relative overflow-hidden">
        <MousePointer className="h-5 w-5 text-primary absolute z-30 transition-all duration-500 animate-cursor-gantt" style={{ transformOrigin: 'top left' }}/>
        <div className="w-full h-full">
            <div className="font-semibold text-muted-foreground mb-2">Project Gantt Chart</div>
            {/* Timeline Header */}
            <div className="flex bg-muted/50 text-xs">
                {Array.from({length: 10}).map((_, i) => <div key={i} className="flex-1 text-center border-r py-1">{i+1}</div>)}
            </div>
            {/* Task Area */}
            <div className="mt-2 space-y-2 relative">
                <div className="h-6 w-20 bg-primary/80 rounded absolute left-4 top-2 z-10 text-white text-xs px-1 flex items-center">Task A</div>
                <div className="h-6 bg-primary/80 rounded absolute left-8 top-10 z-10 text-white text-xs px-1 flex items-center animate-task-gantt">Task B</div>
                <div className="h-6 w-24 bg-primary/80 rounded absolute left-12 top-20 z-10 text-white text-xs px-1 flex items-center">Task C</div>
                
                {/* Dependency Line */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none animate-dep-gantt opacity-0 z-20">
                    <path d="M 112 48 L 122 48 L 122 88 L 136 88" stroke="hsl(var(--accent-foreground))" strokeWidth="1.5" fill="none" />
                    <path d="M 131 84 L 136 88 L 131 92" stroke="hsl(var(--accent-foreground))" fill="none" strokeWidth="1.5" />
                </svg>
            </div>
        </div>
    </div>
  );

  const Step4Dashboard = () => (
      <div className="w-full h-full bg-muted/40 p-4 font-sans text-sm overflow-hidden">
        <MousePointer className="h-5 w-5 text-primary absolute z-20 transition-all duration-500 animate-cursor-dashboard" style={{ transformOrigin: 'top left' }}/>
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                <Card>
                    <CardHeader><CardTitle className="text-base">Workload Heatmap</CardTitle></CardHeader>
                    <CardContent className="h-24">
                       <div className="grid grid-cols-6 gap-px">
                            <div className="text-xs h-4 bg-muted/50 col-span-1"></div>
                            <div className="text-xs h-4 bg-muted/50 text-center">M</div>
                            <div className="text-xs h-4 bg-muted/50 text-center">T</div>
                            <div className="text-xs h-4 bg-muted/50 text-center">W</div>
                            <div className="text-xs h-4 bg-muted/50 text-center">T</div>
                            <div className="text-xs h-4 bg-muted/50 text-center">F</div>

                            <div className="text-xs h-4 flex items-center">Alice</div>
                            <div className="h-4 bg-green-500/20 border border-green-500/30"></div>
                            <div className="h-4 bg-green-500/20 border border-green-500/30"></div>
                            <div className="h-4 bg-yellow-500/20 border border-yellow-500/30"></div>
                            <div className="h-4 bg-green-500/20 border border-green-500/30"></div>
                            <div className="h-4 bg-sky-500/20 border border-sky-500/30"></div>

                             <div className="text-xs h-4 flex items-center">Bob</div>
                            <div className="h-4 bg-red-500/20 border border-red-500/30"></div>
                            <div className="h-4 bg-orange-500/20 border border-orange-500/30"></div>
                            <div className="h-4 bg-red-500/20 border border-red-500/30"></div>
                            <div className="h-4 bg-yellow-500/20 border border-yellow-500/30"></div>
                            <div className="h-4 bg-yellow-500/20 border border-yellow-500/30"></div>
                       </div>
                    </CardContent>
                </Card>
            </div>
            <div className="col-span-1 space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-base">Project Status</CardTitle></CardHeader>
                    <CardContent className="h-10 p-2">
                      <div className="flex w-full h-3 rounded-full overflow-hidden">
                        <div className="w-1/2 bg-green-500/80"></div>
                        <div className="w-1/4 bg-yellow-500/80"></div>
                        <div className="w-1/4 bg-red-500/80"></div>
                      </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle className="text-base">Allocation</CardTitle></CardHeader>
                    <CardContent className="h-10 p-2 flex items-end gap-1">
                      <div className="w-1/4 h-full bg-muted rounded-t-sm">
                        <div className="h-1/2 w-full bg-primary rounded-t-sm"></div>
                      </div>
                      <div className="w-1/4 h-3/4 bg-muted rounded-t-sm">
                        <div className="h-full w-full bg-primary rounded-t-sm"></div>
                      </div>
                      <div className="w-1/4 h-full bg-muted rounded-t-sm">
                         <div className="h-1/4 w-full bg-primary rounded-t-sm"></div>
                      </div>
                      <div className="w-1/4 h-1/2 bg-muted rounded-t-sm">
                         <div className="h-full w-full bg-primary rounded-t-sm"></div>
                      </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
  );

  switch (step) {
    case 0:
      return <Step1AddProject />;
    case 1:
      return <Step2ManageTeam />;
    case 2:
      return <Step3ScheduleGantt />;
    case 3:
      return <Step4Dashboard />;
    default:
      return <div>No Animation</div>;
  }
};

export default OnboardingAnimation;
