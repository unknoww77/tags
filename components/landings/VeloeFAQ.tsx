"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/veloe-content";

export function VeloeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="vl-section vl-faq">
      <h2 className="vl-title vl-title-sm">Perguntas frequentes</h2>
      <div className="vl-faq-list">
        {FAQ_ITEMS.map((item, i) => {
          const open = openIndex === i;
          return (
            <article key={item.question} className={`vl-faq-item${open ? " is-open" : ""}`}>
              <button
                type="button"
                className="vl-faq-trigger"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
              >
                <h3>{item.question}</h3>
                <span className="vl-faq-chevron" aria-hidden />
              </button>
              <div className="vl-faq-body">
                <p>{item.answer}</p>
                {!open && <span className="vl-faq-more">Ver mais</span>}
              </div>
            </article>
          );
        })}
      </div>
      <div className="vl-faq-footer">
        <p>Não encontrou o que procurava?</p>
        <a href="#funil" className="vl-link">
          Acesse nosso FAQ
        </a>
      </div>
    </section>
  );
}
