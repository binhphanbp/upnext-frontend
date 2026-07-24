import localFont from "next/font/local";

export const svnGilroy = localFont({
  src: [
    { path: "./fonts/svn-gilroy/SVN-Gilroy Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy XBold.otf", weight: "800", style: "normal" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy Black.otf", weight: "900", style: "normal" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy Medium Italic.otf", weight: "500", style: "italic" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy SemiBold Italic.otf", weight: "600", style: "italic" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy Bold Italic.otf", weight: "700", style: "italic" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy XBold Italic.otf", weight: "800", style: "italic" },
    { path: "./fonts/svn-gilroy/SVN-Gilroy Black Italic.otf", weight: "900", style: "italic" },
  ],
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  preload: false,
  variable: "--font-sans",
});
