'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { users, tasks } from '@/lib/data';

export default function ResourceAllocationChart() {
  const allocationData = users.map((user) => {
    const assignedTasks = tasks.filter((task) => task.assigneeId === user.id);
    // Simplified: assume each task takes 2 hours of work per day
    const allocatedHours = assignedTasks.length * 2;
    return {
      name: user.name.split(' ')[0], // Use first name for brevity
      capacity: user.capacity,
      allocated: allocatedHours,
    };
  });

  const chartConfig = {
    allocated: {
      label: 'Allocated',
      color: 'hsl(var(--primary))',
    },
    capacity: {
      label: 'Capacity',
      color: 'hsl(var(--muted))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart data={allocationData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
        />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar
          dataKey="capacity"
          fill="var(--color-capacity)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="allocated"
          fill="var(--color-allocated)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
