import React, { useEffect, useRef, useState } from "react";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import * as dicomParser from "dicom-parser";
import * as cornerstoneDICOMImageLoaderAmbient from "@cornerstonejs/dicom-image-loader";
const cornerstoneDICOMImageLoader = cornerstoneDICOMImageLoaderAmbient.default || cornerstoneDICOMImageLoaderAmbient;
import { cornerstoneStreamingImageVolumeLoader } from "@cornerstonejs/streaming-image-volume-loader";
import { Maximize2, MousePointer2, Ruler, Search, Trash2, Crosshair, GripVertical, Activity } from "lucide-react";
import { motion } from "framer-motion";

// Importamos explícitamente las Enums para evitar el error de 'undefined'
const { Enums: csEnums } = cornerstone;
const { Enums: csToolsEnums } = cornerstoneTools;
import { Study } from "../types";

const initCornerstone = async () => {
    if (cornerstone.getEnabledElements().length > 0) return;
    await cornerstone.init();
    await cornerstoneTools.init();
    cornerstone.cache.setMaxCacheSize(1024 * 1024 * 1024);

    [
        cornerstoneTools.WindowLevelTool,
        cornerstoneTools.ZoomTool,
        cornerstoneTools.PanTool,
        cornerstoneTools.StackScrollMouseWheelTool,
        cornerstoneTools.LengthTool,
        cornerstoneTools.AngleTool,
        cornerstoneTools.PlanarFreehandROITool,
        cornerstoneTools.CrosshairsTool,
    ].forEach((tool: any) => {
        try { cornerstoneTools.addTool(tool); } catch (e) { }
    });

    cornerstone.volumeLoader.registerVolumeLoader('cornerstoneStreamingImageVolume', cornerstoneStreamingImageVolumeLoader);
    
    // Configurar cargador DICOM
    cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
    cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
    
    const webWorkerConfig = {
        maxWebWorkers: navigator.hardwareConcurrency || 4,
        startWebWorkersOnDemand: true,
    };
    
    cornerstoneDICOMImageLoader.configure({
        useWebWorkers: true,
        decodeConfig: { convertFloatToUint8: false, use16BitDataType: true },
    });
    
    // IMPORTANTE: Registrar el proveedor de metadatos de forma robusta
    cornerstone.metaData.addProvider((type: string, query: string) => {
        try {
            // @ts-ignore
            return cornerstoneDICOMImageLoader?.wadouri?.metaDataProvider?.get(query, type) || 
                   // @ts-ignore
                   cornerstoneDICOMImageLoader?.wadors?.metaDataProvider?.get(query, type);
        } catch (e) {
            return undefined;
        }
    }, 10000);
    
    if (typeof (cornerstoneDICOMImageLoader as any).init === 'function') {
        (cornerstoneDICOMImageLoader as any).init(webWorkerConfig);
    }
};

const WINDOW_PRESETS = [
    { name: "LUNG", wc: -600, ww: 1500 },
    { name: "SOFT", wc: 40, ww: 400 },
    { name: "BONE", wc: 300, ww: 1500 },
    { name: "BRAIN", wc: 40, ww: 80 },
];

