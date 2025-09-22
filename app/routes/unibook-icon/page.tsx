import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MetaArgs } from "react-router";
import { Download, RefreshCcw, RotateCcw } from "lucide-react";
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
import { cn } from "~/lib/utils";

const ICON_EXPORT_SIZE = 512;
const COVER_WIDTH = 3000;
const COVER_HEIGHT = 1200;
const COVER_ICON_SIZE = 300;
const DEFAULT_BASE_FILENAME = "unibook-icon";
const DEFAULT_BACKGROUND_COLOR = "#ffffff";
const DEFAULT_CORNER_RADIUS_PERCENT = 40;
const DEFAULT_PADDING = 0;
const MAX_PADDING = 160;
const MAX_CORNER_RADIUS_PERCENT = 50;
const CORNER_SLIDER_STEP = 0.1;

const FALLBACK_COLOR: RgbColor = { r: 255, g: 255, b: 255 };

const LETTER_ICONS: IconOption[] = Array.from({ length: 26 }, (_, index) => {
  const letter = String.fromCharCode(65 + index);
  return {
    id: letter.toLowerCase(),
    label: letter,
    src: `/unibook-iconset/${letter}.png`,
  };
});

const UNIBOOK_ICONS: IconOption[] = [
  { id: "logo", label: "Logo", src: "/unibook-iconset/Logo.png" },
  ...LETTER_ICONS,
];

