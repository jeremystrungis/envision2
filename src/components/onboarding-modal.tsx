
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ClipboardList, Users, GanttChartSquare, LayoutDashboard } from 'lucide-react';
import { Progress } from './ui/progress';
import OnboardingAnimation from './onboarding-animation';

const onboardingSteps = [
  {
    icon: ClipboardList,
    title: 'Add Projects & Tasks',
    description: 'Start by creating a new project. In the same step, you can add all the initial tasks, assign them to team members, and set their deadlines.',
  },
  {
    icon: Users,
    title: 'Manage Your Team',
    description: 'Navigate to the Teams page to add new members or edit existing ones. You can create new teams on the fly and set each member\'s daily work capacity.',
  },
  {
    icon: GanttChartSquare,
    title: 'Schedule & Allocate',
    description: 'Use the Gantt charts to visualize project timelines. Assign tasks to team members and draw dependencies between tasks to create a clear project plan.',
  },
  {
    icon: LayoutDashboard,
    title: 'Visualize Your Data',
    description: 'The dashboard provides a real-time overview of your team\'s workload, project statuses, and resource allocation. Use the heatmap to prevent burnout!',
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);
  
  const scrollNext = useCallback(() => {
    api?.scrollNext()
  }, [api])


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent">
            Welcome to ENTRUST PMvision!
          </DialogTitle>
          <DialogDescription className="text-center">
            Here’s a quick tour to get you started.
          </DialogDescription>
        </DialogHeader>
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {onboardingSteps.map((step, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="relative w-full h-64 rounded-lg overflow-hidden border bg-muted">
                           <OnboardingAnimation step={index} />
                        </div>
                        <step.icon className="h-10 w-10 text-primary" />
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                        <p className="text-muted-foreground px-8">{step.description}</p>
                    </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <div className="flex items-center justify-center space-x-4">
             <Progress value={(current / count) * 100} className="w-1/3" />
        </div>
        <div className="flex justify-center">
            {current < count ? (
                 <Button onClick={scrollNext}>Next Step</Button>
            ) : (
                <Button onClick={onClose}>Get Started!</Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
