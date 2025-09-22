import { useCallback, useEffect, useState } from "react";
import type { MetaArgs } from "react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SidebarInset, SidebarTrigger } from "~/components/ui/sidebar";
import { Textarea } from "~/components/ui/textarea";
import { MainSidebar } from "~/containers/MainSidebar/MainSidebar";
import {
  addBackgroundAndPadding,
  encodeBase64,
  generateBackgroundImageSvg,
} from "./functions";
import { COLOR_PRESETS } from "../../data/color-preset";

const DEFAULT_COLOR = "#ffffff";
const DEFAULT_ICON_COLOR = "#000000";

type DataTarget = "icon" | "background";

type DownloadConfig = {
  label: string;
  suffix: string;
  pngSize: {
    width: number;
    height: number;
  };
};

const DOWNLOAD_CONFIG: Record<DataTarget, DownloadConfig> = {
  icon: {
    label: "아이콘",
    suffix: "icon",
    pngSize: { width: 512, height: 512 },
  },
  background: {
    label: "배경",
    suffix: "wallpaper",
    pngSize: { width: 1500, height: 600 },
  },
};

function normalizeHex(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(prefixed)
    ? prefixed.toLowerCase()
    : null;
}

export function meta({}: MetaArgs) {
  return [
    { title: "SVG 아이콘 생성 | Hyuns PKM Utils" },
    {
      name: "description",
      content:
        "SVG 코드에 배경과 여백을 적용하고 아이콘/배경 이미지를 만들어보세요.",
    },
  ];
}

