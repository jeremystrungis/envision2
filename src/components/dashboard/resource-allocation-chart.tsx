
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useUsers as useUsersFromHook } from '@/hooks/use-users';
import { useTasks as useTasksFromHook } from '@/hooks/use-tasks';
import { getDay, isWithinInterval, eachDayOfInterval, startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { Task, User } from '@/lib/firebase-types';
import { cn } from '@/lib/utils';


interface ResourceAllocationChartProps {
  users?: User[];
  tasks?: Task[];
  selectedDay: Date;
}

const getWorkloadColorClass = (workload: number, capacity: number) => {
    if (capacity === 0) return 'fill-muted';
    const ratio = workload / capacity;
    if (ratio === 0) return 'fill-muted';
    if (ratio < 0.5) return 'fill-sky-500';
    if (ratio < 0.9) return 'fill-green-500';
    if (ratio <= 1) return 'fill-yellow-500';
    if (ratio <= 1.2) return 'fill-orange-500';
    return 'fill-red-500';
};

const getTaskDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (date.toDate) return date.toDate();
    return new Date(date);
}


export default function ResourceAllocationChart({ users: usersProp, tasks: tasksProp, selectedDay }: ResourceAllocationChartProps) {
  const { users: usersFromHook } = useUsersFromHook();
  const { tasks: tasksFromHook } = useTasksFromHook();
  
  const users = usersProp || usersFromHook;
  const tasks = tasksProp || tasksFromHook;

  const allocationData = useMemo(() => {
    const dayToAnalyze = startOfDay(selectedDay);
    const dayOfWeek = getDay(dayToAnalyze);

    return users.map((user) => {
      // Find all tasks assigned to this user that are active on the selected day.
      const tasksOnDay = tasks.filter(task => {
          const startDate = getTaskDate(task.startDate);
          const endDate = getTaskDate(task.endDate);

          const isTaskActive = isWithinInterval(dayToAnalyze, { start: startDate, end: endDate });
          if (!isTaskActive) return false;
          
          const isAssigned = task.assignments.some(a => a.assigneeId === user.id && a.workingDays.includes(dayOfWeek));
          return isAssigned;
      });

      // Calculate the total allocated hours for the selected day from all assigned tasks.
      const allocatedHours = tasksOnDay.reduce((total, task) => {
          const assignment = task.assignments.find(a => a.assigneeId === user.id)!;
          
          const startDate = getTaskDate(task.startDate);
          const endDate = getTaskDate(task.endDate);
          
          const allDaysInInterval = eachDayOfInterval({ start: startDate, end: endDate });
          
          const workingDaysForAssignment = allDaysInInterval.filter(day => assignment.workingDays.includes(getDay(day))).length;
          
          const assignedHoursForTask = task.hours * (assignment.effort / 100);

          const dailyHours = workingDaysForAssignment > 0 ? assignedHoursForTask / workingDaysForAssignment : 0;
          
          return total + dailyHours;
      }, 0);

      return {
        name: user.name.split(' ')[0], // Use first name for brevity
        capacity: user.capacity,
        allocated: allocatedHours,
        colorClass: getWorkloadColorClass(allocatedHours, user.capacity),
      };
    });
  }, [users, tasks, selectedDay]);

  const chartConfig = {
    allocated: {
      label: 'Allocated Workload',
      color: 'hsl(var(--primary))',
    },
    capacity: {
      label: 'Daily Capacity',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <div className="overflow-x-auto">
        <ChartContainer config={chartConfig} className="h-[250px] min-w-[600px] w-full">
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
                radius={[4, 4, 0, 0]}
                name="Allocated Workload"
                >
                {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} className={cn(entry.colorClass)} />
                ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    </div>
  );
}

    