"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, Download, Upload, X, Check, Sparkles } from "lucide-react";
import JSZip from "jszip";

type GridSize = 2 | 3 | 4 | 5 | 6;

interface CroppedImage {
  dataUrl: string;
  index: number;
}

const GRID_OPTIONS: { size: GridSize; label: string }[] = [
  { size: 2, label: "2x2" },
  { size: 3, label: "3x3" },
  { size: 4, label: "4x4" },
  { size: 5, label: "5x5" },
  { size: 6, label: "6x6" },
];

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(3);
  const [croppedImages, setCroppedImages] = useState<CroppedImage[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGridSizeChange = (size: GridSize) => {
    setGridSize(size);
    setCroppedImages([]);
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      setUploadedImage(imageDataUrl);
      setCroppedImages([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const cropImage = useCallback(async () => {
    if (!uploadedImage) return;

    setIsCropping(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = uploadedImage;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCropping(false);
      return;
    }

    const size = gridSize;
    const tileWidth = img.width / size;
    const tileHeight = img.height / size;

    const results: CroppedImage[] = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        canvas.width = tileWidth;
        canvas.height = tileHeight;
        
        ctx.drawImage(
          img,
          col * tileWidth,
          row * tileHeight,
          tileWidth,
          tileHeight,
          0,
          0,
          tileWidth,
          tileHeight
        );

        const dataUrl = canvas.toDataURL("image/png");
        results.push({
          dataUrl,
          index: row * size + col,
        });
      }
    }

    setCroppedImages(results);
    setIsCropping(false);
  }, [uploadedImage, gridSize]);

  const downloadSingleImage = useCallback((dataUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `grid_${String(index + 1).padStart(2, "0")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const downloadAllImages = useCallback(async () => {
    setDownloadProgress(0);
    
    const zip = new JSZip();
    
    for (let i = 0; i < croppedImages.length; i++) {
      const dataUrl = croppedImages[i].dataUrl;
      const base64Data = dataUrl.split(",")[1];
      zip.file(`grid_${String(croppedImages[i].index + 1).padStart(2, "0")}.png`, base64Data, { base64: true });
      setDownloadProgress(Math.round(((i + 1) / croppedImages.length) * 50));
    }
    
    setDownloadProgress(50);
    const content = await zip.generateAsync({ type: "blob" });
    
    setDownloadProgress(80);
    const blobUrl = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `grid_images_${gridSize}x${gridSize}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    
    setDownloadProgress(100);
    setTimeout(() => setDownloadProgress(null), 1000);
  }, [croppedImages, gridSize]);

  const handleReset = useCallback(() => {
    setUploadedImage(null);
    setCroppedImages([]);
    setGridSize(3);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_70%)]" />
      
      <header className="relative z-10 border-b border-white/10 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Grid3X3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">图片切割器</h1>
              <p className="text-xs text-white/50">多宫格图片分割工具</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">轻松制作朋友圈九宫格</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!uploadedImage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div
                className="relative w-64 h-64 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer group hover:border-purple-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors"
                >
                  <Upload className="w-8 h-8 text-purple-400" />
                </motion.div>
                <p className="text-white font-medium mb-2">点击上传图片</p>
                <p className="text-white/50 text-sm">支持 JPG、PNG、GIF 格式</p>
                
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">重新上传</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">更换图片</span>
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-white font-medium">原始图片</h3>
                    </div>
                    <div className="p-4 flex items-center justify-center">
                      <img
                        src={uploadedImage}
                        alt="Original"
                        className="max-w-full max-h-80 object-contain rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mt-4 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
                    <h3 className="text-white font-medium mb-4">选择宫格数量</h3>
                    <div className="flex flex-wrap gap-3">
                      {GRID_OPTIONS.map((option) => (
                        <button
                          key={option.size}
                          onClick={() => handleGridSizeChange(option.size)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            gridSize === option.size
                              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={cropImage}
                    disabled={isCropping}
                    className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCropping ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        正在切割...
                      </>
                    ) : (
                      <>
                        <Grid3X3 className="w-5 h-5" />
                        开始切割
                      </>
                    )}
                  </button>
                </div>

                <div className="flex-1">
                  <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-white font-medium">切割结果</h3>
                      {croppedImages.length > 0 && (
                        <button
                          onClick={downloadAllImages}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                        >
                          {downloadProgress !== null ? (
                            <span>{downloadProgress}%</span>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              全部下载
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {croppedImages.length > 0 ? (
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                        >
                          {croppedImages.map((image, idx) => (
                            <motion.div
                              key={image.index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="relative rounded-lg overflow-hidden group cursor-pointer bg-black/30"
                            >
                              <img
                                src={image.dataUrl}
                                alt={`Cropped ${idx + 1}`}
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex items-center gap-2 text-white">
                                  <Check className="w-4 h-4" />
                                  <span className="text-xs">下载</span>
                                </div>
                              </div>
                              <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/60 flex items-center justify-center text-white text-xs">
                                {idx + 1}
                              </div>
                              <button
                                onClick={() => downloadSingleImage(image.dataUrl, image.index)}
                                className="absolute inset-0"
                              />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-white/40">
                          <Grid3X3 className="w-12 h-12 mb-3 opacity-50" />
                          <p>切割后的图片将在这里显示</p>
                          <p className="text-sm mt-1">点击上方按钮开始切割</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {croppedImages.length > 0 && (
                    <div className="mt-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">切割数量</span>
                        <span className="text-white font-medium">{croppedImages.length} 张</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-white/70">宫格尺寸</span>
                        <span className="text-white font-medium">{gridSize} × {gridSize}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-white/30 text-sm">
          多宫格图片切割器 - 轻松制作朋友圈九宫格
        </div>
      </footer>
    </div>
  );
}