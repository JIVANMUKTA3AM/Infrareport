// @ts-nocheck
import { useEffect, useRef, useState } from "react";

const NICHES = [
  {
    name: "Climatização / AC", color: "#38bdf8",
    icon: "M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1",
    probs: ["Cálculo de carga térmica (BTU/h) por ambiente", "Dimensionamento de splits, VRF e self-contained", "Projeto de dutos, vazão de ar e renovação", "Laudo de PMOC e qualidade do ar interno"],
    norms: ["NBR 16401", "Portaria 3.523", "NBR 6401"],
  },
  {
    name: "CFTV / Segurança", color: "#a78bfa",
    icon: "M2 7l13-4 1 3-13 4zM3 8l1 9h10l1-7M11 14a2 2 0 1 0 .01 0",
    probs: ["Cálculo de armazenamento (bitrate × canais × dias)", "Dimensionamento de NVR/DVR e switches PoE", "Posicionamento, lente e ângulo de cobertura", "Projeto de cabeamento e infraestrutura"],
    norms: ["NBR 16786", "LGPD", "ABNT CFTV"],
  },
  {
    name: "TI / Redes", color: "#22d3ee",
    icon: "M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M12 20h.01",
    probs: ["Projeto de cabeamento estruturado Cat6/fibra", "Dimensionamento de rack, patch panel e switches", "Segmentação de VLAN e plano de endereçamento", "Certificação e documentação de pontos"],
    norms: ["NBR 14565", "EIA/TIA 568", "ISO 11801"],
  },
  {
    name: "Controle de Acesso", color: "#34d399",
    icon: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5zM12 15v2",
    probs: ["Projeto de catracas, fechaduras e biometria", "Integração com CFTV e sistema de alarme", "Dimensionamento de controladoras e leitoras", "Topologia de rede e fontes redundantes"],
    norms: ["NBR 16786", "LGPD", "NBR 5410"],
  },
  {
    name: "Instalações Elétricas", color: "#fbbf24",
    icon: "M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z",
    probs: ["Dimensionamento de disjuntores, cabos e DR", "Diagnóstico de disparo, sobrecarga e fuga", "Cálculo de queda de tensão e curto-circuito", "Laudo de SPDA e aterramento"],
    norms: ["NBR 5410", "NBR 5419", "NR-10", "NBR 14039"],
  },
  {
    name: "Alarme / Monitoramento", color: "#f87171",
    icon: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    probs: ["Projeto de sensores (IVP, magnético, barreira)", "Dimensionamento de central e zoneamento", "Integração com CFTV e monitoramento 24h", "Detecção e alarme de incêndio"],
    norms: ["NBR 17240", "NBR 9441", "ABNT alarme"],
  },
  {
    name: "Automação Predial", color: "#e879f9",
    icon: "M4 20h16M6 20V10l6-5 6 5v10M10 20v-5h4v5",
    probs: ["Integração de subsistemas (BMS/SCADA)", "Lógica de iluminação, HVAC e energia", "Sensores, atuadores e protocolos (KNX/Modbus)", "Eficiência energética e relatórios de consumo"],
    norms: ["NBR 16401", "ISO 16484", "ABNT BMS"],
  },
];

