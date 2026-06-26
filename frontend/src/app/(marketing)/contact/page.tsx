import { ContactClient } from "@/components/marketing/ContactClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | ThreadCounty",
  description: "Get in touch with the ThreadCounty team for enterprise support or general inquiries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-muslin selection:bg-shuttle-red selection:text-muslin pt-20">
      <ContactClient />
    </div>
  );
}
