
'use client';

import { useState } from 'react';
import { Bell, Menu, Search, User, PlayCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useStore } from '@/lib/store';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import AppSidebar from './app-sidebar';
import Image from 'next/image';

export default function AppHeader() {
  const { users, getOverloadedUsers } = useStore();
  const overloadedUsers = getOverloadedUsers();
  const currentUser = users[0];

  return (
    <>
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 py-2 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              <AppSidebar />
            </SheetContent>
          </Sheet>
      <div className="flex items-baseline gap-2 sm:hidden">
         <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">
          ENTRUST PMvision
        </h1>
      </div>
      <div className="relative ml-auto flex items-center gap-2">
        <div className="bg-white rounded-md p-1">
            <Image
                src="https://i.ibb.co/X1TzKgY/a.png"
                alt="Header Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
                />
        </div>
        <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[180px] lg:w-[300px]"
            />
        </div>
        <Button variant="outline" size="sm" asChild>
            <Link href="/features">
                <PlayCircle className="mr-2 h-4 w-4" />
                How to use ENTRUST PMvision
            </Link>
        </Button>
      </div>
       <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {overloadedUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Resource allocation alerts.
              </p>
            </div>
            <div className="grid gap-2">
              {overloadedUsers.length > 0 ? (
                overloadedUsers.map((user) => (
                  <div key={user.id} className="flex items-start gap-2 rounded-md bg-destructive/10 p-2">
                     <div className="mt-1 h-2 w-2 rounded-full bg-destructive" />
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">{user.name} is overloaded.</p>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {user.capacity}h/day. Check workload.
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <Avatar>
              {currentUser ? (
                <>
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </>
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
    </>
  );
}
