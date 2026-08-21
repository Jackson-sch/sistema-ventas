"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode as QrIcon } from "lucide-react";

interface SunatQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function SunatQrCode({
  value,
  size = 100,
  className = "",
  alt = "Código QR SUNAT",
}: SunatQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setHasError(true);
      return;
    }

    let isMounted = true;

    QRCode.toDataURL(value, {
      width: size * 2, // 2x for retina / high-DPI thermal print crispness
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setHasError(false);
        }
      })
      .catch((err) => {
        console.error("Error generando QR SUNAT:", err);
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (hasError || !dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-white text-slate-900 border border-slate-300 rounded flex flex-col items-center justify-center p-1 text-center ${className}`}
      >
        <QrIcon className="size-6 text-slate-700 stroke-[1.5]" />
        <span className="text-[7px] font-mono font-bold leading-tight mt-0.5">QR SUNAT</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`block object-contain image-rendering-pixelated bg-white ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
