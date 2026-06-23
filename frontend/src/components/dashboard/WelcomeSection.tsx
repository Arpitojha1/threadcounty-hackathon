"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function WelcomeSection({ email }: { email: string }) {
  const [greeting, setGreeting] = useState("WELCOME BACK");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("GOOD MORNING");
    else if (hour < 18) setGreeting("GOOD AFTERNOON");
    else setGreeting("GOOD EVENING");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className="font-display text-4xl md:text-5xl uppercase text-loom-iron dark:text-muslin tracking-wide">
        {greeting},<br />
        <span className="text-shuttle-red break-all">{email}</span>
      </h1>
    </motion.div>
  );
}
