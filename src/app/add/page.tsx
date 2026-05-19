"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  MapPin, 
  Sparkles, 
  Navigation, 
  CheckCircle2, 
  Loader2,
  Search as SearchIcon,
  X,
  Target
} from "lucide-react";
import { saveReminder } from "@/lib/store";
import type { Reminder, Location } from "@/lib/types";
import { suggestLocationTags } from "@/ai/flows/suggest-location-tags";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/components/location-provider";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { motion, AnimatePresence } from "framer-motion";

interface AutocompleteSuggestion {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export default function AddReminder() {
  const router = useRouter();
  const { toast } = useToast();
  const { location: currentLoc, isLoading: isLocLoading } = useLocation();
  
  const [title, setTitle] = useState("");
  const [radius, setRadius] = useState([200]);
  const [tags, setTags] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [location, setLocation] = useState<Location>({
    latitude: 37.7749,
    longitude: -122.4194,
    address: "San Francisco, CA"
  });

  const mapPlaceholder = PlaceHolderImages.find(img => img.id === 'map-preview');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        
        const mappedSuggestions: AutocompleteSuggestion[] = data.features.map((f: any) => ({
          name: f.properties.name || f.properties.street || "Unknown Place",
          address: [
            f.properties.street,
            f.properties.city,
            f.properties.country
          ].filter(Boolean).join(", "),
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
        }));
        
        setSuggestions(mappedSuggestions);
        setShowSuggestions(true);
      } catch (err) {
        // Silent fail
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    setLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.address || suggestion.name
    });
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    toast({
      title: "Pin Dropped",
      description: suggestion.name,
    });
  };

  const handleAiCategorize = async () => {
    if (!title) {
      toast({ title: "Note needed", description: "Describe your reminder first." });
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await suggestLocationTags({ reminderContent: title });
      setTags(result.tags);
    } catch (err) {
      // AI fail silently
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLoc) {
      setLocation(currentLoc);
      setSearchQuery("My Current Position");
      toast({ 
        title: "GPS Locked", 
        description: "Reminder set to your current coordinates." 
      });
    } else {
      toast({ 
        variant: "destructive",
        title: "Signal Error", 
        description: "Could not retrieve your location." 
      });
    }
  };

  const handleSave = () => {
    if (!title) return;
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title,
      location,
      radius: radius[0],
      tags,
      isActive: true,
      createdAt: Date.now()
    };
    saveReminder(newReminder);
    router.push("/");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-6 pt-12 pb-32 min-h-screen"
    >
      <header className="flex items-center gap-4 mb-10">
        <Button variant="ghost" size="icon" className="rounded-2xl bg-muted/50 text-foreground" onClick={() => router.back()}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-2xl font-headline font-bold text-foreground">Create Reminder</h1>
      </header>

      <div className="space-y-10">
        <section className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Task Details</Label>
          <div className="relative">
            <Input 
              placeholder="What do you need to do?" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-16 bg-card border-border/40 rounded-2xl text-lg native-shadow pr-14 focus-visible:ring-primary"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:bg-primary/10 rounded-xl transition-all"
              onClick={handleAiCategorize}
              disabled={isAiLoading}
            >
              <Sparkles size={20} className={isAiLoading ? "animate-spin" : ""} />
            </Button>
          </div>
          <AnimatePresence>
            {tags.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap gap-2 mt-3"
              >
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold py-1 px-3 rounded-lg">
                    #{tag}
                  </Badge>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-3 relative">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Target Location</Label>
          <div className="relative group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" size={18} />
            <Input 
              placeholder="Search address or business..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-12 h-16 bg-card border-border/40 rounded-2xl native-shadow text-base focus-visible:ring-primary"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching && <Loader2 className="animate-spin text-primary" size={18} />}
              {searchQuery && !isSearching && (
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setSearchQuery(""); setSuggestions([]); }}>
                  <X size={16} />
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2"
              >
                <Card className="bg-card/95 backdrop-blur-xl border-border/40 native-shadow-lg overflow-hidden rounded-2xl">
                  <div className="max-h-[280px] overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.latitude}-${s.longitude}-${i}`}
                        className="w-full text-left p-5 hover:bg-primary/5 transition-colors border-b border-border/20 last:border-none group flex items-start gap-4"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/20 group-hover:text-primary transition-all">
                          <MapPin size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground line-clamp-1">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{s.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Trigger Radius</Label>
            <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">{radius[0]}m</span>
          </div>
          <Card className="p-8 bg-card border-none native-shadow rounded-2xl">
            <Slider 
              value={radius} 
              onValueChange={setRadius} 
              max={1000} 
              min={50} 
              step={50}
              className="py-4"
            />
            <div className="flex justify-between mt-4">
              <span className="text-[10px] font-bold text-muted-foreground/40">50M</span>
              <span className="text-[10px] font-bold text-muted-foreground/40">1KM</span>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Geofence Preview</Label>
          <div className="aspect-[16/10] bg-muted rounded-2xl border border-border/30 relative overflow-hidden flex items-center justify-center native-shadow">
            {mapPlaceholder && (
              <Image 
                src={mapPlaceholder.imageUrl}
                alt={mapPlaceholder.description}
                fill
                className="absolute inset-0 object-cover opacity-60 mix-blend-overlay grayscale"
                data-ai-hint={mapPlaceholder.imageHint}
              />
            )}
            <div className="relative z-10 flex flex-col items-center gap-4 bg-card/90 backdrop-blur-xl p-6 rounded-3xl border border-border/50 native-shadow-lg max-w-[85%]">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                <Target size={28} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold truncate max-w-[200px] mb-1">{location.address || "Select a Location"}</p>
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground tracking-tighter uppercase">
                  <span>LAT: {location.latitude.toFixed(3)}</span>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span>LON: {location.longitude.toFixed(3)}</span>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-10 text-xs gap-2 rounded-xl border-primary/30 text-primary font-bold px-5"
                onClick={handleUseCurrentLocation}
                disabled={isLocLoading}
              >
                {isLocLoading ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />} 
                Current Location
              </Button>
            </div>
          </div>
        </section>

        <Button 
          className="w-full h-16 rounded-2xl text-lg font-headline font-bold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 gap-3 border-b-4 border-primary-foreground/10"
          onClick={handleSave}
          disabled={!title}
        >
          <CheckCircle2 size={24} strokeWidth={2.5} />
          Activate Geofence
        </Button>
      </div>

      <BottomNav />
    </motion.div>
  );
}