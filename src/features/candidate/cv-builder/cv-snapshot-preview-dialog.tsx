"use client";

import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import "./cv-builder.css";
import { CvPreview } from "./cv-preview";
import type { CvData } from "./types";

const CV_PAGE_WIDTH = 794;
const INITIAL_CV_PAGE_HEIGHT = 1123;

type CvSnapshotPreviewDialogProps = Readonly<{
  cvData: CvData | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}>;

/** Displays the exact Builder snapshot that was selected for an application. */
export function CvSnapshotPreviewDialog({
  cvData,
  onOpenChange,
  open,
  title,
}: CvSnapshotPreviewDialogProps) {
  const t = useTranslations("CandidateWorkspace.applicationDetail.cvPreview");
  const viewportRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [documentHeight, setDocumentHeight] = useState(INITIAL_CV_PAGE_HEIGHT);

  useLayoutEffect(() => {
    if (!open || !viewportRef.current || !documentRef.current) return;

    const updateMeasurements = () => {
      const viewportWidth = viewportRef.current?.clientWidth ?? CV_PAGE_WIDTH;
      const sourceHeight = documentRef.current?.scrollHeight ?? INITIAL_CV_PAGE_HEIGHT;
      setScale(Math.min(1, Math.max(0.38, (viewportWidth - 24) / CV_PAGE_WIDTH)));
      setDocumentHeight(Math.max(INITIAL_CV_PAGE_HEIGHT, sourceHeight));
    };

    updateMeasurements();
    const observer = new ResizeObserver(updateMeasurements);
    observer.observe(viewportRef.current);
    observer.observe(documentRef.current);
    return () => observer.disconnect();
  }, [cvData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        closeLabel={t("close")}
        className="max-h-[calc(100dvh-2rem)] max-w-[min(58rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="border-b border-slate-200 px-5 py-4 pr-12 sm:px-6">
          <DialogTitle className="truncate text-left">{title}</DialogTitle>
          <DialogDescription className="text-left leading-5">{t("description")}</DialogDescription>
        </DialogHeader>

        <div
          ref={viewportRef}
          className="max-h-[calc(100dvh-12rem)] overflow-auto overscroll-contain bg-slate-100 p-3 sm:p-5"
        >
          {cvData ? (
            <div
              className="mx-auto"
              style={{ height: documentHeight * scale, width: CV_PAGE_WIDTH * scale }}
            >
              <div
                ref={documentRef}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: CV_PAGE_WIDTH,
                }}
              >
                <CvPreview cvData={cvData} />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-slate-200 px-5 py-3 sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("dismiss")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
