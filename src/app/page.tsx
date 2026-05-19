
"use client";

import { useEffect, useState } from "react";
import { Reminder } from "@/lib/types";
import { getReminders } from "@/lib/store";
import { calculateDistance } from "@/lib/geo";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { MapPin, Search, Bell, Ghost } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // 1. Get User Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err)
      );
    }

    // 2. Initial load
    refresh();
  }, []);

  const refresh = () => {
    const data = getReminders();
    setReminders(data);
  };

  // Sort and filter reminders
  const processedReminders = reminders
    .map(r => {
      if (!userLocation) return r;
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        r.location.latitude, r.location.longitude
      );
      return { ...r, distance };
    })
    .filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });

  return (
    <div className="px-6 pt-10 pb-24 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground indigo-glow">NearRemind</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <MapPin size={14} className="text-accent" />
            {userLocation ? "Location active" : "Tracking location..."}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50">
          <Bell size={20} className="text-muted-foreground" />
        </Button>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search proximity tasks..." 
          className="pl-10 h-12 bg-secondary/30 border-border/50 rounded-xl focus-visible:ring-accent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-headline font-semibold text-muted-foreground uppercase tracking-widest">
            Spatial Dashboard
          </h2>
          <span className="text-xs text-primary font-medium">{processedReminders.length} Active Pins</span>
        </div>

        {processedReminders.length > 0 ? (
          processedReminders.map((reminder, idx) => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              index={idx}
              onToggle={refresh} 
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
              <Ghost className="text-muted-foreground/30" size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-headline font-medium text-muted-foreground">No reminders found</h3>
              <p className="text-xs text-muted-foreground/60 max-w-[200px]">Add your first location-based task to see it on the dashboard.</p>
            </div>
          </div>
        )}
      </section>

      <BottomNav />
    </div>
  );
}
