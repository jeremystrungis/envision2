
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useUsers as useUsersFromHook } from '@/hooks/use-users';
import { useTasks as useTasksFromHook } from '@/hooks/use-tasks';
import { getDay, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { useMemo } from 'react';
import { Task, User } from '@/lib/firebase-types';

interface ResourceAllocationChartProps {
  users?: User[];
  tasks?: Task[];
}

export default function ResourceAllocationChart({ users: usersProp, tasks: tasksProp }: ResourceAllocationChartProps) {
  const { users: usersFromHook } = useUsersFromHook();
  const { tasks: tasksFromHook } = useTasksFromHook();
  
  const users = usersProp || usersFromHook;
  const tasks = tasksProp || tasksFromHook;

  const getTaskDate = (date: any) => {
      if (!date) return new Date();
      return date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  }

  const allocationData = useMemo(() => {
    const today = new Date();
    const todayDay = getDay(today);

    return users.map((user) => {
      // Find all tasks assigned to this user that are active today.
      const tasksToday = tasks.filter(task => {
          const startDate = getTaskDate(task.startDate);
          const endDate = getTaskDate(task.endDate);

          const isTaskActive = isWithinInterval(today, { start: startDate, end: endDate });
          if (!isTaskActive) return false;
          
          const isAssigned = task.assignments.some(a => a.assigneeId === user.id && a.workingDays.includes(todayDay));
          return isAssigned;
      });

      // Calculate the total allocated hours for today from all assigned tasks.
      const allocatedHoursToday = tasksToday.reduce((total, task) => {
          const assignment = task.assignments.find(a => a.assigneeId === user.id);
          if (!assignment) return total;
          
          const startDate = getTaskDate(task.startDate);
          const endDate = getTaskDate(task.endDate);
          
          // Get all days in the task's date range
          const allDaysInInterval = eachDayOfInterval({ start: startDate, end: endDate });
          
          // Filter to get only the days the user is scheduled to work
          const workingDaysInInterval = allDaysInInterval.filter(day => assignment.workingDays.includes(getDay(day))).length;
          
          // Calculate the total hours assigned to this user for this task
          const assignedHoursForTask = task.hours * (assignment.effort / 100);

          // Calculate the average daily hours based on their specific working days
          const dailyHours = workingDaysInInterval > 0 ? assignedHoursForTask / workingDaysInInterval : 0;
          
          return total + dailyHours;
      }, 0);

      return {
        name: user.name.split(' ')[0], // Use first name for brevity
        capacity: user.capacity,
        allocated: allocatedHoursToday,
      };
    });
  }, [users, tasks]);

  const chartConfig = {
    allocated: {
      label: 'Allocated Today',
      color: 'hsl(var(--primary))',
    },
    capacity: {
      label: 'Daily Capacity',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart data={allocationData} accessibilityLayer barGap={4}>
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
