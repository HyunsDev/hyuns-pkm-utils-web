import * as React from "react";
import { Link, useLocation } from "react-router";
import { Home, Image, PenSquare, Rows } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

import type { LucideIcon } from "lucide-react";
import { SelectSite } from "./SelectSite";

type ExternalLinkItem = {
  label: string;
  href: string;
};

type NavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "대시보드",
    items: [{ label: "홈", href: "/", icon: Home }],
  },
  {
    label: "아이콘 도구",
    items: [
      { label: "SVG 아이콘 생성", href: "/svg-icon", icon: PenSquare },
      { label: "이미지 아이콘 생성", href: "/image-icon", icon: Image },
      { label: "라인 생성", href: "/line", icon: Rows },
    ],
  },
];

function isExternalHref(href: string) {
  return /^https?:\/\//.test(href) || href.startsWith("mailto:");
}

export function MainSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  const isActive = React.useCallback(
    (href: string) => {
      if (isExternalHref(href)) {
        return false;
      }

      return location.pathname === href;
    },
    [location.pathname]
  );

  return (
    <Sidebar className="border-r" {...props}>
      <SidebarHeader className="gap-2">
        <SelectSite />
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link
                          to={item.href}
                          className="flex w-full items-center gap-2"
                        >
                          {Icon ? (
                            <Icon className="size-4" aria-hidden="true" />
                          ) : null}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t pt-2">
        <div className="flex justify-between items-center">
          <span className="px-2 text-xs text-muted-foreground">
            Developed By{" "}
            <a
              href="https://hyuns.dev"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              HyunsDev
            </a>
          </span>
          <a
            href="https://github.com/hyunsdev/hyuns-pkm-utils-web"
            target="_blank"
            rel="noreferrer"
          >
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 fill-muted-foreground hover:fill-foreground transition-colors"
            >
              <title>GitHub</title>
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
