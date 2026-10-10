import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { NavPage, SystemInfo } from "../types";
import { AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button";

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
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-200">
      {/* Sidebar */}
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

        {/* Backend Offline Notification */}
        {!backendOnline && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 select-none shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Mất kết nối máy chủ AI (<code className="font-mono text-amber-950 dark:text-amber-300 font-semibold">127.0.0.1:8000</code>). Vui lòng đảm bảo tiến trình Python backend đang chạy.
              </span>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={onRefreshSystem}
              className="text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-500/40 bg-amber-100 dark:bg-amber-500/10 hover:bg-amber-200 dark:hover:bg-amber-500/20"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Dynamic Page Content - Full Width */}
        <main className="flex-1 min-h-0 overflow-y-auto p-6 bg-transparent w-full custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
