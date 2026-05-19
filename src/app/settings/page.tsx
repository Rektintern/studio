"use client";

import { BottomNav } from "@/components/layout/BottomNav";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Shield, Bell, Zap, Map, Info, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLocation } from "@/components/location-provider";

export default function Settings() {
  const router = useRouter();
  const { permissionStatus } = useLocation();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-6 pt-12 pb-32 min-h-screen"
    >
      <header className="flex items-center gap-4 mb-10">
        <Button variant="ghost" size="icon" className="rounded-2xl bg-muted/50 text-foreground" onClick={() => router.back()}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-2xl font-headline font-bold text-foreground">App Preferences</h1>
      </header>

      <div className="space-y-10">
        {permissionStatus === 'denied' && (
          <Card className="p-6 bg-destructive/5 border border-destructive/20 rounded-3xl">
            <div className="flex gap-4">
              <div className="p-2 bg-destructive/10 rounded-xl h-fit">
                <AlertTriangle className="text-destructive" size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-destructive">Tracking Restricted</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your browser has blocked location access. Please enable it in your browser settings and refresh the page to use geofencing.
                </p>
              </div>
            </div>
          </Card>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Bell size={16} className="text-primary" />
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Notification Engine</h2>
          </div>
          <Card className="bg-card border-none native-shadow rounded-3xl overflow-hidden">
            <RadioGroup defaultValue="immediate" className="divide-y divide-border/20">
              <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="immediate" className="font-bold text-base">Instant Alert</Label>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Notify precisely when crossing geofence bounds.</p>
                </div>
                <RadioGroupItem value="immediate" id="immediate" className="w-5 h-5 border-2" />
              </div>
              <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                <div className="space-y-1 pr-4">
                  <Label htmlFor="summary" className="font-bold text-base">Smart Summary</Label>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Cluster nearby reminders into a single alert.</p>
                </div>
                <RadioGroupItem value="summary" id="summary" className="w-5 h-5 border-2" />
              </div>
            </RadioGroup>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Zap size={16} className="text-accent" />
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Geo-Performance</h2>
          </div>
          <Card className="p-6 bg-card border-none native-shadow rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 pr-4">
                <Label className="font-bold text-base">Enhanced Accuracy</Label>
                <p className="text-[11px] text-muted-foreground">Utilize sub-meter tracking for dense urban areas.</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-border/20">
              <div className="space-y-1 pr-4">
                <Label className="font-bold text-base">Background Polling</Label>
                <p className="text-[11px] text-muted-foreground">Keep tracking active when the screen is locked.</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-primary" />
            </div>
          </Card>
          <p className="px-1 text-[10px] text-muted-foreground/60 leading-relaxed italic">
            Note: For the best background performance, keep this tab open or add the app to your home screen.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield size={16} className="text-muted-foreground" />
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Security & Privacy</h2>
          </div>
          <div className="space-y-3">
            <Button variant="outline" className="w-full h-14 justify-between bg-card border-none native-shadow rounded-2xl px-6 group">
              <div className="flex items-center gap-3">
                <Map size={18} className="text-primary" />
                <span className="font-bold text-sm">Export My History</span>
              </div>
              <ChevronLeft size={16} className="rotate-180 opacity-30 group-hover:opacity-100 transition-opacity" />
            </Button>
            <Button variant="outline" className="w-full h-14 justify-between bg-card border-none native-shadow rounded-2xl px-6 group">
              <div className="flex items-center gap-3">
                <Info size={18} className="text-muted-foreground" />
                <span className="font-bold text-sm">Privacy Dashboard</span>
              </div>
              <ChevronLeft size={16} className="rotate-180 opacity-30 group-hover:opacity-100 transition-opacity" />
            </Button>
            <Button variant="ghost" className="w-full h-14 text-destructive font-bold hover:bg-destructive/5 rounded-2xl">
              Purge All Local Data
            </Button>
          </div>
        </section>

        <div className="pt-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-primary flex items-center justify-center text-white native-shadow-lg transform rotate-3">
            <Zap size={32} fill="white" />
          </div>
          <div className="text-center">
            <p className="text-xs font-headline font-bold tracking-widest uppercase">NearRemind</p>
            <p className="text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-tighter">Version 1.2.0 • Build 842</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </motion.div>
  );
}
