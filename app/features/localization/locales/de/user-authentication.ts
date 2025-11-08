export default {
  layout: {
    backgroundPathsTitle: "Animierte Hintergrundpfade",
    home: "Startseite",
    quote:
      "Dieses Authentifizierungssystem hat verändert, wie wir Benutzer-Logins handhaben. Der Magic-Link-Flow ist nahtlos und unsere Benutzer lieben es.",
    quoteAuthor: "Alex Chen, Lead Developer",
  },
  login: {
    emailLabel: "E-Mail",
    emailPlaceholder: "du@beispiel.de",
    errors: {
      invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    form: {
      joinOrganization: "Melde dich an, um {{organizationName}} beizutreten",
      joinOrganizationDescription:
        "{{creatorName}} hat dich eingeladen, {{organizationName}} beizutreten.",
      loginFailed: "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",
      userDoesntExist:
        "Benutzer mit der angegebenen E-Mail existiert nicht. Wolltest du stattdessen ein neues Konto erstellen?",
    },
    googleButton: "Mit Google fortfahren",
    magicLink: {
      alertDescription: "Denk daran, auch deinen Spam-Ordner zu überprüfen.",
      cardDescription:
        "Wir haben einen sicheren Anmeldelink an deine E-Mail-Adresse gesendet. Bitte überprüfe deinen Posteingang und klicke auf den Link, um auf dein Konto zuzugreifen.",
      cardTitle: "Überprüfe deine E-Mails",
      countdownMessage_one:
        "Nachdem du auf den Link geklickt hast, <1>schließe bitte diesen Tab</1>. Wenn du die E-Mail nicht innerhalb von {{count}} Sekunde erhalten hast, kannst du einen weiteren Link anfordern.",
      countdownMessage_other:
        "Nachdem du auf den Link geklickt hast, <1>schließe bitte diesen Tab</1>. Wenn du die E-Mail nicht innerhalb von {{count}} Sekunden erhalten hast, kannst du einen weiteren Link anfordern.",
      countdownMessage_zero:
        "Nachdem du auf den Link geklickt hast, <1>schließe bitte diesen Tab</1>. Wenn du die E-Mail nicht erhalten hast, kannst du jetzt einen neuen Anmeldelink anfordern.",
      resendButton: "Neuen Anmeldelink anfordern",
      resendButtonLoading: "Wird gesendet...",
      resendSuccess:
        "Ein neuer Anmeldelink wurde an deine E-Mail-Adresse gesendet. Bitte überprüfe deinen Posteingang.",
    },
    pageTitle: "Anmelden",
    separator: "Oder",
    signupCta: "Noch kein Konto? <signup>Registrieren</signup>",
    submitButton: "Mit E-Mail anmelden",
    submitButtonSubmitting: "Wird angemeldet...",
    subtitle: "Gib deine E-Mail unten ein, um dich bei deinem Konto anzumelden",
    title: "Willkommen zurück",
  },
  register: {
    emailLabel: "E-Mail",
    emailPlaceholder: "du@beispiel.de",
    errors: {
      invalidEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
    },
    form: {
      joinOrganization: "Registriere dich, um {{organizationName}} beizutreten",
      joinOrganizationDescription:
        "{{creatorName}} hat dich eingeladen, {{organizationName}} beizutreten.",
      registrationFailed:
        "Registrierung fehlgeschlagen. Bitte versuche es erneut.",
      termsAndPrivacy:
        "Durch das Erstellen eines Kontos stimmst du unseren <1>Nutzungsbedingungen</1> und <2>Datenschutzrichtlinien</2> zu.",
      userAlreadyExists:
        "Benutzer mit der angegebenen E-Mail existiert bereits. Wolltest du dich stattdessen anmelden?",
    },
    googleButton: "Mit Google fortfahren",
    legal:
      "Durch Klicken auf Fortfahren stimmst du unseren <tos>Nutzungsbedingungen</tos> und <pp>Datenschutzrichtlinien</pp> zu.",
    loginCta: "Hast du bereits ein Konto? <login>Anmelden</login>",
    magicLink: {
      alertDescription: "Denk daran, auch deinen Spam-Ordner zu überprüfen.",
      cardDescription:
        "Wir haben einen Verifizierungslink an deine E-Mail-Adresse gesendet. Bitte überprüfe deinen Posteingang und klicke auf den Link, um deine Registrierung abzuschließen.",
      cardTitle: "Verifiziere deine E-Mail",
      countdownMessage_one:
        "Nachdem du auf den Link geklickt hast, <1>schließe bitte diesen Tab</1>. Wenn du die E-Mail nicht innerhalb von {{count}} Sekunde erhalten hast, kannst du einen weiteren Verifizierungslink anfordern.",
      countdownMessage_other:
        "Nachdem du auf den Link geklickt hast, <1>schließe bitte diesen Tab</1>. Wenn du die E-Mail nicht innerhalb von {{count}} Sekunden erhalten hast, kannst du einen weiteren Verifizierungslink anfordern.",
      countdownMessage_zero:
        "Nachdem du auf den Link geklickt hast, <1>schließe bitte diesen Tab</1>. Wenn du die E-Mail nicht erhalten hast, kannst du jetzt einen neuen Verifizierungslink anfordern.",
      resendButton: "Neuen Verifizierungslink anfordern",
      resendButtonLoading: "Wird gesendet...",
      resendSuccess:
        "Ein neuer Verifizierungslink wurde an deine E-Mail-Adresse gesendet. Bitte überprüfe deinen Posteingang.",
    },
    pageTitle: "Registrieren",
    separator: "Oder",
    submitButton: "Konto erstellen",
    submitButtonSubmitting: "Konto wird erstellt...",
    subtitle: "Gib deine E-Mail unten ein, um dein Konto zu erstellen",
    title: "Erstelle ein Konto",
  },
} satisfies typeof import("../en/user-authentication").default;
