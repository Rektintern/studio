
"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Shield, Bell, Zap, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const router = useRouter();

  return (
    <div className="px-6 pt-10 pb-24 min-h-screen animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50" onClick={() => router.back()}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-2xl font-headline font-bold text-foreground">Settings</h1>
      </header>

      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-primary" />
            <h2 className="text-sm font-headline font-semibold text-muted-foreground uppercase tracking-widest">Notification Frequency</h2>
          </div>
          <Card className="p-6 bg-secondary/20 border-border/50 rounded-xl">
            <RadioGroup defaultValue="immediate" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="immediate" className="font-semibold">Immediate Alert</Label>
                  <p className="text-[10px] text-muted-foreground">Notify as soon as I enter the radius</p>
                </div>
                <RadioGroupItem value="immediate" id="immediate" className="border-primary text-primary" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="summary" className="font-semibold">Contextual Summary</Label>
                  <p className="text-[10px] text-muted-foreground">Group alerts by proximity zones</p>
                </div>
                <RadioGroupItem value="summary" id="summary" className="border-primary text-primary" />
              </div>
            </RadioGroup>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-accent" />
            <h2 className="text-sm font-headline font-semibold text-muted-foreground uppercase tracking-widest">Proximity Engine</h2>
          </div>
          <Card className="p-6 bg-secondary/20 border-border/50 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-semibold">High Accuracy Mode</Label>
                <p className="text-[10px] text-muted-foreground">Uses GPS + WiFi for sub-meter tracking</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="font-semibold">Battery Saver</Label>
                <p className="text-[10px] text-muted-foreground">Lower polling rate when stationary</p>
              </div>
              <Switch />
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-muted-foreground" />
            <h2 className="text-sm font-headline font-semibold text-muted-foreground uppercase tracking-widest">Data & Privacy</h2>
          </div>
          <Card className="p-6 bg-secondary/20 border-border/50 rounded-xl space-y-4">
            <Button variant="ghost" className="w-full justify-start text-xs font-semibold gap-3 h-10 px-0 hover:bg-transparent hover:text-primary">
              <Map size={16} /> Export Location History
            </Button>
            <div className="border-t border-border/50 pt-4">
              <Button variant="ghost" className="w-full justify-start text-xs font-semibold gap-3 h-10 px-0 text-destructive hover:bg-transparent hover:text-destructive/80">
                Clear All Geo-Data
              </Button>
            </div>
          </Card>
        </section>

        <div className="pt-10 flex flex-col items-center gap-2 opacity-30">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-headline font-bold">NR</div>
          <p className="text-[10px] font-medium tracking-widest">NearRemind v1.0.4</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
