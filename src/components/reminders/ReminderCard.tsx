
"use client";

import { Reminder } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock } from "lucide-react";
import { formatDistance } from "@/lib/geo";
import { Switch } from "@/components/ui/switch";
import { toggleReminder } from "@/lib/store";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReminderCardProps {
  reminder: Reminder;
  onToggle?: () => void;
  index: number;
}

export function ReminderCard({ reminder, onToggle, index }: ReminderCardProps) {
  const [active, setActive] = useState(reminder.isActive);

  const handleToggle = () => {
    toggleReminder(reminder.id);
    setActive(!active);
    onToggle?.();
  };

  const isVeryClose = reminder.distance && reminder.distance < reminder.radius;

  return (
    <Card 
      className={cn(
        "p-5 mb-4 border-l-4 transition-all duration-500 animate-spring-up relative overflow-hidden group card-glow",
        active ? "border-l-primary" : "border-l-muted opacity-60",
        isVeryClose && active && "bg-primary/5 border-l-accent ring-1 ring-accent/30"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-1">
          <h3 className={cn(
            "text-lg font-headline font-semibold tracking-tight",
            active ? "text-foreground" : "text-muted-foreground line-through"
          )}>
            {reminder.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} className="text-primary" />
            <span className="truncate max-w-[180px]">
              {reminder.location.address || "Saved Location"}
            </span>
          </div>
        </div>
        <Switch checked={active} onCheckedChange={handleToggle} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {reminder.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="bg-secondary/50 text-[10px] font-medium py-0 px-2 rounded-sm border-none">
            #{tag}
          </Badge>
        ))}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold",
            isVeryClose && active ? "bg-accent/20 text-accent" : "bg-muted/50 text-muted-foreground"
          )}>
            <Navigation size={12} fill={isVeryClose ? "currentColor" : "none"} />
            {reminder.distance ? formatDistance(reminder.distance) : 'Searching...'}
          </div>
          <span className="text-[10px] text-muted-foreground/50">Radius: {reminder.radius}m</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <Clock size={10} />
          {new Date(reminder.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Card>
  );
}
