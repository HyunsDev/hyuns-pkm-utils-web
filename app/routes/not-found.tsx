import { Link } from "react-router";
import type { MetaArgs } from "react-router";
import { ArrowLeft, Compass } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { SidebarInset, SidebarTrigger } from "~/components/ui/sidebar";
import { MainSidebar } from "~/containers/MainSidebar/MainSidebar";

export function meta({}: MetaArgs) {
  return [
    { title: "페이지를 찾을 수 없습니다" },
    {
      name: "description",
      content: "요청하신 페이지를 찾을 수 없습니다. 홈 화면으로 돌아가주세요.",
    },
  ];
}

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen w-full max-w-full">
      <MainSidebar />

      <SidebarInset className="bg-muted/20 w-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[100dvw] flex-1 flex-col">
          <header className="sticky top-0 z-20 flex w-full items-center gap-3 border-b bg-background/80 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
            <SidebarTrigger />
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">
                Error 404
              </p>
              <h1 className="text-xl font-semibold tracking-tight sm:text-xl">
                페이지가 존재하지 않습니다
              </h1>
            </div>
          </header>

          <main className="flex-1 px-4 py-12 sm:px-6 lg:px-12">
            <div className="flex h-full min-h-[60dvh] items-center justify-center">
              <Card className="max-w-xl">
                <CardHeader className="space-y-4 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Compass className="size-6" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-2xl font-semibold">
                    요청하신 페이지를 찾을 수 없습니다
                  </CardTitle>
                  <CardDescription className="text-base">
                    주소가 변경되었거나 삭제되었을 수 있어요. 아래 버튼을 눌러
                    홈으로 돌아가 다른 도구를 탐색해 보세요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild size="lg">
                    <Link to="/">
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      홈으로 돌아가기
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/svg-icon">SVG 아이콘 생성로 이동</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
