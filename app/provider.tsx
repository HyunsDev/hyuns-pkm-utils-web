import { SidebarProvider } from "./components/ui/sidebar";
import { Toaster } from "./components/ui/sonner";

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="min-w-screen">
      {children}
      <Toaster />
    </SidebarProvider>
  );
}
