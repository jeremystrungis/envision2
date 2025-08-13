
'use client';

import React, { useState, useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addDays,
  getDay,
  differenceInBusinessDays
} from 'date-fns';
import { User } from '@/lib/data';
import { useStore } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const workloadLevels = [
    { level: 'Light', color: 'bg-sky-500/20 border-sky-500/30', description: '< 50%' },
    { level: 'Good', color: 'bg-green-500/20 border-green-500/30', description: '50-90%' },
    { level: 'High', color: 'bg-yellow-500/20 border-yellow-500/30', description: '90-100%' },
    { level: 'Overloaded', color: 'bg-orange-500/20 border-orange-500/30', description: '100-120%' },
    { level: 'Critically Overloaded', color: 'bg-red-500/20 border-red-500/30', description: '> 120%' },
];

export default function WorkloadHeatmap() {
  const { users, tasks } = useStore();
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  }).filter(day => getDay(day) >= 1 && getDay(day) <= 5); // 1 is Monday, 5 is Friday

  const teams = useMemo(() => {
    const allTeams = new Set(users.map(user => user.team));
    return ['All', ...Array.from(allTeams)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (selectedTeam === 'All') return users;
    return users.filter((user) => user.team === selectedTeam);
  }, [selectedTeam, users]);

  const workloadData = useMemo(() => {
    return filteredUsers.map((user: User) => {
        const dailyWorkload = weekDays.map((day) => {
            const dayOfWeek = getDay(day);
            const tasksOnDay = tasks.filter(task =>
                task.assignments.some(a => a.assigneeId === user.id && a.workingDays.includes(dayOfWeek)) &&
                day >= task.startDate && day <= task.endDate
            );

            return tasksOnDay.reduce((acc, task) => {
                const assignment = task.assignments.find(a => a.assigneeId === user.id)!;
                const taskWorkDays = assignment.workingDays.length;
                const dailyHours = task.hours > 0 && taskWorkDays > 0 ? task.hours / taskWorkDays : 0;
                return acc + dailyHours;
            }, 0);
        });
        return { user, dailyWorkload };
    });
  }, [filteredUsers, weekDays, tasks]);

  const getWorkloadColor = (workload: number, capacity: number) => {
    if (workload === 0) return 'bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30';
    const ratio = capacity > 0 ? workload / capacity : 0;
    if (ratio < 0.5) return 'bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30';
    if (ratio < 0.9) return 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30';
    if (ratio <= 1) return 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30';
    if (ratio <= 1.2) return 'bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30';
    return 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30';
  };
  
  const handleDateChange = (days: number) => {
    setCurrentDate(prev => addDays(prev, days));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Workload Heatmap</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => handleDateChange(-7)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground w-max">
              {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => handleDateChange(7)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <div className="grid gap-px bg-border" style={{ gridTemplateColumns: `110px repeat(${weekDays.length}, 1fr)` }}>
                {/* Header */}
                <div className="p-2 text-sm font-semibold bg-muted/50">Member</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="p-2 text-center text-sm font-semibold bg-muted/50">
                    <div>{format(day, 'E')}</div>
                    <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
                  </div>
                ))}

                {/* User Rows */}
                {workloadData.map(({ user, dailyWorkload }) => (
                  <React.Fragment key={user.id}>
                    <div className="p-2 flex items-center gap-2 bg-muted/30">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium truncate">{user.name}</span>
                    </div>
                    {dailyWorkload.map((load, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-full min-h-12 w-full cursor-pointer rounded-sm transition-colors',
                              getWorkloadColor(load, user.capacity)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{load.toFixed(1)}h / {user.capacity}h allocated</p>
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
