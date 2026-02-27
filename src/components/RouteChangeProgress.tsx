import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export const RouteChangeProgress = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    setVisible(true);
    setProgress(15);

    intervalId = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const next = prev + Math.random() * 15;
        return next > 90 ? 90 : next;
      });
    }, 150);

    timeoutId = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }, 700);

    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
      <div className="mx-auto max-w-6xl px-4">
        <Progress
          value={progress}
          className="h-1 rounded-full bg-background/40 overflow-hidden shadow-[0_0_12px_rgba(0,0,0,0.35)]"
        />
      </div>
    </div>
  );
};

