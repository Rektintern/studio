"use client";

import type { Reminder } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Trash2, ChevronRight } from "lucide-react";
import { formatDistance } from "@/lib/geo";
import { Switch } from "@/components/ui/switch";
import { toggleReminder, deleteReminder } from "@/lib/store";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, type PanInfo } from "framer-motion";

interface ReminderCardProps {
  reminder: Reminder;
  onToggle?: () => void;
  onDelete?: () => void;
  index: number;
}

export function ReminderCard({ reminder, onToggle, onDelete, index }: ReminderCardProps) {
  const [active, setActive] = useState(reminder.isActive);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = (e: any) => {
    e.stopPropagation();
    toggleReminder(reminder.id);
    setActive(!active);
    onToggle?.();
  };

  const handleDelete = () => {
    setIsDeleting(true);
    deleteReminder(reminder.id);
    onDelete?.();
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      handleDelete();
    }
  };

  const isVeryClose = reminder.distance && reminder.distance < reminder.radius;

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      <div className="absolute inset-0 bg-destructive/90 flex items-center justify-end px-8 z-0">
        <div className="flex flex-col items-center gap-1 text-white">
          <Trash2 size={24} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={isDeleting ? { x: -500, opacity: 0 } : { x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        <Card 
          className={cn(
            "p-6 bg-card border-none native-shadow transition-all duration-300",
            !active && "opacity-60",
            isVeryClose && active && "ring-2 ring-primary/40 bg-primary/[0.02]"
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1.5 flex-1 pr-4">
              <h3 className={cn(
                "text-lg font-headline font-bold tracking-tight transition-colors",
                active ? "text-foreground" : "text-muted-foreground line-through"
              )}>
                {reminder.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                <div className="p-1 rounded-md bg-muted">
                  <MapPin size={10} className="text-primary" />
                </div>
                <span className="truncate max-w-[200px] font-medium">
                  {reminder.location.address || "Saved Geo-Point"}
                </span>
              </div>
            </div>
            <div className="flex items-center self-start pt-1">
              <Switch checked={active} onCheckedChange={handleToggle} className="data-[state=checked]:bg-primary" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {reminder.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-muted text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-lg border-none">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border/40">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all",
                isVeryClose && active ? "bg-primary text-primary-foreground native-shadow" : "bg-muted text-muted-foreground"
              )}>
                <Navigation size={12} fill={isVeryClose && active ? "currentColor" : "none"} />
                {reminder.distance ? formatDistance(reminder.distance) : 'Locating...'}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                <div className="w-1 h-1 rounded-full bg-current" />
                {reminder.radius}m Zone
              </div>
            </div>
            <div className="text-[10px] font-medium text-muted-foreground/40">
              {new Date(reminder.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}