const DicomViewer: React.FC<{ imageUrls: string[], study?: Study }> = ({ imageUrls, study }) => {
    const axialRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [activeTool, setActiveTool] = useState("WindowLevel");
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isVolumeLoaded, setIsVolumeLoaded] = useState(false);

    const renderingEngineId = "RadAIRxEngine";
    const toolGroupId = "RadAIRxTG";

    useEffect(() => {
        let isCancelled = false;
        let resizeObserver: ResizeObserver | null = null;

        const setup = async () => {
            if (imageUrls.length === 0) return;
            setIsVolumeLoaded(false);
            await initCornerstone();
            if (isCancelled) return;

            const sortedImageIds = [...imageUrls]
                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                .map(url => `wadouri:${url}`);

            const renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
            const volumeId = `cornerstoneStreamingImageVolume:${renderingEngineId}`;
            const volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, { imageIds: sortedImageIds });
            
            volume.load();

            const viewportInput = [
                { 
                    viewportId: 'AXIAL', 
                    type: csEnums.ViewportType.ORTHOGRAPHIC, 
                    element: axialRef.current!, 
                    defaultOptions: { 
                        orientation: csEnums.OrientationAxis.AXIAL, 
                        background: [0, 0, 0] 
                    } 
                }
            ];

            renderingEngine.setViewports(viewportInput as any);
            const toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId)!;

            [
                cornerstoneTools.WindowLevelTool.toolName,
                cornerstoneTools.ZoomTool.toolName,
                cornerstoneTools.PanTool.toolName,
                cornerstoneTools.StackScrollMouseWheelTool.toolName,
                cornerstoneTools.LengthTool.toolName,
                cornerstoneTools.AngleTool.toolName,
                cornerstoneTools.PlanarFreehandROITool.toolName,
            ].forEach(name => toolGroup.addTool(name));

            toolGroup.addViewport('AXIAL', renderingEngineId);

            toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
                bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }]
            });
            toolGroup.setToolActive(cornerstoneTools.StackScrollMouseWheelTool.toolName);

            await cornerstone.setVolumesForViewports(renderingEngine, [{ volumeId }], ['AXIAL']);

            renderingEngine.render();
            setIsVolumeLoaded(true);

            if (containerRef.current) {
                resizeObserver = new ResizeObserver(() => {
                    renderingEngine.resize(true, true);
                    renderingEngine.render();
                });
                resizeObserver.observe(containerRef.current);
                setTimeout(() => {
                    renderingEngine.resize(true, true);
                    renderingEngine.render();
                }, 500);
            }
        };

        setup().catch(console.error);

        return () => {
            isCancelled = true;
            if (resizeObserver) resizeObserver.disconnect();
            const engine = cornerstone.getRenderingEngine(renderingEngineId);
            if (engine) engine.destroy();
            cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
        };
    }, [imageUrls]);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const setTool = (name: string) => {
        const tg = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
        if (!tg) return;
        ["WindowLevel", "Zoom", "Pan", "Length", "Angle", "PlanarFreehandROI"].forEach(t => tg.setToolPassive(t));
        tg.setToolActive(name, { bindings: [{ mouseButton: csToolsEnums.MouseBindings.Primary }] });
        setActiveTool(name);
    };

    const applyPreset = (preset: any) => {
        const engine = cornerstone.getRenderingEngine(renderingEngineId);
        const vp = engine?.getViewport('AXIAL') as any;
        vp?.setProperties({ voiRange: { lower: preset.wc - preset.ww / 2, upper: preset.wc + preset.ww / 2 } });
        vp?.render();
        setActivePreset(preset.name);
    };

    return (
        <div ref={containerRef} className="w-full h-[85vh] relative bg-black flex overflow-hidden border border-white/10 rounded-2xl shadow-2xl">
            {!isVolumeLoaded && (
                <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
                    <Activity size={48} className="text-blue-500 animate-spin mb-4" />
                    <p className="text-blue-400 font-black tracking-widest uppercase text-xs">Cargando Imagen...</p>
                </div>
            )}

            <div className="flex-1 flex flex-col relative bg-[#010204]">
                <div className="flex-1 w-full h-full p-2">
                    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-white/5 shadow-inner">
                        <div ref={axialRef} className="w-full h-full" />
                        <LabelOverlay label="VIEWPORT PRINCIPAL" color="text-blue-400" />
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full pointer-events-auto flex gap-6 items-center shadow-xl">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Active</span>
                        </div>
                        {study && (
                            <>
                                <div className="h-4 w-px bg-white/10" />
                                <span className="text-[9px] font-mono text-blue-400 uppercase">AI: {study.pathology_detected} ({(study.confidence * 100).toFixed(0)}%)</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar - Smaller width as requested */}
            <div className="w-56 bg-[#020617] border-l border-white/10 flex flex-col shrink-0">
                <div className="p-4 border-b border-white/5 bg-gradient-to-b from-blue-500/5 to-transparent">
                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        TOOLS
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                        <SidebarBtn icon={<MousePointer2 size={16} />} active={activeTool === "WindowLevel"} onClick={() => setTool("WindowLevel")} label="Level" />
                        <SidebarBtn icon={<Search size={16} />} active={activeTool === "Zoom"} onClick={() => setTool("Zoom")} label="Zoom" />
                        <SidebarBtn icon={<GripVertical size={16} />} active={activeTool === "Pan"} onClick={() => setTool("Pan")} label="Pan" />
                        <SidebarBtn icon={<Ruler size={16} />} active={activeTool === "Length"} onClick={() => setTool("Length")} label="Measure" />
                    </div>
                </div>

                <div className="p-4 border-b border-white/5 flex-1 overflow-y-auto custom-scrollbar">
                    <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">PRESETS</h4>
                    <div className="space-y-1.5">
                        {WINDOW_PRESETS.map((p) => (
                            <button 
                                key={p.name} 
                                onClick={() => applyPreset(p)} 
                                className={`w-full px-3 py-3 rounded-lg text-[9px] font-black transition-all flex justify-between items-center border ${activePreset === p.name ? "bg-blue-600 border-blue-400 text-white" : "bg-white/5 border-white/5 text-slate-500"}`}
                            >
                                <span>{p.name}</span>
                            </button>
                        ))}
                    </div>
                    
                    {study && (
                        <div className="mt-8 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                            <h4 className="text-[8px] font-black text-blue-400 uppercase tracking-[0.3em] mb-3">AI DIAGNOSIS</h4>
                            <p className="text-xs font-black text-white mb-1 uppercase leading-tight">{study.pathology_detected}</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${study.confidence * 100}%` }} />
                                </div>
                                <span className="text-[9px] font-mono text-slate-500">{(study.confidence * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 space-y-2 bg-[#010413]">
                    <button 
                        onClick={handleFullscreen}
                        className="w-full py-3 rounded-lg flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest"
                    >
                        <Maximize2 size={12} /> {isFullscreen ? "Exit" : "Expand"}
                    </button>
                    <button 
                        onClick={() => cornerstoneTools.annotation.state.removeAllAnnotations()}
                        className="w-full py-3 rounded-lg border border-white/5 text-slate-500 text-[8px] font-black uppercase tracking-widest"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

const LabelOverlay = ({ label, color = "text-blue-400" }: { label: string, color?: string }) => (
    <div className="absolute top-4 left-4 pointer-events-none select-none z-10">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/5 shadow-xl">
            <span className={`w-1 h-1 rounded-full bg-current ${color} animate-pulse shadow-sm`} />
            <span className={`text-[8px] font-black tracking-[0.2em] ${color}`}>{label}</span>
        </div>
    </div>
);

const SidebarBtn = ({ icon, active, onClick, label }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all border relative group ${active ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-slate-800/20 text-slate-500 border-white/5 hover:bg-white/5'}`}>
        {icon}
        <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

export default DicomViewer;