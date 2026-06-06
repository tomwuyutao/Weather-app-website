"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

const storyCities = [
  {
    name: "Lisbon",
    temp: "24°",
    condition: "Sunny",
    forecast: "24° / 18° · clear",
    story: "Check the weather around the places you might travel to before you decide.",
    lng: -9.14,
    lat: 38.72,
    color: "#F4B65E",
    tone: "rgba(244, 182, 94, 0.25)",
    icon: "sun",
    cardOffset: 420
  },
  {
    name: "London",
    temp: "16°",
    condition: "Cloudy",
    forecast: "16° / 11° · cloud",
    story: "Keep saved cities visible together, without opening a dense forecast screen.",
    lng: -0.13,
    lat: 51.51,
    color: "#65ABE3",
    tone: "rgba(101, 171, 227, 0.2)",
    icon: "cloud",
    cardOffset: 390
  },
  {
    name: "Berlin",
    temp: "19°",
    condition: "Partly cloudy",
    forecast: "19° / 12° · mixed",
    story: "Use the map to compare conditions by place, then open details only when needed.",
    lng: 13.4,
    lat: 52.52,
    color: "#FF8A65",
    tone: "rgba(255, 138, 101, 0.2)",
    icon: "cloud",
    cardOffset: 290
  },
  {
    name: "Athens",
    temp: "27°",
    condition: "Clear",
    forecast: "27° / 21° · clear",
    story: "Europe is just one example. The same calm map view works for places around the world.",
    lng: 23.73,
    lat: 37.98,
    color: "#F4B65E",
    tone: "rgba(244, 182, 94, 0.22)",
    icon: "sun",
    cardOffset: 120
  }
];

const backgroundDots = [
  [-3.7, 40.42, "#F4B65E"],
  [2.35, 48.86, "#65ABE3"],
  [4.9, 52.37, "#4D70D4"],
  [12.57, 55.68, "#F4B65E"],
  [16.37, 48.21, "#FF8A65"],
  [28.98, 41.01, "#65ABE3"]
];

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const publicAsset = (path) => `${publicBasePath}${path}`;

const storyBreakpoints = {
  sun: 0.06,
  time: 0.2,
  overlays: 0.58,
  uv: 0.68
};

const overlayIcons = {
  weather: publicAsset("/icons/cloud.sun.fill.svg"),
  temperature: publicAsset("/icons/thermometer.medium.svg"),
  cloud: publicAsset("/icons/cloud.fill.svg"),
  precipitation: publicAsset("/icons/drop.fill.svg"),
  wind: publicAsset("/icons/wind.svg"),
  uv: publicAsset("/icons/sun.max.fill.svg"),
  humidity: publicAsset("/icons/humidity.fill.svg"),
  visibility: publicAsset("/icons/eye.fill.svg")
};

function clampStep(progress) {
  if (progress < storyBreakpoints.sun) return 0;
  if (progress < storyBreakpoints.time) return 1;
  if (progress < storyBreakpoints.overlays) return 2;
  return 3;
}

function IconMask({ src, color = "#FFFFFF", className = "h-8 w-8", glow = false }) {
  return (
    <span
      className={`inline-block ${className}`}
      style={{
        background: color,
        filter: glow ? `drop-shadow(0 0 16px ${color})` : undefined,
        WebkitMask: `url('${src}') center / contain no-repeat`,
        mask: `url('${src}') center / contain no-repeat`
      }}
    />
  );
}

