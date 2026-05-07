"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { ui } from "../lib/ui";

type BarcodeScannerProps = {
  onDetected: (text: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({
  onDetected,
  onClose,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const detectedRef = useRef(false);
  const [message, setMessage] = useState("カメラを起動しています...");

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    const stream = videoRef.current?.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
  };

  const closeScanner = () => {
    stopCamera();
    onClose();
  };

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();

        if (!videoRef.current) return;

        const controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (!result) return;
            if (detectedRef.current) return;

            detectedRef.current = true;

            const text = result.getText();

            stopCamera();
            onDetected(text);
          }
        );

        if (!active) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setMessage("ISBNバーコードを枠内に写してください。");
      } catch (error) {
        console.error("Barcode scanner error:", error);
        setMessage(
          "カメラを起動できませんでした。別のアプリでカメラを使用していないか、ブラウザのカメラ権限を確認してください。"
        );
      }
    };

    start();

    return () => {
      active = false;
      stopCamera();
    };
  }, [onDetected]);

  return (
    <div className="barcodeBackdrop" onClick={closeScanner}>
      <div className="barcodeSheet" onClick={(e) => e.stopPropagation()}>
        <div className="barcodeHeader">
          <p className="barcodeTitle">バーコード読み取り</p>

          <button
            type="button"
            className="barcodeClose"
            onClick={closeScanner}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <video
          ref={videoRef}
          style={{
            width: "100%",
            borderRadius: "16px",
            background: "#000",
          }}
          muted
          playsInline
        />

        <p
          style={{
            margin: "12px 0 0",
            color: ui.colors.subText,
            fontSize: "14px",
          }}
        >
          {message}
        </p>
      </div>

      <style jsx>{`
        .barcodeBackdrop {
          position: fixed;
          inset: 0;
          background: rgba(38, 51, 34, 0.28);
          z-index: 4000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
        }

        .barcodeSheet {
          width: 100%;
          max-width: 520px;
          background: ${ui.colors.cardBg};
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 -8px 28px rgba(38, 51, 34, 0.18);
        }

        .barcodeHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .barcodeTitle {
          margin: 0;
          color: ${ui.colors.text};
          font-weight: 700;
          font-size: 16px;
        }

        .barcodeClose {
          border: none;
          background: ${ui.colors.hoverBg};
          color: ${ui.colors.text};
          width: 36px;
          height: 36px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }

        @media (max-width: 768px) {
          .barcodeBackdrop {
            padding: 0;
          }

          .barcodeSheet {
            max-width: none;
            border-radius: 18px 18px 0 0;
          }
        }
      `}</style>
    </div>
  );
}