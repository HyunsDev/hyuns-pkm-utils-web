import {
  Check,
  ChevronsUpDown,
  GalleryVerticalEnd,
  PencilRuler,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

const sites = [
  { name: "hyuns.dev", url: "https://hyuns.dev" },
  { name: "hyuns.space", url: "https://hyuns.space" },
];

export function SelectSite() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <PencilRuler className="size-4" />
              </div>
              <div className="flex flex-col gap-1 leading-none">
                <span className="font-medium">Hyuns PKM utils</span>
                <span className="text-muted-foreground">
                  pkm-utils.hyuns.dev
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {sites.map((site) => (
              <DropdownMenuItem key={site.name}>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-between"
                >
                  {site.name}
                  <Check className="opacity-0" />
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
