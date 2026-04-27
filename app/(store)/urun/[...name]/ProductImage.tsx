"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductImage({
  src,
  alt,
  width,
  height,
  style,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}) {
  const [error, setError] = useState(false);
  if (error) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={style}
      onError={() => setError(true)}
    />
  );
}
