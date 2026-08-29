import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { SystemStats } from "../types";

export interface StatsSample extends SystemStats {
  t: number;
}

export function useSystemStats(intervalMs = 1000, historyLength = 60) {
  const [current, setCurrent] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<StatsSample[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let timer: number;

    async function tick() {
      try {
        const stats = await invoke<SystemStats>("get_system_stats");
        if (!mounted.current) return;
        setCurrent(stats);
        setHistory((prev) => {
          const next = [...prev, { ...stats, t: Date.now() }];
          return next.length > historyLength ? next.slice(next.length - historyLength) : next;
        });
      } catch (e) {
        console.error("get_system_stats failed", e);
      } finally {
        if (mounted.current) {
          timer = window.setTimeout(tick, intervalMs);
        }
      }
    }

    tick();
    return () => {
      mounted.current = false;
      window.clearTimeout(timer);
    };
  }, [intervalMs, historyLength]);

  return { current, history };
}
