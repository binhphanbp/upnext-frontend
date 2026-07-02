import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, useMemo } from "react";

import type { PipelineCandidate } from "@/features/recruiter/api/pipeline";

import { CandidateCard } from "./candidate-card";
import { PipelineColumn } from "./pipeline-column";
import type { PipelineStage, PipelineStageId } from "./pipeline-mock-data";

type PipelineBoardProps = Readonly<{
  stages: PipelineStage[];
  candidates: PipelineCandidate[];
  onCandidateMove: (candidateId: string, targetStageId: PipelineStageId) => void;
}>;

export function PipelineBoard({ stages, candidates, onCandidateMove }: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCandidate = useMemo(() => {
    if (!activeId) return null;
    return candidates.find((c) => c.id === activeId) || null;
  }, [activeId, candidates]);

  const getCandidatesByStage = (stageId: string) => {
    return candidates.filter((c) => c.stageId === stageId);
  };

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = String(active.id);
    const overId = String(over.id);

    const draggedCandidate = candidates.find((c) => c.id === candidateId);
    if (!draggedCandidate) return;

    // Check if dropped directly onto a column stage
    const targetStage = stages.find((s) => s.id === overId);
    if (targetStage) {
      if (draggedCandidate.stageId !== targetStage.id) {
        onCandidateMove(candidateId, targetStage.id);
      }
      return;
    }

    // Check if dropped over another candidate card
    const overCandidate = candidates.find((c) => c.id === overId);
    if (overCandidate) {
      if (draggedCandidate.stageId !== overCandidate.stageId) {
        onCandidateMove(candidateId, overCandidate.stageId);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="w-full flex-1 overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4 pb-1">
          {stages.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              candidates={getCandidatesByStage(stage.id)}
            />
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeCandidate ? (
          <div className="scale-102 rotate-2 cursor-grabbing opacity-90 shadow-lg">
            <CandidateCard candidate={activeCandidate} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
