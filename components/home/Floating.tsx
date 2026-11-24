"use client";

import React, { useEffect, useRef, useState } from "react";
import Logo from '@/components/Logo'

type Activity = "deposit" | "withdrawal";

interface PopupData {
  username: string;
  country: string;
  amount: number;
  activity: Activity;
}

export default function Floating() {
  const [visible, setVisible] = useState(false);
  const [popup, setPopup] = useState<PopupData | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const names = [
      "Tony", "Alex", "Emily", "Chris", "Sophia", "Michael",
      "Olivia", "William", "Ava", "James", "Grace", "Daniel",
      "Emma", "Joseph", "Mia", "David", "Ella", "Andrew",
      "Amelia", "Benjamin",
    ];

    const countries = [
      "USA", "Canada", "UK", "Australia", "Germany", "France",
      "Italy", "Spain", "Japan", "Brazil", "Mexico", "South Africa",
      "Netherlands", "Switzerland", "Ireland",
    ];

    let mounted = true;

    const showPopup = () => {
      if (!mounted) return;

      const activity: Activity =
        Math.random() > 0.5 ? "deposit" : "withdrawal";

      setPopup({
        username: names[Math.floor(Math.random() * names.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        amount: Math.floor(Math.random() * 144000) + 40000,
        activity,
      });

      setVisible(true);

      timeoutRef.current = setTimeout(() => {
        if (!mounted) return;
        setVisible(false);

        timeoutRef.current = setTimeout(showPopup, 7000);
      }, 5000);
    };

    // Demo preview only — replace with real transaction events.
    timeoutRef.current = setTimeout(showPopup, 2000);

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const w = window as any;

    w.gtranslateSettings = {
      default_language: "en",
      wrapper_selector: ".gtranslate_wrapper",
      flag_style: "3d",
    };

    w.googleTranslateElementInit = function () {
      try {
        if (w.google?.translate?.TranslateElement) {
          new w.google.translate.TranslateElement(
            { pageLanguage: "en" },
            "google_translate_element"
          );
        }
      } catch {
        // Translation widget may be blocked or unavailable.
      }
    };

    w.changeLanguageByValue = function (language: string) {
      const selectField = document.querySelector<HTMLSelectElement>(
        "#google_translate_element select"
      );

      if (!selectField) return;

      const option = Array.from(selectField.options).find(
        (item) => item.value === language
      );

      if (option) {
        selectField.value = option.value;
        selectField.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    const scripts = [
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit",
      "https://cdn.gtranslate.net/widgets/latest/float.js",
    ];

    const addedScripts: HTMLScriptElement[] = [];

    scripts.forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
      addedScripts.push(script);
    });

    return () => {
      // Remove only scripts created by this component.
      addedScripts.forEach((script) => {
        script.onload = null;
        script.onerror = null;
        script.remove();
      });
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }} />
      <div className="gtranslate_wrapper" />

      <div
        aria-live="polite"
        aria-atomic="true"
        aria-hidden={!visible}
        className={`fixed bottom-3 left-3 z-[9999] w-[min(290px,calc(100vw-24px))] transition-all duration-500 sm:bottom-6 sm:left-6 sm:w-full sm:max-w-[350px] ${
          visible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {popup && (
          <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#101512]/95 text-white shadow-[0_16px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="">
                <Logo className="sm:h-9 sm:w-9"/>
                <p className="text-[10px] text-gray-400">
                  Community activity live
                </p>
              </div>

              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-3 p-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  popup.activity === "deposit"
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "bg-sky-400/10 text-red-400"
                }`}
              >
                {popup.activity === "deposit" ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12m-5-5 5 5 5-5" />
                    <path d="M5 17v3h14v-3" />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 21V9m-5 5 5-5 5 5" />
                    <path d="M5 7V4h14v3" />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {popup.username}{" "}
                  <span className="font-normal text-gray-400">
                    from {popup.country}
                  </span>
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {popup.activity === "deposit"
                    ? "Deposit activity (live)"
                    : "Withdrawal activity (live)"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.07] bg-white/[0.025] px-4 py-3">
              <span className="text-xs text-gray-400">
                Example amount
              </span>

              <span
                className={`text-base font-bold tabular-nums ${
                  popup.activity === "deposit"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                ${popup.amount.toLocaleString("en-US")}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
