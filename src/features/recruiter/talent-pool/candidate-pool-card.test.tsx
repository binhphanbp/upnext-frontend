import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AiSearchResultCard, TalentPoolCard } from "./api";
import { CandidatePoolCard, type CandidatePoolCardCopy } from "./candidate-pool-card";

const COPY: CandidatePoolCardCopy = {
  noHeadline: "Chưa có mô tả nghề nghiệp",
  viewDetail: "Xem chi tiết",
  viewedBadge: "Đã xem tháng này",
  matchScoreLabel: (score: number) => `Phù hợp ${score}%`,
  activeSeeking: "Đang tìm việc",
  lastUpdated: (date: string) => `Lần cập nhật gần nhất: ${date}`,
  upgradeToViewCompany: "Mua gói Tìm kiếm ứng viên để xem đầy đủ ...",
  noExperience: "Chưa có kinh nghiệm",
  experienceYears: (years: number) => `${years} năm`,
  salaryNegotiable: "Thoả thuận",
  hasCvTooltip: "Có đính kèm CV",
  saveCandidate: "Lưu hồ sơ",
  savedCandidate: "Đã lưu",
};

function card(overrides: Partial<TalentPoolCard> = {}): TalentPoolCard {
  return {
    candidateProfileId: "cand-1",
    fullName: "Nguyễn Văn A",
    headline: "Backend Engineer",
    currentCompany: "FooCorp",
    description: "3 năm kinh nghiệm Node.js",
    city: "Hồ Chí Minh",
    skills: [{ id: "s1", name: "NestJS" }],
    viewedThisPeriod: false,
    ...overrides,
  };
}

describe("CandidatePoolCard", () => {
  it("hiện đúng nội dung an toàn của card duyệt, kể cả tên thật", () => {
    // Tên KHÔNG bị che ở Kho CV v2 -- chỉ hai kênh liên hệ trực tiếp
    // (email/SĐT) mới đổi tiền để xem, và cả hai đều không có mặt ở tầng danh
    // sách (chỉ chi tiết mới trả).
    render(<CandidatePoolCard card={card()} copy={COPY} onViewDetail={vi.fn()} />);

    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("FooCorp")).toBeInTheDocument();
    expect(screen.getByText("Hồ Chí Minh")).toBeInTheDocument();
    expect(screen.getByText("NestJS")).toBeInTheDocument();
  });

  it("KHÔNG bao giờ hiện email/SĐT -- danh sách duyệt không mang kênh liên hệ", () => {
    // `TalentPoolCard` cấu trúc đã không có hai field này (chỉ
    // `TalentPoolDetail` mới có, và chỉ khi `unlocked`), nhưng khoá thêm ở đây
    // để một regression đưa chúng lọt vào type (rồi vào props) vẫn bị bắt ở
    // tầng render.
    const { container } = render(
      <CandidatePoolCard card={card()} copy={COPY} onViewDetail={vi.fn()} />,
    );

    expect(container.innerHTML).not.toMatch(/@[\w.-]+\.[a-z]{2,}/i);
    expect(container.innerHTML).not.toMatch(/0\d{9,10}/);
  });

  it("gọi onViewDetail với đúng candidateProfileId", () => {
    const onViewDetail = vi.fn();
    render(<CandidatePoolCard card={card()} copy={COPY} onViewDetail={onViewDetail} />);

    screen.getByRole("button", { name: COPY.viewDetail }).click();

    expect(onViewDetail).toHaveBeenCalledWith("cand-1");
  });

  it("đã xem trong kỳ thì hiện badge, chưa xem thì không", () => {
    const { rerender } = render(
      <CandidatePoolCard
        card={card({ viewedThisPeriod: true })}
        copy={COPY}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.getByText(COPY.viewedBadge)).toBeInTheDocument();

    rerender(
      <CandidatePoolCard
        card={card({ viewedThisPeriod: false })}
        copy={COPY}
        onViewDetail={vi.fn()}
      />,
    );
    expect(screen.queryByText(COPY.viewedBadge)).toBeNull();
  });

  it("thiếu headline/currentCompany/city/description thì không render dòng trống", () => {
    const { container } = render(
      <CandidatePoolCard
        card={card({
          headline: null,
          currentCompany: null,
          city: null,
          description: null,
          skills: [],
        })}
        copy={COPY}
        onViewDetail={vi.fn()}
      />,
    );

    expect(screen.getByText(COPY.noHeadline)).toBeInTheDocument();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("card từ AI search hiện matchScore", () => {
    const aiCard: AiSearchResultCard = { ...card(), matchScore: 87 };
    render(<CandidatePoolCard card={aiCard} copy={COPY} onViewDetail={vi.fn()} />);
    expect(screen.getByText("Phù hợp 87%")).toBeInTheDocument();
  });

  it("card duyệt thường (không phải AI search) không hiện matchScore", () => {
    render(<CandidatePoolCard card={card()} copy={COPY} onViewDetail={vi.fn()} />);
    expect(screen.queryByText(/Phù hợp/)).toBeNull();
  });

  it("chỉ hiện badge Đang tìm việc khi isOpenToWork = true", () => {
    const { rerender } = render(
      <CandidatePoolCard card={card({ isOpenToWork: true })} copy={COPY} onViewDetail={vi.fn()} />,
    );
    expect(screen.getByText("Đang tìm việc")).toBeInTheDocument();

    rerender(
      <CandidatePoolCard card={card({ isOpenToWork: false })} copy={COPY} onViewDetail={vi.fn()} />,
    );
    expect(screen.queryByText("Đang tìm việc")).toBeNull();
  });
});
