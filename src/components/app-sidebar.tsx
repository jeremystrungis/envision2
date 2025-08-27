
'use client';

import Link from 'next/link';
import {
  GanttChartSquare,
  LayoutDashboard,
  Settings,
  Users,
  ClipboardList,
  TriangleAlert,
  BookOpenCheck,
  FileJson,
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
import AppLogo from './app-logo';

export default function AppSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard2', label: 'Main Dashboard', icon: FileJson },
    { href: '/gantt', label: 'Gantt', icon: GanttChartSquare },
    { href: '/teams', label: 'Teams', icon: Users },
    { href: '/projects', label: 'Projects', icon: ClipboardList },
    { href: '/risk-assessment', label: 'Risk Assessment', icon: TriangleAlert },
    { href: '/features', label: 'Features', icon: BookOpenCheck },
  ];

  return (
    <aside className="hidden w-56 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col gap-4 p-4">
          <Link
            href="/teams"
            className="group mb-4 flex h-9 shrink-0 items-center gap-2"
          >
            <AppLogo className="h-8 w-8 text-primary" />
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">ENTRUST PMvision</span>
          </Link>
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname.startsWith(item.href) && item.href !== '/' && "bg-gradient-to-r from-green-400/20 to-green-500/20 text-primary font-bold",
                pathname === '/' && item.href === '/' && "bg-gradient-to-r from-green-400/20 to-green-500/20 text-primary font-bold",
                pathname === item.href && item.href === '/dashboard2' && "bg-gradient-to-r from-green-400/20 to-green-500/20 text-primary font-bold"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
            <Link
                href="/settings"
                className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full justify-start",
                    pathname === '/settings' && "bg-gradient-to-r from-green-400/20 to-green-500/20 text-primary font-bold"
                )}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
        </div>
    </aside>
  );
}
