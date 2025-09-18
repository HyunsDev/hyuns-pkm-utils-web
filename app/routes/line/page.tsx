import { useCallback, useEffect, useMemo, useState } from "react";
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
import { MainSidebar } from "~/containers/MainSidebar/MainSidebar";
import { COLOR_PRESETS } from "~/data/color-preset";
import { encodeBase64 } from "../svg-icon/functions";

const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 4;
const DEFAULT_RADIUS = 4;
const DEFAULT_COLOR = "#2463E9";
const DEFAULT_FILENAME = "notion-line";

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
    { title: "노션용 라인 생성 | Hyuns PKM Utils" },
    {
      name: "description",
      content: "노션에 사용할 얇은 사각형 라인 SVG를 제작해보세요.",
    },
  ];
}

export default function LineGeneratorPage() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [colorHexInput, setColorHexInput] = useState(DEFAULT_COLOR);
  const [baseFilename, setBaseFilename] = useState(DEFAULT_FILENAME);

  useEffect(() => {
    setColorHexInput(color);
  }, [color]);

  const svgMarkup = useMemo(() => {
    const safeWidth =
      Number.isFinite(width) && width > 0 ? width : DEFAULT_WIDTH;
    const safeHeight =
      Number.isFinite(height) && height > 0 ? height : DEFAULT_HEIGHT;
    const clampedRadius = Math.max(
      0,
      Math.min(radius, safeWidth / 2, safeHeight / 2)
    );

    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">\n  <rect width="${safeWidth}" height="${safeHeight}" rx="${clampedRadius}" ry="${clampedRadius}" fill="${color}" />\n</svg>`;
  }, [color, height, radius, width]);

  const svgDataUrl = useMemo(() => {
    try {
      return `data:image/svg+xml;base64,${encodeBase64(svgMarkup)}`;
    } catch (err) {
      console.error(err);
      return "";
    }
  }, [svgMarkup]);

  const createFilename = useCallback(
    (extension: "svg" | "png") => {
      const base = baseFilename.trim() || "notion-line";
      const safeBase = base.replace(/\s+/g, "-");
      return `${safeBase}.${extension}`;
    },
    [baseFilename]
  );

  const handleCopySvg = useCallback(async () => {
    if (!svgMarkup) {
      toast.warning("복사할 SVG가 없습니다.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("이 환경에서는 클립보드를 사용할 수 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(svgMarkup);
      toast.success("SVG 코드를 복사했어요.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "클립보드 복사에 실패했어요.";
      toast.error(message);
    }
  }, [svgMarkup]);

  const handleDownloadSvg = useCallback(() => {
    if (!svgDataUrl) {
      toast.warning("다운로드할 SVG가 없습니다.");
      return;
    }

    const link = document.createElement("a");
    link.href = svgDataUrl;
    link.download = createFilename("svg");
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("SVG를 다운로드했어요.");
  }, [createFilename, svgDataUrl]);

  const handleDownloadPng = useCallback(() => {
    if (!svgMarkup) {
      toast.warning("PNG로 변환할 SVG가 없습니다.");
      return;
    }

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (!context) {
        toast.error("캔버스 컨텍스트를 생성할 수 없습니다.");
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("PNG 변환에 실패했어요.");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = createFilename("png");
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("PNG를 다운로드했어요.");
      }, "image/png");
    };

    image.onerror = () => {
      toast.error("SVG 이미지를 불러오지 못했습니다.");
    };

    image.src = svgDataUrl;
  }, [createFilename, svgDataUrl, svgMarkup]);

  const handleColorChange = useCallback((value: string) => {
    setColor(value);
  }, []);

  const handleColorHexChange = useCallback((value: string) => {
    setColorHexInput(value);
    const normalized = normalizeHex(value);
    if (normalized) {
      setColor(normalized);
    }
  }, []);

  const handleApplyPreset = useCallback((presetColor: string) => {
    setColor(presetColor);
  }, []);

  const isPresetActive = useCallback(
    (presetColor: string) => presetColor.toLowerCase() === color.toLowerCase(),
    [color]
  );

  return (
    <div className="flex min-h-screen w-full max-w-full">
      <MainSidebar />

      <SidebarInset className="bg-muted/20 overflow-y-auto w-full">
        <div className="mx-auto flex w-full max-w-[100dvw] flex-1 flex-col">
          <header className="sticky top-0 z-20 flex w-full items-center gap-3 border-b bg-muted/40 px-4 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/60 sm:px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-semibold">노션용 라인 생성</h1>
              <p className="text-sm text-muted-foreground">
                가로 길이, 색상, 모서리 둥글기를 조절해 노션 블록에서 사용할 수
                있는 얇은 라인 이미지를 만들어보세요.
              </p>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex w-full flex-col gap-6 lg:flex-row">
              <Card className="w-full max-w-xl shadow-sm">
                <CardHeader>
                  <CardTitle>라인 설정</CardTitle>
                  <CardDescription>
                    원하는 사이즈와 색상을 입력하면 즉시 미리보기가 갱신돼요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="baseFilename">파일 이름</Label>
                    <Input
                      id="baseFilename"
                      value={baseFilename}
                      onChange={(event) => setBaseFilename(event.target.value)}
                      placeholder="notion-line"
                    />
                    <p className="text-sm text-muted-foreground">
                      저장 시 `.svg`, `.png` 확장자가 자동으로 붙어요.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="width">가로 길이 (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        min={1}
                        value={width}
                        onChange={(event) =>
                          setWidth(Number(event.target.value) || DEFAULT_WIDTH)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">세로 길이 (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        min={1}
                        value={height}
                        onChange={(event) =>
                          setHeight(
                            Number(event.target.value) || DEFAULT_HEIGHT
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <Label htmlFor="radius" className="cursor-pointer">
                        border-radius
                      </Label>
                      <span className="text-muted-foreground">{radius}px</span>
                    </div>
                    <input
                      id="radius"
                      type="range"
                      min={0}
                      max={200}
                      value={radius}
                      onChange={(event) =>
                        setRadius(Number(event.target.value) || 0)
                      }
                      className="w-full cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorPicker">색상</Label>
                    <div className="flex gap-2 sm:flex-row">
                      <Input
                        id="colorPicker"
                        type="color"
                        value={color}
                        onChange={(event) =>
                          handleColorChange(event.target.value)
                        }
                        className="h-12 w-full max-w-[6rem] cursor-pointer p-1 sm:w-16"
                        title="라인 색상 선택"
                      />
                      <Input
                        aria-label="Hex 색상 코드"
                        value={colorHexInput}
                        onChange={(event) =>
                          handleColorHexChange(event.target.value)
                        }
                        className="h-12 w-full font-mono"
                        placeholder="#2463E9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>컬러 프리셋</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => {
                        const presetColor = preset.backgroundColor;
                        const active = isPresetActive(presetColor);
                        return (
                          <Button
                            key={preset.name}
                            type="button"
                            size="icon"
                            variant={active ? "default" : "outline"}
                            onClick={() => handleApplyPreset(presetColor)}
                            className="flex items-center gap-2"
                            title={preset.name}
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
                </CardContent>
              </Card>

              <Card className="w-full shadow-sm">
                <CardHeader>
                  <CardTitle>미리보기</CardTitle>
                  <CardDescription>
                    생성된 라인을 노션 등에서 바로 사용할 수 있어요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed bg-background p-6">
                    {svgDataUrl ? (
                      <img
                        src={svgDataUrl}
                        alt="라인 미리보기"
                        className="max-w-full"
                        style={{
                          width: `${width}px`,
                          height: `${height}px`,
                        }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        값을 입력하면 라인 미리보기가 표시됩니다.
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-end gap-2">
                  <Button onClick={handleCopySvg}>SVG 코드 복사</Button>
                  <Button
                    variant="secondary"
                    onClick={handleDownloadSvg}
                    className="inline-flex items-center gap-2"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    SVG 다운로드
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDownloadPng}
                    className="inline-flex items-center gap-2"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    PNG 다운로드
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
