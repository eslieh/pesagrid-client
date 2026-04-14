"use client";

import { motion } from "framer-motion";
import Link from "next/link";
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
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors"
      >
        <span className="text-sm font-semibold text-zinc-900">{question}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="h-4 w-4 text-zinc-400 flex-shrink-0"
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
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-4 text-sm text-zinc-600 leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState(new Set([0])); // Open first item by default

  const toggleItem = (index) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqCategories = [
    {
      title: "Getting Started",
      questions: [
        {
          question: "What is PesaGrid?",
          answer: "PesaGrid is an automated reconciliation and payments platform designed for Kenyan businesses. It helps you automatically match payments from M-PESA, banks, and other payment providers to your invoices, subscriptions, or fees, eliminating manual work and reducing errors."
        },
        {
          question: "How do I get started with PesaGrid?",
          answer: "Getting started is easy! Simply click 'Get Started' on our homepage, create an account, and follow the onboarding process. You'll need to connect your payment sources (like M-PESA paybill or bank accounts) and upload your customer data. Our team will guide you through the setup process."
        },
        {
          question: "What payment providers does PesaGrid support?",
          answer: "Currently, PesaGrid supports M-PESA (Paybill, Till, and Statements) and KCB Bank transfers. We're continuously adding more payment providers to serve your needs better."
        },
        {
          question: "Is there a minimum contract period?",
          answer: "No, we offer flexible monthly subscriptions. You can upgrade, downgrade, or cancel your plan at any time. However, we recommend using the platform for at least 3 months to see the full benefits of automated reconciliation."
        }
      ]
    },
    {
      title: "Pricing & Billing",
      questions: [
        {
          question: "How does the wallet model work?",
          answer: "The wallet model requires you to maintain a minimum balance in your PesaGrid wallet. Subscription fees and SMS charges (KES 0.50 per notification) are automatically deducted from this wallet. This ensures uninterrupted service and automated billing."
        },
        {
          question: "What's included in the subscription fee?",
          answer: "Your subscription includes access to the reconciliation platform, automated payment matching, dashboard access, reporting features, and customer support. SMS notifications are charged separately at KES 0.50 per message."
        },
        {
          question: "Can I change my plan later?",
          answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. If you need to add more branches or features, simply contact our support team."
        },
        {
          question: "Are there any setup fees?",
          answer: "No, there are no setup fees for our standard plans. Enterprise customers with custom requirements may have implementation fees, which are discussed during the consultation process."
        }
      ]
    },
    {
      title: "Features & Functionality",
      questions: [
        {
          question: "How accurate is the payment matching?",
          answer: "Our intelligent matching algorithm achieves 100% accuracy for properly formatted payments. It uses multiple data points including amount, customer details, reference numbers, and timing to automatically match payments to the correct invoices or obligations."
        },
        {
          question: "Can I send automated reminders to customers?",
          answer: "Yes! PesaGrid automatically sends SMS, WhatsApp, and email reminders for overdue or partial payments. You can customize the message templates and timing to suit your business needs."
        },
        {
          question: "How do I handle partial payments?",
          answer: "Partial payments are automatically detected and matched to the corresponding invoice. The system tracks the remaining balance and continues to send reminders until full payment is received. You can view all partial payment details in your dashboard."
        },
        {
          question: "Can I export reports and data?",
          answer: "Yes, you can export detailed reports in various formats including Excel and CSV. Reports include payment reconciliations, outstanding balances, collection trends, and branch-wise performance. Weekly email reports are also sent automatically."
        }
      ]
    },
    {
      title: "Security & Support",
      questions: [
        {
          question: "How secure is my data?",
          answer: "We take security seriously. All data is encrypted in transit and at rest using industry-standard encryption. We comply with Kenyan data protection regulations and conduct regular security audits. Your financial data is stored securely with limited access."
        },
        {
          question: "What kind of support do you provide?",
          answer: "We provide comprehensive support including email support, phone support during business hours, and a knowledge base with documentation and tutorials. Enterprise customers get dedicated account managers and priority support."
        },
        {
          question: "Is there training available?",
          answer: "Yes, we provide onboarding training for all new customers. This includes setup assistance, dashboard training, and best practices for reconciliation. We also offer ongoing webinars and training sessions for advanced features."
        },
        {
          question: "What happens if there's a system outage?",
          answer: "We maintain 99.9% uptime and have redundancy systems in place. In the rare event of an outage, we work to restore service quickly. All data is backed up regularly, and you'll be notified of any service disruptions via email and SMS."
        }
      ]
    },
    {
      title: "Technical Requirements",
      questions: [
        {
          question: "Do I need to install any software?",
          answer: "No, PesaGrid is a cloud-based platform. You can access it from any web browser on your computer, tablet, or mobile device. There's no software to install or maintain."
        },
        {
          question: "What internet speed do I need?",
          answer: "A standard broadband connection is sufficient. The platform is optimized to work well even with moderate internet speeds. Most features work well with 3G or better connectivity."
        },
        {
          question: "Can I integrate PesaGrid with my existing systems?",
          answer: "Yes, we offer API access for Enterprise customers, allowing integration with your existing accounting, ERP, or CRM systems. Our technical team can assist with custom integrations based on your requirements."
        },
        {
          question: "How often is the data synchronized?",
          answer: "Data synchronization happens in real-time for connected payment providers. Your dashboard shows the latest information within minutes of payment processing. You can also manually sync data at any time."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors mb-6"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-zinc-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-zinc-600 max-w-3xl">
              Find answers to common questions about PesaGrid's automated reconciliation platform. 
              Can't find what you're looking for? Contact our support team.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
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

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-zinc-600 mb-6 max-w-2xl mx-auto">
              Our team is here to help you understand how PesaGrid can transform your payment reconciliation process. 
              Get in touch with us for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-full border border-zinc-900/10 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
