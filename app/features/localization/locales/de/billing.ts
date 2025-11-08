/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: It's a currency */
export default {
  billingPage: {
    cancelAtPeriodEndBanner: {
      button: "Abonnement fortsetzen",
      description: "Dein Abonnement läuft am {{date}} aus.",
      resumeSuccessTitle: "Abonnement fortgesetzt",
      resumingSubscription: "Abonnement wird fortgesetzt ...",
      title: "Dein Abonnement endet bald.",
    },
    cancelSubscriptionModal: {
      cancellingSubscription: "Abonnement wird gekündigt ...",
      changePlan: "Wähle einen anderen Plan",
      confirm: "Abonnement kündigen",
      description:
        "Wenn du dein Abonnement kündigst, verlierst du am Ende deines Abrechnungszeitraums den Zugriff auf deine Vorteile.",
      features: [
        "SSO",
        "Unbegrenzte Mitglieder",
        "Unbegrenzte private Projekte",
        "Prioritäts-Support",
      ],
      title: "Bist du sicher, dass du dein Abonnement kündigen möchtest?",
    },
    freeTrialBanner: {
      button: "Zahlungsinformationen hinzufügen",
      description: "Deine kostenlose Testphase endet am {{date}}.",
      modal: {
        description: "Wähle einen Plan, der zu deinen Bedürfnissen passt.",
        title: "Wähle deinen Plan",
      },
      title:
        "Deine Organisation befindet sich derzeit in der kostenlosen Testphase.",
    },
    openingCustomerPortal: "Kundenportal wird geöffnet ...",
    pageDescription: "Verwalte deine Abrechnungsinformationen.",
    pageTitle: "Abrechnung",
    paymentInformation: {
      billingEmail: "Rechnungs-E-Mail",
      editButton: "Bearbeiten",
      heading: "Zahlungsinformationen",
    },
    pendingDowngradeBanner: {
      button: "Aktuelles Abonnement beibehalten",
      description:
        "Dein Abonnement wird am {{date}} auf den {{planName}}-Plan ({{billingInterval}}) herabgestuft.",
      intervals: {
        annual: "jährlich",
        monthly: "monatlich",
      },
      loadingButton: "Abonnement wird aktualisiert ...",
      successTitle: "Aktuelles Abonnement beibehalten",
      title: "Herabstufung geplant",
    },
    planInformation: {
      amountFormat: "${{amount}}",
      currentPlan: "Aktueller Plan",
      heading: "Dein Plan",
      managePlan: "Plan verwalten",
      manageUsers: "Benutzer verwalten",
      nextBillingDate: "Nächstes Abrechnungsdatum",
      projectedTotal: "Voraussichtliche Summe",
      rateFormatAnnual: "${{amount}} <1>pro Benutzer jährlich abgerechnet</1>",
      rateFormatMonthly:
        "${{amount}} <1>pro Benutzer monatlich abgerechnet</1>",
      users: "Benutzer",
      usersFormat: "{{current}} / {{max}}",
      viewInvoices: "Rechnungen ansehen",
    },
    pricingModal: {
      addingPaymentInformation: "Zahlungsinformationen werden hinzugefügt ...",
      addPaymentInformation: "Zahlungsinformationen hinzufügen",
      cancelSubscriptionBanner: {
        button: "Abonnement kündigen",
        description:
          "Nach der Kündigung deines Abonnements kannst du dein Konto bis zum Ende des aktuellen Abrechnungszeitraums weiter nutzen.",
        title: "Abonnement kündigen",
      },
      currentPlan: "Aktueller Plan",
      description: "Wähle einen Plan, der zu deinen Bedürfnissen passt.",
      downgradeButton: "Herabstufen",
      downgrading: "Wird herabgestuft ...",
      switchToAnnualButton: "Zu jährlicher Abrechnung wechseln",
      switchToMonthlyButton: "Zu monatlicher Abrechnung wechseln",
      title: "Plan verwalten",
      upgradeButton: "Upgrade durchführen",
      upgrading: "Upgrade wird durchgeführt ...",
    },
    subscriptionCancelledBanner: {
      button: "Abonnement reaktivieren",
      description: "Dein Abonnement wurde gekündigt.",
      modal: {
        description: "Wähle einen Plan, der zu deinen Bedürfnissen passt.",
        title: "Wähle deinen Plan, um dein Abonnement zu reaktivieren",
      },
      title: "Dein Abonnement ist inaktiv.",
    },
    updateBillingEmailModal: {
      description: "Deine Rechnungen werden an diese E-Mail-Adresse gesendet.",
      emailInvalid: "Eine gültige E-Mail besteht aus Zeichen, '@' und '.'.",
      emailLabel: "E-Mail",
      emailPlaceholder: "abrechnung@firma.de",
      emailRequired: "Bitte gib eine gültige E-Mail ein (erforderlich).",
      savingChanges: "Änderungen werden gespeichert ...",
      submitButton: "Änderungen speichern",
      successTitle: "Rechnungs-E-Mail aktualisiert",
      title: "Bearbeite deine Rechnungs-E-Mail",
    },
  },
  billingSidebarCard: {
    activeTrial: {
      button: "Zahlungsinformationen hinzufügen",
      description: "Testphase endet am {{date}}.",
      title: "Business Plan (Testphase)",
    },
    billingModal: {
      description: "Wähle einen Plan, der zu deinen Bedürfnissen passt.",
      title: "Wähle deinen Plan",
    },
    subscriptionInactive: {
      button: "Plan auswählen",
      description: "Verlängere, um die App weiter zu nutzen.",
      modal: {
        description: "Wähle einen Plan, der zu deinen Bedürfnissen passt.",
        title: "Wähle deinen Plan, um dein Abonnement zu reaktivieren",
      },
      title: "Abonnement inaktiv",
    },
    trialEnded: {
      button: "Abonnement fortsetzen",
      description: "Testphase endete am {{date}}.",
      title: "Business Plan (Testphase)",
    },
  },
  billingSuccessPage: {
    goToDashboard: "Zum Dashboard",
    pageTitle: "Erfolgreich abonniert!",
    paymentSuccessful: "Zahlung erfolgreich",
    productReady:
      "Dein SaaS-Produkt ist bereit und freut sich darauf, dir zu helfen, deine Zeit optimal zu nutzen und deine Kunden zu bedienen. Verabschiede dich von mühsamer Einrichtung und konzentriere dich aufs Entwickeln.",
    thankYou:
      "Vielen Dank, dass du React Router SaaS Template vertraust. Deine erfolgreiche Reise zum Aufbau und zur Pflege eines SaaS-Produkts beginnt jetzt!",
  },
  contactSales: {
    company: "Firma",
    companyNameLabel: "Firma",
    companyNamePlaceholder: "Firmenname",
    companyNameRequired: "Bitte gib deinen Firmennamen ein (erforderlich).",
    companyNameTooLong:
      "Dein Firmenname darf nicht mehr als 255 Zeichen enthalten.",
    companyPlaceholder: "Firmenname",
    contactSalesDescription:
      "Wir besprechen deine Anforderungen, führen eine Produktdemo durch und richten den richtigen Plan und Preis für dich ein.",
    contactSalesTitle:
      "Sprich mit unserem Vertriebsteam über deine Bedürfnisse.",
    enterpriseSales: "Enterprise-Vertrieb",
    firstNameLabel: "Vorname",
    firstNamePlaceholder: "Vorname",
    firstNameRequired: "Bitte gib deinen Vornamen ein (erforderlich).",
    firstNameTooLong: "Dein Vorname darf nicht mehr als 255 Zeichen enthalten.",
    lastNameLabel: "Nachname",
    lastNamePlaceholder: "Nachname",
    lastNameRequired: "Bitte gib deinen Nachnamen ein (erforderlich).",
    lastNameTooLong: "Dein Nachname darf nicht mehr als 255 Zeichen enthalten.",
    messageLabel: "Nachricht",
    messagePlaceholder:
      "Beschreibe dein Projekt, deine Bedürfnisse und deinen Zeitplan.",
    messageRequired:
      "Bitte gib eine Nachricht ein, die deine Bedürfnisse beschreibt (erforderlich).",
    messageTooLong:
      "Deine Nachricht darf nicht mehr als 5000 Zeichen enthalten.",
    pageTitle: "Vertrieb kontaktieren",
    phoneNumberLabel: "Telefonnummer",
    phoneNumberPlaceholder: "Wo sollen wir dich anrufen?",
    phoneNumberRequired: "Bitte gib deine Telefonnummer ein (erforderlich).",
    submitButton: "Vertrieb kontaktieren",
    submitButtonLoading: "Vertrieb wird kontaktiert ...",
    submitDisclaimer:
      "Mit dem Absenden dieses Formulars erkläre ich mich damit einverstanden, vom Vertriebsteam kontaktiert zu werden.",
    success: "Erfolg!",
    thankYou:
      "Vielen Dank, dass du uns kontaktiert hast. Wir werden uns in Kürze bei dir melden.",
    workEmailInvalid:
      "Bitte gib eine gültige geschäftliche E-Mail ein, die '@' und '.' enthält.",
    workEmailLabel: "Geschäftliche E-Mail",
    workEmailPlaceholder: "name@firma.de",
    workEmailRequired:
      "Bitte gib deine geschäftliche E-Mail ein (erforderlich).",
    workEmailTooLong:
      "Deine geschäftliche E-Mail darf nicht mehr als 255 Zeichen enthalten.",
  },
  noCurrentPlanModal: {
    annual: "Jährlich",
    disabledPlansAlert: {
      descriptionPlural:
        "Du hast derzeit {{currentSeats}} Benutzer, und der {{plan1Title}}-Plan unterstützt nur {{plan1Capacity}} Benutzer, während der {{plan2Title}}-Plan nur {{plan2Capacity}} Benutzer unterstützt. Bitte wähle einen Plan, der mindestens {{currentSeats}} Plätze unterstützt.",
      descriptionSingular:
        "Du hast derzeit {{currentSeats}} Benutzer, und der {{planTitle}}-Plan unterstützt nur {{planCapacity}} Benutzer. Bitte wähle einen Plan, der mindestens {{currentSeats}} Plätze unterstützt.",
      title: "Warum sind einige Pläne deaktiviert?",
    },
    monthly: "Monatlich",
    tierCardBusy: "Abonnement wird abgeschlossen ...",
    tierCardCta: "Jetzt abonnieren",
  },
  pricing: {
    annual: "Jährlich",
    custom: "Individuell",
    free: "Kostenlos",
    monthly: "Monatlich",
    mostPopular: "Am beliebtesten",
    plans: {
      enterprise: {
        cta: "Vertrieb kontaktieren",
        description:
          "Für große Organisationen, die maßgeschneiderte Lösungen benötigen.",
        features: [
          "Individuelle Integrationen",
          "Unbegrenzte Mitglieder",
          "Dedizierter Support",
        ],
        featuresTitle: "Alle Business-Funktionen plus:",
        title: "Enterprise",
      },
      high: {
        cta: "Starte eine 14-tägige kostenlose Testphase",
        description: "Für Profis und Unternehmen, die wachsen möchten.",
        features: ["SSO", "Bis zu 25 Mitglieder", "Prioritäts-Support"],
        featuresTitle: "Alles in Startup plus:",
        title: "Business",
      },
      low: {
        cta: "Jetzt starten",
        description: "Für Hobbyisten und Anfänger, die lernen und erkunden.",
        features: [
          "Unbegrenzte öffentliche Projekte",
          "Community-Support",
          "1 Mitglied",
        ],
        featuresTitle: "Funktionen:",
        title: "Hobby",
      },
      mid: {
        cta: "Starte eine 14-tägige kostenlose Testphase",
        description:
          "Perfekt für Startups mit kleinen Teams, die skalieren müssen.",
        features: [
          "Unbegrenzte private Projekte",
          "Branding entfernen",
          "Bis zu 5 Mitglieder",
        ],
        featuresTitle: "Alles in Hobby plus:",
        title: "Startup",
      },
    },
    price: "{{price}} <1>/Benutzer pro Monat</1>",
    saveAnnually: "Spare bis zu 20% mit dem Jahresplan.",
  },
  pricingPage: {
    pageDescription:
      "Natürlich ist dieses Template kostenlos. Aber so könnte deine Preisgestaltung aussehen.",
    pageTitle: "Preise",
    pricingHeading: "Wähle deinen Plan",
  },
} satisfies typeof import("../en/billing").default;
