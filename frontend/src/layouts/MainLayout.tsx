import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { NavPage, SystemInfo } from "../types";
import { AlertCircle } from "lucide-react";

interface MainLayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  systemInfo: SystemInfo | null;
  backendOnline: boolean;
  onRefreshSystem: () => void;
  isRefreshing: boolean;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  onNavigate,
  systemInfo,
  backendOnline,
  onRefreshSystem,
  isRefreshing,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        systemInfo={systemInfo}
        backendOnline={backendOnline}
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          currentPage={currentPage}
          onNavigate={onNavigate}
          systemInfo={systemInfo}
          onRefreshSystem={onRefreshSystem}
          isRefreshing={isRefreshing}
        />

        {/* Backend Offline Warning Banner */}
        {!backendOnline && (
          <div className="bg-amber-950/40 border-b border-amber-500/20 px-6 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Backend Core Disconnected:</strong> Could not reach FastAPI at{" "}
                <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">127.0.0.1:8000</code>.
                Make sure the backend is running via <code className="bg-black/40 px-1 py-0.5 rounded">python scripts/dev.py</code>.
              </span>
            </div>
            <button
              onClick={onRefreshSystem}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-medium transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#09090b]">
          {children}
        </main>
      </div>
    </div>
  );
};
