
'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { eachDayOfInterval, differenceInDays, format, isWithinInterval } from 'date-fns';
import { projects, tasks as allTasks, users } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

const GANTT_ROW_HEIGHT = 40; // in pixels
const GANTT_DAY_WIDTH = 40; // in pixels

export default function GanttChart() {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const tasks = useMemo(() => {
    return allTasks.filter(task => task.projectId === selectedProjectId);
  }, [selectedProjectId]);

  const { startDate, endDate, dateInterval, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 15);
      const end = new Date(today);
      end.setDate(today.getDate() + 15);
      const interval = eachDayOfInterval({ start, end });
      return { startDate: start, endDate: end, dateInterval: interval, totalDays: interval.length };
    }
    const start = tasks.reduce((min, t) => t.startDate < min ? t.startDate : min, tasks[0].startDate);
    const end = tasks.reduce((max, t) => t.endDate > max ? t.endDate : max, tasks[0].endDate);
    const interval = eachDayOfInterval({ start, end });
    return { startDate: start, endDate: end, dateInterval: interval, totalDays: interval.length };
  }, [tasks]);

  useEffect(() => {
    const updateDimensions = () => {
      if(containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [tasks]);

  const getTaskStyle = (task: typeof tasks[0]) => {
    const left = differenceInDays(task.startDate, startDate) * GANTT_DAY_WIDTH;
    const width = differenceInDays(task.endDate, task.startDate) * GANTT_DAY_WIDTH;
    return {
      left: `${left}px`,
      width: `${width}px`,
    };
  };

  const getAssignee = (assigneeId: string | null) => users.find(u => u.id === assigneeId);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="relative overflow-x-auto border rounded-lg" ref={containerRef}>
          <div style={{ width: `${totalDays * GANTT_DAY_WIDTH}px` }}>
            {/* Timeline Header */}
            <div className="sticky top-0 z-10 flex bg-muted/50">
              {dateInterval.map(day => (
                <div key={day.toString()} className="flex-shrink-0 text-center border-r" style={{ width: `${GANTT_DAY_WIDTH}px` }}>
                  <div className="text-xs text-muted-foreground">{format(day, 'E')}</div>
                  <div className="text-sm font-medium">{format(day, 'd')}</div>
                </div>
              ))}
            </div>

            {/* Task Rows */}
            <div className="relative">
              {tasks.map((task, index) => (
                <div key={task.id} className="flex items-center border-t" style={{ height: `${GANTT_ROW_HEIGHT}px` }}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        ref={el => taskRefs.current[task.id] = el}
                        className={cn("absolute flex items-center h-[30px] rounded bg-primary/80 hover:bg-primary text-primary-foreground text-xs px-2 cursor-pointer transition-all duration-300",
                          isWithinInterval(new Date(), {start: task.startDate, end: task.endDate}) && "animate-slow-pulse border-2 border-accent"
                        )}
                        style={{ top: `${index * GANTT_ROW_HEIGHT + 5}px`, ...getTaskStyle(task) }}
                      >
                        <p className="truncate font-medium">{task.name}</p>
                        {getAssignee(task.assigneeId) && (
                           <Avatar className="ml-auto h-5 w-5">
                            <AvatarImage src={getAssignee(task.assigneeId)?.avatar} />
                            <AvatarFallback>{getAssignee(task.assigneeId)?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">{task.name}</p>
                      <p>Assignee: {getAssignee(task.assigneeId)?.name || 'Unassigned'}</p>
                      <p>Dates: {format(task.startDate, 'MMM d')} - {format(task.endDate, 'MMM d')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
              
              {/* Dependency Lines */}
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{height: `${tasks.length * GANTT_ROW_HEIGHT}px`}}>
                {tasks.flatMap(task => 
                  task.dependencies.map(depId => {
                    const fromTaskEl = taskRefs.current[depId];
                    const toTaskEl = taskRefs.current[task.id];
                    if (!fromTaskEl || !toTaskEl || !containerRef.current) return null;

                    const containerRect = containerRef.current.getBoundingClientRect();
                    const fromRect = fromTaskEl.getBoundingClientRect();
                    const toRect = toTaskEl.getBoundingClientRect();

                    const startX = fromRect.right - containerRect.left + containerRef.current.scrollLeft;
                    const startY = fromRect.top - containerRect.top + fromRect.height / 2 + containerRef.current.scrollTop;
                    const endX = toRect.left - containerRect.left + containerRef.current.scrollLeft;
                    const endY = toRect.top - containerRect.top + toRect.height / 2 + containerRef.current.scrollTop;

                    return (
                      <g key={`${depId}-${task.id}`}>
                        <path
                          d={`M ${startX} ${startY} L ${startX + 10} ${startY} L ${startX + 10} ${endY} L ${endX} ${endY}`}
                          stroke="hsl(var(--accent))"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path d={`M ${endX - 5} ${endY - 4} L ${endX} ${endY} L ${endX - 5} ${endY + 4}`} stroke="hsl(var(--accent))" fill="none" strokeWidth="2" />
                      </g>
                    );
                  })
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
