export default {
  cta: {
    buttons: {
      primary: "Jetzt starten",
      secondary: "Dokumentation",
    },
    description:
      "Richte dein Projekt heute ein und beginne morgen mit der Entwicklung. Spare Monate bei der Einrichtung, damit du dich auf Features konzentrieren kannst.",
    title: "Starte dein SaaS so schnell wie möglich.",
  },
  description: {
    eyebrow: "Warum dieses Template verwenden?",
    features: [
      {
        description:
          "TypeScript, ESLint & Prettier, Commitlint und GitHub Actions sind alle eingerichtet, damit dein Team von Tag eins an sauberen, konsistenten Code schreibt.",
        title: "Werkzeuge ohne Konfiguration.",
      },
      {
        description:
          "In ein Template mit Zehntausenden von Codezeilen einzusteigen ist beängstigend. Vollständige Unit-, Integrations-, Komponenten- und E2E-Tests (Vitest, React Testing Library & Playwright) lassen dich ohne Angst refaktorieren.",
        title: "Mit TDD entwickelt.",
      },
      {
        description:
          "Sieh dir reale Muster für Bild-Uploads (Client vs. Server), MSW-umhüllte Mocks auf Client und Server, Factory-Funktionen und Test-Helfer für einfaches Testen, nahtlosen Dark-Mode ohne Flackern, Stripe-Zahlungsintegration, Authentifizierung und mehr an.",
        title: "Lerne durch Beispiele.",
      },
      {
        description:
          "Alles ist modular - entferne, was du nicht brauchst, passe die Ordnerstruktur an und erfasse neue Anforderungen mit Tests, während du wächst.",
        title: "Vollständig anpassbar.",
      },
    ],
    image: {
      dark: "Produkt-Screenshot (dunkel)",
      light: "Produkt-Screenshot (hell)",
    },
    subtitle:
      "Wenn du ein SaaS startest, ist dein größter Vorteil Geschwindigkeit. Nutze diese produktionsreife Grundlage, damit du Monate der Einrichtung überspringen und direkt mit dem Ausliefern von Features beginnen kannst.",
    title: "Fokussiere dich auf dein PMF",
  },
  faq: {
    items: [
      {
        answer:
          "Ja! Dies ist ein Open-Source-Projekt und kann kostenlos unter der MIT-Lizenz genutzt werden. Einige der integrierten Dienste (zum Beispiel Supabase, Stripe, Hosting-Anbieter usw.) können jedoch eigene Nutzungsgebühren verursachen, für die du verantwortlich bist.",
        question: "Ist das kostenlos?",
      },
      {
        answer:
          'Nein. Dies ist ein unabhängiges, von der Community gepflegtes Open-Source-Template. Es wird nicht von Shopify Inc. gesponsert, ist nicht mit ihnen verbunden oder wird von ihnen unterstützt. "React Router" und seine Logos sind Marken von Shopify Inc., und dieses Projekt erhebt keinen Anspruch auf eine offizielle Partnerschaft oder Unterstützung.',
        question:
          "Wird dieses Template offiziell von Shopify Inc. unterstützt oder befürwortet?",
      },
      {
        answer:
          "Schön, dass du fragst! Wir suchen immer nach Hilfe für das Projekt. Wenn du daran interessiert bist, beizutragen, schau dir bitte unseren <1>Leitfaden für Mitwirkende</1> an.",
        links: {
          contributing:
            "https://github.com/janhesters/react-router-saas-template/blob/main/CONTRIBUTING.md",
        },
        question: "Wie kann ich beitragen?",
      },
      {
        answer:
          "Du kannst in den GitHub-Diskussionen fragen. Wenn du an professioneller Hilfe beim Aufbau deiner App von erfahrenen React-Entwicklern interessiert bist, wende dich an <1>ReactSquad</1>.",
        links: {
          reactsquad: "https://reactsquad.io",
        },
        question: "Ich stecke fest! Wo kann ich Hilfe bekommen?",
      },
      {
        answer:
          "Vielen Dank! Du kannst Jan Hesters auf <1>X</1>, <2>LinkedIn</2> oder <3>YouTube</3> folgen und ein Dankeschön hinterlassen. Und wenn du jemanden kennst, der erfahrene React-Entwickler braucht, empfiehl bitte <4>ReactSquad</4>. Vielen Dank!",
        links: {
          linkedin: "https://www.linkedin.com/in/jan-hesters/",
          reactsquad: "https://reactsquad.io",
          x: "https://x.com/janhesters",
          youtube: "https://www.youtube.com/@janhesters",
        },
        question: "Das ist großartig! Wie kann ich dich unterstützen?",
      },
    ],
    title: "Häufig gestellte Fragen",
  },
  features: {
    cards: [
      {
        description:
          "Jeder Bildschirm funktioniert auf Desktop, Tablet und Mobilgerät. So kannst du alle Kunden bedienen.",
        eyebrow: "TailwindCSS & Shadcn",
        image: {
          dark: "Mobil-Screenshot (dunkel)",
          light: "Mobil-Screenshot (hell)",
        },
        title: "Responsivität & Barrierefreiheit",
      },
      {
        description:
          "Die meisten SaaS-Apps erheben eine Form von wiederkehrendem Abonnement. Dieses Template kommt mit drei vorkonfigurierten Stufen. Aber selbst wenn deine Bedürfnisse anders sind, gibt dir dies einen Vorsprung.",
        eyebrow: "Stripe",
        image: {
          dark: "Abrechnung (dunkel)",
          light: "Abrechnung (hell)",
        },
        title: "Abrechnung",
      },
      {
        description:
          "Mit Supabase Auth (E-Mail Magic Links & Google OAuth), einer verwalteten Postgres-Datenbank und Supabase Storage kümmert sich dieses Template um dein Backend. Storage bietet sogar zwei Upload-Flows: direkte Client-Uploads für große Dateien und server-vermittelte Uploads für kleine Assets wie Profilavatare.",
        eyebrow: "Supabase",
        image: {
          dark: "Authentifizierung (dunkel)",
          light: "Authentifizierung (hell)",
        },
        title: "Authentifizierung & Datenbank",
      },
      {
        description:
          "Dieses Template enthält ein Benachrichtigungssystem, das Text, Erwähnungen und Links unterstützt, komplett mit Gelesen/Ungelesen-Tracking.",
        image: {
          dark: "Benachrichtigungen (dunkel)",
          light: "Benachrichtigungen (hell)",
        },
        title: "Benachrichtigungen",
      },
      {
        description:
          "Der integrierte Cookie-basierte Dark Mode verhindert Flackern beim Laden und respektiert standardmäßig helle, dunkle oder Systemeinstellungen.",
        title: "Dark Mode",
      },
      {
        description:
          "Füge Mitglieder über teilbare Einladungslinks oder E-Mail-Einladungen hinzu, bei denen du Rollen zuweisen kannst - Owner, Admin oder Member - um Zugriff und Berechtigungen zu steuern.",
        eyebrow: "Multi-Tenancy",
        title: "Mitgliederverwaltung",
      },
      {
        description:
          "Verwalte Übersetzungen, wechsle Sprachen im laufenden Betrieb und handhabe gebietsspezifische Formatierung (Daten, Zahlen, Währungen) ohne zusätzliche Einrichtung.",
        eyebrow: "React i18next",
        title: "Internationalisierung",
      },
      {
        description:
          "Enthält Benutzerkontoeinstellungen, E-Mail-Versand (mit Resend), einen Onboarding-Flow und eine Vielzahl anderer Hilfsprogramme, die dir helfen, sofort loszulegen.",
        eyebrow: "Verschiedenes",
        title: "Und vieles mehr ...",
      },
    ],
    eyebrow: "Features",
    title: "Alles, was dein SaaS braucht",
  },
  footer: {
    madeWithLove: "Gemacht mit ❤️ von",
    reactsquad: "ReactSquad",
    social: {
      github: "Github",
      linkedin: "LinkedIn",
      twitter: "X ehemals bekannt als Twitter",
    },
  },
  header: {
    login: "Anmelden",
    navLinks: {
      pricing: "Preise",
    },
    register: "Registrieren",
  },
  hero: {
    badge: "<1>KEIN</1> offizielles Template",
    cta: {
      primary: "Jetzt starten",
      secondary: "Dokumentation",
    },
    description:
      "Spare deinem Team Monate beim Aufbau von B2B & B2C SaaS-Anwendungen mit diesem <1>kostenlosen</1> React Router Community-Template.",
    image: {
      dark: "App-Screenshot (dunkel)",
      light: "App-Screenshot (hell)",
    },
    title: "SaaS Template",
  },
  logos: {
    title: "Der Stack hinter dem Template",
  },
} satisfies typeof import("../en/landing").default;
