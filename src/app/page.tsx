"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Reminder } from "@/lib/types";
import { getReminders } from "@/lib/store";
import { calculateDistance } from "@/lib/geo";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { BottomNav } from "@/components/layout/BottomNav";
import { MapPin, Search, Bell, Ghost, Plus, Filter, AlertCircle, WifiOff, Target, Navigation, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/components/location-provider";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const { location: userLocation, error: locationError, permissionStatus, isLoading: locationLoading } = useLocation();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [search, setSearch] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [greeting, setGreeting] = useState("Hello");

  const mapPlaceholder = PlaceHolderImages.find(img => img.id === 'map-preview');

  useEffect(() => {
    refresh();
    setIsOnline(navigator.onLine);
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refresh = () => {
    const data = getReminders();
    setReminders(data);
  };

  const processedReminders = reminders
    .map(r => {
      if (!userLocation) return r;
      const distance = calculateDistance(
        userLocation.latitude, userLocation.longitude,
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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-6 pt-12 pb-32 min-h-screen"
    >
      <header className="flex justify-between items-start mb-8">
        <div>
          <motion.p 
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1"
          >
            {greeting}, explorer
          </motion.p>
          <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">
            Near<span className="text-primary">Remind</span>
          </h1>
        </div>
        <Button variant="outline" size="icon" className="rounded-2xl border-border/60 bg-card native-shadow hover:bg-primary/5 hover:text-primary transition-all">
          <Bell size={18} className="text-muted-foreground" />
        </Button>
      </header>

      <AnimatePresence>
        {permissionStatus === 'denied' && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }} 
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }} 
            exit={{ height: 0, opacity: 0, marginBottom: 0 }} 
            className="overflow-hidden"
          >
            <Alert className="bg-primary/5 border-primary/20 text-primary rounded-2xl border shadow-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="font-bold text-xs uppercase tracking-widest">Location Restricted</AlertTitle>
              <AlertDescription className="text-[11px] font-medium opacity-90 leading-relaxed">
                Live tracking is disabled. Please grant permission in your browser settings to see nearby reminders.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }} 
            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }} 
            exit={{ height: 0, opacity: 0, marginBottom: 0 }} 
            className="overflow-hidden"
          >
            <Alert className="bg-muted border-border/50 rounded-2xl">
              <WifiOff className="h-4 w-4" />
              <AlertTitle className="font-bold">Offline Mode</AlertTitle>
              <AlertDescription className="text-xs">
                Saved reminders still work, but you can&apos;t search for new locations.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mb-10 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Live Signal</h2>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${userLocation ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-primary/40'} ${locationLoading ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              {locationLoading ? "Searching..." : userLocation ? "Active" : "Offline"}
            </span>
          </div>
        </div>

        <Card className="relative aspect-[16/9] rounded-3xl overflow-hidden border-none native-shadow group">
          {mapPlaceholder && (
            <Image 
              src={mapPlaceholder.imageUrl}
              alt={mapPlaceholder.description}
              fill
              className="absolute inset-0 object-cover opacity-60 mix-blend-overlay grayscale group-hover:scale-105 transition-transform duration-700"
              data-ai-hint={mapPlaceholder.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {userLocation ? (
                <motion.div 
                  key="loc-active"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card/90 backdrop-blur-xl p-5 rounded-3xl border border-border/50 native-shadow-lg flex flex-col items-center gap-3 max-w-[80%]"
                >
                  <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    <Target size={22} className="animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground line-clamp-1">{userLocation.address || "Detecting Street..."}</p>
                    <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tight">
                      <span>{userLocation.latitude.toFixed(4)}°N</span>
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                      <span>{userLocation.longitude.toFixed(4)}°W</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="loc-searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 text-muted-foreground/60"
                >
                  <Navigation size={32} className="animate-bounce" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for Signal</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </section>

      <div className="relative mb-8 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
        <Input 
          placeholder="Filter nearby tasks..." 
          className="pl-12 h-14 bg-card border-border/40 rounded-2xl native-shadow transition-all focus-visible:ring-primary focus-visible:border-primary/50 text-base"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground rounded-xl">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-headline font-bold text-foreground/80 uppercase tracking-widest">
            Proximity List
          </h2>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
            {processedReminders.length} ACTIVE
          </span>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {processedReminders.length > 0 ? (
              processedReminders.map((reminder, idx) => (
                <ReminderCard 
                  key={reminder.id} 
                  reminder={reminder} 
                  index={idx}
                  onToggle={refresh}
                  onDelete={refresh}
                />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                  <div className="relative w-24 h-24 rounded-full bg-card border border-border/50 native-shadow-lg flex items-center justify-center">
                    <Ghost className="text-primary/40" size={48} />
                  </div>
                </div>
                <h3 className="text-lg font-headline font-bold text-foreground mb-2">Clear path ahead</h3>
                <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
                  Your spatial dashboard is empty. Add a location-based task to get started.
                </p>
                <Button 
                  onClick={() => router.push("/add")}
                  variant="outline" 
                  className="mt-8 rounded-xl border-primary/30 text-primary hover:bg-primary/5 px-8"
                >
                  Create First Pin
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Button
        onClick={() => router.push("/add")}
        className="fixed bottom-28 right-6 w-16 h-16 rounded-3xl shadow-2xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-50 native-shadow-lg border-4 border-background"
      >
        <Plus size={32} strokeWidth={2.5} />
      </Button>

      <BottomNav />
    </motion.div>
  );
}
