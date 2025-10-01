
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
  startOfDay,
  isWithinInterval,
} from 'date-fns';
import { User, Task, Team } from '@/lib/firebase-types';
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
import { useUsers as useUsersFromHook } from '@/hooks/use-users';
import { useTasks as useTasksFromHook } from '@/hooks/use-tasks';
import { useTeams as useTeamsFromHook } from '@/hooks/use-teams';

const workloadLevels = [
    { level: 'Light', color: 'bg-sky-500/20 border-sky-500/30', description: '< 50%' },
    { level: 'Good', color: 'bg-green-500/20 border-green-500/30', description: '50-90%' },
    { level: 'High', color: 'bg-yellow-500/20 border-yellow-500/30', description: '90-100%' },
    { level: 'Overloaded', color: 'bg-orange-500/20 border-orange-500/30', description: '100-120%' },
    { level: 'Critically Overloaded', color: 'bg-red-500/20 border-red-500/30', description: '> 120%' },
];

type ViewMode = 'week' | 'month' | '3-month' | '12-month';

interface WorkloadHeatmapProps {
  users?: User[];
  tasks?: Task[];
  teams?: Team[];
}

export default function WorkloadHeatmap({ users: usersProp, tasks: tasksProp, teams: teamsProp }: WorkloadHeatmapProps) {
  const { users: usersFromHook } = useUsersFromHook();
  const { tasks: tasksFromHook } = useTasksFromHook();
  const { teams: teamsFromHook } = useTeamsFromHook();

  const users = usersProp || usersFromHook;
  const tasks = tasksProp || tasksFromHook;
  const teams = teamsProp || teamsFromHook;

  const [selectedTeam, setSelectedTeam] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const { dateInterval, columns, title, monthGrid, threeMonthGrid } = useMemo(() => {
    let start: Date, end: Date, titleStr: string;

    switch(viewMode) {
      case 'month':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        titleStr = format(currentDate, 'MMMM yyyy');
        const monthWeeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        const grid = monthWeeks.map(weekStart => {
          return eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
        });
        return { dateInterval: [], columns: [], title: titleStr, monthGrid: grid, threeMonthGrid: [] };
      
      case '3-month':
        const months = Array.from({ length: 3 }, (_, i) => addMonths(startOfMonth(currentDate), i));
        titleStr = `${format(months[0], 'MMM yyyy')} - ${format(months[2], 'MMM yyyy')}`;
        const quarterlyGrid = months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          return {
            monthName: format(month, 'MMMM'),
            weeks: eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
          }
        });
        return { dateInterval: [], columns: [], title: titleStr, monthGrid: [], threeMonthGrid: quarterlyGrid };

      case '12-month':
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(addMonths(currentDate, 11), { weekStartsOn: 1 });
        titleStr = `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
        return { dateInterval: [], columns: eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }), title: titleStr, monthGrid: [], threeMonthGrid: [] };
      
      case 'week':
      default:
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
        titleStr = `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        const weekDays = eachDayOfInterval({start, end});
        return { dateInterval: weekDays, columns: [], title: titleStr, monthGrid: [], threeMonthGrid: [] };
    }
  }, [currentDate, viewMode]);


  const teamNames = useMemo(() => ['All', ...teams.map(t => t.name)], [teams]);

  const filteredUsers = useMemo(() => {
    if (selectedTeam === 'All') return users;
    return users.filter((user) => user.teams?.includes(selectedTeam));
  }, [selectedTeam, users]);

  const getTaskDate = (date: any) => {
      if (!date) return new Date();
      if (date instanceof Date) return date;
      if (date.toDate) return date.toDate();
      return new Date(date);
  }

  const getWorkloadForDate = (user: User, date: Date): number => {
      if(!user || !date) return 0;
      const dayOfWeek = getDay(date);
      const startOfDayDate = startOfDay(date);
      
      const tasksOnDay = tasks.filter(task => {
        const taskStart = startOfDay(getTaskDate(task.startDate));
        const taskEnd = startOfDay(getTaskDate(task.endDate));

        return startOfDayDate >= taskStart && startOfDayDate <= taskEnd &&
               task.assignments.some(a => a.assigneeId === user.id && a.workingDays.includes(dayOfWeek));
      });

      return tasksOnDay.reduce((acc, task) => {
          const assignment = task.assignments.find(a => a.assigneeId === user.id)!;
          
          const taskStart = getTaskDate(task.startDate);
          const taskEnd = getTaskDate(task.endDate);

          const allDaysInInterval = eachDayOfInterval({ start: taskStart, end: taskEnd });
          const workingDaysForAssignment = allDaysInInterval.filter(day => assignment.workingDays.includes(getDay(day))).length;
          
          const assignedHours = task.hours * (assignment.effort / 100);
          const dailyHours = workingDaysForAssignment > 0 ? assignedHours / workingDaysForAssignment : 0;

          return acc + dailyHours;
      }, 0);
  };
  
  const getAverageWorkloadForInterval = (user: User, intervalStart: Date, intervalEnd: Date): number => {
    const interval = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
    if (interval.length === 0) return 0;

    let totalWorkload = 0;
    let businessDaysInInterval = 0;

    interval.forEach(day => {
        const dayOfWeek = getDay(day);
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Consider Mon-Fri as business days for averaging
            businessDaysInInterval++;
        }
        totalWorkload += getWorkloadForDate(user, day);
    });

    return businessDaysInInterval > 0 ? totalWorkload / businessDaysInInterval : 0;
  };

  const workloadData = useMemo(() => {
    return filteredUsers.map((user: User) => {
        return { user };
    });
  }, [filteredUsers]);

  const getWorkloadColor = (workload: number, capacity: number) => {
    if (capacity === 0 && workload > 0) return 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30';
    if (workload === 0) return 'bg-muted/50';
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

  const gridTemplateColumnsWeek = `minmax(110px, 1.5fr) repeat(${dateInterval.length}, minmax(40px, 1fr))`;
  const gridTemplateColumnsYear = `minmax(110px, 1.5fr) repeat(${columns.length}, minmax(40px, 1fr))`;

  const renderWeekView = () => (
    <div className="overflow-auto max-h-[400px] border rounded-lg">
        <div className="relative grid gap-px bg-border" style={{ gridTemplateColumns: gridTemplateColumnsWeek }}>
            {/* Headers */}
            <div className="sticky top-0 left-0 p-2 text-sm font-semibold bg-muted/50 z-20">Member</div>
            {dateInterval.map((day) => (
            <div key={day.toISOString()} className="sticky top-0 p-2 text-center text-sm font-semibold bg-muted/50 z-10">
                <div className="text-xs text-muted-foreground">{format(day, 'E')}</div>
                <div className={cn("mt-1 font-medium", isSameDay(day, new Date()) ? 'text-primary' : '')}>
                    {isSameDay(day, new Date()) ? 
                        <span className="bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center mx-auto">{format(day, 'd')}</span> :
                        format(day, 'd')
                    }
                </div>
            </div>
            ))}
            
            {/* Rows */}
            {workloadData.map(({ user }) => (
            <React.Fragment key={user.id}>
                <div className="sticky left-0 p-2 flex items-center gap-2 bg-muted/30 z-10 border-t">
                    <Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                    <span className="text-xs font-medium truncate">{user.name}</span>
                </div>
                {dateInterval.map((day, index) => {
                    const load = getWorkloadForDate(user, day);
                    return (
                    <Tooltip key={index} delayDuration={100}>
                    <TooltipTrigger asChild>
                        <div className={cn('h-full min-h-12 w-full cursor-pointer rounded-sm transition-colors border-t', getWorkloadColor(load, user.capacity))} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-sm">Avg: {load.toFixed(1)}h / {user.capacity}h allocated</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(day, 'MMMM d, yyyy')}</p>
                    </TooltipContent>
                    </Tooltip>
                )})}
            </React.Fragment>
            ))}
        </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="overflow-auto max-h-[400px] border rounded-lg p-2">
      <div className="flex gap-8 relative">
        <div className="w-[180px] flex-shrink-0 space-y-px sticky left-0 z-10 bg-background/95">
          <div className="h-10 p-2 text-sm font-semibold bg-muted/50 invisible">Member</div>
          {workloadData.map(({ user }) => (
            <div key={user.id} className="h-14 p-2 flex items-center gap-2 bg-muted/30">
              <Avatar className="h-8 w-8"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
              <span className="text-xs font-medium truncate">{user.name}</span>
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-7 gap-px sticky top-0 z-10 bg-background/95">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="h-10 p-2 text-center text-sm font-semibold bg-muted/50">{day}</div>
            ))}
          </div>
          {monthGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-px border-t">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <div key={dayIndex} className={cn("relative h-14 p-1", isCurrentMonth ? 'bg-background' : 'bg-muted/30')}>
                    <span className={cn("text-xs", isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50')}>{format(day, 'd')}</span>
                    <div className="absolute inset-0 top-[18px] space-y-px">
                      {workloadData.map(({ user }) => {
                          const load = isCurrentMonth ? getWorkloadForDate(user, day) : 0;
                          return(
                          <Tooltip key={user.id} delayDuration={100}>
                              <TooltipTrigger asChild>
                              <div className={cn("h-1.5 w-full", isCurrentMonth ? getWorkloadColor(load, user.capacity) : '')} />
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p className="font-bold">{user.name}</p>
                                  <p className="text-sm">Avg: {load.toFixed(1)}h / {user.capacity}h allocated</p>
                                  <p className="text-xs text-muted-foreground mt-1">{format(day, 'MMMM d, yyyy')}</p>
                              </TooltipContent>
                          </Tooltip>
                      )})}
                    </div>
                     {isSameDay(day, new Date()) && <div className="absolute inset-0 border-2 border-red-500 pointer-events-none rounded-sm" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderThreeMonthView = () => (
     <div className="overflow-auto max-h-[400px] border rounded-lg p-2">
      <div className="flex gap-8 relative">
        <div className="w-[180px] flex-shrink-0 space-y-px sticky left-0 z-10 bg-background/95">
             <div className="h-10 p-2 text-sm font-semibold bg-muted/50 invisible">Member</div>
             {workloadData.map(({user}) => (
                <div key={user.id} className="h-[102px] p-2 flex items-center gap-2 bg-muted/30">
                    <Avatar className="h-8 w-8"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                    <span className="text-xs font-medium truncate">{user.name}</span>
                </div>
             ))}
        </div>
        <div className="flex-1 space-y-4">
          {threeMonthGrid.map(({monthName, weeks}, monthIndex) => (
             <div key={monthIndex}>
                 <h3 className="font-semibold mb-1 sticky top-0 bg-background/95 z-10 py-1">{monthName}</h3>
                 <div className="grid grid-cols-6 gap-px">
                     {weeks.map((week, weekIndex) => {
                         const weekEnd = endOfWeek(week, {weekStartsOn: 1});
                         return (
                            <div key={weekIndex} className="relative h-[102px] p-1 bg-background border rounded-sm">
                                <span className="text-xs text-muted-foreground">{format(week, 'd')}</span>
                                <div className="absolute inset-0 top-[18px] space-y-px">
                                     {workloadData.map(({ user }) => {
                                        const load = getAverageWorkloadForInterval(user, week, weekEnd);
                                        return (
                                            <Tooltip key={user.id} delayDuration={100}>
                                                <TooltipTrigger asChild><div className={cn("h-2.5 w-full", getWorkloadColor(load, user.capacity))} /></TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="font-bold">{user.name}</p>
                                                    <p className="text-sm">Avg: {load.toFixed(1)}h / {user.capacity}h allocated</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{format(week, 'MMM d')} - {format(weekEnd, 'MMM d')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )
                                    })}
                                </div>
                                {isWithinInterval(new Date(), {start: week, end: weekEnd}) && <div className="absolute inset-0 border-2 border-red-500 pointer-events-none rounded-sm" />}
                            </div>
                         )
                     })}
                 </div>
             </div>
          ))}
        </div>
     </div>
     </div>
  );

  const renderYearView = () => (
     <div className="overflow-auto max-h-[400px] border rounded-lg">
      <div className="relative grid gap-px bg-border" style={{ gridTemplateColumns: gridTemplateColumnsYear }}>
            {/* Header */}
            <div className="sticky top-0 left-0 p-2 text-sm font-semibold bg-muted/50 z-20">Member</div>
             {columns.map((week, index) => (
                <div key={index} className="sticky top-0 p-2 text-center text-sm font-semibold bg-muted/50 z-10">
                <div className={cn("text-xs", isSameMonth(week, new Date()) ? "font-bold text-primary" : "text-muted-foreground")}>{format(week, 'MMM')}</div>
                <div className="text-xs">{format(week, 'd')}</div>
                </div>
            ))}
            {/* User Rows */}
            {workloadData.map(({ user }) => (
            <React.Fragment key={user.id}>
                <div className="sticky left-0 p-2 flex items-center gap-2 bg-muted/30 z-10 border-t">
                    <Avatar className="h-6 w-6"><AvatarImage src={user.avatar} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                    <span className="text-xs font-medium truncate">{user.name}</span>
                </div>
                {columns.map((weekStart, index) => {
                     const weekEnd = endOfWeek(weekStart, {weekStartsOn: 1});
                     const load = getAverageWorkloadForInterval(user, weekStart, weekEnd);
                     return (
                         <Tooltip key={index} delayDuration={100}>
                             <TooltipTrigger asChild>
                                 <div className={cn("h-full min-h-12 w-full cursor-pointer rounded-sm transition-colors border-t", getWorkloadColor(load, user.capacity))} />
                             </TooltipTrigger>
                             <TooltipContent>
                                <p className="font-bold">{user.name}</p>
                                <p className="text-sm">Avg: {load.toFixed(1)}h / {user.capacity}h allocated</p>
                                <p className="text-xs text-muted-foreground mt-1">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</p>
                             </TooltipContent>
                         </Tooltip>
                     )
                })}
            </React.Fragment>
            ))}
        </div>
    </div>
  );

  const renderContent = () => {
    switch(viewMode) {
      case 'month': return renderMonthView();
      case '3-month': return renderThreeMonthView();
      case '12-month': return renderYearView();
      case 'week':
      default:
        return renderWeekView();
    }
  }


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
                {teamNames.map(team => (
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
            {renderContent()}
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

    