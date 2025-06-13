import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function LoadingSpinner({ className }: Props) {
  return <span className={cn("loader flex", className)}></span>;
}
