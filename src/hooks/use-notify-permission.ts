"use client";

import { useCallback, useEffect, useState } from "react";
import { requestNotifyPermission } from "@/lib/notify";

export type NotifyState = NotificationPermission | "unsupported";

export interface NotifyEnv {
  /** iPhone/iPad — web notifications only work once added to the Home Screen. */
  ios: boolean;
  /** Running as an installed PWA (Home Screen / standalone) rather than a tab. */
  standalone: boolean;
}

function detectEnv(): NotifyEnv {
  if (typeof navigator === "undefined") return { ios: false, standalone: false };
  const ua = navigator.userAgent || "";
  const iOSClassic = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as desktop Safari; sniff touch points to catch it.
  const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
  const standalone =
    (typeof window !== "undefined" && !!window.matchMedia?.("(display-mode: standalone)").matches) ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return { ios: iOSClassic || iPadOS, standalone };
}

/**
 * Reactive notification-permission state for UI. Returns the live permission
 * ("granted" | "denied" | "default" | "unsupported"), the environment (to tailor
 * guidance), and a `request` that prompts (must be called from a user gesture).
 */
export function useNotifyPermission() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<NotifyState>("default");
  const [env, setEnv] = useState<NotifyEnv>({ ios: false, standalone: false });

  useEffect(() => {
    setEnv(detectEnv());
    if (typeof window === "undefined" || !("Notification" in window)) {
      setState("unsupported");
      setReady(true);
      return;
    }
    setState(Notification.permission);
    setReady(true);

    // Some browsers expose permission changes via the Permissions API.
    let status: PermissionStatus | null = null;
    const onChange = () => setState(Notification.permission);
    navigator.permissions
      ?.query?.({ name: "notifications" as PermissionName })
      .then((s) => {
        status = s;
        s.onchange = onChange;
      })
      .catch(() => {});
    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  const request = useCallback(async () => {
    const result = await requestNotifyPermission();
    setState(result);
    return result;
  }, []);

  return { ready, state, env, request };
}
