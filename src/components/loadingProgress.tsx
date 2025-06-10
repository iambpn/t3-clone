import { useEffect, useState } from "react";
import { Progress } from "./ui/progress";

export function LoadingProgress() {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer90 = setTimeout(() => setProgress(90), 100);
    const timer95 = setTimeout(() => setProgress(95), 130);
    const timer98 = setTimeout(() => setProgress(98), 150);
    const timer99 = setTimeout(() => setProgress(99), 180);

    return () => {
      clearTimeout(timer90);
      clearTimeout(timer95);
      clearTimeout(timer98);
      clearTimeout(timer99);
    };
  }, []);

  return <Progress value={progress} className='w-full transition-all h-[2px]' />;
}
