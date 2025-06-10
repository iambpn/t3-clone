import { useAuth } from "@clerk/react-router";
import { Navigate } from "react-router";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const currentUrl = window.location.pathname;

  if (!isSignedIn) {
    return <Navigate to='/' replace />;
  }

  if (isSignedIn && currentUrl === "/") {
    return <Navigate to='/chat' replace />;
  }

  return <>{children}</>;
}
