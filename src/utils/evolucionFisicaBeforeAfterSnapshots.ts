"use client";

export interface BeforeAfterStudioSnapshot {
  title: string;
  description?: string;
  dataUrl: string;
  width: number;
  height: number;
  view: "front" | "back";
  mode: "slider" | "overlay" | "heatmap";
  beforeLabel?: string;
  afterLabel?: string;
  scoreLabel?: string;
}

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(blob);
  });

const inlineSvgImages = async (svg: SVGSVGElement): Promise<SVGSVGElement> => {
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  const images = Array.from(clonedSvg.querySelectorAll("image"));

  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute("href") ||
        image.getAttributeNS("http://www.w3.org/1999/xlink", "href");

      if (!href || href.startsWith("data:")) return;

      try {
        const absoluteUrl = new URL(href, window.location.origin).toString();
        const response = await fetch(absoluteUrl, { cache: "force-cache" });

        if (!response.ok) return;

        const dataUrl = await readBlobAsDataUrl(await response.blob());

        image.setAttribute("href", dataUrl);
        image.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataUrl);
      } catch (error) {
        console.warn("No se pudo embeber una silueta para PDF:", error);
      }
    })
  );

  return clonedSvg;
};

const svgToTransparentPngDataUrl = async (
  svgElement: SVGSVGElement,
  scale = 2
): Promise<{ dataUrl: string; width: number; height: number } | null> => {
  const rect = svgElement.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  if (!width || !height) return null;

  const clonedSvg = await inlineSvgImages(svgElement);
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", String(width));
  clonedSvg.setAttribute("height", String(height));

  if (!clonedSvg.getAttribute("viewBox")) {
    clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    text { font-family: Arial, Helvetica, sans-serif; }
  `;
  clonedSvg.insertBefore(style, clonedSvg.firstChild);

  const svgText = new XMLSerializer().serializeToString(clonedSvg);
  const svgBlob = new Blob([svgText], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error("No se pudo capturar el mapa corporal antes/después"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      dataUrl: canvas.toDataURL("image/png"),
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("No se pudo cargar una capa del mapa corporal"));
    image.src = dataUrl;
  });

const fillRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
};

const drawExportBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.42,
    10,
    width * 0.5,
    height * 0.42,
    Math.max(width, height) * 0.62
  );

  gradient.addColorStop(0, "rgba(34, 211, 238, 0.23)");
  gradient.addColorStop(0.5, "rgba(8, 47, 73, 0.55)");
  gradient.addColorStop(1, "rgba(2, 6, 23, 0.96)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(103, 232, 249, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, width - 4, height - 4);
};

const drawPanelLabels = (
  ctx: CanvasRenderingContext2D,
  snapshot: Omit<BeforeAfterStudioSnapshot, "dataUrl" | "width" | "height">,
  width: number,
  height: number
) => {
  ctx.font = "600 18px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "rgba(207, 250, 254, 0.95)";

  if (snapshot.beforeLabel) {
    ctx.fillText(snapshot.beforeLabel, 24, 34);
  }

  if (snapshot.afterLabel) {
    const labelWidth = ctx.measureText(snapshot.afterLabel).width;
    ctx.fillText(snapshot.afterLabel, width - labelWidth - 24, 34);
  }

  ctx.font = "700 20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";

  const title = snapshot.view === "back" ? "Vista espalda" : "Vista frente";
  ctx.fillText(title, 24, height - 24);

  if (snapshot.scoreLabel) {
    const score = snapshot.scoreLabel;
    const scoreWidth = ctx.measureText(score).width + 28;

    ctx.fillStyle = "rgba(14, 165, 233, 0.22)";
    fillRoundedRect(ctx, width - scoreWidth - 24, height - 48, scoreWidth, 30, 14);

    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.fillText(score, width - scoreWidth - 10, height - 27);
  }
};

const drawLayer = async ({
  ctx,
  panel,
  layer,
  canvasWidth,
  canvasHeight,
  alpha = 1,
  clipPercent,
}: {
  ctx: CanvasRenderingContext2D;
  panel: HTMLElement;
  layer: HTMLElement;
  canvasWidth: number;
  canvasHeight: number;
  alpha?: number;
  clipPercent?: number;
}) => {
  const svg = layer.querySelector<SVGSVGElement>("svg");
  if (!svg) return;

  const png = await svgToTransparentPngDataUrl(svg);
  if (!png) return;

  const image = await loadImage(png.dataUrl);
  const panelRect = panel.getBoundingClientRect();
  const layerRect = layer.getBoundingClientRect();

  const scaleX = canvasWidth / panelRect.width;
  const scaleY = canvasHeight / panelRect.height;
  const drawX = (layerRect.left - panelRect.left) * scaleX;
  const drawY = (layerRect.top - panelRect.top) * scaleY;
  const drawWidth = layerRect.width * scaleX;
  const drawHeight = layerRect.height * scaleY;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (clipPercent !== undefined) {
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth * (clipPercent / 100), canvasHeight);
    ctx.clip();
  }

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
};

const buildStudioSnapshot = async (
  panel: HTMLElement
): Promise<BeforeAfterStudioSnapshot | null> => {
  const rect = panel.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) return null;

  const canvasWidth = 900;
  const canvasHeight = Math.round(canvasWidth * (rect.height / rect.width));
  const canvas = document.createElement("canvas");

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  drawExportBackground(ctx, canvasWidth, canvasHeight);

  const mode =
    panel.dataset.viewMode === "overlay" || panel.dataset.viewMode === "heatmap"
      ? panel.dataset.viewMode
      : "slider";

  const view = panel.dataset.bodyView === "back" ? "back" : "front";
  const beforeLayer = panel.querySelector<HTMLElement>('[data-evolucion-map-layer="before"]');
  const afterLayer = panel.querySelector<HTMLElement>('[data-evolucion-map-layer="after"]');
  const heatmapLayer = panel.querySelector<HTMLElement>('[data-evolucion-map-layer="heatmap"]');

  if (mode === "heatmap") {
    if (heatmapLayer) {
      await drawLayer({
        ctx,
        panel,
        layer: heatmapLayer,
        canvasWidth,
        canvasHeight,
      });
    }
  } else if (mode === "overlay") {
    if (beforeLayer) {
      await drawLayer({
        ctx,
        panel,
        layer: beforeLayer,
        canvasWidth,
        canvasHeight,
        alpha: 0.48,
      });
    }

    if (afterLayer) {
      await drawLayer({
        ctx,
        panel,
        layer: afterLayer,
        canvasWidth,
        canvasHeight,
      });
    }
  } else {
    const slider = Number(panel.dataset.slider || 52);
    const safeSlider = Number.isFinite(slider)
      ? Math.min(Math.max(slider, 0), 100)
      : 52;

    if (beforeLayer) {
      await drawLayer({
        ctx,
        panel,
        layer: beforeLayer,
        canvasWidth,
        canvasHeight,
        alpha: 0.72,
      });
    }

    if (afterLayer) {
      await drawLayer({
        ctx,
        panel,
        layer: afterLayer,
        canvasWidth,
        canvasHeight,
        clipPercent: safeSlider,
      });
    }

    ctx.strokeStyle = "rgba(207, 250, 254, 0.95)";
    ctx.shadowColor = "rgba(103, 232, 249, 0.95)";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    const x = canvasWidth * (safeSlider / 100);
    ctx.beginPath();
    ctx.moveTo(x, 32);
    ctx.lineTo(x, canvasHeight - 32);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const snapshotMeta = {
    title: "Mapa corporal antes/después",
    description:
      mode === "slider"
        ? "Comparador visual con corte antes/después."
        : mode === "overlay"
          ? "Vista superpuesta de evolución corporal."
          : "Heatmap corporal de la medición seleccionada.",
    view,
    mode,
    beforeLabel: panel.dataset.beforeLabel,
    afterLabel: panel.dataset.afterLabel,
    scoreLabel: panel.dataset.scoreLabel,
  } satisfies Omit<BeforeAfterStudioSnapshot, "dataUrl" | "width" | "height">;

  drawPanelLabels(ctx, snapshotMeta, canvasWidth, canvasHeight);

  return {
    ...snapshotMeta,
    dataUrl: canvas.toDataURL("image/png"),
    width: canvasWidth,
    height: canvasHeight,
  };
};

export const captureBeforeAfterStudioSnapshots = async (): Promise<
  BeforeAfterStudioSnapshot[]
> => {
  if (typeof document === "undefined") return [];

  await waitForPaint();

  const panels = Array.from(
    document.querySelectorAll<HTMLElement>('[data-evolucion-before-after-panel="true"]')
  );

  const snapshots: BeforeAfterStudioSnapshot[] = [];

  for (const panel of panels) {
    try {
      const snapshot = await buildStudioSnapshot(panel);

      if (snapshot) {
        snapshots.push(snapshot);
      }
    } catch (error) {
      console.warn("No se pudo capturar el estudio visual antes/después:", error);
    }
  }

  return snapshots;
};
