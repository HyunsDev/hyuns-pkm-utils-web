import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
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
import { COLOR_PRESETS } from "~/data/color-preset";

const ICON_EXPORT_SIZE = 512;
const BACKGROUND_WIDTH = 1500;
const BACKGROUND_HEIGHT = 600;
const BACKGROUND_ICON_SIZE = 256;
const DEFAULT_BASE_FILENAME = "my-image";
const DEFAULT_BACKGROUND_COLOR = "#f0f0f0";
const DEFAULT_CORNER_RADIUS_PERCENT = 40;
const DEFAULT_PADDING = 24;
const MAX_PADDING = 160;
const MAX_CORNER_RADIUS_PERCENT = 50;
const CORNER_SLIDER_STEP = 0.1;

const FALLBACK_COLOR: RgbColor = { r: 240, g: 240, b: 240 };

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

type ImageInfo = {
  fileName: string;
  width: number;
  height: number;
};

type ProcessedAssets = {
  icon: string;
  background: string;
};

type GenerationSettings = {
  backgroundHex: string;
  cornerRadiusPercent: number;
  padding: number;
};

export function meta({}: MetaArgs) {
  return [
    { title: "이미지 아이콘 생성 | Hyuns PKM Utils" },
    {
      name: "description",
      content: "이미지 파일로 1:1 아이콘과 배경 이미지를 만들어보세요.",
    },
  ];
}

