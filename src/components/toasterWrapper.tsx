import { Toaster } from "sonner";
import { useTheme } from "./theme-provider";

export function ToasterWrapper() {
  const theme = useTheme();
  return <Toaster theme={theme.theme} richColors={true} />;
}
