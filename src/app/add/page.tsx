
"use client";

import { useState, useEffect, useCallback } from "react";
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
  X
} from "lucide-react";
import { saveReminder } from "@/lib/store";
import { Reminder, Location } from "@/lib/types";
import { suggestLocationTags } from "@/ai/flows/suggest-location-tags";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/components/location-provider";
import { cn } from "@/lib/utils";

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
  
  // Location Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [location, setLocation] = useState<Location>({
    latitude: 37.7749,
    longitude: -122.4194,
    address: "San Francisco, CA"
  });

  // Debounced search for locations
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
        console.error("Location search failed", err);
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
      title: "Location pinned",
      description: `Target set to ${suggestion.name}`,
    });
  };

  const handleAiCategorize = async () => {
    if (!title) {
      toast({ title: "Reminder title needed", description: "Enter what you need to remember first." });
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await suggestLocationTags({ reminderContent: title });
      setTags(result.tags);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLoc) {
      setLocation(currentLoc);
      setSearchQuery("Current Location");
      toast({ 
        title: "Spatial Pin Set", 
        description: `Coordinates updated to your current position.` 
      });
    } else {
      toast({ 
        variant: "destructive",
        title: "Signal Lost", 
        description: "Unable to retrieve current coordinates. Check your GPS settings." 
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
    <div className="px-6 pt-10 pb-24 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => router.back()}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-2xl font-headline font-bold text-foreground">Add Reminder</h1>
      </header>

      <div className="space-y-8">
        {/* Title Input */}
        <div className="space-y-2">
          <Label className="text-xs font-headline uppercase tracking-widest text-muted-foreground">What to remember?</Label>
          <div className="relative">
            <Input 
              placeholder="e.g. Buy groceries" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-14 bg-secondary/30 border-border/50 rounded-xl text-lg pr-12 focus-visible:ring-primary"
            />
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-2 top-2 text-primary hover:bg-primary/10 rounded-lg"
              onClick={handleAiCategorize}
              disabled={isAiLoading}
            >
              <Sparkles size={20} className={isAiLoading ? "animate-pulse" : ""} />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-1 px-3">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Location Search Autocomplete */}
        <div className="space-y-2 relative">
          <Label className="text-xs font-headline uppercase tracking-widest text-muted-foreground">Location Target</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search place or address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="pl-10 h-14 bg-secondary/30 border-border/50 rounded-xl text-lg focus-visible:ring-accent"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-accent" size={18} />
            )}
            {searchQuery && !isSearching && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions([]);
                }}
              >
                <X size={16} />
              </Button>
            )}
          </div>

          {/* Autocomplete Results */}
          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 bg-card/95 backdrop-blur-md border-border/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="max-h-[240px] overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.latitude}-${s.longitude}-${i}`}
                    className="w-full text-left p-4 hover:bg-primary/10 transition-colors border-b border-border/30 last:border-none group"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="text-primary mt-1 shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{s.address}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Radius Selector */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-headline uppercase tracking-widest text-muted-foreground">Radius Selector</Label>
            <span className="text-sm font-bold text-accent">{radius[0]}m</span>
          </div>
          <Card className="p-6 bg-secondary/20 border-border/50 rounded-xl">
            <Slider 
              value={radius} 
              onValueChange={setRadius} 
              max={1000} 
              min={50} 
              step={50}
              className="py-4"
            />
            <p className="text-[10px] text-muted-foreground/60 mt-2 text-center uppercase tracking-tighter">
              Adjust triggering distance from center point
            </p>
          </Card>
        </div>

        {/* Map Preview Area */}
        <div className="space-y-4">
          <Label className="text-xs font-headline uppercase tracking-widest text-muted-foreground">Adaptive Geo-Point</Label>
          <div className="aspect-video bg-secondary/30 rounded-xl border border-border/50 relative overflow-hidden flex items-center justify-center">
            <img 
              src={`https://picsum.photos/seed/${location.latitude}/600/300`} 
              alt="Location map" 
              className="absolute inset-0 object-cover opacity-50 grayscale contrast-125"
              data-ai-hint="city map"
            />
            <div className="relative z-10 flex flex-col items-center gap-3 bg-card/90 backdrop-blur-md p-4 rounded-xl border border-border shadow-2xl max-w-[80%]">
              <div className="p-2 bg-primary/20 rounded-full">
                <MapPin className="text-primary" size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold truncate w-full">{location.address || "Untitled Location"}</p>
                <p className="text-[10px] text-muted-foreground">Lat: {location.latitude.toFixed(4)} Lon: {location.longitude.toFixed(4)}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs gap-2 rounded-lg border-primary/30 text-primary"
                onClick={handleUseCurrentLocation}
                disabled={isLocLoading}
              >
                {isLocLoading ? <Loader2 className="animate-spin" size={12} /> : <Navigation size={12} />} 
                Use current location
              </Button>
            </div>
          </div>
        </div>

        <Button 
          className="w-full h-16 rounded-xl text-lg font-headline font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 gap-3"
          onClick={handleSave}
          disabled={!title}
        >
          <CheckCircle2 size={24} />
          Activate Proximity Pin
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
