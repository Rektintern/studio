"use client";

import { useState, useEffect, useRef } from "react";
import { SuggestedPlace, Reminder, Location } from "@/lib/types";
import { calculateDistance, formatDistance } from "@/lib/geo";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, ArrowUpRight, Loader2, Info, SearchX, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface NearbySuggestionsProps {
  userLocation: Location;
  reminders: Reminder[];
}

export function NearbySuggestions({ userLocation, reminders }: NearbySuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const lastRequestTime = useRef<number>(0);
  const lastLocation = useRef<Location | null>(null);

  const fetchNearby = async (tag: string, force = false) => {
    // Basic debounce/rate limit for OSM
    const now = Date.now();
    if (!force && now - lastRequestTime.current < 2000) return;

    setLoading(true);
    setActiveTag(tag);
    lastRequestTime.current = now;
    lastLocation.current = userLocation;

    try {
      // 1km bounding box calculation (~0.009 deg)
      const offset = 0.012; 
      const viewbox = `${userLocation.longitude - offset},${userLocation.latitude + offset},${userLocation.longitude + offset},${userLocation.latitude - offset}`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tag)}&format=json&viewbox=${viewbox}&bounded=1&limit=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'NearRemind-App/1.0',
            'Accept-Language': 'en'
          }
        }
      );
      
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        setSuggestions([]);
        return;
      }

      const places: SuggestedPlace[] = data
        .map((item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const dist = calculateDistance(
            userLocation.latitude, userLocation.longitude,
            lat, lon
          );
          
          return {
            name: item.display_name.split(',')[0] || "Nearby Spot",
            address: item.display_name.split(',').slice(1, 3).join(',').trim(),
            distance: dist,
            latitude: lat,
            longitude: lon,
            type: item.type || item.class || 'Spot'
          };
        })
        .filter((place: SuggestedPlace) => place.distance <= 1500) // Slightly generous filter
        .sort((a: SuggestedPlace, b: SuggestedPlace) => a.distance - b.distance)
        .slice(0, 5);

      setSuggestions(places);
    } catch (err) {
      console.error("Failed to fetch nearby spots", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeReminders = reminders.filter(r => r.isActive);
    if (activeReminders.length === 0) {
      setSuggestions([]);
      setActiveTag(null);
      return;
    }

    // Pick the first valid tag that isn't generic
    const tagToSearch = activeReminders
      .flatMap(r => r.tags)
      .find(t => !['home', 'work', 'office', 'my place'].includes(t.toLowerCase())) 
      || activeReminders[0].title.split(' ').filter(w => w.length > 3)[0];

    if (!tagToSearch) return;

    // Trigger if tag changed or if we've moved significantly (>100m)
    const hasMoved = !lastLocation.current || 
      calculateDistance(userLocation.latitude, userLocation.longitude, lastLocation.current.latitude, lastLocation.current.longitude) > 100;

    if (tagToSearch !== activeTag || hasMoved) {
      fetchNearby(tagToSearch);
    }
  }, [reminders, userLocation, activeTag]);

  if (suggestions.length === 0 && !loading && !activeTag) return null;

  return (
    <section className="space-y-4 mb-10">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-primary" />
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Nearby Intelligence</h2>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">
             {activeTag ? `Searching: ${activeTag}` : 'Local Scan'}
           </span>
           {loading ? (
             <Loader2 className="animate-spin text-primary" size={14} />
           ) : (
             <button 
               onClick={() => activeTag && fetchNearby(activeTag, true)}
               className="text-muted-foreground/40 hover:text-primary transition-colors"
             >
               <RefreshCcw size={12} />
             </button>
           )}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
        <AnimatePresence mode="popLayout">
          {suggestions.length > 0 ? (
            suggestions.map((place, idx) => (
              <motion.div
                key={`${place.name}-${idx}`}
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="snap-center shrink-0 w-[260px]"
              >
                <Card className="p-5 bg-card border-none native-shadow rounded-3xl h-full flex flex-col justify-between group overflow-hidden relative border border-primary/5">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <MapPin size={16} />
                      </div>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] font-bold py-0.5 px-2">
                        {place.type?.replace('_', ' ') || 'Spot'}
                      </Badge>
                    </div>
                    
                    <h3 className="font-bold text-sm text-foreground line-clamp-1 mb-1">{place.name}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 font-medium">{place.address}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <Navigation size={12} fill="currentColor" />
                      {formatDistance(place.distance)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-xl bg-muted hover:bg-primary hover:text-white transition-all shadow-sm"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`)}
                    >
                      <ArrowUpRight size={16} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : !loading && activeTag && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center justify-center py-10 bg-primary/5 rounded-3xl border border-dashed border-primary/20 gap-3"
            >
              <SearchX size={28} className="text-primary/30" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60">No local matches</p>
                <p className="text-[9px] text-muted-foreground/60 mt-1">Try adding more specific tags to your task.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// Minimal Badge replacement since it might be missing in this file scope
function Badge({ children, className, variant }: any) {
  return <div className={className}>{children}</div>;
}
