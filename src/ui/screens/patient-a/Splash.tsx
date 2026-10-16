"use client";
// P01 Splash (225:10): green gradient, Lobster wordmark + leaf, "Doctors who listen".
// Tapping anywhere goes home; the flag stops "/" sending the reader back here.
import "@fontsource/lobster/400.css";
import { asset } from "@/src/ui/base-path";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markSplashSeen } from "@/src/ui/store";

export function Splash() {
  const router = useRouter();
  useEffect(() => {
    markSplashSeen();
    router.prefetch("/");
  }, [router]);
  return (
    <main
      role="button"
      tabIndex={0}
      aria-label="Continue"
      onClick={() => router.push("/")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") router.push("/");
      }}
      className="relative mx-auto min-h-dvh w-full max-w-[430px] cursor-pointer overflow-clip sm:my-6 sm:min-h-[932px] sm:rounded-[50px] sm:shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
      style={{ background: "linear-gradient(180deg, #2f5d3a 0%, #0f2c1c 100%)" }}
    >
      <div className="absolute left-[141px] top-[390px] flex items-center gap-[10px]">
        <span className="text-[44px] leading-normal text-white" style={{ fontFamily: '"Lobster", cursive' }}>
          wattle
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/figma/leaf.svg")} alt="" width={34} height={34} className="block size-[34px]" />
      </div>
      <p className="absolute left-1/2 top-[474px] w-[300px] -translate-x-1/2 text-center text-[20px] font-medium leading-normal text-[#e8e8e8]">Doctors who listen</p>
    </main>
  );
}
