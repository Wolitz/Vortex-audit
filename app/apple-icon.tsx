import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 32 32"
          fill="none"
        >
          <rect width="32" height="32" rx="8" fill="#060606" />
          <rect
            x="0.5"
            y="0.5"
            width="31"
            height="31"
            rx="7.5"
            fill="none"
            stroke="#1A1A1A"
          />
          <path
            d="M7 10.5l3.2 11h2.5L16 13l3.3 8.5h2.5l3.2-11h-2.6l-2 7.4-2.9-7.4h-2.4l-2.9 7.4-2-7.4z"
            fill="#2DD4BF"
          />
          <circle cx="24.5" cy="8.5" r="2.5" fill="#A78BFA" />
        </svg>
      </div>
    ),
    size
  );
}
