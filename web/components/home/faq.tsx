"use client";

import { useRef } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useHomeGsap } from "./use-home-gsap";

const faqs = [
  {
    question: "What is ProofPay, and how does it work?",
    answer:
      "ProofPay is a trust layer for online transactions. It helps buyers verify vendor credibility before payment by surfacing identity checks, trust scores, and risk signals. Vendors benefit from a visible reputation that builds buyer confidence, leading to more sales. The platform integrates with Kora for secure payment processing.",
  },
  {
    question: "How are the ProofPay fees structured?",
    answer:
      "ProofPay charges vendors a small transaction fee of 2-3% per successful sale, while buyers pay nothing extra. From this fee, ProofPay covers the payment processing cost (about 1.4%) and keeps the remaining amount as revenue; for example, on a ₦10,000 sale, a 2.5% fee generates ₦250, of which ₦140 goes to payment processing and ₦110 is retained by ProofPay.",
  },
  {
    question: "How do I get paid as a vendor?",
    answer:
      "When a buyer completes a payment, the funds are processed through Kora and settled to your registered bank account. The ProofPay transaction fee is deducted at the point of settlement. Settlement timelines depend on your Kora account configuration but typically follow standard payment processing schedules.",
  },
  {
    question: "How does ProofPay protect buyers?",
    answer:
      "ProofPay gives buyers a comprehensive view of each vendor before they commit money. This includes identity verification, a calculated trust score, payment history summaries, and risk flags for incomplete profiles or unusual transaction patterns. Buyers can review all evidence and the order details side-by-side before confirming payment.",
  },
  {
    question: "Which countries is ProofPay available in?",
    answer:
      "ProofPay is currently available in Nigeria, with plans to expand to other African markets. If you are a vendor or buyer in a country not yet supported, you can join the waitlist and we will notify you as soon as we launch in your region.",
  },
] as const;

const Faq = () => {
  const rootRef = useRef<HTMLElement>(null);

  useHomeGsap(rootRef, (gsap, _ScrollTrigger, prefersReducedMotion) => {
    if (prefersReducedMotion) {
      gsap.set("[data-faq-animate]", { clearProps: "all" });
      return;
    }

    gsap
      .timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 74%",
          end: "bottom 30%",
          toggleActions: "play none none reverse",
        },
      })
      .from("[data-faq-kicker]", {
        autoAlpha: 0,
        y: 18,
        duration: 0.55,
      })
      .from(
        "[data-faq-copy]",
        { autoAlpha: 0, y: 18, duration: 0.65, filter: "blur(6px)" },
        "-=0.3",
      )
      .from(
        "[data-faq-item]",
        {
          autoAlpha: 0,
          y: 24,
          duration: 0.6,
          stagger: 0.1,
        },
        "-=0.25",
      );
  }, []);

  return (
    <section ref={rootRef} id="faq" className="pt-20 sm:pt-24">
      <div className="app-container">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-12 space-y-4 text-center">
            <h2
              data-faq-animate
              data-faq-kicker
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Frequently asked questions
            </h2>
            <p
              data-faq-animate
              data-faq-copy
              className="text-sm leading-7 text-muted-foreground sm:text-base"
            >
              Everything you need to know about ProofPay.
            </p>
          </div>

          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.question}
                value={faq.question}
                data-faq-animate
                data-faq-item
              >
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Faq;
