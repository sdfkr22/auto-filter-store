"use client";

import { useRouter } from "next/navigation";

export default function SortSelectClient({
  currentSort,
  options,
}: {
  currentSort: string;
  options: { value: string; label: string; url: string }[];
}) {
  const router = useRouter();

  return (
    <select
      value={currentSort}
      onChange={(e) => {
        const opt = options.find((o) => o.value === e.target.value);
        if (opt) router.push(opt.url);
      }}
      style={{
        background: "#0c0c0c",
        border: "1px solid #1f1f1f",
        borderRadius: 6,
        padding: "7px 30px 7px 12px",
        color: "#e5e5e5",
        fontSize: 13,
        outline: "none",
        fontFamily: "inherit",
        cursor: "pointer",
        appearance: "none",
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#0c0c0c" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
