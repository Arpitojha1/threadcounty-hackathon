import { FaqClient } from "@/components/marketing/FaqClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | ThreadCounty",
  description: "Frequently asked questions about ThreadCounty.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-muslin selection:bg-shuttle-red selection:text-muslin pt-20">
      <FaqClient />
    </div>
  );
}
