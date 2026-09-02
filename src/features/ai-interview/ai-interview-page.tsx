"use client";

import React, { useState } from "react";

import { EvaluationReport } from "./components/evaluation-report";
import { InterviewRoom } from "./components/interview-room";
import { SetupScreen } from "./components/setup-screen";
import { apiClient } from "./services/apiClient";
import { InterviewSessionConfig, Question, FinalInterviewReport, InterviewStage } from "./types";

export const AiInterviewPage: React.FC = () => {
  const [stage, setStage] = useState<InterviewStage>("setup");
  const [config, setConfig] = useState<InterviewSessionConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [finalReport, setFinalReport] = useState<FinalInterviewReport | null>(null);

  const handleStartInterview = async (
    newConfig: InterviewSessionConfig,
    stream: MediaStream | null,
  ) => {
    setMediaStream(stream);

    // Initialize session from Backend (with automatic local fallback)
    const sessionRes = await apiClient.startSession(newConfig);
    setConfig({ ...newConfig, sessionId: sessionRes.sessionId });
    setQuestions(sessionRes.questions);
    setStage("interview");
  };

  const handleFinishInterview = (report: FinalInterviewReport) => {
    setFinalReport(report);
    setStage("report");
  };

  const handleRestart = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setFinalReport(null);
    setStage("setup");
  };

  return (
    <main className="flex min-h-screen flex-col justify-between bg-slate-50/50 text-slate-900 transition-colors selection:bg-emerald-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <div className="relative z-10 flex flex-1 flex-col">
        {stage === "setup" && <SetupScreen onStartInterview={handleStartInterview} />}

        {stage === "interview" && config && (
          <InterviewRoom
            questions={questions}
            config={config}
            stream={mediaStream}
            onFinishInterview={handleFinishInterview}
            onExit={handleRestart}
          />
        )}

        {stage === "report" && finalReport && (
          <EvaluationReport report={finalReport} onRestart={handleRestart} />
        )}
      </div>

      {/* Footer Branding */}
      <footer className="dark:border-slate-850 relative z-10 border-t border-slate-200/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          UpNext AI Interview Studio • Đánh Giá Năng Lực Đa Phương Thức 60 FPS • Microsoft Edge-TTS
          & Gemini AI
        </p>
      </footer>
    </main>
  );
};
