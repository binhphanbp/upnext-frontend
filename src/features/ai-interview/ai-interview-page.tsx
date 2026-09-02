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
    <main className="flex min-h-screen flex-col justify-between bg-[#0B0F19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

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
      <footer className="relative z-10 border-t border-slate-900/80 py-3 text-center text-xs text-slate-500">
        <p>
          AI Realtime Multimodal Interviewer Studio • Face Expression 60 FPS • Web Audio & Speech
          API • Powered by Microsoft Edge-TTS & Gemini AI
        </p>
      </footer>
    </main>
  );
};
