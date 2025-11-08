export default {
  layout: {
    quote:
      "Diese Plattform hat unseren gesamten Workflow optimiert. Der Onboarding-Prozess war intuitiv und hat unser Team in wenigen Minuten einsatzbereit gemacht.",
    quoteAuthor: "Sarah Mitchell, Product Manager",
  },
  organization: {
    errors: {
      invalidFileType: "Bitte lade eine gültige Bilddatei hoch.",
      logoTooLarge: "Das Logo muss kleiner als 1 MB sein.",
      nameMax: "Dein Organisationsname darf höchstens 255 Zeichen lang sein.",
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
