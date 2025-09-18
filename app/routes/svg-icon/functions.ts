export function addBackgroundAndPadding(
  svgString: string,
  color: string,
  radius: number,
  padding: number,
  iconColor: string
) {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const parserError = doc.querySelector("parsererror");

  if (parserError) {
    throw new Error("SVG 코드 파싱 오류");
  }

  const svgElement = doc.documentElement;
  let viewBox = svgElement.getAttribute("viewBox");

  if (!viewBox) {
    const widthAttr = svgElement.getAttribute("width");
    const heightAttr = svgElement.getAttribute("height");

    if (!widthAttr || !heightAttr) {
      throw new Error("SVG에 viewBox 또는 width/height 속성이 필요합니다.");
    }

    const width = parseFloat(widthAttr);
    const height = parseFloat(heightAttr);

    if (Number.isNaN(width) || Number.isNaN(height)) {
      throw new Error("width/height 속성을 숫자로 변환할 수 없습니다.");
    }

    viewBox = `0 0 ${width} ${height}`;
  }

  const vb = viewBox.trim().split(/\s+/).map(Number);

  if (vb.length !== 4 || vb.some((value) => Number.isNaN(value))) {
    throw new Error("viewBox 값이 올바르지 않습니다.");
  }

  const [x, y, w, h] = vb;
  const safePadding = Math.max(0, padding);
  const newVB = {
    x: x - safePadding,
    y: y - safePadding,
    width: w + safePadding * 2,
    height: h + safePadding * 2,
  };

  svgElement.setAttribute("width", newVB.width.toString());
  svgElement.setAttribute("height", newVB.height.toString());
  svgElement.setAttribute(
    "viewBox",
    `${newVB.x} ${newVB.y} ${newVB.width} ${newVB.height}`
  );
  svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgElement.setAttribute("color", iconColor);
  svgElement.style.setProperty("color", iconColor);

  doc
    .querySelectorAll('path[data-background-path="true"]')
    .forEach((node) => node.remove());

  const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    generateSquirclePath(newVB.x, newVB.y, newVB.width, newVB.height, radius)
  );
  path.setAttribute("fill", color);
  path.setAttribute("stroke", "none");
  path.setAttribute("data-background-path", "true");

  svgElement.insertBefore(path, svgElement.firstChild);

  const serializer = new window.XMLSerializer();
  return serializer.serializeToString(svgElement);
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

  const k = 0.8; // Approximation factor for Apple's superellipse
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

export function generateBackgroundImageSvg(
  iconDataUrl: string,
  bgColor: string
) {
  const bgWidth = 1500;
  const bgHeight = 600;
  const iconSize = 128;
  const iconX = (bgWidth - iconSize) / 2;
  const iconY = (bgHeight - iconSize) / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${bgWidth}" height="${bgHeight}" viewBox="0 0 ${bgWidth} ${bgHeight}">\n  <rect width="100%" height="100%" fill="${bgColor}" />\n  <image x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" href="${iconDataUrl}" />\n</svg>`;
}

export function encodeBase64(value: string) {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64");
  }

  throw new Error("현재 환경에서 base64 인코딩을 지원하지 않습니다.");
}
