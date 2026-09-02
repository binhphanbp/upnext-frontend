"use client";
import {
  MessageSquareText,
  Mic,
  AlertCircle,
  Edit3,
  Check,
  RefreshCw,
  Sparkles,
  Volume2,
  Download,
  FileText,
} from "lucide-react";
import React, { useState } from "react";

import { appLogger } from "../services/logger";
import { Language } from "../types";

interface LiveTranscriptProps {
  transcript: string;
  onTranscriptChange: (newTranscript: string) => void;
  wpm: number;
  detectedFillers: string[];
  isListening: boolean;
  isAiSpeaking?: boolean;
  language: Language;
  error?: string | null;
  isTranscribing?: boolean;
  onRestart?: () => void;
}

export const LiveTranscript: React.FC<LiveTranscriptProps> = ({
  transcript,
  onTranscriptChange,
  wpm,
  detectedFillers,
  isListening,
  isAiSpeaking = false,
  language,
  error,
  isTranscribing,
  onRestart,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcript);

  const handleSaveEdit = () => {
    onTranscriptChange(editedText);
    setIsEditing(false);
  };

  const wordsCount = transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-600/20 text-indigo-400">
            <MessageSquareText className="h-4 w-4" />
          </div>
          <div>
            <h4 className="flex flex-wrap items-center gap-1.5 text-xs font-bold tracking-wider text-slate-100 uppercase">
              Phụ đề giọng nói (VAD + Backend STT)
              {isAiSpeaking ? (
                <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 lowercase">
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  AI đang đọc câu hỏi...
                </span>
              ) : isListening ? (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 lowercase">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                  Đang thu âm câu trả lời
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500 lowercase">
                  Tạm dừng
                </span>
              )}
              {isTranscribing && (
                <span className="flex animate-pulse items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 lowercase">
                  <Sparkles className="h-3 w-3 animate-spin text-indigo-400" />
                  AI đang nhận diện đoạn vừa nói...
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Action / Stats Buttons */}
        <div className="flex items-center space-x-2">
          <span className="rounded-lg border border-slate-700/50 bg-slate-800/60 px-2.5 py-1 text-xs font-semibold text-slate-400">
            {wordsCount} từ
          </span>

          <button
            onClick={() => appLogger.downloadLogFile()}
            title="Tải toàn bộ file log (.log) để kiểm tra chi tiết các bước xử lý"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-emerald-400"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden text-[11px] font-semibold text-emerald-300 sm:inline">
              Tải .log
            </span>
          </button>

          {onRestart && (
            <button
              onClick={onRestart}
              title="Khởi động lại nhận dạng giọng nói"
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-indigo-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              if (isEditing) handleSaveEdit();
              else {
                setEditedText(transcript);
                setIsEditing(true);
              }
            }}
            title={isEditing ? "Lưu chỉnh sửa" : "Chỉnh sửa văn bản thủ công"}
            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 transition hover:bg-slate-700"
          >
            {isEditing ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Edit3 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* STT Error Banner */}
      {error && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-300">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
          {onRestart && (
            <button
              onClick={onRestart}
              className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 transition hover:bg-amber-500/30"
            >
              Thử lại
            </button>
          )}
        </div>
      )}

      {/* Transcript Text Area */}
      <div className="max-h-[140px] min-h-[90px] overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-sm leading-relaxed text-slate-200">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="h-full w-full resize-none border-0 bg-transparent text-sm text-slate-100 focus:ring-0 focus:outline-none"
            placeholder="Nhập hoặc sửa câu trả lời của bạn tại đây..."
            rows={3}
          />
        ) : transcript.trim() ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : isAiSpeaking ? (
          <div className="flex h-full items-center justify-center space-x-2 py-4 text-xs text-amber-400/70 italic">
            <Volume2 className="h-4 w-4 animate-pulse text-amber-400" />
            <span>Đang nghe AI đọc câu hỏi. Micro sẽ tự động bật ngay khi AI đọc xong...</span>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center space-x-2 py-4 text-xs text-slate-500 italic">
            <Mic className="h-4 w-4 animate-pulse text-indigo-400" />
            <span>
              Hãy bắt đầu nói câu trả lời của bạn (nghỉ 1s sẽ tự động gửi và nhận diện)...
            </span>
          </div>
        )}
      </div>

      {/* Filler Words Alert Bar */}
      {detectedFillers.length > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs">
          <div className="flex items-center space-x-1.5 font-medium text-amber-300">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Phát hiện {detectedFillers.length} từ đệm:</span>
          </div>
          <div className="flex max-w-[60%] flex-wrap justify-end gap-1">
            {Array.from(new Set(detectedFillers)).map((f, i) => (
              <span
                key={i}
                className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300"
              >
                "{f}"
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
