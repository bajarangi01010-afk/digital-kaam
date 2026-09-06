/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/audio';
import { analyzeCanvasFaceLighting, FaceQualityResult } from '../utils/kycVerification';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onFaceVerified: (photoDataUrl: string) => void;
}

export const LiveFaceCaptureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  onFaceVerified,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FaceQualityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize camera stream when modal opens
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (isOpen) {
      setCapturedPhoto(null);
      setAnalysisResult(null);
      setCameraError(null);
      setIsInitializing(true);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
          })
          .then((stream) => {
            currentStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
            setStreamActive(true);
            setIsInitializing(false);
            sound.playClick();
          })
          .catch((err) => {
            console.warn('Camera permission or device error:', err);
            setCameraError(
              'कैमरा अनुमति अस्वीकृत या उपलब्ध नहीं है। कृपया कैमरा परमिशन सक्षम करें।'
            );
            setIsInitializing(false);
          });
      } else {
        setCameraError('इस ब्राउज़र में कैमरा एक्सेस समर्थित नहीं है।');
        setIsInitializing(false);
      }
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  // Capture current frame from live stream
  const handleCaptureSnapshot = () => {
    sound.playClick();
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);

    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeCanvasFaceLighting(canvas);
      setAnalysisResult(result);
      setIsAnalyzing(false);

      if (result.status === 'SUCCESS') {
        sound.playSuccess();
      } else {
        sound.playError();
      }
    }, 800);
  };

  // Retake photo
  const handleRetake = () => {
    sound.playClick();
    setCapturedPhoto(null);
    setAnalysisResult(null);
  };

  // Confirm and save face
  const handleConfirmFace = () => {
    if (capturedPhoto && analysisResult?.status === 'SUCCESS') {
      sound.playSuccess();
      onFaceVerified(capturedPhoto);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none">{title}</h3>
              <p className="text-[11px] text-slate-300 mt-1">
                लाइव फेस गाइड: अपना चेहरा बीच के अंडाकार (Oval) घेरे में रखें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport with Oval Mask Overlay */}
        <div className="relative bg-black h-80 sm:h-96 flex items-center justify-center overflow-hidden">
          {isInitializing && (
            <div className="text-center text-white space-y-2 z-20">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400" />
              <p className="text-xs font-semibold">कैमरा सक्रिय किया जा रहा है...</p>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center text-white space-y-3 z-20 max-w-xs">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-rose-300 font-bold">{cameraError}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition"
              >
                वापस जाएं
              </button>
            </div>
          )}

          {/* Live Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] ${capturedPhoto ? 'hidden' : 'block'}`}
          />

          {/* Captured Preview Image */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Live Face Snapshot"
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Centered Oval Face Guide Overlay */}
          {!capturedPhoto && !cameraError && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer darkened vignette */}
              <div className="w-56 h-72 sm:w-64 sm:h-80 border-2 border-dashed border-cyan-400 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center transition-all animate-pulse">
                <span className="text-[11px] font-bold text-cyan-300 bg-slate-900/80 px-2.5 py-1 rounded-full border border-cyan-500/40">
                  चेहरा यहां रखें (Fit Face Here)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quality Feedback Bar */}
        {isAnalyzing && (
          <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs text-blue-800 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>एआई चेहरे का मिलान व रोशनी की जांच कर रहा है...</span>
          </div>
        )}

        {analysisResult && (
          <div
            className={`p-3 border-b text-xs font-bold flex items-center justify-between ${
              analysisResult.status === 'SUCCESS'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {analysisResult.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{analysisResult.message}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border">
              गुणवत्ता: {analysisResult.lightingQuality}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 bg-slate-50 flex items-center justify-between gap-3">
          {!capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                रद्द करें
              </button>

              <button
                id="live-camera-capture-trigger"
                type="button"
                disabled={isInitializing || !!cameraError}
                onClick={handleCaptureSnapshot}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>लाइव फोटो कैप्चर करें</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>दोबारा लें (Retake)</span>
              </button>

              <button
                id="live-camera-confirm-trigger"
                type="button"
                disabled={isAnalyzing || analysisResult?.status !== 'SUCCESS'}
                onClick={handleConfirmFace}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>सत्यापित करें और सेव करें</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
