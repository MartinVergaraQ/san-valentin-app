// App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Step = "intro1" | "intro2" | "intro3" | "ask" | "quiz" | "yes";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysBetween(a: Date, b: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.max(0, Math.round((end - start) / oneDay));
}

export default function App() {
  // --- CONFIG RÁPIDA ---
  const NOMBRE = "Caroline Farias";
  const FECHA_INICIO = new Date("2025-06-06");
  const ENABLE_QUIZ = true;

  // ✅ Base real (en GitHub Pages es /san-valentin-app/)
  const BASE = import.meta.env.BASE_URL;

  // ✅ Assets desde /public (respetando base)
  const REGALO = { type: "video" as const, src: `${BASE}regalo.mp4` };
  const MUSIC_SRC = `${BASE}love.mp3`;

  const quizQuestions = [
    {
      q: "¿Dónde fue nuestra primera salida? (puede ser con o sin espacio)",
      a: ["jardin japones", "jardinjapones", "jardín japonés", "jardinjaponés"],
    },
    {
      q: "¿Qué comida pedimos siempre? (una palabra)",
      a: ["hamburguesas", "hamburguesa"],
    },
  ];

  const [step, setStep] = useState<Step>("intro1");

  // Botón NO escapa
  const [noPos, setNoPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [noCount, setNoCount] = useState(0);
  const [showNoToast, setShowNoToast] = useState(false);

  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Quiz
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizValue, setQuizValue] = useState("");
  const [quizError, setQuizError] = useState("");

  // Música
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicOn, setMusicOn] = useState(false);

  // UI extra
  const [giftOpen, setGiftOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState(false);

  // Reveal de carta + galería
  const [reveal, setReveal] = useState(0);

  // ✅ iOS Safari: 100vh es inestable por barra del navegador
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);

    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);

  const daysTogether = useMemo(() => {
    return daysBetween(FECHA_INICIO, new Date());
  }, [FECHA_INICIO]);

  const noText = useMemo(() => {
    const options = [
      "No",
      "¿Segura?",
      "Piénsalo bien",
      "No seas mala",
      "Dale que sí",
      "Última oportunidad",
      "Ok pero mira qué bonito",
      "Te estás equivocando 😤",
    ];
    return options[Math.min(noCount, options.length - 1)];
  }, [noCount]);

  const yesScale = useMemo(() => Math.min(1 + noCount * 0.06, 1.35), [noCount]);

  const introIndex = useMemo(() => {
    if (step === "intro1") return 1;
    if (step === "intro2") return 2;
    if (step === "intro3") return 3;
    return 0;
  }, [step]);

  function moveNoButton() {
    const arena = arenaRef.current;
    if (!arena) return;

    const rect = arena.getBoundingClientRect();

    const padding = 12;
    const maxX = Math.max(0, rect.width - 140 - padding);
    const maxY = Math.max(0, rect.height - 52 - padding);

    const isMobile = rect.width < 520;
    const x = isMobile ? rand(padding, Math.min(maxX, 240)) : rand(padding, maxX);
    const y = isMobile ? rand(padding, Math.min(maxY, 190)) : rand(padding, maxY);

    setNoPos({ x, y });
    setNoCount((c) => c + 1);
  }

  useEffect(() => {
    if (step !== "ask") return;
    const t = setTimeout(() => moveNoButton(), 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (noCount === 8) {
      setShowNoToast(true);
      const t = setTimeout(() => setShowNoToast(false), 2800);
      return () => clearTimeout(t);
    }
  }, [noCount]);

  useEffect(() => {
    if (noCount === 12) {
      if (ENABLE_QUIZ) setStep("quiz");
      else setStep("yes");
    }
  }, [noCount, ENABLE_QUIZ]);

  useEffect(() => {
    if (step !== "yes" || captureMode) return;

    const timer = setInterval(() => {
      const el = document.createElement("div");
      el.className = "heart";
      el.style.left = `${rand(0, 100)}vw`;
      el.style.fontSize = `${rand(16, 30)}px`;
      el.style.animationDuration = `${rand(3200, 5600)}ms`;
      el.textContent = ["💖", "💘", "💕", "❤️"][rand(0, 3)];

      document.body.appendChild(el);
      setTimeout(() => el.remove(), 6500);
    }, 320);

    return () => clearInterval(timer);
  }, [step, captureMode]);

  // Reveal por bloques
  useEffect(() => {
    if (step !== "yes") {
      setReveal(0);
      return;
    }

    const t1 = window.setTimeout(() => setReveal(1), 180);
    const t2 = window.setTimeout(() => setReveal(2), 650);
    const t3 = window.setTimeout(() => setReveal(3), 1150);
    const t4 = window.setTimeout(() => setReveal(4), 1600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [step]);

  // ✅ Lock scroll iOS cuando modal está abierto (lo tuyo está bien)
  useEffect(() => {
    if (!giftOpen) return;

    const scrollY = window.scrollY;

    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [giftOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setGiftOpen(false);
    }
    if (giftOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [giftOpen]);

  function goNextFromIntro() {
    setStep((prev) => {
      if (prev === "intro1") return "intro2";
      if (prev === "intro2") return "intro3";
      return "ask";
    });
  }

  function handleYes() {
    if (ENABLE_QUIZ) setStep("quiz");
    else setStep("yes");
  }

  function normalize(s: string) {
    return s
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function handleQuizSubmit() {
    const current = quizQuestions[quizIndex];
    const normalized = normalize(quizValue);

    if (!normalized) {
      setQuizError("No vale dejarlo vacío po 😶");
      return;
    }

    const accepted = Array.isArray(current.a) ? current.a : [current.a];
    const ok = accepted.some((ans) => normalize(ans) === normalized);

    if (!ok) {
      setQuizError("Mmm… nooo 😅 (pista: piensa en nosotros)");
      return;
    }

    setQuizError("");
    setQuizValue("");

    if (quizIndex < quizQuestions.length - 1) setQuizIndex((i) => i + 1);
    else setStep("yes");
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!musicOn) {
      audio.volume = 0.55;
      audio
        .play()
        .then(() => setMusicOn(true))
        .catch(() => setMusicOn(false));
    } else {
      audio.pause();
      setMusicOn(false);
    }
  }

  return (
    <div className={`page ${captureMode ? "capture" : ""}`}>
      <div className="card">
        {(step === "ask" || step === "quiz" || step === "yes") && (
          <div className="topbar">
            <button className="chip" onClick={toggleMusic}>
              {musicOn ? "Pausar 🎶" : "Play 🎶"}
            </button>
            <button className="chip" onClick={() => setCaptureMode((v) => !v)}>
              {captureMode ? "Salir captura" : "Modo captura 📸"}
            </button>
          </div>
        )}

        {(step === "intro1" || step === "intro2" || step === "intro3") && (
          <div className="screen">
            <div className="pill">Mini historia 💌</div>

            {introIndex > 0 && (
              <div className="progress" aria-label="Progreso historia">
                <div className="progressBar" style={{ width: `${(introIndex / 3) * 100}%` }} />
              </div>
            )}

            {step === "intro1" && (
              <>
                <h1>Oye {NOMBRE}…</h1>
                <p className="subtitle">Tengo algo importante que decirte. No es una mentira. Por una vez.</p>
              </>
            )}

            {step === "intro2" && (
              <>
                <h1>Gracias por todo ❤️</h1>
                <p className="subtitle">Por tu paciencia, por tu cariño, y por aguantar mis momentos.</p>
              </>
            )}

            {step === "intro3" && (
              <>
                <h1>Última pantalla antes del evento</h1>
                <p className="subtitle">Ok… ahora sí viene la pregunta oficial. Respira.</p>
              </>
            )}

            <div className="actions">
              <button className="btn yes" onClick={goNextFromIntro}>
                Siguiente ➜
              </button>
              <button className="btn ghost" onClick={() => setStep("ask")} aria-label="Saltar">
                Saltar
              </button>
            </div>

            <div className="tiny" style={{ marginTop: 12 }}>
              {introIndex} / 3
            </div>
          </div>
        )}

        {step === "ask" && (
          <div className="screen">
            <h1>¿Quieres ser mi San Valentín? 💘</h1>
            <p className="subtitle">
              Prometo: comida rica, besitos y cero enojos (mentira, pero lo intento)
              <br />
              <span className="counter">
                Llevamos <b>{daysTogether}</b> días juntos ❤️
              </span>
            </p>

            <div className="arena" ref={arenaRef}>
              <button
                className="btn yes bigYes"
                onClick={handleYes}
                aria-label="Sí"
                style={{ transform: `scale(${yesScale}) translateZ(0)` }}
                title="Esta opción era inevitable."
              >
                Sí 💞
              </button>

              <button
                className="btn no"
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
                onMouseEnter={moveNoButton}
                onTouchStart={(e) => {
                  e.preventDefault();
                  moveNoButton();
                }}
                onClick={moveNoButton}
                aria-label="No"
              >
                {noText}
              </button>

              {showNoToast && (
                <div className="toast">Ya ya… entendí. Igual me gustas. Ahora aprieta “Sí” 😤❤️</div>
              )}
            </div>

            <div className="tiny">Tip: en celular, toca el “No”. Buena suerte.</div>
          </div>
        )}

        {step === "quiz" && (
          <div className="screen">
            <div className="pill">Desbloqueo secreto 🔐</div>
            <h1>Antes de pasar…</h1>
            <p className="subtitle">Solo para asegurarme que eres tú y no alguien robándome el link 😌</p>

            <div className="quizBox">
              <div className="quizQ">{quizQuestions[quizIndex]?.q}</div>

              <input
                className="quizInput"
                value={quizValue}
                onChange={(e) => setQuizValue(e.target.value)}
                placeholder="Escribe aquí…"
                autoFocus
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuizSubmit();
                }}
              />

              {quizError && <div className="quizError">{quizError}</div>}

              <div className="actions">
                <button className="btn yes" onClick={handleQuizSubmit}>
                  Confirmar
                </button>
                <button className="btn ghost" onClick={() => setStep("yes")} title="Ok, lo dejo pasar...">
                  Saltar (trampa)
                </button>
              </div>

              <div className="tiny">
                {quizIndex + 1} / {quizQuestions.length}
              </div>
            </div>
          </div>
        )}

        {step === "yes" && (
          <div className="screen">
            <h1>Sabía que dirías que sí ❤️</h1>
            <p className="subtitle">
              Te amo. Gracias por existir y por aguantar a un programador.
              <br />
              <b>Promesa:</b> este año te invito a una cita rica y sin apuros.
            </p>

            <div className="loveLetter">
              <p className={`reveal ${reveal >= 1 ? "show" : ""}`}>
                {NOMBRE}, gracias por ser mi lugar seguro. Me encanta tu forma de ser, tu sonrisa, y cómo
                haces que todo se sienta más bonito.
              </p>

              <p className={`reveal ${reveal >= 2 ? "show" : ""}`}>
                Mi recuerdo favorito: <i>cuando fuimos al Jardín Japonés</i>. Y otro que siempre me da risa:{" "}
                <i>en el Cerro Santa Lucía, cuando todavía éramos amigos</i> 😅.
              </p>

              <p className={`reveal ${reveal >= 3 ? "show" : ""}`}>
                Y mi plan:{" "}
                <i>
                  pasar la tarde juntos comiendo helados (McFlurry, obvio)… y después quedarnos a dormir juntitos
                  dos noches: <b>13 y 14 de febrero</b> 💞
                </i>
                .
              </p>

              <p className={`reveal ${reveal >= 3 ? "show" : ""}`}>
                Y sí… también quiero una vida contigo llena de <i>gatitos</i> 🐾😺 (porque obvio).
              </p>

              <p className={`signature reveal ${reveal >= 3 ? "show" : ""}`}>Con amor, tu programador 💘</p>
            </div>

            <div className="actions">
              <button className="btn yes" onClick={() => setGiftOpen(true)}>
                Abrir regalo 🎁
              </button>
              <button className="btn ghost" onClick={() => setStep("ask")}>
                Repetir
              </button>
            </div>

            <div className={`gallery reveal ${reveal >= 4 ? "show" : ""}`}>
              <img src={`${BASE}1.jpeg`} alt="recuerdo 1" />
              <img src={`${BASE}2.jpeg`} alt="recuerdo 2" />
              <img src={`${BASE}3.jpeg`} alt="recuerdo 3" />
            </div>

            <audio ref={audioRef} src={MUSIC_SRC} preload="auto" loop />
          </div>
        )}
      </div>

      {giftOpen && (
        <div className="modalBackdrop" onClick={() => setGiftOpen(false)} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">Para ti ❤️</div>
              <button className="modalClose" onClick={() => setGiftOpen(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modalBody">
              {REGALO.type === "video" && <video className="giftMedia" src={REGALO.src} controls playsInline />}

              <p className="tiny" style={{ marginTop: 10 }}>
                Si llegaste hasta aquí, ya gané. Te amo ❤️
              </p>
            </div>
          </div>
        </div>
      )}

      {!captureMode && (
        <footer className="footer">Hecho con amor y con la mínima cantidad de dignidad profesional.</footer>
      )}
    </div>
  );
}
