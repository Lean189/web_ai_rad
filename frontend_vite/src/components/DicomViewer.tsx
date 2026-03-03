import React, { useEffect, useRef, useState } from "react";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import dicomParser from "dicom-parser";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import { Maximize2, MousePointer2, Ruler, Sun, Search, Move, Hash } from "lucide-react";

// Initialize Cornerstone
const initCornerstone = async () => {
    if (cornerstone.getEnabledElements().length > 0) return;

    await cornerstone.init();
    cornerstoneTools.init();

    cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
    cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;

    cornerstoneDICOMImageLoader.configure({
        useWebWorkers: true,
        decodeConfig: {
            convertFloatToUint8: true,
            use16BitDataType: true,
        },
    });

    // Add tools to Cornerstone
    cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);
    cornerstoneTools.addTool(cornerstoneTools.LengthTool);
    cornerstoneTools.addTool(cornerstoneTools.ProbeTool);
};

interface DicomViewerProps {
    imageUrls: string[]; // Soporte para stacks
}

const WINDOW_PRESETS = [
    { name: "Cerebro", wc: 40, ww: 80 },
    { name: "Tejido Blando", wc: 40, ww: 400 },
    { name: "Pulmón", wc: -600, ww: 1500 },
    { name: "Hueso", wc: 300, ww: 1500 },
    { name: "Abdomen", wc: 40, ww: 350 },
    { name: "Mediastino", wc: 40, ww: 350 },
];