const AGENTS = [
  {
    tag: "TÉCNICO", color: "#38bdf8",
    name: "Agente Técnico",
    desc: "Diagnóstico de falhas, dimensionamentos, laudos e consulta de normas NBR/NR para 7 nichos técnicos.",
    q: "Disjuntor Q3 (32A) do QD-02 disparando com carga medida de 18A. Já substituí e o problema persiste.",
    a: "Disparo com 18A em 32A descarta sobrecarga — problema é isolação degradada no ramal. Meça Riso com megôhmetro, mín. 1MΩ (NBR 5410 §6.3.3).",
  },
  {
    tag: "COMERCIAL", color: "#a78bfa",
    name: "Agente Comercial",
    desc: "Gera propostas profissionais em .docx com precificação validada e envia automaticamente por e-mail ao cliente.",
    q: "Proposta para 8 câmeras IP 4MP com NVR 16 canais no galpão da Construtora Beta.",
    a: "Proposta gerada — R$ 6.840,00. .docx enviado para contato@construtorabeta.com.br.",
  },
  {
    tag: "FINANCEIRO", color: "#34d399",
    name: "Agente Financeiro",
    desc: "Registre movimentações em linguagem natural. O agente classifica, persiste no banco e atualiza seu saldo em tempo real.",
    q: "Entrada de R$ 8.500 do Grupo TechPark — OS 2341, cabeamento concluído.",
    a: "R$ 8.500,00 registrado — Serviços / OS 2341. Saldo: R$ 26.350,00. Margem: 62%.",
  },
];

const PLANS = [
  { name: "Starter", price: "97", period: "/mês", desc: "Para o técnico autônomo começando a escalar.", features: ["1 agente (Técnico)", "50 laudos/mês", "Propostas em .docx", "Suporte por e-mail"], cta: "Começar grátis", featured: false },
  { name: "Pro", price: "247", period: "/mês", desc: "Para equipes que vivem de produtividade técnica.", features: ["3 agentes (Téc + Com + Fin)", "Laudos ilimitados", "Integração WhatsApp", "Controle financeiro", "Suporte prioritário"], cta: "Assinar o Pro", featured: true },
  { name: "Scale", price: "Sob consulta", period: "", desc: "Para empresas com múltiplas frentes e times.", features: ["Tudo do Pro", "Multi-usuário", "API e webhooks", "Onboarding dedicado", "SLA garantido"], cta: "Falar com engenharia", featured: false },
];

function Logo({ size = 38 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ position: "relative", width: size, height: size, borderRadius: size * 0.29, background: "linear-gradient(135deg,#1d4ed8,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 4px 18px rgba(14,165,233,0.4)" }}>
        <div className="ir-sheen" />
        <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none" style={{ position: "relative", zIndex: 2 }}>
          <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="#fff" />
        </svg>
      </div>
      <span style={{ fontSize: size * 0.5, fontWeight: 700, letterSpacing: "-0.02em" }}>
        <span style={{ color: "#fff" }}>Infra</span><span style={{ color: "#38bdf8" }}>Report</span>
      </span>
    </div>
  );
}

