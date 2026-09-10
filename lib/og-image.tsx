import { ImageResponse } from "next/og";

export const ogImageAlt =
  "WOB Analysis — AI YouTube monetization and compliance checker";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = "image/png";

export function createOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#060606",
          color: "#E0E0E0",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#111111",
              border: "1px solid #1A1A1A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2DD4BF",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            W
          </div>
          <div
            style={{
              marginLeft: 18,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            WOB Analysis
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 1.08,
              color: "#FFFFFF",
            }}
          >
            AI YouTube monetization & compliance checker
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 28,
              color: "#9CA3AF",
              lineHeight: 1.35,
            }}
          >
            Scan for yellow-dollar risks, profanity, and advertiser-friendly
            guideline breaks before you upload.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#2DD4BF",
          }}
        >
          <span>www.wobanalysis.com</span>
          <span style={{ color: "#A78BFA" }}>Video compliance audit</span>
        </div>
      </div>
    ),
    {
      ...ogImageSize,
    }
  );
}

export function createSquareIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060606",
          color: "#2DD4BF",
          fontSize: Math.round(size * 0.46),
          fontWeight: 800,
          letterSpacing: "-0.06em",
        }}
      >
        W
      </div>
    ),
    { width: size, height: size }
  );
}
