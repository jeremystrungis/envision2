
'use client';

import { Pie, PieChart, Tooltip, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { projects } from '@/lib/data';
import { useMemo } from 'react';

export default function ProjectStatusChart() {
  const chartData = useMemo(() => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(statusCounts).map((status) => ({
      status,
      count: statusCounts[status],
    }));
  }, []);

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
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px]"
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
          innerRadius={60}
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
  );
}
