"use client";
import Link from "next/link";

import { useState } from "react";
import { CutCornerPanel } from "@/components/ui/cut-corner-panel";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "How accurate is the computer vision model?",
    answer: "Our computer vision model is highly accurate for standard weaves (like plain and twill weaves) in good lighting, often exceeding 95% confidence. However, extremely textured, sheer, or complex jacquard fabrics may receive lower confidence scores."
  },
  {
    question: "Do I need special equipment?",
    answer: "No. A standard smartphone camera with a macro lens attachment is usually sufficient. For best results, ensure the fabric is flat, well-lit, and the image is perfectly in focus."
  },
  {
    question: "What types of fabrics can be analyzed?",
    answer: "ThreadCounty is currently optimized for woven fabrics (plain weave, twill, satin). Knits and non-wovens are not officially supported at this time and will likely yield inaccurate thread density counts."
  },
  {
    question: "Can I export my analysis history?",
    answer: "Yes, you can download the raw JSON data or the original uploaded image directly from your History dashboard."
  },
  {
    question: "Is my uploaded data private?",
    answer: "Yes. All uploads are stored securely and are only accessible to the account that uploaded them, enforced by strict Row Level Security (RLS) policies in our database."
  },
  {
    question: "How do I delete my account?",
    answer: "You can request account deletion from your Profile page. This will soft-delete your data and log you out immediately. Hard-deletion of your auth record must be manually processed by our team."
  }
];

export function FaqClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-24 sm:py-32">
      <div className="text-center mb-16">
        <h1 className="font-display text-5xl sm:text-6xl uppercase text-loom-iron mb-6">
          Frequently Asked <span className="text-shuttle-red">Questions</span>
        </h1>
        <p className="font-sans text-lg text-concrete-grey">
          Everything you need to know about the product and billing.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <CutCornerPanel
              key={index}
              variant={isOpen ? "loom-iron" : "transparent"}
              bordered={!isOpen}
              size="sm"
              className={cn("transition-colors overflow-hidden", !isOpen && "bg-white border-loom-iron/10")}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full text-left px-6 py-5 flex items-center justify-between focus:outline-none"
              >
                <span className={cn("font-display text-xl uppercase", isOpen ? "text-muslin" : "text-loom-iron")}>
                  {faq.question}
                </span>
                <span className={cn("ml-6 shrink-0 transition-transform duration-200", isOpen ? "rotate-45 text-shuttle-red" : "text-concrete-grey")}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </span>
              </button>
              
              <div
                className={cn(
                  "px-6 overflow-hidden transition-all duration-300 ease-in-out",
                  isOpen ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <p className="font-sans text-muslin/80">
                  {faq.answer}
                </p>
              </div>
            </CutCornerPanel>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <p className="font-sans text-concrete-grey">
          Still have questions?{" "}
          <Link href="/contact" className="font-semibold text-shuttle-red hover:underline">
            Get in touch
          </Link>
        </p>
      </div>
    </div>
  );
}
