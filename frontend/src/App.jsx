import { Suspense, lazy } from "react";
import { useRoute } from "./lib/route.js";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AdminProvider } from "./context/AdminContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { StatsProvider } from "./context/StatsContext.jsx";
import { DrawerProvider } from "./context/DrawerContext.jsx";
import Layout from "./components/Layout.jsx";
import { Skeleton } from "./components/ui.jsx";

const PAGES = {
  overview: lazy(() => import("./pages/Overview.jsx")),
  transactions: lazy(() => import("./pages/Transactions.jsx")),
  review: lazy(() => import("./pages/ReviewQueue.jsx")),
  try: lazy(() => import("./pages/TryIt.jsx")),
  rules: lazy(() => import("./pages/Rules.jsx")),
};

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function App() {
  const [route] = useRoute();
  const active = PAGES[route] ? route : "overview";
  const Page = PAGES[active];

  return (
    <ToastProvider>
      <AdminProvider>
        <SocketProvider>
          <StatsProvider>
            <DrawerProvider>
              <Layout route={active}>
                <Suspense fallback={<PageFallback />}>
                  <Page />
                </Suspense>
              </Layout>
            </DrawerProvider>
          </StatsProvider>
        </SocketProvider>
      </AdminProvider>
    </ToastProvider>
  );
}
