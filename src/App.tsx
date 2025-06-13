import { ClerkLoaded, ClerkLoading, ClerkProvider, useAuth } from "@clerk/react-router";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import "./App.css";
import { LoadingProgress } from "./components/loadingProgress";
import { ThemeProvider } from "./components/theme-provider";
import { ToasterWrapper } from "./components/toasterWrapper";
import WelcomeMessage from "./components/WelcomeMessage";
import RootLayout from "./layouts/RootLayout";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
        <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl={"/"}>
          <ClerkLoaded>
            <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
              <Outlet />
            </ConvexProviderWithClerk>
          </ClerkLoaded>
          <ClerkLoading>
            <div className='flex h-screen w-full flex-col '>
              <LoadingProgress />
              <div className='flex-1 flex items-center justify-center'>
                <WelcomeMessage />
              </div>
            </div>
          </ClerkLoading>
        </ClerkProvider>
        <ToasterWrapper />
      </ThemeProvider>
    ),
    children: [
      {
        index: true,
        element: <RootLayout />,
      },
      {
        path: ":conversationId",
        element: <RootLayout />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
