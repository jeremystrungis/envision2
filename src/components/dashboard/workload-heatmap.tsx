
'use client';

import React, { useState, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addDays,
  getDay,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { User, Task } from '@/lib/data';
import { useStore } from '@/lib/store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


const workloadLevels = [
    { level: 'Light', color: 'bg-sky-500/20 border-sky-500/30', description: '< 50%' },
    { level: 'Good', color: 'bg-green-500/20 border-green-500/30', description: '50-90%' },
    { level: 'High', color: 'bg-yellow-500/20 border-yellow-500/30', description: '90-100%' },
    { level: 'Overloaded', color: 'bg-orange-500/20 border-orange-500/30', description: '100-120%' },
    { level: 'Critically Overloaded', color: 'bg-red-500/20 border-red-500/30', description: '> 120%' },
];

type ViewMode = 'week' | 'month' | '3-month' | '12-month';

export default function WorkloadHeatmap() {
  const { users, tasks } = useStore();
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const { dateInterval, columns, title } = useMemo(() => {
    let start: Date, end: Date;
    let title: string;
    switch(viewMode) {
      case 'month':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        title = format(currentDate, 'MMMM yyyy');
        return { dateInterval: eachDayOfInterval({start, end}), columns: [], title};
      case '3-month':
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(addMonths(currentDate, 2), { weekStartsOn: 1 });
        title = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        return { dateInterval: [], columns: eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }), title };
      case '12-month':
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(addMonths(currentDate, 11), { weekStartsOn: 1 });
        title = `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
        return { dateInterval: [], columns: eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }), title };
      case 'week':
      default:
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
        title = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        const weekDays = eachDayOfInterval({start, end}).filter(day => getDay(day) >= 1 && getDay(day) <= 5);
        return { dateInterval: weekDays, columns: [], title};
    }
  }, [currentDate, viewMode]);

  const teams = useMemo(() => {
    const allTeams = new Set(users.map(user => user.team));
    return ['All', ...Array.from(allTeams)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (selectedTeam === 'All') return users;
    return users.filter((user) => user.team === selectedTeam);
  }, [selectedTeam, users]);

  const getWorkloadForDate = (user: User, date: Date): number => {
      const dayOfWeek = getDay(date);
      const tasksOnDay = tasks.filter(task =>
          task.assignments.some(a => a.assigneeId === user.id && a.workingDays.includes(dayOfWeek)) &&
          date >= task.startDate && date <= task.endDate
      );

      return tasksOnDay.reduce((acc, task) => {
          const assignment = task.assignments.find(a => a.assigneeId === user.id)!;
          const taskWorkDays = assignment.workingDays.length;
          const assignedHours = task.hours * (assignment.effort / 100);
          const dailyHours = taskWorkDays > 0 ? assignedHours / taskWorkDays : 0;
          return acc + dailyHours;
      }, 0);
  };
  
  const getAverageWorkloadForInterval = (user: User, interval: Date[]): number => {
    if (interval.length === 0) return 0;
    const totalWorkload = interval.reduce((sum, day) => sum + getWorkloadForDate(user, day), 0);
    return totalWorkload / interval.length;
  };

  const workloadData = useMemo(() => {
    return filteredUsers.map((user: User) => {
        const workload = (viewMode === 'week' || viewMode === 'month')
            ? dateInterval.map(day => getWorkloadForDate(user, day))
            : columns.map(weekStart => {
                const weekInterval = eachDayOfInterval({start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1})});
                return getAverageWorkloadForInterval(user, weekInterval);
            });
        return { user, workload };
    });
  }, [filteredUsers, dateInterval, columns, tasks, viewMode]);

  const getWorkloadColor = (workload: number, capacity: number) => {
    if (workload === 0) return 'bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30';
    const ratio = capacity > 0 ? workload / capacity : 0;
    if (ratio < 0.5) return 'bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30';
    if (ratio < 0.9) return 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30';
    if (ratio <= 1) return 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30';
    if (ratio <= 1.2) return 'bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30';
    return 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30';
  };
  
  const handleDateChange = (direction: number) => {
    setCurrentDate(prev => {
        switch(viewMode) {
            case 'month': return addMonths(prev, direction);
            case '3-month': return addMonths(prev, direction * 3);
            case '12-month': return addMonths(prev, direction * 12);
            case 'week':
            default: return addDays(prev, direction * 7);
        }
    });
  };

  const gridTemplateColumns = useMemo(() => {
    const length = viewMode === 'week' || viewMode === 'month' ? dateInterval.length : columns.length;
    return `110px repeat(${length}, minmax(32px, 1fr))`;
  }, [viewMode, dateInterval, columns]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Workload Heatmap</CardTitle>
            <CardDescription>Visualize team workload over different timeframes.</CardDescription>
          </div>
          <div className="flex items-center gap-4">
             <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="3-month">3 Months</TabsTrigger>
                <TabsTrigger value="12-month">12 Months</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team === 'All' ? 'All Teams' : team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
            <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground w-max text-center">
             {title}
            </span>
            <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <div className="grid gap-px bg-border" style={{ gridTemplateColumns }}>
                {/* Header */}
                <div className="sticky left-0 p-2 text-sm font-semibold bg-muted/50 z-10">Member</div>
                
                {(viewMode === 'week' || viewMode === 'month') ? (
                    dateInterval.map((day) => (
                      <div key={day.toISOString()} className="p-2 text-center text-sm font-semibold bg-muted/50">
                        {viewMode === 'week' ? <div>{format(day, 'E')}</div> : null}
                        <div className={cn("text-xs", viewMode === 'week' ? "text-muted-foreground" : "font-medium")}>
                            {viewMode === 'month' && isSameDay(day, new Date()) ? 
                                <span className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center mx-auto">{format(day, 'd')}</span> :
                                format(day, 'd')
                            }
                        </div>
                      </div>
                    ))
                ) : (
                    columns.map((week, index) => (
                      <div key={index} className="p-2 text-center text-sm font-semibold bg-muted/50">
                        <div className={cn("text-xs", isSameMonth(week, new Date()) ? "font-bold text-primary" : "text-muted-foreground")}>{format(week, 'MMM')}</div>
                        <div className="text-xs">{format(week, 'd')}</div>
                      </div>
                    ))
                )}


                {/* User Rows */}
                {workloadData.map(({ user, workload }) => (
                  <React.Fragment key={user.id}>
                    <div className="sticky left-0 p-2 flex items-center gap-2 bg-muted/30 z-10">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">{user.name}</span>
                    </div>
                    {workload.map((load, index) => (
                      <Tooltip key={index} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-full min-h-12 w-full cursor-pointer rounded-sm transition-colors',
                              getWorkloadColor(load, user.capacity)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                           <p className="font-bold">{user.name}</p>
                           <p className="text-sm">Avg: {load.toFixed(1)}h / {user.capacity}h allocated</p>
                           <p className="text-xs text-muted-foreground mt-1">
                                {
                                    (viewMode === 'week' || viewMode === 'month') 
                                        ? format(dateInterval[index], 'MMMM d, yyyy')
                                        : `${format(columns[index], 'MMM d')} - ${format(endOfWeek(columns[index], {weekStartsOn: 1}), 'MMM d, yyyy')}`
                                }
                           </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end space-x-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Legend:</span>
              </div>
              {workloadLevels.map(item => (
                <div key={item.level} className="flex items-center gap-2">
                  <div className={cn("h-4 w-4 rounded-sm border", item.color)}></div>
                  <span className="text-xs text-muted-foreground">{item.level} ({item.description})</span>
                </div>
              ))}
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

