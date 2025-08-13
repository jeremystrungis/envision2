
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useStore } from '@/lib/store';
import { eachDayOfInterval, startOfWeek, endOfWeek, differenceInBusinessDays, getDay } from 'date-fns';
import { useMemo } from 'react';

export default function ResourceAllocationChart() {
  const { users, tasks } = useStore();

  const allocationData = useMemo(() => {
    return users.map((user) => {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const end = endOfWeek(today, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({start, end});

      let totalWeeklyHours = 0;
      let workingDaysCount = 0;

      weekDays.forEach(day => {
        const dayOfWeek = getDay(day);
        const tasksOnDay = tasks.filter(task =>
          task.assignments.some(a => a.assigneeId === user.id && a.workingDays.includes(dayOfWeek)) &&
          day >= task.startDate && day <= task.endDate
        );

        if (tasksOnDay.length > 0) {
            workingDaysCount++;
        }
        
        const dailyLoad = tasksOnDay.reduce((acc, task) => {
            const assignment = task.assignments.find(a => a.assigneeId === user.id)!;
            const taskWorkDays = assignment.workingDays.length;
            const dailyHours = task.hours > 0 && taskWorkDays > 0 ? task.hours / taskWorkDays : 0;
            return acc + dailyHours;
        }, 0);
        
        totalWeeklyHours += dailyLoad;
      });
      
      const allocatedHours = workingDaysCount > 0 ? totalWeeklyHours / workingDaysCount : 0;

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
