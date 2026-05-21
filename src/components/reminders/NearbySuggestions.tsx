
"use client";

import { useState, useEffect, useRef } from "react";
import { SuggestedPlace, Reminder, Location } from "@/lib/types";
import { calculateDistance, formatDistance } from "@/lib/geo";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, ArrowUpRight, Loader2, Info, SearchX } from "lucide-react";
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

  useEffect(() => {
    // Get the most relevant tag from the nearest active reminders
    const activeReminders = reminders.filter(r => r.isActive);
    if (activeReminders.length === 0) {
      setSuggestions([]);
      return;
    }

    // Filter out generic tags like "home" or "work" that won't yield good POI results
    const firstReminder = activeReminders[0];
    const tagToSearch = firstReminder.tags.find(t => !['home', 'work', 'my place'].includes(t.toLowerCase())) 
                       || firstReminder.title.split(' ')[0];
    
    if (!tagToSearch || tagToSearch === activeTag) return;

    const fetchNearby = async () => {
      // Respect Nominatim's 1 request per second policy
      const now = Date.now();
      const timeSinceLast = now - lastRequestTime.current;
      if (timeSinceLast < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLast));
      }

      setLoading(true);
      setActiveTag(tagToSearch);
      lastRequestTime.current = Date.now();

      try {
        // Calculate a bounding box for ~1km (roughly 0.009 degrees lat/lon)
        const offset = 0.01; 
        const viewbox = `${userLocation.longitude - offset},${userLocation.latitude + offset},${userLocation.longitude + offset},${userLocation.latitude - offset}`;
        
        // Using Nominatim with bounded search to strictly limit to the current area
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tagToSearch)}&format=json&viewbox=${viewbox}&bounded=1&limit=10&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en'
            }
          }
        );
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
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
          // Extra safety check for 1km
          .filter((place: SuggestedPlace) => place.distance <= 1200)
          .sort((a: SuggestedPlace, b: SuggestedPlace) => a.distance - b.distance)
          .slice(0, 5);

        setSuggestions(places);
      } catch (err) {
        console.error("Failed to fetch nearby spots", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [reminders, userLocation, activeTag]);

  if (suggestions.length === 0 && !loading) return null;

  return (
    <section className="space-y-4 mb-10">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-primary" />
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Nearby Intelligence</h2>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">1KM Radius</span>
           {loading && <Loader2 className="animate-spin text-primary" size={14} />}
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
                transition={{ delay: idx * 0.1 }}
                className="snap-center shrink-0 w-[240px]"
              >
                <Card className="p-5 bg-card border-none native-shadow rounded-3xl h-full flex flex-col justify-between group overflow-hidden relative">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <MapPin size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                        {place.type || 'Spot'}
                      </span>
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
                      className="h-8 w-8 rounded-xl bg-muted hover:bg-primary hover:text-white transition-all"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`)}
                    >
                      <ArrowUpRight size={14} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : !loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center justify-center py-8 text-muted-foreground/40 gap-2"
            >
              <SearchX size={24} />
              <p className="text-[10px] font-bold uppercase tracking-widest">No matching spots within 1KM</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
