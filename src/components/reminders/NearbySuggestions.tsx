"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Get the most relevant tag from the nearest active reminders
    const activeReminders = reminders.filter(r => r.isActive);
    if (activeReminders.length === 0) {
      setSuggestions([]);
      return;
    }

    const firstReminder = activeReminders[0];
    const tagToSearch = firstReminder.tags[0] || firstReminder.title.split(' ')[0];
    
    if (!tagToSearch || tagToSearch === activeTag) return;

    const fetchNearby = async () => {
      setLoading(true);
      setActiveTag(tagToSearch);
      try {
        // Increase limit to 15 so we can filter for proximity client-side
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(tagToSearch)}&lat=${userLocation.latitude}&lon=${userLocation.longitude}&limit=15`
        );
        const data = await response.json();
        
        const places: SuggestedPlace[] = data.features
          .map((f: any) => {
            const coords = f.geometry.coordinates;
            const dist = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              coords[1], coords[0]
            );
            return {
              name: f.properties.name || f.properties.street || "Nearby Spot",
              address: [f.properties.street, f.properties.city].filter(Boolean).join(", "),
              distance: dist,
              latitude: coords[1],
              longitude: coords[0],
              type: f.properties.osm_value
            };
          })
          // STRICT FILTER: Only show locations within 1km (1000 meters)
          .filter((place: SuggestedPlace) => place.distance <= 1000)
          .sort((a: SuggestedPlace, b: SuggestedPlace) => a.distance - b.distance)
          // Show only top 5 closest within that 1km
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
