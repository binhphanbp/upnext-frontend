"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { loginRecruiterWithMagicLink } from "@/features/recruiter/api/auth";
import { clearRecruiterSession, getRecruiterSession } from "@/features/recruiter/session";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";

import { RecruiterAuthShell } from "./login-page";

/**
 * Chỉ nhận đường dẫn nội bộ trong khu vực nhà tuyển dụng.
 *
 * `to` đến từ query string nên nếu tin thẳng thì đây là một open redirect: kẻ tấn công
 * gửi `/recruiter/continue?to=https://evil.example` và người dùng bị đẩy ra ngoài từ một
 * URL mang tên miền của mình. `//` cũng bị loại vì trình duyệt hiểu đó là protocol-relative.
 */
function safeTarget(raw: string | null) {
  if (!raw) return null;
  if (!raw.startsWith("/recruiter/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

type Phase =
  | { kind: "working" }
  | { kind: "wrong-account"; current: string; expected: string }
  | { kind: "failed"; message: string };

/**
 * Chặng trung gian cho các link trong email gửi nhà tuyển dụng.
 *
 * Giải hai vấn đề:
 * 1. Email gửi cho tài khoản A nhưng trình duyệt đang giữ session của B — bấm link vào
 *    là thấy dữ liệu công ty của B mà không hề biết.
 * 2. Phải nhập mật khẩu lại chỉ để xem thứ mà email vừa nói.
 *
 * `token` trong link đổi được thành session của đúng tài khoản nhận email, nên khi cần
 * đổi tài khoản thì đổi luôn, không đẩy về trang đăng nhập.
 *
 * Token chỉ được đổi khi người dùng bấm nút, hoặc khi máy chưa có session nào — không
 * đổi ngầm lúc trang vừa mở nếu đang có session khác, vì làm vậy là tự ý đăng xuất
 * tài khoản người ta đang dùng.
 */
export function RecruiterContinuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>({ kind: "working" });

  const target = safeTarget(searchParams.get("to")) ?? "/recruiter";
  const expected = searchParams.get("as");
  const token = searchParams.get("token");

  // Link trong email hay bị mail client GET trước để preview, và React 18 gọi effect
  // hai lần ở dev — ref này giữ cho việc đổi token chỉ chạy một lần.
  const exchanging = useRef(false);

  const signInWithToken = useCallback(
    async (magicToken: string) => {
      if (exchanging.current) return;
      exchanging.current = true;

      try {
        const session = await loginRecruiterWithMagicLink(magicToken);

        clearRecruiterSession();
        localStorage.setItem("upnext.recruiter.accessToken", session.accessToken);
        localStorage.setItem("upnext.recruiter.refreshToken", session.refreshToken);
        localStorage.setItem("upnext.recruiter.tokenType", session.tokenType);
        localStorage.setItem("upnext.recruiter.user", JSON.stringify(session.user));

        router.replace(target);
      } catch {
        exchanging.current = false;
        // Token hết hạn sau 30 phút — nói rõ để người dùng biết phải đăng nhập tay.
        setPhase({
          kind: "failed",
          message: "Link đăng nhập đã hết hạn. Vui lòng đăng nhập bằng mật khẩu.",
        });
      }
    },
    [router, target],
  );

  useEffect(() => {
    const session = getRecruiterSession();
    const current = session?.user.email;

    // Chưa đăng nhập: có token thì vào luôn, không thì về trang đăng nhập.
    if (!session) {
      if (token) {
        void signInWithToken(token);
      } else {
        router.replace(`/recruiter/login?redirect=${encodeURIComponent(target)}`);
      }
      return;
    }

    // Không có gì để đối chiếu thì cứ đi tiếp.
    if (!expected || !current) {
      router.replace(target);
      return;
    }

    if (current.toLowerCase() !== expected.toLowerCase()) {
      setPhase({ kind: "wrong-account", current, expected });
      return;
    }

    router.replace(target);
  }, [router, target, expected, token, signInWithToken]);

  if (phase.kind === "working") {
    return (
      <RecruiterAuthShell basic>
        <p className="py-10 text-center text-sm text-slate-500">Đang chuyển hướng…</p>
      </RecruiterAuthShell>
    );
  }

  if (phase.kind === "failed") {
    return (
      <RecruiterAuthShell basic>
        <div className="py-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Không mở được link</h2>
          <p className="mt-3 text-sm text-slate-600">{phase.message}</p>
          <Button
            className="mt-6 w-full"
            onClick={() =>
              router.replace(`/recruiter/login?redirect=${encodeURIComponent(target)}`)
            }
          >
            Đăng nhập
          </Button>
        </div>
      </RecruiterAuthShell>
    );
  }

  return (
    <RecruiterAuthShell basic>
      <div className="py-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">Sai tài khoản</h2>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-relaxed text-amber-800">
          <p className="font-semibold">Lưu ý về tài khoản:</p>
          <p className="mt-2">
            Bạn đang đăng nhập bằng <strong>{phase.current}</strong>, nhưng email này được gửi cho{" "}
            <strong>{phase.expected}</strong>.
          </p>
          <p className="mt-2">
            Nếu tiếp tục, bạn sẽ xem dữ liệu của công ty gắn với tài khoản đang đăng nhập, không
            phải công ty trong email.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {token ? (
            <Button onClick={() => void signInWithToken(token)}>
              Chuyển sang {phase.expected}
            </Button>
          ) : (
            <Button
              onClick={() => {
                clearRecruiterSession();
                router.replace(`/recruiter/login?redirect=${encodeURIComponent(target)}`);
              }}
            >
              Đăng nhập bằng {phase.expected}
            </Button>
          )}
          <Button variant="outline" onClick={() => router.replace(target)}>
            Tiếp tục với {phase.current}
          </Button>
        </div>
      </div>
    </RecruiterAuthShell>
  );
}
