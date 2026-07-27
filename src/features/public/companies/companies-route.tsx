"use client";

import { useRouter } from "@/i18n/navigation";

import { PublicFooter } from "../shared/public-footer";
import { PublicHeader } from "../shared/public-header";
import { PublicCompanyPage } from "./components";

export function CompaniesRoute({ slug }: { slug?: string }) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  if (!slug) {
    return (
      <main className="company-page">
        <PublicHeader navigate={navigate} />
        <section className="company-page-state">
          <h1>Danh sách công ty</h1>
          <p>Chọn một công ty từ trang chủ hoặc kết quả tìm kiếm để xem thông tin chi tiết.</p>
          <button type="button" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </section>
        <PublicFooter navigate={navigate} />
      </main>
    );
  }

  return <PublicCompanyPage slug={slug} navigate={navigate} />;
}

export function CompanyDetailRoute({ slug }: { slug: string }) {
  return <CompaniesRoute slug={slug} />;
}
