"use client";

import React, { useState } from "react";

import { EvaluationReport } from "./components/evaluation-report";
import { InterviewRoom } from "./components/interview-room";
import { SetupScreen } from "./components/setup-screen";
import { ROLE_PRESETS, DEFAULT_MOCK_REPORT } from "./mock-data";
import {
  RolePreset,
  SeniorityLevel,
  InterviewType,
  InterviewStage,
  InterviewEvaluationReport,
} from "./types";

const defaultRole: RolePreset = ROLE_PRESETS[0] ?? {
  id: "frontend-developer",
  category: "frontend",
  title: "Senior Frontend Developer",
  titleVi: "Lập trình viên Frontend (React/Next.js)",
  description:
    "Deep dive into React 19, Next.js App Router, Performance Optimization, State Management & Modern CSS.",
  descriptionVi:
    "Phỏng vấn chuyên sâu React 19, Next.js App Router, Tối ưu hiệu năng Core Web Vitals, Quản lý State & Kiến trúc Frontend.",
  iconName: "Code",
  tags: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  recommendedLevel: "senior",
  totalQuestions: 5,
  durationMinutes: 20,
};

export const AiInterviewPage: React.FC = () => {
  const [stage, setStage] = useState<InterviewStage>("setup");

  const [selectedRole, setSelectedRole] = useState<RolePreset>(defaultRole);
  const [selectedLevel, setSelectedLevel] = useState<SeniorityLevel>("senior");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(true);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const [candidateName, setCandidateName] = useState<string>("Nguyễn Quốc Vượng");

  const [evaluationReport, setEvaluationReport] =
    useState<InterviewEvaluationReport>(DEFAULT_MOCK_REPORT);

  const handleStartInterview = (config: {
    role: RolePreset;
    level: SeniorityLevel;
    interviewType: InterviewType;
    isCameraEnabled: boolean;
    isMicEnabled: boolean;
    candidateName: string;
  }) => {
    setSelectedRole(config.role);
    setSelectedLevel(config.level);
    setInterviewType(config.interviewType);
    setIsCameraEnabled(config.isCameraEnabled);
    setIsMicEnabled(config.isMicEnabled);
    setCandidateName(config.candidateName);
    setStage("interview");
  };

  const handleFinishInterview = () => {
    // Generate tailored mock report based on user config
    setEvaluationReport({
      ...DEFAULT_MOCK_REPORT,
      roleTitle: selectedRole.title,
      roleTitleVi: selectedRole.titleVi,
      level: selectedLevel,
      interviewType: interviewType,
    });
    setStage("report");
  };

  const handleRestart = () => {
    setStage("setup");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {stage === "setup" && <SetupScreen onStartInterview={handleStartInterview} />}

      {stage === "interview" && (
        <InterviewRoom
          role={selectedRole}
          level={selectedLevel}
          interviewType={interviewType}
          isCameraEnabled={isCameraEnabled}
          isMicEnabled={isMicEnabled}
          candidateName={candidateName}
          onFinishInterview={handleFinishInterview}
          onExit={handleRestart}
        />
      )}

      {stage === "report" && (
        <EvaluationReport report={evaluationReport} onRestart={handleRestart} />
      )}
    </div>
  );
};
