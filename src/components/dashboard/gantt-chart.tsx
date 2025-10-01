
'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { eachDayOfInterval, differenceInDays, format, isWithinInterval, startOfToday } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import type { Project, Task, User } from '@/lib/firebase-types';
import EditTaskDialog from '@/components/projects/edit-task-dialog';
import { useProjects as useProjectsFromHook } from '@/hooks/use-projects';
import { useTasks as useTasksFromHook, useTasks } from '@/hooks/use-tasks';
import { useUsers as useUsersFromHook } from '@/hooks/use-users';

const GANTT_ROW_HEIGHT = 40; // in pixels
const GANTT_DAY_WIDTH = 36; // in pixels
const GANTT_CONTAINER_HEIGHT = 400; // in pixels

interface GanttChartProps {
    projects?: Project[];
    tasks?: Task[];
    users?: User[];
    isStatic?: boolean;
}

interface GroupedTask extends Task {
  isGroupHeader?: boolean;
}

const getTaskDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (date.toDate) return date.toDate();
    return new Date(date);
}

export default function GanttChart({ projects: projectsProp, tasks: tasksProp, users: usersProp, isStatic = false }: GanttChartProps) {
  const { projects: projectsFromHook } = useProjectsFromHook();
  const { users: usersFromHook } = useUsersFromHook();
  
  const projects = projectsProp || projectsFromHook;
  const allUsers = usersProp || usersFromHook;

  const [selectedProjectId, setSelectedProjectId] = useState(projects.length > 0 ? 'all' : '');
  
  const { tasks: tasksFromHook, updateTask } = useTasks(isStatic ? undefined : (selectedProjectId !== 'all' ? selectedProjectId : undefined));
  const allTasks = tasksProp || tasksFromHook;

  const tasks = useMemo(() => {
    const tasksWithDates = allTasks.map(t => ({
      ...t,
      startDate: getTaskDate(t.startDate),
      endDate: getTaskDate(t.endDate)
    }));

    const tasksForSelectedProject = selectedProjectId === 'all'
        ? tasksWithDates
        : tasksWithDates.filter(t => t.projectId === selectedProjectId);

    if (selectedProjectId === 'all' && projects.length > 1) {
        const grouped: GroupedTask[] = [];
        projects.forEach(project => {
            const projectTasks = tasksForSelectedProject.filter(t => t.projectId === project.id);
            if (projectTasks.length > 0) {
              grouped.push({ 
                  id: `header-${project.id}`, 
                  name: project.name, 
                  isGroupHeader: true,
                  projectId: project.id,
                  assignments: [],
                  startDate: new Date() as any,
                  endDate: new Date() as any,
                  dependencies: [],
                  hours: 0,
              });
              grouped.push(...projectTasks);
            }
        });
        return grouped;
    }
    
    return tasksForSelectedProject;
  }, [allTasks, selectedProjectId, projects]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId('all');
    }
    if (selectedProjectId !== 'all' && !projects.find(p => p.id === selectedProjectId)) {
        if (projects.length > 0) {
            setSelectedProjectId('all');
        } else {
            setSelectedProjectId('');
        }
    }
  }, [projects, selectedProjectId]);


  const { startDate, endDate, dateInterval, totalDays, monthIntervals } = useMemo(() => {
    const tasksWithDates = tasks.filter(t => !t.isGroupHeader);
    if (tasksWithDates.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 15);
      const end = new Date(today);
      end.setDate(today.getDate() + 15);
      const interval = eachDayOfInterval({ start, end });
      return { startDate: start, endDate: end, dateInterval: interval, totalDays: interval.length, monthIntervals: [] };
    }
    
    const taskDates = tasksWithDates.flatMap(t => [getTaskDate(t.startDate), getTaskDate(t.endDate)]);
    const start = taskDates.reduce((min, d) => d < min ? d : min, taskDates[0]);
    const end = taskDates.reduce((max, d) => d > max ? d : max, taskDates[0]);

    const interval = eachDayOfInterval({ start, end });

    const months: { name: string; days: number }[] = [];
    interval.forEach(day => {
      const monthName = format(day, 'MMM yyyy');
      const month = months.find(m => m.name === monthName);
      if (month) {
        month.days++;
      } else {
        months.push({ name: monthName, days: 1 });
      }
    });

    return { startDate: start, endDate: end, dateInterval: interval, totalDays: interval.length, monthIntervals: months };
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    if (isStatic || task.isGroupHeader) return;
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  }

  const handleUpdateTask = (updatedTask: Omit<Task, 'id' | 'projectId' | 'dependencies'>) => {
    if(selectedTask) {
        updateTask(selectedTask.id, updatedTask);
    }
    setIsEditDialogOpen(false);
    setSelectedTask(null);
  };

  const getTaskStyle = (task: Task) => {
    const sDate = getTaskDate(task.startDate);
    const eDate = getTaskDate(task.endDate);
    const left = differenceInDays(sDate, startDate) * GANTT_DAY_WIDTH;
    const width = differenceInDays(eDate, sDate) * GANTT_DAY_WIDTH + GANTT_DAY_WIDTH;
    return {
      left: `${left}px`,
      width: `${width}px`,
    };
  };
  
  const todayPosition = useMemo(() => {
    const today = startOfToday();
    if (isWithinInterval(today, {start: startDate, end: endDate})) {
        return differenceInDays(today, startDate) * GANTT_DAY_WIDTH;
    }
    return -1;
  }, [startDate, endDate]);

  const getAssignees = (assignments: Task['assignments']): User[] => {
    if (!assignments) return [];
    const assigneeIds = assignments.map(a => a.assigneeId);
    return allUsers.filter(u => assigneeIds.includes(u.id));
  };


  return (
    <>
      <TooltipProvider>
        <div className="space-y-4">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={projects.length === 0}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
                {projects.length > 1 && <SelectItem value="all">All Projects</SelectItem>}
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="w-full overflow-hidden border rounded-lg">
              <div 
                  className="overflow-auto"
                  ref={containerRef}
                  style={{maxHeight: `${GANTT_CONTAINER_HEIGHT}px`}}
              >
              <div className="overflow-x-auto">
                <div style={{ width: `${totalDays * GANTT_DAY_WIDTH}px` }}>
                    {/* Timeline Header */}
                    <div className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                    {/* Month row */}
                    <div className="flex">
                        {monthIntervals.map((month, index) => (
                        <div key={index} className="flex-shrink-0 text-center border-r border-b font-semibold text-sm py-1" style={{ width: `${month.days * GANTT_DAY_WIDTH}px` }}>
                            {month.name}
                        </div>
                        ))}
                    </div>
                    {/* Day row */}
                    <div className="flex">
                        {dateInterval.map(day => (
                        <div key={day.toString()} className="flex-shrink-0 text-center border-r" style={{ width: `${GANTT_DAY_WIDTH}px` }}>
                            <div className="text-xs text-muted-foreground">{format(day, 'E')}</div>
                            <div className="text-sm font-medium">{format(day, 'd')}</div>
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* Task Area */}
                    <div className="relative">
                    {/* Today Marker */}
                    {todayPosition !== -1 && (
                        <div 
                            className="absolute top-0 bottom-0 w-px bg-red-500 z-20"
                            style={{ left: `${todayPosition + GANTT_DAY_WIDTH / 2}px` }}
                        >
                            <div className="absolute -top-5 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                Today
                            </div>
                        </div>
                    )}

                    {/* Dependency Lines (rendered first to be in the background) */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{height: `${tasks.length * GANTT_ROW_HEIGHT}px`}}>
                        {tasks.flatMap(task => 
                        (task.dependencies || []).map(depId => {
                            const fromTaskEl = taskRefs.current[depId];
                            const toTaskEl = taskRefs.current[task.id];
                            if (!fromTaskEl || !toTaskEl || !containerRef.current) return null;

                            const containerRect = containerRef.current.getBoundingClientRect();
                            const fromRect = fromTaskEl.getBoundingClientRect();
                            const toRect = toTaskEl.getBoundingClientRect();
                            
                            const headerEl = containerRef.current.querySelector('.sticky');
                            const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;
                            
                            const scrollLeft = containerRef.current.scrollLeft;
                            const scrollTop = containerRef.current.scrollTop;

                            const startX = fromRect.right - containerRect.left + scrollLeft;
                            const startY = fromRect.top - containerRect.top - headerHeight + fromRect.height / 2 + scrollTop;
                            const endX = toRect.left - containerRect.left + scrollLeft;
                            const endY = toRect.top - containerRect.top - headerHeight + toRect.height / 2 + scrollTop;

                            return (
                            <g key={`${depId}-${task.id}`}>
                                <path
                                d={`M ${startX} ${startY} L ${startX + 10} ${startY} L ${startX + 10} ${endY} L ${endX} ${endY}`}
                                stroke="hsl(var(--accent-foreground))"
                                strokeWidth="2"
                                fill="none"
                                />
                                <path d={`M ${endX - 5} ${endY - 4} L ${endX} ${endY} L ${endX - 5} ${endY + 4}`} stroke="hsl(var(--accent-foreground))" fill="none" strokeWidth="2" />
                            </g>
                            );
                        })
                        )}
                    </svg>

                    {/* Task Rows and Bars (rendered second to be on top) */}
                    {tasks.map((task, index) => {
                        if (task.isGroupHeader) {
                            return (
                                <div key={task.id} className="flex items-center border-t bg-muted font-semibold text-muted-foreground" style={{ height: `${GANTT_ROW_HEIGHT}px` }}>
                                    <div className="px-2 truncate">{task.name}</div>
                                </div>
                            );
                        }

                        const assignees = getAssignees(task.assignments);
                        const sDate = getTaskDate(task.startDate);
                        const eDate = getTaskDate(task.endDate);

                        return (
                        <div key={task.id} className="flex items-center border-t relative" style={{ height: `${GANTT_ROW_HEIGHT}px` }}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <div
                                ref={el => taskRefs.current[task.id] = el}
                                className={cn("absolute z-10 flex items-center h-[30px] rounded text-primary-foreground text-xs px-2 transition-colors",
                                !isStatic && 'cursor-pointer',
                                isWithinInterval(new Date(), {start: sDate, end: eDate}) 
                                    ? "bg-accent hover:bg-accent/90 border-2 border-primary" 
                                    : "bg-primary/80 hover:bg-primary"
                                )}
                                style={{ top: `${(GANTT_ROW_HEIGHT - 30) / 2}px`, ...getTaskStyle(task) }}
                                onClick={() => handleTaskClick(task)}
                            >
                                <p className="truncate font-medium">{task.name}</p>
                                <div className="ml-auto flex items-center -space-x-2">
                                    {assignees.map(assignee => (
                                        <Avatar key={assignee.id} className="h-5 w-5 border-2 border-primary-foreground">
                                            <AvatarImage src={assignee?.avatar} />
                                            <AvatarFallback>{assignee?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    ))}
                                    </div>
                            </div>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p className="font-bold">{task.name}</p>
                            <p>Assignees: {assignees.length > 0 ? assignees.map(a => a.name).join(', ') : 'Unassigned'}</p>
                            <p>Dates: {format(sDate, 'MMM d')} - {format(eDate, 'MMM d')}</p>
                            {!isStatic && <p className="text-muted-foreground text-xs mt-1">Click to edit this task.</p>}
                            </TooltipContent>
                        </Tooltip>
                        </div>
                    )})}
                    </div>
                </div>
              </div>
              </div>
          </div>
        </div>
      </TooltipProvider>
      {selectedTask && !isStatic && (
        <EditTaskDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
                setIsEditDialogOpen(false);
                setSelectedTask(null);
            }}
            onUpdateTask={handleUpdateTask}
            task={selectedTask}
        />
      )}
    </>
  );
}

    