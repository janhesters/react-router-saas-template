import type en from './en';

export default {
  cta: {
    buttons: {
      primary: 'Loslegen',
      secondary: 'Dokumentation',
    },
    description:
      'Richte dein Projekt heute ein und leg morgen los. Spare dir monatelangen Setup-Aufwand und konzentriere dich auf die Features.',
    title: 'Bring dein SaaS so schnell wie möglich an den Start.',
  },
  description: {
    eyebrow: 'Warum dieses Template?',
    features: [
      {
        description:
          'TypeScript, ESLint & Prettier, Commitlint und GitHub Actions sind alle vorkonfiguriert – damit ihr von Anfang an sauberen, einheitlichen Code schreibt.',
        title: 'Tooling ohne Setup.',
      },
      {
        description:
          'Ein Template mit zehntausenden Zeilen Code kann abschrecken. Vollständige Unit-, Integrations-, Komponenten- und E2E-Tests (Vitest, React Testing Library & Playwright) geben dir die Sicherheit zum Refaktorisieren.',
        title: 'Mit TDD gebaut.',
      },
      {
        description:
          'Sieh dir echte Beispiele an: Bild-Uploads (Client vs. Server), MSW-Mocks auf Client und Server, Factory Functions und Test-Utils, flackerfreier Dark Mode, Stripe-Integration, Authentifizierung und mehr.',
        title: 'Lernen durch Praxis.',
      },
      {
        description:
          'Alles ist modular – entferne, was du nicht brauchst, passe die Struktur an und deck neue Anforderungen mit Tests ab.',
        title: 'Voll anpassbar.',
      },
    ],
    image: {
      dark: 'Produktscreenshot (dunkel)',
      light: 'Produktscreenshot (hell)',
    },
    subtitle:
      'Wenn du ein SaaS startest, ist Geschwindigkeit dein größter Vorteil. Dieses produktionsreife Fundament spart dir Monate beim Setup und bringt dich direkt zum Feature-Building.',
    title: 'Konzentrier dich auf deinen PMF',
  },
  faq: {
    items: [
      {
        answer:
          'Ja! Dieses Projekt ist Open Source und kostenlos unter der MIT-Lizenz nutzbar. Beachte aber, dass einige integrierte Dienste (z. B. Supabase, Stripe, Hosting-Anbieter etc.) eigene Gebühren erheben können.',
        question: 'Ist das kostenlos?',
      },
      {
        answer:
          'Nein. Dieses Template ist ein unabhängiges, von der Community gepflegtes Open-Source-Projekt. Es wird nicht von Shopify Inc. gesponsert, unterstützt oder anerkannt. „React Router“ und dessen Logos sind Marken von Shopify Inc. – dieses Projekt erhebt keinen Anspruch auf eine Partnerschaft oder offizielle Unterstützung.',
        question: 'Wird das Template offiziell von Shopify unterstützt?',
      },
      {
        answer:
          'Gute Frage! Wir freuen uns immer über Unterstützung. Wenn du beitragen willst, schau dir bitte unseren <1>Beitragsleitfaden</1> an.',
        links: {
          contributing:
            'https://github.com/janhesters/react-router-saas-template/blob/main/CONTRIBUTING.md',
        },
        question: 'Wie kann ich beitragen?',
      },
      {
        answer:
          'Frag gerne in den GitHub Discussions. Wenn du professionelle Hilfe von erfahrenen React-Entwicklern suchst, melde dich bei <1>ReactSquad</1>.',
        links: {
          reactsquad: 'https://reactsquad.io',
        },
        question: 'Ich hänge fest! Wo bekomme ich Hilfe?',
      },
      {
        answer:
          'Danke dir! Du kannst Jan Hesters auf <1>X</1>, <2>LinkedIn</2> oder <3>YouTube</3> folgen und gern ein Dankeschön dalassen. Und wenn du jemanden kennst, der Senior React Devs sucht – empfehle <4>ReactSquad</4> weiter. Danke!',
        links: {
          linkedin: 'https://www.linkedin.com/in/jan-hesters/',
          reactsquad: 'https://reactsquad.io',
          x: 'https://x.com/janhesters',
          youtube: 'https://www.youtube.com/@janhesters',
        },
        question: 'Das ist genial! Wie kann ich dich unterstützen?',
      },
    ],
    title: 'Häufige Fragen',
  },
  features: {
    cards: [
      {
        description:
          'Alle Screens funktionieren auf Desktop, Tablet und Mobilgerät – damit du alle Nutzer erreichst.',
        eyebrow: 'TailwindCSS & Shadcn',
        image: {
          dark: 'Mobile-Screenshot (dunkel)',
          light: 'Mobile-Screenshot (hell)',
        },
        title: 'Responsiveness & Barrierefreiheit',
      },
      {
        description:
          'Die meisten SaaS-Apps arbeiten mit Abos. Dieses Template bringt drei Preisstufen mit – auch wenn du etwas anderes brauchst, bist du schneller startklar.',
        eyebrow: 'Stripe',
        image: {
          dark: 'Abrechnung (dunkel)',
          light: 'Abrechnung (hell)',
        },
        title: 'Zahlungen & Abos',
      },
      {
        description:
          'Mit Supabase Auth (Magic Links per E-Mail & Google OAuth), einer verwalteten Postgres-Datenbank und Supabase Storage übernimmt das Template deinen Backend-Teil. Für Uploads gibt es zwei Wege: große Dateien direkt vom Client, kleine über den Server.',
        eyebrow: 'Supabase',
        image: {
          dark: 'Authentifizierung (dunkel)',
          light: 'Authentifizierung (hell)',
        },
        title: 'Auth & Datenbank',
      },
      {
        description:
          'Enthält ein Benachrichtigungssystem mit Texten, Erwähnungen, Links – inklusive Gelesen/Ungelesen-Tracking.',
        image: {
          dark: 'Benachrichtigungen (dunkel)',
          light: 'Benachrichtigungen (hell)',
        },
        title: 'Benachrichtigungen',
      },
      {
        description:
          'Der Cookie-basierte Dark Mode verhindert Flackern beim Laden und unterstützt Light-, Dark- oder System-Einstellungen von Haus aus.',
        title: 'Dark Mode',
      },
      {
        description:
          'Füge Mitglieder über teilbare Links oder E-Mail-Einladungen hinzu und vergib Rollen – Owner, Admin oder Member – zur Steuerung der Zugriffsrechte.',
        eyebrow: 'Multi-Tenancy',
        title: 'Mitgliederverwaltung',
      },
      {
        description:
          'Verwalte Übersetzungen, wechsle Sprachen im laufenden Betrieb und nutze länderspezifische Formate für Datum, Zahlen & Währungen – ganz ohne Zusatzsetup.',
        eyebrow: 'React i18next',
        title: 'Internationalisierung',
      },
      {
        description:
          'Beinhaltet Kontoeinstellungen, E-Mail-Versand (via Resend), einen Onboarding-Flow und viele weitere Hilfen für einen schnellen Start.',
        eyebrow: 'Verschiedenes',
        title: 'Und vieles mehr ...',
      },
    ],
    eyebrow: 'Features',
    title: 'Alles, was dein SaaS braucht',
  },
  footer: {
    'made-with-love': 'Mit ❤️ gebaut von',
    reactsquad: 'ReactSquad',
    social: {
      github: 'GitHub',
      linkedin: 'LinkedIn',
      twitter: 'X ehemals Twitter',
    },
  },
  header: {
    login: 'Login',
    'nav-links': {
      pricing: 'Preise',
    },
    register: 'Registrieren',
  },
  hero: {
    badge: '<1>KEIN</1> offizielles Template',
    cta: {
      primary: 'Jetzt starten',
      secondary: 'Zur Dokumentation',
    },
    description:
      'Spare deinem Team Monate beim Aufbau von B2B- & B2C-SaaS-Anwendungen mit diesem <1>kostenlosen</1> React Router Community-Template.',
    image: {
      dark: 'App-Screenshot (dunkel)',
      light: 'App-Screenshot (hell)',
    },
    title: 'SaaS-Template',
  },
  logos: {
    title: 'Der Tech-Stack hinter dem Template',
  },
} satisfies typeof en;
