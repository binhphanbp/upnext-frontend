import { http, HttpResponse } from "msw";

import { env } from "@/shared/lib/env";

export const handlers = [
  http.get(`${env.NEXT_PUBLIC_API_BASE_URL}/health`, () => {
    return HttpResponse.json({
      service: "upnext-api",
      status: "ok",
    });
  }),
  http.post(`${env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/login`, async ({ request }) => {
    const body = (await request.json()) as any;
    if (
      body.email === "admin.super@upnext.dev" ||
      body.email === "admin.moderator@upnext.dev" ||
      body.email === "admin.compliance@upnext.dev" ||
      body.email === "admin.finance@upnext.dev" ||
      body.email === "admin.support@upnext.dev"
    ) {
      return HttpResponse.json({
        accessToken: "mock-admin-token-123",
        tokenType: "Bearer",
        user: { id: "admin-1", email: body.email, role: "ADMIN" },
      });
    }
    return HttpResponse.json(
      { message: "Invalid credentials", error: "Unauthorized", statusCode: 401 },
      { status: 401 },
    );
  }),
  http.patch(
    `${env.NEXT_PUBLIC_API_BASE_URL}/applications/:id/status`,
    async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as { status: string; note?: string };
      return HttpResponse.json({
        id,
        status: body.status,
        note: body.note,
        updatedAt: new Date().toISOString(),
      });
    },
  ),

  http.get(`${env.NEXT_PUBLIC_API_BASE_URL}/cvs`, () => {
    return HttpResponse.json({
      items: [
        {
          id: "cv-1",
          title: "CV_NguyenQuocVuong.pdf",
          source: "UPLOAD",
          status: "ACTIVE",
          isDefault: true,
          createdAt: "2025-06-10T12:00:00Z",
          updatedAt: "2025-06-10T12:00:00Z",
          versions: [
            {
              id: "cv-v1",
              sourceFileId: "file-1",
              createdAt: "2025-06-10T12:00:00Z",
              sourceFile: {
                id: "file-1",
                originalName: "CV_NguyenQuocVuong.pdf",
                mimeType: "application/pdf",
                publicUrl: "https://api-staging.upnext.works/files/cv-1.pdf",
              },
            },
          ],
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
  }),

  http.post(`${env.NEXT_PUBLIC_API_BASE_URL}/files/upload`, async ({ request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const name = file ? file.name : "uploaded_cv.pdf";
      return HttpResponse.json({
        file: {
          id: `mock-file-${Math.random().toString(36).substring(2, 9)}`,
          originalName: name,
          mimeType: file ? file.type : "application/pdf",
          publicUrl: "https://api-staging.upnext.works/files/mock-uploaded.pdf",
          sizeBytes: file ? String(file.size) : "512000",
        },
      });
    } catch {
      return HttpResponse.json({
        file: {
          id: "mock-file-123",
          originalName: "uploaded_cv.pdf",
          mimeType: "application/pdf",
          publicUrl: "https://api-staging.upnext.works/files/mock-uploaded.pdf",
          sizeBytes: "512000",
        },
      });
    }
  }),

  http.post(`${env.NEXT_PUBLIC_API_BASE_URL}/cvs`, async ({ request }) => {
    const body = (await request.json()) as { title: string; sourceFileId: string };
    return HttpResponse.json({
      id: `mock-cv-${Math.random().toString(36).substring(2, 9)}`,
      title: body.title,
      source: "UPLOAD",
      status: "ACTIVE",
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          id: `mock-cv-v-${Math.random().toString(36).substring(2, 9)}`,
          sourceFileId: body.sourceFileId,
          createdAt: new Date().toISOString(),
          sourceFile: {
            id: body.sourceFileId,
            originalName: body.title,
            mimeType: "application/pdf",
            publicUrl: "https://api-staging.upnext.works/files/mock-uploaded.pdf",
          },
        },
      ],
    });
  }),

  http.post(`${env.NEXT_PUBLIC_API_BASE_URL}/applications`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: `mock-app-${Math.random().toString(36).substring(2, 9)}`,
      status: "reviewing",
      submittedAt: new Date().toISOString(),
      ...body,
    });
  }),
];
