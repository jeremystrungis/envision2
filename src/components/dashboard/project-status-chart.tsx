
'use client';

import { Bar, BarChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useStore } from '@/lib/store';
import { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { CardDescription } from '../ui/card';

export default function ProjectStatusChart() {
  const { projects } = useStore();
  
  const { chartData, totalProjects } = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const data = [{
        name: 'status',
        'On Track': statusCounts['On Track'] || 0,
        'At Risk': statusCounts['At Risk'] || 0,
        'Off Track': statusCounts['Off Track'] || 0,
    }];

    return { chartData: data, totalProjects: projects.length };
  }, [projects]);

  const chartConfig = {
    'On Track': {
      label: 'On Track',
      color: 'hsl(var(--chart-2))',
    },
    'At Risk': {
      label: 'At Risk',
      color: 'hsl(var(--chart-4))',
    },
    'Off Track': {
      label: 'Off Track',
      color: 'hsl(var(--chart-5))',
    },
  };

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[50px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            stackOffset="expand"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                   const total = payload.reduce((sum, item) => sum + (item.value as number), 0);
                   return (
                    <div className="min-w-[8rem] rounded-lg border bg-background p-2 text-xs shadow-sm">
                      <div className="grid gap-1.5">
                        {payload.map((item) => (
                           <div key={item.dataKey} className="flex items-center gap-2">
                             <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: item.color}}/>
                             <div className="flex flex-1 justify-between">
                               <span>{chartConfig[item.dataKey as keyof typeof chartConfig].label}</span>
                               <span>{item.value} ({total > 0 ? Math.round(((item.value as number) / totalProjects) * 100) : 0}%)</span>
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                   )
                }
                return null
              }}
            />
            <Bar dataKey="On Track" stackId="a" fill="var(--color-On Track)" radius={[4, 0, 0, 4]} />
            <Bar dataKey="At Risk" stackId="a" fill="var(--color-At Risk)" radius={0} />
            <Bar dataKey="Off Track" stackId="a" fill="var(--color-Off Track)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="mt-4 space-y-2">
            <CardDescription>Individual Project Status</CardDescription>
            <ul className="divide-y divide-border rounded-md border">
                {projects.map(project => (
                    <li key={project.id} className="flex items-center justify-between p-2">
                        <span className="text-sm font-medium">{project.name}</span>
                        <Badge
                            variant={project.status === 'On Track' ? 'default' : project.status === 'At Risk' ? 'secondary' : 'destructive'}
                            className={cn(
                                'text-xs',
                                project.status === 'On Track' && 'bg-green-600/80',
                                project.status === 'At Risk' && 'bg-yellow-600/80',
                                project.status === 'Off Track' && 'bg-red-600/80',
                            )}
                        >
                            {project.status}
                        </Badge>
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
}
