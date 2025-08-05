
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useStore } from '@/lib/store';
import { eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useMemo } from 'react';

export default function ResourceAllocationChart() {
  const { users, tasks } = useStore();

  const allocationData = useMemo(() => {
    return users.map((user) => {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({start, end});

      const dailyWorkload = weekDays.map((day) => {
          const tasksOnDay = tasks.filter(
            (task) =>
              task.assigneeId === user.id &&
              day >= task.startDate && day <= task.endDate
          );
          return tasksOnDay.reduce((acc) => acc + 2, 0); // Simplified: 2 hours per task
        });
        
      const totalWeeklyHours = dailyWorkload.reduce((sum, load) => sum + load, 0);
      const allocatedHours = totalWeeklyHours / (dailyWorkload.length || 1);

      return {
        name: user.name.split(' ')[0], // Use first name for brevity
        capacity: user.capacity,
        allocated: allocatedHours,
      };
    });
  }, [users, tasks]);

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
            unit="h"
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
          name="Daily Capacity"
        />
        <Bar
          dataKey="allocated"
          fill="var(--color-allocated)"
          radius={[4, 4, 0, 0]}
          name="Current Daily Workload"
        />
      </BarChart>
    </ChartContainer>
  );
}
