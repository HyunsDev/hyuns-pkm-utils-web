import { Link } from "react-router";
import type { MetaArgs } from "react-router";
import {
  ArrowRight,
  Image as ImageIcon,
  PenSquare,
  Rows,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { SidebarInset, SidebarTrigger } from "~/components/ui/sidebar";
import { Separator } from "~/components/ui/separator";
import { MainSidebar } from "~/containers/MainSidebar/MainSidebar";

type ToolItem = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const toolItems: ToolItem[] = [
  {
    title: "SVG 아이콘 생성",
    description: "SVG 코드에 배경과 여백을 적용하고 PNG로도 내보내보세요.",
    href: "/svg-icon",
    icon: PenSquare,
  },
  {
    title: "이미지 아이콘 생성",
    description:
      "원본 이미지를 불러와 1:1 아이콘과 배경 이미지를 자동으로 생성합니다.",
    href: "/image-icon",
    icon: ImageIcon,
  },
  {
    title: "라인 생성",
    description:
      "색상과 굵기를 조절하며 균등한 라인 배너 이미지를 만들어보세요.",
    href: "/line",
    icon: Rows,
  },
];

const highlightItems = [
  {
    title: "PKM 워크플로에 딱 맞는 도구",
    description:
      "노트, 위키, 슬라이드 등 어디에나 활용할 아이콘과 배경 이미지를 빠르게 준비할 수 있어요.",
  },
  {
    title: "브라우저만 있으면 OK",
    description:
      "별도의 설치 없이 웹에서 바로 편집하고 결과물을 다운로드하세요. 모든 데이터는 로컬에서 처리됩니다.",
  },
  {
    title: "세심한 제어 옵션",
    description:
      "여백, 둥근 모서리, 색상 프리셋 등 자주 쓰는 옵션을 한 번에 지정해 반복 작업 시간을 줄여줍니다.",
  },
];

export function meta({}: MetaArgs) {
  return [
    { title: "Hyuns PKM Utils" },
    {
      name: "description",
      content:
        "PKM 문서와 자료를 위한 아이콘·배경 생성 도구 모음. SVG, 이미지, 라인 배너까지 한 곳에서 처리하세요.",
    },
  ];
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full max-w-full">
      <MainSidebar />

      <SidebarInset className="bg-muted/20 w-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[100dvw] flex-1 flex-col">
          <header className="sticky top-0 z-20 flex w-full items-center gap-3 border-b bg-background/80 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
            <SidebarTrigger />
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight sm:text-xl">
                Hyuns PKM Utils
              </h1>
            </div>
          </header>

          <main className="flex-1 space-y-8 px-4 py-6 sm:px-6 lg:px-12">
            <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 sm:p-12">
              <div className="absolute inset-x-12 -top-24 hidden h-48 rounded-full bg-primary/20 blur-3xl sm:block" />
              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-4 max-w-xl">
                  <Badge className="w-fit gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                    <Sparkles className="size-3" aria-hidden="true" />
                    새로운 워크플로 실험실
                  </Badge>
                  <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                    반복 작업을 줄여주는 개인 지식관리 도구 세트
                  </h2>
                  <p className="text-base text-muted-foreground sm:text-lg">
                    디자인 도구를 켜지 않고도 노트 앱, 블로그, 위키에 맞는
                    아트워크를 1분 안에 만들어보세요. 준비된 템플릿과 직관적인
                    옵션으로 결과물을 빠르게 확보할 수 있습니다.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button size="lg" className="sm:w-auto" asChild>
                      <Link to="/svg-icon" className="flex items-center gap-2">
                        바로 시작하기
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="flex w-full max-w-xs flex-col gap-3 rounded-2xl border bg-background/60 p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    추천 시작 경로
                  </p>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2">
                      <span>아이콘부터 준비하기</span>
                      <ArrowRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </li>
                    <li className="flex items-center justify-between rounded-xl border bg-muted/20 px-3 py-2">
                      <span>배경 이미지 완성</span>
                      <ArrowRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </li>
                    <li className="flex items-center justify-between rounded-xl border bg-muted/20 px-3 py-2">
                      <span>라인 배너로 마무리</span>
                      <ArrowRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold sm:text-xl">
                  hyuns pkm utils 도구들
                </h3>
                <p className="text-sm text-muted-foreground sm:text-base">
                  자주 사용하는 에디터별 요구 사항을 반영한 맞춤 도구들을
                  확인하세요.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {toolItems.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Card
                      key={tool.href}
                      className="flex h-full flex-col border-border/80 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                    >
                      <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="size-5" aria-hidden="true" />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          asChild
                        >
                          <Link to={tool.href}>
                            열어보기
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col gap-3">
                        <div className="space-y-2">
                          <CardTitle>{tool.title}</CardTitle>
                          <CardDescription>{tool.description}</CardDescription>
                        </div>
                        <div className="mt-auto pt-2">
                          <Button
                            className="w-full"
                            variant="secondary"
                            asChild
                          >
                            <Link
                              to={tool.href}
                              className="flex items-center justify-center gap-2"
                            >
                              바로 이동
                              <ArrowRight
                                className="size-4"
                                aria-hidden="true"
                              />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 rounded-2xl border bg-card/80 p-8 sm:grid-cols-3">
              {highlightItems.map((item) => (
                <article key={item.title} className="space-y-2">
                  <h4 className="text-base font-semibold sm:text-lg">
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </article>
              ))}
            </section>
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