const DicomViewer: React.FC<DicomViewerProps> = ({ imageUrls }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const runningRef = useRef(false);
    const [activeTool, setActiveTool] = useState("WindowLevel");
    const [currentSlice, setCurrentSlice] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const cineIntervalRef = useRef<any>(null);

    useEffect(() => {
        if (!elementRef.current || runningRef.current) return;
        runningRef.current = true;

        const setup = async () => {
            await initCornerstone();

            const element = elementRef.current!;
            const renderingEngineId = "myRenderingEngine";
            const viewportId = "CT_VIEWPORT";

            const renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);

            const viewportInput = {
                viewportId,
                type: cornerstone.Enums.ViewportType.STACK,
                element,
                defaultOptions: {
                    background: [0, 0, 0] as [number, number, number],
                },
            };

            renderingEngine.enableElement(viewportInput);
            const viewport = renderingEngine.getViewport(viewportId) as any;

            const imageIds = imageUrls.map(url => `wadouri:${url}`);

            try {
                await viewport.setStack(imageIds);
                viewport.render();

                const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup("myToolGroup")!;

                toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
                toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
                toolGroup.addTool(cornerstoneTools.PanTool.toolName);
                toolGroup.addTool(cornerstoneTools.StackScrollMouseWheelTool.toolName);
                toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
                toolGroup.addTool(cornerstoneTools.ProbeTool.toolName);

                // Default active tools
                toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
                    bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
                });
                toolGroup.setToolActive(cornerstoneTools.ZoomTool.toolName, {
                    bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Secondary }],
                });
                toolGroup.setToolActive(cornerstoneTools.PanTool.toolName, {
                    bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Auxiliary }],
                });
                toolGroup.setToolActive(cornerstoneTools.StackScrollMouseWheelTool.toolName);

                toolGroup.addViewport(viewportId, renderingEngineId);

                // Listen for scroll events to update UI
                element.addEventListener(cornerstone.Enums.Events.STACK_NEW_IMAGE, (evt: any) => {
                    setCurrentSlice(evt.detail.imageIndex + 1);
                });

            } catch (err) {
                console.error("Error loading DICOM:", err);
            }
        };

        setup();

        return () => {
            if (cineIntervalRef.current) clearInterval(cineIntervalRef.current);
            cornerstone.cache.purgeCache();
            const engine = cornerstone.getRenderingEngine("myRenderingEngine");
            if (engine) engine.destroy();
            runningRef.current = false;
        };
    }, [imageUrls]);

    // CINE Mode Effect
    useEffect(() => {
        if (isPlaying && imageUrls.length > 1) {
            cineIntervalRef.current = setInterval(() => {
                const engine = cornerstone.getRenderingEngine("myRenderingEngine");
                if (!engine) return;
                const viewport = engine.getViewport("CT_VIEWPORT") as any;
                if (!viewport) return;

                const currentIndex = viewport.getTargetImageIdIndex();
                const nextIndex = (currentIndex + 1) % imageUrls.length;
                viewport.setImageIdIndex(nextIndex);
            }, 100); // 10 FPS
        } else {
            if (cineIntervalRef.current) clearInterval(cineIntervalRef.current);
        }
        return () => { if (cineIntervalRef.current) clearInterval(cineIntervalRef.current); };
    }, [isPlaying, imageUrls]);

    const setTool = (toolName: string) => {
        const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup("myToolGroup");
        if (!toolGroup) return;

        // Deactivate all first (basic approach)
        [
            cornerstoneTools.WindowLevelTool.toolName,
            cornerstoneTools.LengthTool.toolName,
            cornerstoneTools.ProbeTool.toolName,
            cornerstoneTools.ZoomTool.toolName,
            cornerstoneTools.PanTool.toolName
        ].forEach(t => toolGroup.setToolPassive(t));

        toolGroup.setToolActive(toolName, {
            bindings: [{ mouseButton: cornerstoneTools.Enums.MouseBindings.Primary }],
        });
        setActiveTool(toolName);
    };

    const applyPreset = (preset: typeof WINDOW_PRESETS[0]) => {
        const engine = cornerstone.getRenderingEngine("myRenderingEngine");
        if (!engine) return;
        const viewport = engine.getViewport("CT_VIEWPORT") as any;
        if (!viewport) return;

        viewport.setProperties({
            voiRange: {
                lower: preset.wc - preset.ww / 2,
                upper: preset.wc + preset.ww / 2,
            },
        });
        viewport.render();
        setActivePreset(preset.name);
    };

    return (
        <div className="w-full h-full relative bg-black group select-none">
            {/* Toolbar */}
            <div className="absolute top-6 right-6 z-30 flex flex-col gap-2 bg-slate-900/60 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ToolBtn icon={<MousePointer2 size={18} />} active={activeTool === "WindowLevel"} onClick={() => setTool("WindowLevel")} label="W/L" />
                <ToolBtn icon={<Ruler size={18} />} active={activeTool === "Length"} onClick={() => setTool("Length")} label="Regla" />
                <ToolBtn icon={<Hash size={18} />} active={activeTool === "Probe"} onClick={() => setTool("Probe")} label="Probe" />
                <ToolBtn icon={<Search size={18} />} active={activeTool === "Zoom"} onClick={() => setTool("Zoom")} label="Zoom" />
                <ToolBtn icon={<Move size={18} />} active={activeTool === "Pan"} onClick={() => setTool("Pan")} label="Pan" />

                <div className="h-px bg-white/10 my-1" />

                <ToolBtn
                    icon={isPlaying ? <div className="w-3 h-3 bg-red-500 rounded-sm" /> : <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-1" />}
                    active={isPlaying}
                    onClick={() => setIsPlaying(!isPlaying)}
                    label={isPlaying ? "Detener CINE" : "Iniciar CINE"}
                />
            </div>

            {/* Presets Panel */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-slate-900/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 hover:opacity-100">
                {WINDOW_PRESETS.map((preset) => (
                    <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activePreset === preset.name
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            {/* Viewport */}
            <div ref={elementRef} className="w-full h-full cursor-crosshair" />

            {/* Overlays */}
            <div className="absolute top-6 left-6 pointer-events-none flex flex-col gap-1">
                <div className="flex gap-2 items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">Live Viewport</span>
                </div>
                {activePreset && (
                    <div className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest mt-2 self-start animate-fade-in">
                        Preset: {activePreset}
                    </div>
                )}
                <div className="text-white/30 text-[10px] font-mono mt-2">
                    RES: 512 x 512<br />
                    FPS: 60
                </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 pointer-events-none flex justify-between items-end">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[10px] text-white/60 font-mono">
                    Slide: {currentSlice} / {imageUrls.length}
                </div>
                <div className="flex gap-4">
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[10px] text-white/40">
                        Scroll: Rueda Mouse
                    </span>
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5 text-[10px] text-white/40">
                        L: {activeTool} | R: Zoom
                    </span>
                </div>
            </div>
        </div>
    );
};

const ToolBtn = ({ icon, active, onClick, label }: any) => (
    <button
        onClick={onClick}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group/tool ${active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
        {icon}
        <span className="absolute right-full mr-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/tool:opacity-100 pointer-events-none whitespace-nowrap border border-white/5">
            {label}
        </span>
    </button>
);

export default DicomViewer;