export default function InfraReportLanding({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [openNiche, setOpenNiche] = useState(-1);
  const revealRefs = useRef([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.style.cssText += "opacity:1;transform:none;"; }),
      { threshold: 0.12 }
    );
    revealRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const addReveal = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };
  const revealStyle = { opacity: 0, transform: "translateY(24px)", transition: "opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)" };

  const handleRegister = () => onRegister && onRegister();
  const handleLogin = () => onLogin && onLogin();

  return (
    <div style={{ background: "#0a0e14", color: "#fff", fontFamily: "'Sora',system-ui,sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        .ir-sheen{position:absolute;inset:0;background:linear-gradient(135deg,transparent 30%,rgba(255,255,255,0.45) 50%,transparent 70%);animation:irSheen 3.2s ease-in-out infinite}
        @keyframes irSheen{0%,100%{transform:translateX(-130%)}50%{transform:translateX(130%)}}
        @keyframes irBlink{50%{opacity:0}}
        @keyframes irPulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        .ir-mono{font-family:'JetBrains Mono',monospace}
        .ir-link{color:rgba(255,255,255,0.55);font-size:14px;text-decoration:none;transition:color .2s;cursor:pointer}
        .ir-link:hover{color:#fff}
        .ir-niche:hover{border-color:rgba(56,189,248,0.4)!important;transform:translateY(-3px)}
        .ir-niche{transition:transform .25s,border-color .25s}
        .ir-plan:hover{transform:translateY(-4px)}
        .ir-plan{transition:transform .25s}
        .ir-btn-primary:hover{transform:translateY(-2px)}
        .ir-btn-primary{transition:transform .2s}
        .ir-blueprint{background-image:linear-gradient(rgba(56,138,221,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(56,138,221,0.045) 1px,transparent 1px);background-size:34px 34px}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 40px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: scrolled ? "rgba(10,14,20,0.85)" : "transparent", backdropFilter: scrolled ? "blur(14px)" : "none", transition: "background .3s" }}>
        <Logo size={38} />
        <div style={{ display: "flex", gap: 30 }} className="ir-desktop-nav">
          <a className="ir-link">Recursos</a><a className="ir-link">Agentes</a><a className="ir-link">Planos</a><a className="ir-link">Casos</a>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <button className="ir-link" onClick={handleLogin} style={{ fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>Entrar</button>
          <button className="ir-btn-primary" onClick={handleRegister} style={{ background: "linear-gradient(135deg,#1d4ed8,#0ea5e9)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 9, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>Criar conta grátis →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="ir-blueprint" style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -200, right: -100, width: 520, height: 520, background: "radial-gradient(circle,rgba(37,99,235,0.14) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 50, alignItems: "center", padding: "76px 40px", maxWidth: 1200, margin: "0 auto" }} className="ir-hero-grid">
          <div>
            <div className="ir-mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)", padding: "6px 13px", borderRadius: 30, marginBottom: 26, background: "rgba(56,189,248,0.05)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }} />Plataforma para prestadores técnicos
            </div>
            <h1 style={{ fontSize: 54, lineHeight: 1.04, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 24 }}>
              O laudo técnico<br />
              <span style={{ fontStyle: "italic", fontWeight: 300, background: "linear-gradient(120deg,#38bdf8,#2563eb)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>que se escreve</span><br />sozinho.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.65, color: "rgba(255,255,255,0.55)", maxWidth: 440, marginBottom: 34 }}>
              Diagnóstico, proposta e controle financeiro num só lugar. Agentes treinados em normas NBR/NR que respondem como um engenheiro — não como um chatbot.
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button className="ir-btn-primary" onClick={handleRegister} style={{ background: "#fff", color: "#0a0e14", border: "none", padding: "14px 26px", borderRadius: 11, fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>Começar grátis <span>→</span></button>
              <button style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", padding: "14px 24px", borderRadius: 11, fontFamily: "inherit", fontSize: 15, fontWeight: 500, cursor: "pointer" }}>Ver os agentes</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30 }}>
              <div style={{ display: "flex" }}>
                {["#38bdf8", "#34d399", "#a78bfa", "#fbbf24"].map((c, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: "2px solid #0a0e14", marginLeft: i ? -10 : 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}><strong style={{ color: "#fff" }}>4.9/5</strong> · 200+ profissionais</span>
            </div>
          </div>

          {/* terminal */}
          <div style={{ position: "relative", background: "rgba(13,18,28,0.82)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(10px)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />)}
              <span className="ir-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>infrareport · agente-tecnico</span>
            </div>
            <div className="ir-mono" style={{ padding: 20, fontSize: 12.5, lineHeight: 1.7 }}>
              <div style={{ marginBottom: 10 }}><span style={{ color: "#38bdf8" }}>› </span><span style={{ color: "#fff" }}>Disjuntor Q3 (32A) do QD-02 disparando com carga de 18A. Já troquei e persiste.</span></div>
              <div style={{ marginBottom: 10 }}><span style={{ color: "rgba(255,255,255,0.6)" }}>Disparo com 18A em 32A descarta sobrecarga. Causa provável: isolação degradada no ramal.</span></div>
              <div style={{ marginBottom: 10 }}><span style={{ color: "#22c55e" }}>→ Meça Riso com megôhmetro — mín. 1MΩ (NBR 5410 §6.3.3)</span></div>
              <div><span style={{ color: "#38bdf8" }}>› </span><span style={{ display: "inline-block", width: 7, height: 14, background: "#38bdf8", verticalAlign: "middle", animation: "irBlink 1s step-end infinite" }} /></div>
            </div>
            <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {[["9+", "nichos"], ["<2s", "resposta"], ["24/7", "ativo"]].map(([v, l], i) => (
                <div key={i} style={{ flex: 1, padding: 16, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{v}</div>
                  <div className="ir-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NICHES */}
      <section style={{ padding: "90px 40px", maxWidth: 920, margin: "0 auto" }}>
        <div ref={addReveal} style={{ ...revealStyle, textAlign: "center", marginBottom: 50 }}>
          <div className="ir-mono" style={{ fontSize: 12, letterSpacing: "0.15em", color: "#38bdf8", marginBottom: 14 }}>NICHOS ATENDIDOS</div>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>Um sistema para <span style={{ background: "linear-gradient(120deg,#38bdf8,#2563eb)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>cada especialidade</span></h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 14, maxWidth: 480, margin: "14px auto 0" }}>Clique em um nicho para ver o que o agente resolve e quais normas domina.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }} className="ir-niche-grid">
          {NICHES.map((n, i) => {
            const open = openNiche === i;
            return (
              <div key={i} ref={addReveal} style={{ ...revealStyle, transitionDelay: `${i * 50}ms`, background: "rgba(255,255,255,0.02)", border: `1px solid ${open ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color .25s, opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)" }}>
                <div onClick={() => setOpenNiche(open ? -1 : i)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", cursor: "pointer", userSelect: "none" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: `${n.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={n.color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon} /></svg>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{n.name}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .3s", transform: open ? "rotate(180deg)" : "none" }}><polyline points="6 9 12 15 18 9" /></svg>
                </div>
                <div style={{ maxHeight: open ? 360 : 0, overflow: "hidden", transition: "max-height .4s cubic-bezier(.16,1,.3,1)" }}>
                  <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="ir-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "16px 0 10px" }}>O QUE O AGENTE RESOLVE</div>
                    {n.probs.map((p, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={n.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}><polyline points="20 6 9 17 4 12" /></svg>
                        {p}
                      </div>
                    ))}
                    <div className="ir-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", margin: "16px 0 10px" }}>NORMAS QUE DOMINA</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {n.norms.map((nm, j) => (
                        <span key={j} className="ir-mono" style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "rgba(56,189,248,0.1)", color: "#85c5f0", border: "1px solid rgba(56,189,248,0.2)" }}>{nm}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AGENTS */}
      <section className="ir-blueprint" style={{ padding: "90px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div ref={addReveal} style={{ ...revealStyle, textAlign: "center", marginBottom: 50 }}>
            <div className="ir-mono" style={{ fontSize: 12, letterSpacing: "0.15em", color: "#38bdf8", marginBottom: 14 }}>OS ESPECIALISTAS</div>
            <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>Cada agente é <span style={{ fontStyle: "italic", fontWeight: 300 }}>treinado</span> no setor</h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginTop: 14 }}>Conhecimento técnico real. Sem respostas genéricas.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="ir-agent-grid">
            {AGENTS.map((ag, i) => (
              <div key={i} ref={addReveal} style={{ ...revealStyle, transitionDelay: `${i * 100}ms`, background: "rgba(13,18,28,0.6)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 26, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${ag.color},transparent)` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ag.color}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ag.color, boxShadow: `0 0 10px ${ag.color}`, animation: "irPulse 2s ease-in-out infinite" }} />
                  </div>
                  <span className="ir-mono" style={{ fontSize: 10, color: "#34d399", border: "1px solid rgba(52,211,153,0.3)", padding: "3px 9px", borderRadius: 20 }}>● Ativo 24/7</span>
                </div>
                <div className="ir-mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: ag.color, marginBottom: 6 }}>{ag.tag}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>{ag.name}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>{ag.desc}</p>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 14 }}>
                  <div style={{ background: `${ag.color}15`, borderRadius: 9, padding: "9px 12px", marginBottom: 10, fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>{ag.q}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.65)", padding: "0 4px" }}>{ag.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section style={{ padding: "90px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div ref={addReveal} style={{ ...revealStyle, textAlign: "center", marginBottom: 50 }}>
          <div className="ir-mono" style={{ fontSize: 12, letterSpacing: "0.15em", color: "#38bdf8", marginBottom: 14 }}>PLANOS</div>
          <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em" }}>Escolha como quer <span style={{ background: "linear-gradient(120deg,#38bdf8,#2563eb)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>escalar</span></h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "start" }} className="ir-plan-grid">
          {PLANS.map((p, i) => (
            <div key={i} ref={addReveal} className="ir-plan" style={{ ...revealStyle, transitionDelay: `${i * 90}ms`, background: p.featured ? "linear-gradient(160deg,rgba(37,99,235,0.15),rgba(13,18,28,0.6))" : "rgba(255,255,255,0.02)", border: p.featured ? "1px solid rgba(56,189,248,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 28, position: "relative" }}>
              {p.featured && <div className="ir-mono" style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#1d4ed8,#0ea5e9)", fontSize: 10, letterSpacing: "0.1em", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>MAIS POPULAR</div>}
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{p.name}</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 18, minHeight: 38 }}>{p.desc}</p>
              <div style={{ marginBottom: 22 }}>
                {p.price === "Sob consulta"
                  ? <span style={{ fontSize: 26, fontWeight: 700 }}>Sob consulta</span>
                  : <><span style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", verticalAlign: "top" }}>R$</span><span style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>{p.price}</span><span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{p.period}</span></>}
              </div>
              <button className="ir-btn-primary" onClick={handleRegister} style={{ width: "100%", background: p.featured ? "linear-gradient(135deg,#1d4ed8,#0ea5e9)" : "rgba(255,255,255,0.06)", color: "#fff", border: p.featured ? "none" : "1px solid rgba(255,255,255,0.12)", padding: "12px 0", borderRadius: 11, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 22, boxShadow: p.featured ? "0 6px 24px rgba(37,99,235,0.4)" : "none" }}>{p.cta}</button>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {p.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={p.featured ? "#38bdf8" : "#34d399"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: "20px 40px 90px" }}>
        <div ref={addReveal} style={{ ...revealStyle, maxWidth: 1000, margin: "0 auto", background: "linear-gradient(135deg,rgba(29,78,216,0.2),rgba(14,165,233,0.1))", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 24, padding: "56px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 0%,rgba(56,189,248,0.15),transparent 60%)", pointerEvents: "none" }} />
          <h2 style={{ position: "relative", fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 16 }}>Pare de escrever laudo no Word.</h2>
          <p style={{ position: "relative", fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 30, maxWidth: 440, margin: "0 auto 30px" }}>Comece grátis hoje. Sem cartão de crédito.</p>
          <button className="ir-btn-primary" onClick={handleRegister} style={{ position: "relative", background: "#fff", color: "#0a0e14", border: "none", padding: "15px 32px", borderRadius: 12, fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Criar conta grátis →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px", maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <Logo size={32} />
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>InfraReport é um produto da 3AMG Studio · infrareport.3amgflowz.com.br</span>
        <div style={{ display: "flex", gap: 22 }}>
          <a className="ir-link" style={{ fontSize: 13 }}>Termos</a><a className="ir-link" style={{ fontSize: 13 }}>Privacidade</a><a className="ir-link" style={{ fontSize: 13 }}>Contato</a>
        </div>
      </footer>

      <style>{`
        @media(max-width:900px){
          .ir-hero-grid{grid-template-columns:1fr!important;gap:40px!important}
          .ir-agent-grid,.ir-plan-grid{grid-template-columns:1fr!important}
          .ir-niche-grid{grid-template-columns:repeat(2,1fr)!important}
          .ir-desktop-nav{display:none!important}
          h1{font-size:40px!important}
        }
      `}</style>
    </div>
  );
}
