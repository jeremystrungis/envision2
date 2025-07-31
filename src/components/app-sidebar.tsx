
'use client';

import Link from 'next/link';
import {
  GanttChartSquare,
  LayoutDashboard,
  Settings,
  Users,
  BotMessageSquare,
  ClipboardList,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from './ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/gantt', label: 'Gantt', icon: GanttChartSquare },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/projects', label: 'Projects', icon: ClipboardList },
  ];

  return (
    <aside className="hidden h-screen w-16 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <BotMessageSquare className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">EngVision</span>
          </Link>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-lg", pathname === item.href && "bg-accent")}
                  aria-label={item.label}
                  asChild
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={5}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mt-auto rounded-lg"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              Settings
            </TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