function WeatherIcon({ type, color = "#D3E3EC", size = "large" }) {
  const scale = size === "small" ? "h-8 w-8" : "h-12 w-12";

  if (type === "sun") {
    return (
      <span className={`relative inline-flex ${scale} items-center justify-center`}>
        <span className="absolute h-full w-full rounded-full blur-md" style={{ background: color, opacity: 0.18 }} />
        <IconMask src={publicAsset("/icons/sun.max.fill.svg")} color={color} className="relative h-full w-full" glow />
      </span>
    );
  }

  if (type === "rain") {
    return (
      <span className={`relative inline-flex ${scale} items-center justify-center`}>
        <span className="absolute h-[34%] w-[64%] translate-y-[-18%] rounded-full bg-weather-cloud/90" />
        <span className="absolute h-[42%] w-[42%] translate-x-[-25%] translate-y-[-24%] rounded-full bg-weather-cloud/90" />
        <span className="absolute bottom-[18%] h-[20%] w-[8%] rotate-12 rounded-full" style={{ background: color }} />
        <span className="absolute bottom-[12%] h-[20%] w-[8%] rotate-12 rounded-full" style={{ left: "58%", background: color }} />
      </span>
    );
  }

  return (
    <span className={`relative inline-flex ${scale} items-center justify-center`}>
      <span className="absolute h-[34%] w-[70%] translate-y-[5%] rounded-full bg-weather-cloud/90" />
      <span className="absolute h-[44%] w-[44%] translate-x-[-26%] translate-y-[-12%] rounded-full bg-weather-cloud/90" />
      <span className="absolute h-[38%] w-[38%] translate-x-[18%] translate-y-[-16%] rounded-full bg-weather-cloud/80" />
    </span>
  );
}

function applyMinimalMapStyle(mapInstance) {
  const style = mapInstance.getStyle();
  style.layers?.forEach((layer) => {
    const id = layer.id.toLowerCase();
    const source = `${layer["source-layer"] || ""}`.toLowerCase();
    const signature = `${id} ${source}`;

    try {
      if (layer.type === "background") {
        mapInstance.setPaintProperty(layer.id, "background-color", "#4A457D");
      }

      if (layer.type === "fill") {
        const isWater = signature.includes("water") || signature.includes("ocean") || signature.includes("sea");
        mapInstance.setPaintProperty(layer.id, "fill-color", isWater ? "#2E2961" : "#4A457D");
        mapInstance.setPaintProperty(layer.id, "fill-opacity", isWater ? 0.98 : 1);
        if (isWater) {
          mapInstance.setFilter(layer.id, [
            "all",
            ["match", ["geometry-type"], ["MultiPolygon", "Polygon"], true, false],
            ["match", ["get", "class"], ["river", "lake", "reservoir", "stream", "canal"], false, true]
          ]);
        }
      }

      if (layer.type === "line" || layer.type === "symbol") {
        mapInstance.setLayoutProperty(layer.id, "visibility", "none");
      }
    } catch {
      // Some imported style layers do not support every paint/filter property.
    }
  });
}

