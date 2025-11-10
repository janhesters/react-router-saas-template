export default {
  layout: {
    quote:
      "Diese Plattform hat unseren gesamten Workflow optimiert. Der Onboarding-Prozess war intuitiv und hat unser Team in wenigen Minuten einsatzbereit gemacht.",
    quoteAuthor: "Sarah Mitchell, Product Manager",
  },
  organization: {
    companySize: {
      "1-10": "1-10 Mitarbeiter",
      "11-50": "11-50 Mitarbeiter",
      "51-200": "51-200 Mitarbeiter",
      "201-500": "201-500 Mitarbeiter",
      "501-1000": "501-1000 Mitarbeiter",
      "1001+": "1001+ Mitarbeiter",
    },
    companySizeDescription:
      "Wie viele Personen arbeiten in deiner Organisation? (optional)",
    companySizeLabel: "Unternehmensgröße",
    companySizePlaceholder: "Unternehmensgröße auswählen (optional)",
    companyType: {
      agency: "Agentur",
      enterprise: "Großunternehmen",
      government: "Öffentliche Verwaltung",
      midMarket: "Mittelstand",
      nonprofit: "Gemeinnützig",
      startup: "Startup",
    },
    companyTypesDescription: "Wähle alle zutreffenden aus.",
    companyTypesLabel: "Für welche Art von Unternehmen arbeitest du?",
    companyWebsiteDescription:
      "Die Website-URL deines Unternehmens (optional).",
    companyWebsiteLabel: "Unternehmenswebsite",
    companyWebsitePlaceholder: "https://example.com",
    earlyAccessDescription:
      "Erhalte frühen Zugang zu neuen Funktionen und hilf mit, die Zukunft unserer Plattform zu gestalten.",
    earlyAccessLabel: "Early Access Programm",
    earlyAccessTitle: "Tritt unserem Early Access Programm bei",
    errors: {
      companySizeRequired: "Bitte wähle die Größe deines Unternehmens.",
      createOrganizationFailedDescription:
        "Bitte versuche es erneut. Wenn das Problem weiterhin besteht, kontaktiere bitte den Support.",
      createOrganizationFailedTitle: "Fehler beim Erstellen der Organisation",
      invalidFileType: "Bitte lade eine gültige Bilddatei hoch.",
      logoTooLarge: "Das Logo muss kleiner als 1 MB sein.",
      nameMax: "Dein Organisationsname darf höchstens 72 Zeichen lang sein.",
      nameMin: "Dein Organisationsname muss mindestens 3 Zeichen lang sein.",
    },
    heading: "Erstelle deine Organisation",
    logoDescription:
      "Lade ein Logo hoch, um deine Organisation zu repräsentieren.",
    logoFormats: "PNG, JPG, GIF bis zu 1 MB",
    logoLabel: "Logo",
    logoPreviewAlt: "Vorschau des Organisationslogos",
    nameDescription: "Bitte gib den Namen deiner Organisation ein.",
    nameLabel: "Organisationsname",
    namePlaceholder: "Der Name deiner Organisation ...",
    recruitingPainPointDescription:
      "Hilf uns, deine größten Herausforderungen zu verstehen (optional).",
    recruitingPainPointLabel:
      "Was ist dein größter Schmerzpunkt bei der Personalbeschaffung?",
    recruitingPainPointPlaceholder:
      "Erzähle uns von deinen Herausforderungen bei der Einstellung, dem Onboarding oder dem Team-Management...",
    referralSource: {
      blogArticle: "Blog-Artikel",
      colleagueReferral: "Empfehlung eines Kollegen",
      industryEvent: "Branchenveranstaltung",
      onlineAd: "Online-Anzeige",
      other: "Sonstiges",
      partnerReferral: "Partner-Empfehlung",
      podcast: "Podcast",
      productHunt: "Product Hunt",
      searchEngine: "Suchmaschine",
      socialMedia: "Soziale Medien",
      wordOfMouth: "Mundpropaganda",
    },
    referralSourcesDescription: "Wähle alle zutreffenden aus (optional).",
    referralSourcesLabel: "Wie hast du von uns erfahren?",
    save: "Weiter",
    saving: "Wird erstellt ...",
    subtitle:
      "Du kannst später weitere Benutzer einladen, deiner Organisation über die Organisationseinstellungen beizutreten.",
    title: "Organisation",
  },
  userAccount: {
    errors: {
      invalidFileType: "Bitte lade eine gültige Bilddatei hoch.",
      nameMax: "Dein Name darf höchstens 128 Zeichen lang sein.",
      nameMin: "Dein Name muss mindestens 2 Zeichen lang sein.",
      photoTooLarge: "Das Profilfoto muss kleiner als 1 MB sein.",
    },
    heading: "Erstelle dein Konto",
    nameDescription:
      "Bitte gib deinen vollständigen Namen für die öffentliche Anzeige innerhalb deiner Organisation ein.",
    nameLabel: "Name",
    namePlaceholder: "Dein vollständiger Name ...",
    profilePhotoDescription:
      "Lade ein Profilfoto hoch, um dein Konto zu personalisieren.",
    profilePhotoFormats: "PNG, JPG, GIF bis zu 1 MB",
    profilePhotoLabel: "Profilfoto",
    profilePhotoPreviewAlt: "Profilfoto-Vorschau",
    save: "Weiter",
    saving: "Wird gespeichert ...",
    subtitle:
      "Willkommen beim React Router SaaS Template! Bitte erstelle dein Benutzerkonto, um loszulegen.",
    title: "Benutzerkonto",
  },
} satisfies typeof import("../en/onboarding").default;
