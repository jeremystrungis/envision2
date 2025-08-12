
'use client';

import AppSidebar from '@/components/app-sidebar';
import AppHeader from '@/components/app-header';
import GanttChart from '@/components/dashboard/gantt-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GanttPage() {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 p-4 sm:py-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
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
  );
}