function StoryMap({ progress, activeStep }) {
  const mapNode = useRef(null);
  const map = useRef(null);
  const [isCompactMap, setIsCompactMap] = useState(() => (typeof window === "undefined" ? false : window.matchMedia("(max-width: 767px)").matches));
  const [projectedDots, setProjectedDots] = useState({ background: [], cities: [] });
  const [dateFrame, setDateFrame] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const mapScale = useTransform(progress, [0, 0.86, 0.99], [1.03, 1.01, 0.98]);
  const mapOpacity = useTransform(progress, [0.91, 0.98], [1, 0]);
  const uiOpacity = useTransform(progress, [0.6, 0.8], [0, 1]);
  const uiY = useTransform(progress, [0.6, 0.8], [28, 0]);
  const atmosphereOpacity = useTransform(progress, [0.06, 0.62], [0.42, 0.9]);
  const dateSliderOpacity = activeStep === 2 ? 1 : 0;
  const overlaySwitcherOpacity = activeStep === 3 ? 1 : 0;
  const selectedOverlay = activeStep === 3 && storyProgress >= storyBreakpoints.uv ? "uv" : "weather";
  const isUvOverlay = selectedOverlay === "uv";
  const dateLabels = ["Thu, May 21", "Sun, May 24", "Thu, May 28"];
  const selectedDateLabel = dateLabels[dateFrame];
  const dateSliderTop = ["10%", "36%", "62%"][dateFrame];
  const forecastPalettes = [
    ["#F4B65E", "#FF8A65", "#65ABE3", "#4D70D4", "#F4B65E", "#65ABE3", "#F4B65E", "#65ABE3", "#FF8A65", "#F4B65E"],
    ["#4D70D4", "#65ABE3", "#F4B65E", "#F4B65E", "#4D70D4", "#FF8A65", "#65ABE3", "#F4B65E", "#4D70D4", "#FF8A65"],
    ["#FF8A65", "#4D70D4", "#65ABE3", "#FF8A65", "#F4B65E", "#4D70D4", "#F4B65E", "#4D70D4", "#65ABE3", "#F4B65E"]
  ];
  const uvPalette = [
    "#F8F4F1",
    "#F1B9B9",
    "#F8F4F1",
    "#E66262",
    "#F3D8D8",
    "#EA8383",
    "#F8F4F1",
    "#E66262",
    "#F0A0A0",
    "#EC7777"
  ];
  const allDotColors = isUvOverlay
    ? uvPalette
    : activeStep === 2
    ? forecastPalettes[dateFrame % forecastPalettes.length]
    : [...backgroundDots.map((dot) => dot[2]), ...storyCities.map((city) => city.color)];
  const overlayOptions = [
    ["weather", "Weather"],
    ["temperature", "Temperature"],
    ["cloud", "Cloud Cover"],
    ["precipitation", "Precipitation"],
    ["wind", "Wind Speed"],
    ["uv", "UV Index"],
    ["humidity", "Humidity"],
    ["visibility", "Visibility"]
  ];
  const selectedOverlayLabel = overlayOptions.find(([type]) => type === selectedOverlay)?.[1] ?? "Weather";
  const selectedOverlayColor = selectedOverlay === "uv" ? "#E66262" : "#F4B65E";

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsCompactMap(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useMotionValueEvent(progress, "change", (latest) => {
    setStoryProgress(latest);
    const timeSpan = storyBreakpoints.overlays - storyBreakpoints.time;
    const timeProgress = Math.min(0.999, Math.max(0, (latest - storyBreakpoints.time) / timeSpan));
    const heldProgress = Math.max(0, (timeProgress - 0.24) / 0.76);
    const nextFrame = heldProgress < 0.36 ? 0 : heldProgress < 0.62 ? 1 : 2;
    setDateFrame(nextFrame);
  });

  useEffect(() => {
    if (!mapNode.current || map.current) return;
    const testCanvas = document.createElement("canvas");
    const hasWebGl = Boolean(testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"));
    if (!hasWebGl) return;

    const projectDots = () => {
      if (!map.current) return;
      setProjectedDots({
        background: backgroundDots.map(([lng, lat, color]) => {
          const point = map.current.project([lng, lat]);
          return { x: point.x, y: point.y, color };
        }),
        cities: storyCities.map((city) => {
          const point = map.current.project([city.lng, city.lat]);
          return { x: point.x, y: point.y };
        })
      });
    };

    const initialView = isCompactMap ? { center: [10, 47.5], zoom: 2.28 } : { center: [12, 48.5], zoom: 3.55 };

    try {
      map.current = new maplibregl.Map({
        container: mapNode.current,
        style: "https://tiles.openfreemap.org/styles/dark",
        center: initialView.center,
        zoom: initialView.zoom,
        attributionControl: false,
        scrollZoom: false,
        doubleClickZoom: false,
        dragRotate: false,
        pitch: 0,
        bearing: 0
      });
    } catch {
      return;
    }

    map.current.once("load", () => {
      applyMinimalMapStyle(map.current);
      map.current.resize();
      map.current.jumpTo({ ...initialView, bearing: 0, pitch: 0 });
      projectDots();
      window.setTimeout(() => map.current?.resize(), 250);
      window.setTimeout(() => {
        map.current?.resize();
        projectDots();
      }, 900);
    });
    map.current.once("idle", () => {
      if (!map.current) return;
      applyMinimalMapStyle(map.current);
      map.current.resize();
      projectDots();
    });
    map.current.on("move", projectDots);
    map.current.on("resize", projectDots);

    return () => {
      map.current?.off("move", projectDots);
      map.current?.off("resize", projectDots);
      map.current?.remove();
      map.current = null;
    };
  }, [isCompactMap]);

  useEffect(() => {
    if (!map.current) return;

    const views = isCompactMap
      ? [
          { center: [10, 47.5], zoom: 2.28 },
          { center: [-8.9, 39.5], zoom: 3.38 },
          { center: [10, 48.4], zoom: 2.36 },
          { center: [12, 49.2], zoom: 2.32 }
        ]
      : [
          { center: [12, 48.5], zoom: 3.55 },
          { center: [-9.14, 38.72], zoom: 5.25 },
          { center: [8, 49], zoom: 3.75 },
          { center: [12, 50], zoom: 3.55 }
        ];

    map.current.easeTo({
      ...views[activeStep],
      bearing: 0,
      pitch: 0,
      duration: 1250,
      easing: (t) => 1 - Math.pow(1 - t, 3)
    });
  }, [activeStep, isCompactMap]);

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden bg-weather-night"
      style={{ scale: mapScale, opacity: mapOpacity }}
    >
      <div className="absolute inset-0 opacity-100 md:inset-y-0 md:left-[14vw] md:right-[-14vw]">
        <div ref={mapNode} className="absolute inset-0" />
        <div className="cinematic-noise pointer-events-none absolute inset-0 mix-blend-soft-light opacity-[0.06]" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 54% 42%, rgba(211, 227, 236, 0.05), transparent 24%), radial-gradient(circle at 26% 58%, rgba(255, 138, 101, 0.08), transparent 24%), linear-gradient(180deg, rgba(46,41,97,0.02), rgba(17,15,38,0.26))",
            opacity: atmosphereOpacity
          }}
        />
        <div className="absolute inset-0">
          {projectedDots.background.map(({ x, y, color }, index) => {
            const dotColor = allDotColors[index] ?? color;
            const isDimmedByFocus = activeStep === 1;
            return (
            <motion.span
              key={`${x}-${y}-${index}`}
              className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 ${isDimmedByFocus ? "grayscale" : ""}`}
              style={{
                left: x,
                top: y
              }}
              animate={{
                scale: [0.92, 1.02, 0.92],
                backgroundColor: dotColor,
                boxShadow: isUvOverlay ? "0 0 24px rgba(230, 98, 98, 0.34)" : `0 0 22px ${dotColor}66`,
                opacity: isDimmedByFocus ? 0.24 : isUvOverlay ? 0.88 : 0.78
              }}
              transition={{
                scale: { duration: 5 + (index % 5), repeat: Infinity, ease: "easeInOut", delay: index * 0.12 },
                backgroundColor: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
                boxShadow: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
              }}
            />
            );
          })}

          {storyCities.map((city, index) => {
            const isActive = activeStep === 1 && index === 0;
            const point = projectedDots.cities[index];
            const dotColor = allDotColors[backgroundDots.length + index] ?? city.color;
            if (!point) return null;

            return (
              <motion.div
                key={city.name}
                className="absolute"
                style={{ left: point.x, top: point.y }}
                animate={{
                  scale: isActive ? 1.08 : 1,
                  opacity: activeStep === 1 ? (isActive ? 1 : 0.24) : 0.82,
                  filter: activeStep === 1 && !isActive ? "saturate(0.18)" : "saturate(1)"
                }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="absolute left-1/2 top-1/2 rounded-full blur-xl"
                  animate={{
                    width: isActive ? 180 : 54,
                    height: isActive ? 180 : 54,
                    x: isActive ? -90 : -27,
                    y: isActive ? -90 : -27,
                    opacity: isActive ? 0.7 : 0.22,
                    backgroundColor: activeStep === 2 || isUvOverlay ? dotColor : city.tone
                  }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.div
                  className="relative h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35 shadow-bloom"
                  animate={{
                    backgroundColor: dotColor,
                    boxShadow: isActive ? `0 0 0 26px ${city.tone}, 0 0 68px ${dotColor}` : `0 0 0 9px ${isUvOverlay ? "rgba(230, 98, 98, 0.16)" : city.tone}`
                  }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.div
                  className="absolute left-1/2 top-[-156px] w-[min(72vw,230px)] -translate-x-1/2 rounded-[24px] border border-white/10 bg-[#2E2961]/66 p-4 text-weather-text shadow-atmospheric backdrop-blur-2xl md:left-8 md:top-8 md:w-[min(78vw,260px)] md:translate-x-0"
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    filter: isActive ? "blur(0px)" : "blur(8px)",
                    pointerEvents: isActive ? "auto" : "none"
                  }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-sm font-medium text-weather-cloud/68">{city.name}</p>
                      <p className="mt-1 text-3xl font-semibold tracking-normal text-weather-text">{city.temp}</p>
                    </div>
                    <span className="translate-y-2">
                      <WeatherIcon type={city.icon} color={city.color} />
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <motion.div
        className="absolute right-[7vw] top-[18vh] hidden rounded-full border border-[#6F67C8]/70 bg-[#211E49]/72 px-8 py-4 text-2xl font-semibold text-weather-text shadow-atmospheric backdrop-blur-2xl lg:block"
        style={{ opacity: uiOpacity, y: uiY }}
      >
        Now
      </motion.div>
      <motion.div
        className="absolute right-[-240px] top-[28vh] z-20 h-[42vh] w-[430px] lg:right-[-300px] lg:top-[31vh] lg:h-[54vh] lg:w-[560px]"
        animate={{ opacity: dateSliderOpacity, x: dateSliderOpacity ? 0 : 64, filter: dateSliderOpacity ? "blur(0px)" : "blur(8px)" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative h-full w-full">
          <div className="absolute left-0 top-0 h-full w-full bg-[linear-gradient(90deg,rgba(46,41,97,0),rgba(46,41,97,0.14))]" />
          <motion.div
            className="absolute left-0 flex h-12 min-w-[220px] items-center rounded-full border border-[#8E83F5]/70 bg-[linear-gradient(100deg,rgba(33,30,73,0.92),rgba(138,121,255,0.95))] px-6 text-xl font-semibold text-white shadow-[0_16px_46px_rgba(113,95,235,0.34)] backdrop-blur-2xl lg:h-16 lg:min-w-[320px] lg:px-8 lg:text-3xl"
            animate={{ top: dateSliderTop }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {selectedDateLabel}
          </motion.div>
          <div className="absolute -right-5 h-12 w-28 rounded-full bg-[#211E49]/76 shadow-atmospheric backdrop-blur-xl" style={{ top: dateSliderTop }} />
        </div>
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-[10vh] z-20 w-auto -translate-x-1/2 rounded-full border border-[#6F67C8]/55 bg-[#211E49]/88 px-5 py-3 text-weather-text shadow-atmospheric backdrop-blur-2xl lg:left-auto lg:right-14 lg:top-24 lg:w-[390px] lg:translate-x-0 lg:rounded-[34px] lg:p-8"
        animate={{ opacity: overlaySwitcherOpacity, filter: overlaySwitcherOpacity ? "blur(0px)" : "blur(8px)" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 lg:hidden">
          <IconMask src={overlayIcons[selectedOverlay]} color={selectedOverlayColor} className="h-6 w-6" glow={selectedOverlay === "uv"} />
          <span className="whitespace-nowrap text-xl font-semibold" style={{ color: selectedOverlayColor }}>{selectedOverlayLabel}</span>
          <span className="text-2xl leading-none" style={{ color: selectedOverlayColor }}>✓</span>
        </div>
        <div className="hidden space-y-6 lg:block">
          {overlayOptions.map(([type, label]) => {
            const isSelected = selectedOverlay === type;
            const selectedColor = type === "uv" ? "#E66262" : "#F4B65E";
            const selectedBg = type === "uv" ? "rgba(230, 98, 98, 0.16)" : "rgba(244, 182, 94, 0.16)";
            const color = isSelected ? selectedColor : "#FFFFFF";
            return (
            <div
              key={label}
              className={`grid grid-cols-[54px_1fr_32px] items-center gap-4 rounded-full px-4 py-3 transition duration-700 ${isSelected ? "text-white" : "text-white/88"}`}
              style={{
                backgroundColor: isSelected ? selectedBg : "rgba(255, 255, 255, 0)",
                boxShadow: isSelected ? `0 0 36px ${selectedBg}` : "none"
              }}
            >
              <IconMask src={overlayIcons[type]} color={color} className="h-9 w-9" glow={isSelected && type === "uv"} />
              <span className="text-3xl font-medium transition" style={{ color: isSelected ? selectedColor : undefined }}>{label}</span>
              <span className={`text-3xl leading-none transition ${isSelected ? "opacity-100" : "opacity-0"}`} style={{ color: selectedColor }}>✓</span>
            </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScrollCopy({ activeStep }) {
  const copy = useMemo(
    () => [
      {
        title: "Weather, on a map.",
        body: ""
      },
      {
        title: "Find sunshine instantly.",
        body: "Compare weather conditions without opening forecasts one by one."
      },
      {
        title: "Plan ahead for your trip.",
        body: "See when conditions improve before you travel."
      },
      {
        title: "Focus on what matters.",
        body: "Weather, cloud cover, UV index, visibility, and more..."
      }
    ],
    []
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex h-screen items-end px-5 pb-12 md:items-center md:px-12 md:pb-0 lg:px-20">
      <motion.div
        key={activeStep}
        initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className={activeStep === 0 ? "max-w-[720px]" : "max-w-[560px]"}
      >
        <h1
          className={`font-semibold tracking-normal text-weather-text ${
            activeStep === 0
              ? "max-w-[11ch] text-6xl leading-[0.86] md:text-8xl lg:text-9xl"
              : "max-w-[13ch] text-5xl leading-[0.92] md:text-6xl lg:text-7xl"
          }`}
        >
          {copy[activeStep].title}
        </h1>
        {copy[activeStep].body ? (
          <p className="mt-7 max-w-[540px] text-lg leading-8 text-weather-muted/74 md:text-xl md:leading-9">{copy[activeStep].body}</p>
        ) : null}
      </motion.div>
    </div>
  );
}

function DownloadFooter() {
  const links = [
    ["Contact", publicAsset("/contact/")],
    ["Privacy Policy", publicAsset("/privacy/")]
  ];

  return (
    <section className="relative z-20 flex min-h-screen flex-col overflow-hidden bg-[#17152F] text-weather-text">
      <div className="relative flex min-h-[52vh] items-center justify-center overflow-hidden px-5 py-24 text-center md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(244,182,94,0.16),transparent_30%),radial-gradient(circle_at_28%_62%,rgba(101,171,227,0.14),transparent_34%),linear-gradient(180deg,#211E49_0%,#17152F_100%)]" />
        <div className="relative mx-auto max-w-4xl">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-normal md:text-6xl lg:text-7xl">
            Try Weather Atlas today, completely free.
          </h2>
          <a
            className="mx-auto mt-10 inline-flex min-h-14 items-center justify-center rounded-full bg-weather-light px-8 text-base font-semibold text-[#2E2961] shadow-bloom transition hover:bg-white"
            href="#"
            aria-label="Download on the App Store"
          >
            Download on the App Store
          </a>
          <p className="mt-4 text-sm leading-6 text-weather-muted/58">App Store link placeholder.</p>
        </div>
      </div>

      <footer className="flex flex-1 items-center px-5 py-16 md:px-10 lg:px-16">
        <div className="mx-auto grid w-full max-w-7xl gap-12 md:grid-cols-[1.2fr_1fr_1fr] md:items-start">
          <div>
            <div className="flex items-center gap-4">
              <span className="h-10 w-10 rounded-full border border-white/20 bg-[#F4B65E] shadow-[0_0_28px_rgba(244,182,94,0.45)]" />
              <p className="text-4xl font-semibold tracking-normal">Weather Atlas</p>
            </div>
            <a
              className="mt-10 inline-flex min-h-14 items-center justify-center rounded-full bg-weather-light px-7 text-base font-semibold text-[#2E2961] shadow-bloom"
              href="#"
              aria-label="Download on the App Store"
            >
              Download on the App Store
            </a>
          </div>

          <div className="md:pt-2">
            <nav className="flex flex-col gap-5 text-lg text-weather-muted/70">
              {links.map(([label, href]) => (
                <a key={label} href={href} className="transition hover:text-weather-text">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </section>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setActiveStep(clampStep(latest));
  });

  return (
    <main id="top" className="relative min-h-screen overflow-hidden">
      <StoryMap progress={scrollYProgress} activeStep={activeStep} />
      <ScrollCopy activeStep={activeStep} />
      <div className="relative z-10 h-[1200vh]" />
      <div id="app" className="relative z-20 bg-[#17152F]">
        <DownloadFooter />
      </div>
    </main>
  );
}
