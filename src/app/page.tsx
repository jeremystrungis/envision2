
'use client';

import { useState, useEffect } from 'react';
import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import WorkloadHeatmap from '@/components/dashboard/workload-heatmap';
import GanttChart from '@/components/dashboard/gantt-chart';
import ResourceAllocationChart from '@/components/dashboard/resource-allocation-chart';
import ProjectStatusChart from '@/components/dashboard/project-status-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OnboardingModal from '@/components/onboarding-modal';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedEngVision');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('hasVisitedEngVision', 'true');
    }
  }, []);


  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 grid auto-rows-max gap-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Workload Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkloadHeatmap />
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resource Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResourceAllocationChart />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Project Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProjectStatusChart />
                  </CardContent>
                </Card>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Project Gantt Chart</CardTitle>
              </CardHeader>
              <CardContent>
                  <GanttChart />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