export default function ImageIconGeneratorPage() {
  const [iconDataUrl, setIconDataUrl] = useState("");
  const [backgroundDataUrl, setBackgroundDataUrl] = useState("");
  const [baseFilename, setBaseFilename] = useState(DEFAULT_BASE_FILENAME);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
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

  const lastFileRef = useRef<File | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const taskIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      lastFileRef.current = null;
      imageElementRef.current = null;
    };
  }, []);

  const resetOutputs = useCallback(() => {
    setIconDataUrl("");
    setBackgroundDataUrl("");
    setImageInfo(null);
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

  const handleApplyPreset = useCallback((color: string) => {
    const normalized = normalizeHex(color);
    if (!normalized) {
      return;
    }
    setBackgroundColor(normalized);
    setBackgroundHexInput(normalized);
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일을 선택해주세요.");
        resetOutputs();
        return;
      }

      resetOutputs();
      lastFileRef.current = file;
      setIsProcessing(true);
      setBaseFilename(sanitizeBaseFilename(file.name));

      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        imageElementRef.current = image;
        setImageInfo({
          fileName: file.name,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });

        const suggestedRgb = softenColor(extractAverageColor(image));
        const suggestedHex = rgbToHex(suggestedRgb);
        setBackgroundColor(suggestedHex);
        setBackgroundHexInput(suggestedHex);
        setImageVersion((value) => value + 1);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        if (imageElementRef.current === image) {
          imageElementRef.current = null;
        }
        const message = "이미지를 불러오는 데 실패했습니다.";
        setError(message);
        setIsProcessing(false);
        toast.error(message);
      };

      image.src = objectUrl;
    },
    [resetOutputs]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) {
        resetOutputs();
        lastFileRef.current = null;
        setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
        setBackgroundHexInput(DEFAULT_BACKGROUND_COLOR);
        setCornerRadiusPercent(DEFAULT_CORNER_RADIUS_PERCENT);
        setPadding(DEFAULT_PADDING);
        setIsProcessing(false);
        return;
      }

      processFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFile, resetOutputs]
  );

  const handleDownload = useCallback(
    (dataUrl: string, suffix: "icon" | "background") => {
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
        `${suffix === "icon" ? "아이콘" : "배경"} PNG를 다운로드했어요.`
      );
    },
    [baseFilename]
  );

  const handleReset = useCallback(() => {
    resetOutputs();
    setBaseFilename(DEFAULT_BASE_FILENAME);
    setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
    setBackgroundHexInput(DEFAULT_BACKGROUND_COLOR);
    setCornerRadiusPercent(DEFAULT_CORNER_RADIUS_PERCENT);
    setPadding(DEFAULT_PADDING);
    lastFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsProcessing(false);
  }, [resetOutputs]);

  const handleReprocess = useCallback(() => {
    if (!imageElementRef.current) {
      toast.warning("다시 생성할 이미지가 없습니다.");
      return;
    }

    setImageVersion((value) => value + 1);
  }, []);

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
      setBackgroundDataUrl(assets.background);
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
      setBackgroundDataUrl("");
    } finally {
      if (taskIdRef.current === currentTaskId) {
        setIsProcessing(false);
      }
    }
  }, [backgroundColor, cornerRadiusPercent, padding, imageVersion]);

  const hasGeneratedAssets = Boolean(iconDataUrl || backgroundDataUrl);
  const hasCustomBackground = backgroundColor !== DEFAULT_BACKGROUND_COLOR;
  const hasCustomCorner = cornerRadiusPercent !== DEFAULT_CORNER_RADIUS_PERCENT;
  const hasCustomPadding = padding !== DEFAULT_PADDING;

  const canResetState = Boolean(
    hasGeneratedAssets ||
      imageInfo ||
      error ||
      baseFilename !== DEFAULT_BASE_FILENAME ||
      hasCustomBackground ||
      hasCustomCorner ||
      hasCustomPadding
  );

  const isPresetActive = useCallback(
    (color: string) => backgroundColor === normalizeHex(color),
    [backgroundColor]
  );

  return (
    <div className="flex min-h-screen w-full max-w-full">
      <MainSidebar />

      <SidebarInset className="bg-muted/20 overflow-y-auto">
        <div className="flex w-full flex-1 flex-col">
          <header className="sticky top-0 z-20 flex w-full items-center gap-3 border-b bg-muted/40 px-4 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/60 sm:px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-semibold">이미지 아이콘 생성</h1>
              <p className="text-sm text-muted-foreground">
                이미지 파일을 기반으로 1:1 아이콘과 배경 이미지를 빠르게
                만들어보세요.
              </p>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex w-full flex-col gap-6 lg:flex-row">
              <Card className="w-full shadow-sm lg:max-w-sm">
                <CardHeader>
                  <CardTitle>이미지 업로드</CardTitle>
                  <CardDescription>
                    JPG, PNG, WebP 등 대부분의 이미지 파일을 지원해요.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="imageFile">이미지 파일</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef}
                        id="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReprocess}
                        disabled={!imageElementRef.current || isProcessing}
                      >
                        <RefreshCcw
                          className="mr-2 size-4"
                          aria-hidden="true"
                        />
                        다시 생성
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      동일한 파일을 다시 선택하지 않고도 "다시 생성"으로 최신
                      설정을 적용할 수 있어요.
                    </p>
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
                      아이콘은 `이름-icon.png`, 배경은 `이름-background.png`로
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
                    <Label>컬러 프리셋</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => {
                        const background = normalizeHex(preset.backgroundColor);
                        if (!background) {
                          return null;
                        }

                        const active = isPresetActive(background);
                        return (
                          <Button
                            key={preset.name}
                            type="button"
                            size="sm"
                            variant={active ? "default" : "outline"}
                            onClick={() => handleApplyPreset(background)}
                            className="flex items-center gap-2"
                          >
                            <span
                              className="h-4 w-4 rounded-full border"
                              style={{ backgroundColor: background }}
                              aria-hidden="true"
                            />
                            {preset.name}
                          </Button>
                        );
                      })}
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
                    <p className="text-xs text-muted-foreground">
                      Squircle 형태의 곡률을 퍼센트 단위로 조절할 수 있어요.
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      여백을 늘리면 아이콘 내부에 더 넉넉한 공간이 생겨요.
                    </p>
                  </div>

                  {imageInfo ? (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm leading-tight">
                      <p className="font-medium">선택한 파일</p>
                      <p className="mt-1 break-all text-muted-foreground">
                        {imageInfo.fileName}
                      </p>
                      <p className="text-muted-foreground">
                        해상도 {imageInfo.width} × {imageInfo.height}
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
                </CardFooter>
              </Card>

              <div className="flex w-full flex-1 flex-col gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>아이콘 (512×512)</CardTitle>
                    <CardDescription>
                      정사각형 비율로 잘라낸 아이콘을 다운로드할 수 있어요.
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
                          이미지를 업로드하면 아이콘 미리보기가 표시됩니다.
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
                    <CardTitle>배경 이미지 (1500×600)</CardTitle>
                    <CardDescription>
                      선택한 배경색을 중심으로 커버 이미지를 함께 생성합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed bg-background p-6">
                      {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                      ) : isProcessing ? (
                        <p className="text-sm text-muted-foreground">
                          배경 이미지를 만드는 중입니다...
                        </p>
                      ) : backgroundDataUrl ? (
                        <img
                          src={backgroundDataUrl}
                          alt="배경 미리보기"
                          className="h-auto w-full rounded-lg shadow-sm"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          이미지를 업로드하면 자동으로 배경 이미지를 생성합니다.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handleDownload(backgroundDataUrl, "background")
                      }
                      disabled={!backgroundDataUrl}
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
  const backgroundCanvas = createBackgroundCanvas(
    image,
    iconCanvas,
    backgroundColor
  );

  return {
    icon: iconCanvas.toDataURL("image/png"),
    background: backgroundCanvas.toDataURL("image/png"),
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
    inset,
    targetSize,
    targetSize
  );

  context.restore();

  return canvas;
}

function createBackgroundCanvas(
  image: HTMLImageElement,
  iconCanvas: HTMLCanvasElement,
  baseColor: RgbColor
) {
  const canvas = document.createElement("canvas");
  canvas.width = BACKGROUND_WIDTH;
  canvas.height = BACKGROUND_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("배경 캔버스를 생성할 수 없습니다.");
  }

  context.fillStyle = toRgb(baseColor);
  context.fillRect(0, 0, BACKGROUND_WIDTH, BACKGROUND_HEIGHT);

  const rect = getCoverSourceRect(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    BACKGROUND_WIDTH,
    BACKGROUND_HEIGHT
  );

  context.save();
  context.globalAlpha = 0.28;
  context.drawImage(
    image,
    rect.sx,
    rect.sy,
    rect.sWidth,
    rect.sHeight,
    0,
    0,
    BACKGROUND_WIDTH,
    BACKGROUND_HEIGHT
  );
  context.restore();

  context.fillStyle = toRgba(baseColor, 0.6);
  context.fillRect(0, 0, BACKGROUND_WIDTH, BACKGROUND_HEIGHT);

  const iconX = (BACKGROUND_WIDTH - BACKGROUND_ICON_SIZE) / 2;
  const iconY = (BACKGROUND_HEIGHT - BACKGROUND_ICON_SIZE) / 2;

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.18)";
  context.shadowBlur = 24;
  context.shadowOffsetY = 12;
  context.drawImage(
    iconCanvas,
    iconX,
    iconY,
    BACKGROUND_ICON_SIZE,
    BACKGROUND_ICON_SIZE
  );
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

function extractAverageColor(image: HTMLImageElement): RgbColor {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");

  if (!context) {
    return FALLBACK_COLOR;
  }

  context.drawImage(image, 0, 0, 1, 1);
  const data = context.getImageData(0, 0, 1, 1).data;
  const alpha = data[3] / 255;

  if (alpha === 0) {
    return FALLBACK_COLOR;
  }

  const blend = (value: number) =>
    clamp(Math.round(value * alpha + 255 * (1 - alpha)), 0, 255);

  return {
    r: blend(data[0]),
    g: blend(data[1]),
    b: blend(data[2]),
  };
}

function softenColor(color: RgbColor, amount = 0.15): RgbColor {
  return {
    r: clamp(Math.round(color.r + (255 - color.r) * amount), 0, 255),
    g: clamp(Math.round(color.g + (255 - color.g) * amount), 0, 255),
    b: clamp(Math.round(color.b + (255 - color.b) * amount), 0, 255),
  };
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

function toRgba(color: RgbColor, alpha: number) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${clamp(alpha, 0, 1)})`;
}

function rgbToHex(color: RgbColor) {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
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