type IconOption = {
  id: string;
  label: string;
  src: string;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type IconInfo = {
  fileName: string;
  width: number;
  height: number;
};

type ProcessedAssets = {
  icon: string;
  cover: string;
};

type GenerationSettings = {
  backgroundHex: string;
  cornerRadiusPercent: number;
  padding: number;
};

export function meta({}: MetaArgs) {
  return [
    { title: "유니북 아이콘 생성 | Hyuns PKM Utils" },
    {
      name: "description",
      content:
        "유니북 아이콘셋으로 1:1 아이콘과 3000×1200 커버 이미지를 만들어보세요.",
    },
  ];
}

export default function UnibookIconGeneratorPage() {
  const [selectedIcon, setSelectedIcon] = useState<IconOption | null>(null);
  const [iconDataUrl, setIconDataUrl] = useState("");
  const [coverDataUrl, setCoverDataUrl] = useState("");
  const [baseFilename, setBaseFilename] = useState(DEFAULT_BASE_FILENAME);
  const [iconInfo, setIconInfo] = useState<IconInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState(
    DEFAULT_BACKGROUND_COLOR
  );
  const [backgroundHexInput, setBackgroundHexInput] = useState(
    DEFAULT_BACKGROUND_COLOR
  );
  const [cornerRadiusPercent, setCornerRadiusPercent] = useState(
    DEFAULT_CORNER_RADIUS_PERCENT
  );
  const [padding, setPadding] = useState(DEFAULT_PADDING);
  const [imageVersion, setImageVersion] = useState(0);

  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const taskIdRef = useRef(0);
  const selectedIconIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      imageElementRef.current = null;
      selectedIconIdRef.current = null;
    };
  }, []);

  const resetOutputs = useCallback(() => {
    setIconDataUrl("");
    setCoverDataUrl("");
    setIconInfo(null);
    setError(null);
    imageElementRef.current = null;
  }, []);

  const handleBackgroundColorChange = useCallback((value: string) => {
    const normalized = normalizeHex(value);
    if (!normalized) {
      return;
    }
    setBackgroundColor(normalized);
    setBackgroundHexInput(normalized);
  }, []);

  const handleBackgroundHexChange = useCallback((value: string) => {
    setBackgroundHexInput(value);
    const normalized = normalizeHex(value);
    if (normalized) {
      setBackgroundColor(normalized);
    }
  }, []);

  const handleSelectIcon = useCallback(
    (option: IconOption) => {
      selectedIconIdRef.current = option.id;
      setSelectedIcon(option);
      resetOutputs();
      setIsProcessing(true);
      setBaseFilename(sanitizeBaseFilename(`unibook-${option.label}`));

      const image = new Image();
      image.onload = () => {
        if (selectedIconIdRef.current !== option.id) {
          return;
        }
        imageElementRef.current = image;
        setIconInfo({
          fileName: `${option.label}.png`,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });

        setBackgroundColor("#ffffff");
        setBackgroundHexInput("#ffffff");
        setImageVersion((value) => value + 1);
      };

      image.onerror = () => {
        if (selectedIconIdRef.current !== option.id) {
          return;
        }
        const message = "아이콘 이미지를 불러오지 못했습니다.";
        setError(message);
        setIsProcessing(false);
        toast.error(message);
      };

      image.src = option.src;
    },
    [resetOutputs]
  );

  const handleReprocess = useCallback(() => {
    if (!imageElementRef.current) {
      toast.warning("다시 생성할 아이콘이 없습니다.");
      return;
    }

    setImageVersion((value) => value + 1);
  }, []);

  const handleReset = useCallback(() => {
    resetOutputs();
    setSelectedIcon(null);
    selectedIconIdRef.current = null;
    setBaseFilename(DEFAULT_BASE_FILENAME);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setBackgroundHexInput(DEFAULT_BACKGROUND_COLOR);
    setCornerRadiusPercent(DEFAULT_CORNER_RADIUS_PERCENT);
    setPadding(DEFAULT_PADDING);
    setIsProcessing(false);
  }, [resetOutputs]);

  const handleDownload = useCallback(
    (dataUrl: string, suffix: "icon" | "cover") => {
      if (!dataUrl) {
        toast.warning("다운로드할 이미지가 없습니다.");
        return;
      }

      const safeBase = sanitizeBaseFilename(baseFilename);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${safeBase}-${suffix}.png`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(
        `${suffix === "icon" ? "아이콘" : "커버"} PNG를 다운로드했어요.`
      );
    },
    [baseFilename]
  );

  useEffect(() => {
    const image = imageElementRef.current;
    if (!image) {
      return;
    }

    const currentTaskId = ++taskIdRef.current;
    setIsProcessing(true);

    try {
      const assets = generateAssetsFromImage(image, {
        backgroundHex: backgroundColor,
        cornerRadiusPercent,
        padding,
      });

      if (taskIdRef.current !== currentTaskId) {
        return;
      }

      setIconDataUrl(assets.icon);
      setCoverDataUrl(assets.cover);
      setError(null);
    } catch (err) {
      if (taskIdRef.current !== currentTaskId) {
        return;
      }

      const message =
        err instanceof Error
          ? err.message
          : "이미지 처리 중 오류가 발생했습니다.";
      setError(message);
      setIconDataUrl("");
      setCoverDataUrl("");
    } finally {
      if (taskIdRef.current === currentTaskId) {
        setIsProcessing(false);
      }
    }
  }, [backgroundColor, cornerRadiusPercent, padding, imageVersion]);

  const hasGeneratedAssets = Boolean(iconDataUrl || coverDataUrl);
  const hasCustomBackground = backgroundColor !== DEFAULT_BACKGROUND_COLOR;
  const hasCustomCorner = cornerRadiusPercent !== DEFAULT_CORNER_RADIUS_PERCENT;
  const hasCustomPadding = padding !== DEFAULT_PADDING;

  const canResetState = Boolean(
    hasGeneratedAssets ||
      selectedIcon ||
      error ||
      baseFilename !== DEFAULT_BASE_FILENAME ||
      hasCustomBackground ||
      hasCustomCorner ||
      hasCustomPadding
  );

  const selectionDescription = useMemo(() => {
    if (!selectedIcon) {
      return "아이콘을 선택하면 미리보기와 다운로드 옵션이 활성화됩니다.";
    }

    if (isProcessing) {
      return "아이콘을 준비하는 중입니다...";
    }

    if (error) {
      return error;
    }

    return "아래에서 생성된 이미지를 확인하고 다운로드할 수 있어요.";
  }, [error, isProcessing, selectedIcon]);

  return (
    <div className="flex min-h-screen w-full max-w-full">
      <MainSidebar />

      <SidebarInset className="bg-muted/20 overflow-y-auto">
        <div className="flex w-full flex-1 flex-col">
          <header className="sticky top-0 z-20 flex w-full items-center gap-3 border-b bg-muted/40 px-4 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/60 sm:px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-semibold">유니북 아이콘 생성</h1>
              <p className="text-sm text-muted-foreground">
                유니북 아이콘셋을 활용해 1:1 아이콘과 3000×1200 커버 이미지를
                만들어보세요.
              </p>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex w-full flex-col gap-6 lg:flex-row">
              <Card className="w-full shadow-sm lg:max-w-md">
                <CardHeader>
                  <CardTitle>아이콘 선택 및 설정</CardTitle>
                  <CardDescription>{selectionDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>유니북 아이콘셋</Label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {UNIBOOK_ICONS.map((icon) => {
                        const active = selectedIcon?.id === icon.id;
                        return (
                          <button
                            key={icon.id}
                            type="button"
                            onClick={() => handleSelectIcon(icon)}
                            className={cn(
                              "group flex flex-col items-center gap-2 rounded-md border p-3 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                              active
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-transparent bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted"
                            )}
                            aria-pressed={active}
                          >
                            <img
                              src={icon.src}
                              alt={`${icon.label} 아이콘 미리보기`}
                              className="h-12 w-12 rounded-md border border-transparent bg-background object-contain transition group-hover:border-primary/40"
                            />
                            <span>{icon.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseFilename">파일 이름</Label>
                    <Input
                      id="baseFilename"
                      value={baseFilename}
                      onChange={(event) => setBaseFilename(event.target.value)}
                      placeholder={DEFAULT_BASE_FILENAME}
                    />
                    <p className="text-xs text-muted-foreground">
                      아이콘은 `이름-icon.png`, 커버는 `이름-cover.png`로
                      저장돼요.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">배경색</Label>
                    <div className="flex gap-2 sm:flex-row">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={backgroundColor}
                        onChange={(event) =>
                          handleBackgroundColorChange(event.target.value)
                        }
                        className="h-12 w-full max-w-[6rem] cursor-pointer p-1 sm:w-16"
                        title="배경색 선택"
                      />
                      <Input
                        aria-label="배경 Hex 색상 코드"
                        value={backgroundHexInput}
                        onChange={(event) =>
                          handleBackgroundHexChange(event.target.value)
                        }
                        className="h-12 w-full font-mono"
                        placeholder="#2463E9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cornerRadius">모서리 곡률</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="cornerRadius"
                        type="range"
                        min={0}
                        max={MAX_CORNER_RADIUS_PERCENT}
                        step={CORNER_SLIDER_STEP}
                        value={cornerRadiusPercent}
                        onChange={(event) =>
                          setCornerRadiusPercent(Number(event.target.value))
                        }
                        className="h-2 w-full cursor-pointer"
                      />
                      <span className="w-16 text-right text-sm text-muted-foreground">
                        {cornerRadiusPercent % 1 === 0
                          ? cornerRadiusPercent
                          : cornerRadiusPercent.toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="padding">아이콘 여백</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="padding"
                        type="range"
                        min={0}
                        max={MAX_PADDING}
                        step={1}
                        value={padding}
                        onChange={(event) =>
                          setPadding(Number(event.target.value))
                        }
                        className="h-2 w-full cursor-pointer"
                      />
                      <span className="w-12 text-right text-sm text-muted-foreground">
                        {padding}px
                      </span>
                    </div>
                  </div>

                  {iconInfo ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm leading-tight">
                      <p className="font-medium">선택한 아이콘</p>
                      <p className="mt-1 break-all text-muted-foreground">
                        {iconInfo.fileName}
                      </p>
                      <p className="text-muted-foreground">
                        해상도 {iconInfo.width} × {iconInfo.height}
                      </p>
                    </div>
                  ) : null}

                  {isProcessing ? (
                    <p className="text-sm text-muted-foreground">
                      이미지를 처리하는 중입니다...
                    </p>
                  ) : null}

                  {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                  ) : null}
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isProcessing || !canResetState}
                    className="inline-flex items-center gap-2"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    초기화
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleReprocess}
                    disabled={!imageElementRef.current || isProcessing}
                    className="inline-flex items-center gap-2"
                  >
                    <RefreshCcw className="size-4" aria-hidden="true" />
                    다시 생성
                  </Button>
                </CardFooter>
              </Card>

              <div className="flex w-full flex-1 flex-col gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>아이콘 (512×512)</CardTitle>
                    <CardDescription>
                      정사각형 비율의 PNG 아이콘을 바로 다운로드할 수 있어요.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-background p-6">
                      {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                      ) : isProcessing ? (
                        <p className="text-sm text-muted-foreground">
                          아이콘을 준비하고 있습니다...
                        </p>
                      ) : iconDataUrl ? (
                        <img
                          src={iconDataUrl}
                          alt="아이콘 미리보기"
                          className="w-full max-w-xs rounded-lg shadow-sm"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          아이콘을 선택하면 미리보기가 표시됩니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(iconDataUrl, "icon")}
                      disabled={!iconDataUrl}
                      className="inline-flex items-center gap-2"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      PNG 다운로드
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>커버 이미지 (3000×1200)</CardTitle>
                    <CardDescription>
                      선택한 색상과 아이콘으로 넉넉한 비율의 커버 이미지를
                      생성합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-background p-6">
                      {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                      ) : isProcessing ? (
                        <p className="text-sm text-muted-foreground">
                          커버 이미지를 만드는 중입니다...
                        </p>
                      ) : coverDataUrl ? (
                        <img
                          src={coverDataUrl}
                          alt="커버 미리보기"
                          className="h-auto w-full rounded-lg shadow-sm"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          아이콘을 선택하면 자동으로 커버 이미지를 생성합니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(coverDataUrl, "cover")}
                      disabled={!coverDataUrl}
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
        </div>
      </SidebarInset>
    </div>
  );
}

function generateAssetsFromImage(
  image: HTMLImageElement,
  settings: GenerationSettings
): ProcessedAssets {
  const normalizedHex =
    normalizeHex(settings.backgroundHex) ?? DEFAULT_BACKGROUND_COLOR;
  const backgroundColor = hexToRgb(normalizedHex) ?? FALLBACK_COLOR;
  const safeCornerPercent = clamp(
    settings.cornerRadiusPercent,
    0,
    MAX_CORNER_RADIUS_PERCENT
  );
  const safePadding = clamp(settings.padding, 0, ICON_EXPORT_SIZE / 2);

  const iconCanvas = createIconCanvas(
    image,
    backgroundColor,
    safeCornerPercent,
    safePadding
  );
  const coverCanvas = createCoverCanvas(image, iconCanvas, backgroundColor);

  return {
    icon: iconCanvas.toDataURL("image/png"),
    cover: coverCanvas.toDataURL("image/png"),
  };
}

function createIconCanvas(
  image: HTMLImageElement,
  backgroundColor: RgbColor,
  cornerRadiusPercent: number,
  padding: number
) {
  const canvas = document.createElement("canvas");
  canvas.width = ICON_EXPORT_SIZE;
  canvas.height = ICON_EXPORT_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("아이콘 캔버스를 생성할 수 없습니다.");
  }

  context.clearRect(0, 0, ICON_EXPORT_SIZE, ICON_EXPORT_SIZE);

  const cornerRadius = percentToPixels(cornerRadiusPercent, ICON_EXPORT_SIZE);
  const path = new Path2D(
    generateSquirclePath(0, 0, ICON_EXPORT_SIZE, ICON_EXPORT_SIZE, cornerRadius)
  );

  context.fillStyle = toRgb(backgroundColor);
  context.fill(path);
  context.save();
  context.clip(path);

  const inset = clamp(padding, 0, ICON_EXPORT_SIZE / 2);
  const targetSize = ICON_EXPORT_SIZE - inset * 2;
  const rect = getCoverSourceRect(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    targetSize,
    targetSize
  );

  context.drawImage(
    image,
    rect.sx,
    rect.sy,
    rect.sWidth,
    rect.sHeight,
    inset,
    inset - 10,
    targetSize,
    targetSize
  );

  context.restore();

  return canvas;
}

function createCoverCanvas(
  image: HTMLImageElement,
  iconCanvas: HTMLCanvasElement,
  baseColor: RgbColor
) {
  const canvas = document.createElement("canvas");
  canvas.width = COVER_WIDTH;
  canvas.height = COVER_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("커버 캔버스를 생성할 수 없습니다.");
  }

  context.fillStyle = toRgb(baseColor);
  context.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

  const iconX = (COVER_WIDTH - COVER_ICON_SIZE) / 2;
  const iconY = (COVER_HEIGHT - COVER_ICON_SIZE) / 2 - 30;

  context.save();
  context.drawImage(iconCanvas, iconX, iconY, COVER_ICON_SIZE, COVER_ICON_SIZE);
  context.restore();

  return canvas;
}

function percentToPixels(percent: number, dimension: number) {
  const safePercent = clamp(percent, 0, 100);
  return (safePercent / 100) * dimension;
}

function getCoverSourceRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = sourceWidth / sourceHeight;

  if (sourceRatio > targetRatio) {
    const sHeight = sourceHeight;
    const sWidth = targetRatio * sHeight;
    const sx = (sourceWidth - sWidth) / 2;

    return { sx, sy: 0, sWidth, sHeight };
  }

  const sWidth = sourceWidth;
  const sHeight = sWidth / targetRatio;
  const sy = (sourceHeight - sHeight) / 2;

  return { sx: 0, sy, sWidth, sHeight };
}

function generateSquirclePath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const maxRadius = Math.min(radius, width / 2, height / 2);

  if (maxRadius <= 0) {
    return `M${x},${y}h${width}v${height}h${-width}Z`;
  }

  const k = 0.8;
  const right = x + width;
  const bottom = y + height;
  const r = maxRadius;
  const cp = r * k;

  return [
    `M${x + r},${y}`,
    `H${right - r}`,
    `C${right - r + cp},${y} ${right},${y + r - cp} ${right},${y + r}`,
    `V${bottom - r}`,
    `C${right},${bottom - r + cp} ${right - r + cp},${bottom} ${
      right - r
    },${bottom}`,
    `H${x + r}`,
    `C${x + r - cp},${bottom} ${x},${bottom - r + cp} ${x},${bottom - r}`,
    `V${y + r}`,
    `C${x},${y + r - cp} ${x + r - cp},${y} ${x + r},${y}`,
    "Z",
  ].join(" ");
}

function toRgb(color: RgbColor) {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function hexToRgb(value: string): RgbColor | null {
  const normalized = normalizeHex(value);
  if (!normalized) {
    return null;
  }

  const hex = normalized.slice(1);
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { r, g, b };
  }

  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

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

function sanitizeBaseFilename(value: string) {
  const withoutExtension = value.replace(/\.[^/.]+$/, "");
  const normalized = withoutExtension
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || DEFAULT_BASE_FILENAME;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