export default function SvgIconGeneratorPage() {
  const [svgInput, setSvgInput] = useState("");
  const [bgColor, setBgColor] = useState(DEFAULT_COLOR);
  const [bgHexInput, setBgHexInput] = useState(DEFAULT_COLOR);
  const [iconColor, setIconColor] = useState(DEFAULT_ICON_COLOR);
  const [iconHexInput, setIconHexInput] = useState(DEFAULT_ICON_COLOR);
  const [cornerRadius, setCornerRadius] = useState(12);
  const [padding, setPadding] = useState(4);
  const [iconDataUrl, setIconDataUrl] = useState("");
  const [backgroundDataUrl, setBackgroundDataUrl] = useState("");
  const [iconSvg, setIconSvg] = useState("");
  const [backgroundSvg, setBackgroundSvg] = useState("");
  const [baseFilename, setBaseFilename] = useState("my");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBgHexInput(bgColor);
  }, [bgColor]);

  useEffect(() => {
    setIconHexInput(iconColor);
  }, [iconColor]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const value = svgInput.trim();

    if (!value) {
      setError(null);
      setIconDataUrl("");
      setBackgroundDataUrl("");
      setIconSvg("");
      setBackgroundSvg("");
      return;
    }

    if (!value.startsWith("<svg")) {
      setError("유효한 SVG 코드를 입력해주세요.");
      setIconDataUrl("");
      setBackgroundDataUrl("");
      setIconSvg("");
      setBackgroundSvg("");
      return;
    }

    try {
      const iconSvgMarkup = addBackgroundAndPadding(
        value,
        bgColor,
        cornerRadius,
        padding,
        iconColor
      );
      const iconUrl = `data:image/svg+xml;base64,${encodeBase64(
        iconSvgMarkup
      )}`;
      const backgroundSvgMarkup = generateBackgroundImageSvg(iconUrl, bgColor);
      const backgroundUrl = `data:image/svg+xml;base64,${encodeBase64(
        backgroundSvgMarkup
      )}`;

      setIconDataUrl(iconUrl);
      setBackgroundDataUrl(backgroundUrl);
      setIconSvg(iconSvgMarkup);
      setBackgroundSvg(backgroundSvgMarkup);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "SVG 처리 중 오류가 발생했습니다.";
      setError(message);
      setIconDataUrl("");
      setBackgroundDataUrl("");
      setIconSvg("");
      setBackgroundSvg("");
    }
  }, [svgInput, bgColor, cornerRadius, padding, iconColor]);

  const createFilename = useCallback(
    (target: DataTarget, extension: "svg" | "png") => {
      const base = baseFilename.trim() || "image";
      const safeBase = base.replace(/\s+/g, "-");
      return `${safeBase}-${DOWNLOAD_CONFIG[target].suffix}.${extension}`;
    },
    [baseFilename]
  );

  const handleCopySvg = useCallback(
    async (value: string, target: DataTarget) => {
      if (!value) {
        toast.warning("복사할 데이터가 없습니다.");
        return;
      }

      if (typeof navigator === "undefined" || !navigator.clipboard) {
        toast.error("이 환경에서는 클립보드를 사용할 수 없습니다.");
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        toast.success(
          `${DOWNLOAD_CONFIG[target].label} SVG 코드를 복사했어요.`
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "클립보드 복사에 실패했어요.";
        toast.error(message);
      }
    },
    []
  );

  const handleDownloadSvg = useCallback(
    (value: string, target: DataTarget) => {
      if (!value) {
        toast.warning("다운로드할 데이터가 없습니다.");
        return;
      }

      const link = document.createElement("a");
      link.href = value;
      link.download = createFilename(target, "svg");
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${DOWNLOAD_CONFIG[target].label} SVG를 다운로드했어요.`);
    },
    [createFilename]
  );

  const handleDownloadPng = useCallback(
    (target: DataTarget) => {
      const svgMarkup = target === "icon" ? iconSvg : backgroundSvg;

      if (!svgMarkup) {
        toast.warning("PNG로 변환할 SVG가 없습니다.");
        return;
      }

      const { width, height } = DOWNLOAD_CONFIG[target].pngSize;
      const svgDataUrl = `data:image/svg+xml;base64,${encodeBase64(svgMarkup)}`;
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");

        if (!context) {
          toast.error("캔버스 컨텍스트를 생성할 수 없습니다.");
          return;
        }

        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error("PNG 변환에 실패했어요.");
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = createFilename(target, "png");
          link.rel = "noopener";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success(
            `${DOWNLOAD_CONFIG[target].label} PNG를 다운로드했어요.`
          );
        }, "image/png");
      };

      image.onerror = () => {
        toast.error("SVG 이미지를 불러오지 못했습니다.");
      };

      image.src = svgDataUrl;
    },
    [backgroundSvg, createFilename, iconSvg]
  );

  const handleBgColorChange = useCallback((value: string) => {
    setBgColor(value);
  }, []);

  const handleBgHexChange = useCallback((value: string) => {
    setBgHexInput(value);
    const normalized = normalizeHex(value);
    if (normalized) {
      setBgColor(normalized);
    }
  }, []);

  const handleIconColorChange = useCallback((value: string) => {
    setIconColor(value);
  }, []);

  const handleIconHexChange = useCallback((value: string) => {
    setIconHexInput(value);
    const normalized = normalizeHex(value);
    if (normalized) {
      setIconColor(normalized);
    }
  }, []);

  const handleApplyPreset = useCallback((icon: string, bg: string) => {
    setIconColor(icon);
    setBgColor(bg);
  }, []);

  const isPresetActive = useCallback(
    (icon: string, bg: string) => icon === iconColor && bg === bgColor,
    [bgColor, iconColor]
  );

  return (
    <div className="flex min-h-screen w-full max-w-full">
      <MainSidebar />

      <SidebarInset className="bg-muted/20 overflow-y-auto w-full">
        <div className="mx-auto flex w-full max-w-[100dvw] flex-1 flex-col">
          <header className="sticky top-0 z-20 flex w-full items-center gap-3 border-b bg-muted/40 px-4 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/60 sm:px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-semibold">SVG 아이콘 생성</h1>
              <p className="text-sm text-muted-foreground">
                SVG 코드에 배경, 모서리 둥글기, 여백을 적용한 아이콘과 배경
                이미지를 만들어보세요.
              </p>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row w-full gap-6">
              <Card className="w-full shadow-sm">
                <CardHeader>
                  <CardTitle>SVG 입력</CardTitle>
                  <CardDescription>
                    원하는 아이콘의 SVG 코드를 붙여넣고 배경과 아이콘 색상을
                    자유롭게 조절해보세요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="svgInput">SVG 코드</Label>
                    <Textarea
                      id="svgInput"
                      value={svgInput}
                      onChange={(event) => setSvgInput(event.target.value)}
                      placeholder="&lt;svg&gt;...&lt;/svg&gt; 형식의 SVG 코드를 입력하세요."
                      className="min-h-48 w-full resize-y break-words font-mono text-sm"
                      spellCheck={false}
                      wrap="soft"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseFilename">파일 이름</Label>
                    <Input
                      id="baseFilename"
                      value={baseFilename}
                      onChange={(event) => setBaseFilename(event.target.value)}
                      placeholder="my-icon"
                    />
                    <p className="text-sm text-muted-foreground">
                      아이콘은 `이름-icon`, 배경은 `이름-wallpaper` 형태로
                      저장돼요.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bgColor">배경색</Label>
                      <div className="flex gap-2 sm:flex-row">
                        <Input
                          id="bgColor"
                          type="color"
                          value={bgColor}
                          onChange={(event) =>
                            handleBgColorChange(event.target.value)
                          }
                          className="h-12 w-full max-w-[6rem] cursor-pointer p-1 sm:w-16"
                          title="배경색 선택"
                        />
                        <Input
                          aria-label="Hex 색상 코드"
                          value={bgHexInput}
                          onChange={(event) =>
                            handleBgHexChange(event.target.value)
                          }
                          className="h-12 w-full font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="iconColor">아이콘 색상</Label>
                      <div className="flex gap-2 sm:flex-row">
                        <Input
                          id="iconColor"
                          type="color"
                          value={iconColor}
                          onChange={(event) =>
                            handleIconColorChange(event.target.value)
                          }
                          className="h-12 w-full max-w-[6rem] cursor-pointer p-1 sm:w-16"
                          title="아이콘 색상 선택"
                        />
                        <Input
                          aria-label="아이콘 Hex 색상 코드"
                          value={iconHexInput}
                          onChange={(event) =>
                            handleIconHexChange(event.target.value)
                          }
                          className="h-12 w-full font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>컬러 프리셋</Label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((preset) => {
                          const active = isPresetActive(
                            preset.iconColor,
                            preset.backgroundColor
                          );
                          return (
                            <Button
                              key={preset.name}
                              type="button"
                              size="icon"
                              variant={active ? "default" : "outline"}
                              onClick={() =>
                                handleApplyPreset(
                                  preset.iconColor,
                                  preset.backgroundColor
                                )
                              }
                              className="flex items-center gap-2"
                            >
                              <span
                                className="h-4 w-4 rounded-full border"
                                style={{
                                  background: `linear-gradient(135deg, ${preset.iconColor} 0%, ${preset.backgroundColor} 100%)`,
                                }}
                                aria-hidden="true"
                              />
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="">
                        <div className="flex items-center justify-between text-sm">
                          <Label
                            htmlFor="cornerRadius"
                            className="cursor-pointer"
                          >
                            모서리 둥글기
                          </Label>
                          <span className="text-muted-foreground">
                            {cornerRadius}px
                          </span>
                        </div>
                        <input
                          id="cornerRadius"
                          type="range"
                          min={0}
                          max={50}
                          value={cornerRadius}
                          onChange={(event) =>
                            setCornerRadius(Number(event.target.value))
                          }
                          className="w-full cursor-pointer"
                        />
                      </div>

                      <div className="">
                        <div className="flex items-center justify-between text-sm">
                          <Label htmlFor="padding" className="cursor-pointer">
                            여백
                          </Label>
                          <span className="text-muted-foreground">
                            {padding}px
                          </span>
                        </div>
                        <input
                          id="padding"
                          type="range"
                          min={0}
                          max={30}
                          value={padding}
                          onChange={(event) =>
                            setPadding(Number(event.target.value))
                          }
                          className="w-full cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col w-full content-start gap-6">
                <Card className="w-full shadow-sm">
                  <CardHeader>
                    <CardTitle>아이콘 미리보기</CardTitle>
                    <CardDescription>
                      배경이 적용된 아이콘을 확인하고 SVG 코드 또는 PNG 파일로
                      저장할 수 있어요.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed bg-background p-6">
                      {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                      ) : iconDataUrl ? (
                        <img
                          src={iconDataUrl}
                          alt="아이콘 미리보기"
                          className="max-h-48 max-w-full"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          유효한 SVG 코드를 입력하면 미리보기가 표시됩니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      onClick={() => handleCopySvg(iconSvg, "icon")}
                      disabled={!iconSvg}
                    >
                      SVG 코드 복사
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownloadSvg(iconDataUrl, "icon")}
                      disabled={!iconDataUrl}
                      className="inline-flex items-center gap-2"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      SVG 다운로드
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownloadPng("icon")}
                      disabled={!iconSvg}
                      className="inline-flex items-center gap-2"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      PNG 다운로드
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="w-full shadow-sm">
                  <CardHeader>
                    <CardTitle>배경 이미지 (3000×1200)</CardTitle>
                    <CardDescription>
                      생성된 아이콘을 중앙에 배치한 배경 이미지를 제공합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-background p-6">
                      {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                      ) : backgroundDataUrl ? (
                        <img
                          src={backgroundDataUrl}
                          alt="배경 미리보기"
                          className="max-h-40 w-full object-contain"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          SVG 코드를 입력하면 자동으로 배경 이미지를 생성합니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      onClick={() => handleCopySvg(backgroundSvg, "background")}
                      disabled={!backgroundSvg}
                    >
                      SVG 코드 복사
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleDownloadSvg(backgroundDataUrl, "background")
                      }
                      disabled={!backgroundDataUrl}
                      className="inline-flex items-center gap-2"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      SVG 다운로드
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownloadPng("background")}
                      disabled={!backgroundSvg}
                      className="inline-flex items-center gap-2"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      PNG 다운로드
                    </Button>
                  </CardFooter>
                </Card>

                <p className="text-sm text-muted-foreground">
                  아이콘 소스가 필요하다면{" "}
                  <a
                    href="https://lucide.dev/icons/"
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    lucide.dev/icons
                  </a>
                  에서 다양한 예시를 확인해보세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
