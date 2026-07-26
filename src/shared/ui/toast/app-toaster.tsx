"use client";

import { Toaster } from "sonner";

type AppToasterProps = {
  locale: string;
};

export function AppToaster({ locale }: AppToasterProps) {
  const isVietnamese = locale === "vi";

  return (
    <Toaster
      closeButton
      containerAriaLabel={isVietnamese ? "Thông báo" : "Notifications"}
      duration={5_000}
      gap={10}
      mobileOffset={{
        bottom: "max(16px, calc(env(safe-area-inset-bottom) + 12px))",
        left: "16px",
        right: "16px",
      }}
      offset={{ bottom: "24px", right: "24px" }}
      position="bottom-right"
      swipeDirections={["right"]}
      toastOptions={{
        classNames: {
          actionButton: "upnext-toast-action",
          closeButton: "upnext-toast-dismiss",
          error: "upnext-toast-error",
          success: "upnext-toast-success",
          toast: "upnext-toast",
        },
        closeButtonAriaLabel: isVietnamese ? "Đóng thông báo" : "Dismiss notification",
        unstyled: true,
      }}
      visibleToasts={3}
    />
  );
}
