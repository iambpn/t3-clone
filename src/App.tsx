import { ClerkProvider } from "@clerk/react-router";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./App.css";
import { ThemeProvider } from "./components/theme-provider";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl={"/"}>
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
          <RootLayout />
        </ThemeProvider>
      </ClerkProvider>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
