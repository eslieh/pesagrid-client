"use client";

import { motion } from "framer-motion";
import { useState } from "react";

function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-3xl border border-zinc-900/10 bg-white shadow-[0_1px_0_0_rgba(24,24,27,0.04),0_20px_60px_-40px_rgba(24,24,27,0.55)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-zinc-100 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors group"
      >
        <h3 className="text-base font-semibold text-zinc-900 group-hover:text-lime-600 transition-colors">
          {question}
        </h3>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="h-5 w-5 text-zinc-400 flex-shrink-0 ml-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </button>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ 
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 text-sm text-zinc-600 leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </div>
  );
}

export default function FAQClient({ faqCategories }) {
  const [openItems, setOpenItems] = useState(new Set([0]));

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="grid gap-12">
      {faqCategories.map((category, categoryIndex) => (
        <motion.div
          key={category.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
        >
          <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
            {category.title}
          </h2>
          <Card className="divide-y divide-zinc-100">
            {category.questions.map((item, questionIndex) => {
              const globalIndex = categoryIndex * 100 + questionIndex;
              return (
                <FAQItem
                  key={globalIndex}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openItems.has(globalIndex)}
                  onToggle={() => toggleItem(globalIndex)}
                />
              );
            })}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
