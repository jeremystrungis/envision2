
'use client';

import { Pie, PieChart, Tooltip, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { useStore } from '@/lib/store';
import { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { CardDescription } from '../ui/card';

export default function ProjectStatusChart() {
  const { projects } = useStore();
  
  const chartData = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(statusCounts).map((status) => ({
      status,
      count: statusCounts[status],
    }));
  }, [projects]);

  const chartConfig = {
    count: {
      label: 'Projects',
    },
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
        <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-[200px]"
        >
            <PieChart>
                <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="status" />}
                />
                <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={50}
                strokeWidth={5}
                >
                {chartData.map((entry) => (
                    <Cell
                    key={entry.status}
                    fill={chartConfig[entry.status as keyof typeof chartConfig]?.color}
                    />
                ))}
                </Pie>
                <ChartLegend
                content={<ChartLegendContent nameKey="status" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
            </PieChart>
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
