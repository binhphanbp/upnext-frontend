"use client";
import {
  X,
  Settings,
  Key,
  Volume2,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mic2,
  ShieldCheck,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import { getApiBaseUrl, setApiBaseUrl, checkBackendHealth } from "../config/api";
import { apiClient } from "../services/apiClient";
import { InterviewSessionConfig, TTSVoiceInfo } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InterviewSessionConfig;
  onUpdateConfig: (newConfig: Partial<InterviewSessionConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [isChecking, setIsChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    online: boolean;
    message?: string;
  } | null>(null);
  const [voices, setVoices] = useState<TTSVoiceInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      setServerUrl(getApiBaseUrl());
      checkStatus(getApiBaseUrl());
      apiClient.getTTSVoices(config.language).then((v) => setVoices(v));
    }
  }, [isOpen, config.language]);

  const checkStatus = async (url: string) => {
    setIsChecking(true);
    const res = await checkBackendHealth(url);
    setServerStatus(res);
    setIsChecking(false);
  };

  const handleSaveServerUrl = () => {
    setApiBaseUrl(serverUrl);
    checkStatus(serverUrl);
    apiClient.getTTSVoices(config.language).then((v) => setVoices(v));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-bold tracking-wider text-white uppercase">
              Cài Đặt Hệ Thống
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 p-1 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Backend Server Configuration */}
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Server className="h-3.5 w-3.5 text-indigo-400" />
              Địa Chỉ Máy Chủ Backend
            </label>
            {serverStatus && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  serverStatus.online
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border border-rose-500/20 bg-rose-500/10 text-rose-400"
                }`}
              >
                {serverStatus.online ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Online
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" /> Offline
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://100.85.145.47:5000 hoặc http://IP:5000"
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveServerUrl}
              disabled={isChecking}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
              <span>Lưu</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Khi chạy FE trên máy khác, nhập IP máy chủ Backend (VD: http://100.85.145.47:5000).
          </p>
        </div>

        {/* AI Voice Selection */}
        {voices.length > 0 && (
          <div className="space-y-1.5">
            <label className="block flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Mic2 className="h-3.5 w-3.5 text-indigo-400" /> Giọng Đọc AI (Neural Voice)
              </span>
              <span className="text-[10px] font-medium text-indigo-400">Microsoft Neural</span>
            </label>
            <select
              value={config.selectedVoiceId || voices[0]?.id}
              onChange={(e) => onUpdateConfig({ selectedVoiceId: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.description})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Gemini API Key */}
        <div className="space-y-1.5">
          <label className="block flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Key className="h-3.5 w-3.5 text-amber-400" /> Google Gemini API Key
          </label>
          <input
            type="password"
            value={config.geminiApiKey || ""}
            onChange={(e) => onUpdateConfig({ geminiApiKey: e.target.value })}
            placeholder="AIzaSy... (Tùy chọn)"
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400">
            Dùng để sinh nhận xét AI tự động chuyên sâu theo mô hình LLM.
          </span>
        </div>

        {/* Toggle TTS */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-indigo-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">
                Đọc câu hỏi bằng giọng nói (TTS)
              </div>
              <div className="text-[10px] text-slate-400">AI sẽ tự động đọc to câu hỏi</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.enableTTS}
            onChange={(e) => onUpdateConfig({ enableTTS: e.target.checked })}
            className="h-4 w-4 cursor-pointer rounded border-slate-700 text-indigo-600 focus:ring-0"
          />
        </div>

        {/* Toggle Noise Suppression */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-slate-200">Lọc tiếng ồn & Nhạc nền AI</div>
              <div className="text-[10px] text-slate-400">
                Triệt tiêu tạp âm phòng & nhạc nền bằng DSP Filter
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.enableNoiseSuppression ?? true}
            onChange={(e) => onUpdateConfig({ enableNoiseSuppression: e.target.checked })}
            className="h-4 w-4 cursor-pointer rounded border-slate-700 text-indigo-600 focus:ring-0"
          />
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500"
        >
          Hoàn Tất
        </button>
      </div>
    </div>
  );
};
