import { createBrowserRouter, RouterProvider } from "react-router";
import "./App.css";
import IndexPage from "./pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <IndexPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
