
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ChevronLeft, MapPin, Sparkles, Navigation, CheckCircle2, Loader2 } from "lucide-react";
import { saveReminder } from "@/lib/store";
import { Reminder, Location } from "@/lib/types";
import { suggestLocationTags } from "@/ai/flows/suggest-location-tags";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/components/location-provider";

export default function AddReminder() {
  const router = useRouter();
  const { toast } = useToast();
  const { location: currentLoc, isLoading: isLocLoading } = useLocation();
  const [title, setTitle] = useState("");
  const [radius, setRadius] = useState([200]);
  const [tags, setTags] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [location, setLocation] = useState<Location>({
    latitude: 37.7749,
    longitude: -122.4194,
    address: "San Francisco, CA"
  });

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
        <div className="space-y-2">
          <Label className="text-xs font-headline uppercase tracking-widest text-muted-foreground">What to remember?</Label>
          <div className="relative">
            <Input 
              placeholder="e.g. Buy groceries at Market St" 
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

        <div className="space-y-4">
          <Label className="text-xs font-headline uppercase tracking-widest text-muted-foreground">Adaptive Geo-Point</Label>
          <div className="aspect-video bg-secondary/30 rounded-xl border border-border/50 relative overflow-hidden flex items-center justify-center">
            <img 
              src="https://picsum.photos/seed/location-map/600/300" 
              alt="Location map" 
              className="absolute inset-0 object-cover opacity-50 grayscale contrast-125"
              data-ai-hint="city map"
            />
            <div className="relative z-10 flex flex-col items-center gap-3 bg-card/90 backdrop-blur-md p-4 rounded-xl border border-border shadow-2xl max-w-[80%]">
              <div className="p-2 bg-primary/20 rounded-full">
                <MapPin className="text-primary" size={24} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold truncate w-full">{location.address}</p>
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
