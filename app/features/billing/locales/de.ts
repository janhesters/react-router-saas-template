import type en from './en';

export default {
  'billing-page': {
    'cancel-at-period-end-banner': {
      button: 'Abonnement fortsetzen',
      description: 'Dein Abonnement endet am {{date}}.',
      'resume-success-title': 'Abonnement fortgesetzt',
      'resuming-subscription': 'Abonnement wird fortgesetzt ...',
      title: 'Dein Abonnement läuft bald ab.',
    },
    'cancel-subscription-modal': {
      'cancelling-subscription': 'Abonnement wird gekündigt ...',
      'change-plan': 'Anderen Plan wählen',
      confirm: 'Abonnement kündigen',
      description:
        'Wenn du dein Abonnement kündigst, verlierst du am Ende deines Abrechnungszeitraums den Zugriff auf deine Vorteile.',
      features: [
        'SSO',
        'Unbegrenzte Mitglieder',
        'Unbegrenzte private Projekte',
        'Priorisierter Support',
      ],
      title: 'Möchtest du dein Abonnement wirklich kündigen?',
    },
    'free-trial-banner': {
      button: 'Zahlungsinformationen hinzufügen',
      description: 'Deine kostenlose Testphase endet am {{date}}.',
      modal: {
        description: 'Wähle einen Plan, der deinen Bedürfnissen entspricht.',
        title: 'Wähle deinen Plan',
      },
      title: 'Deine Organisation ist derzeit in der Testphase.',
    },
    'opening-customer-portal': 'Kundenportal wird geöffnet ...',
    'page-description': 'Verwalte deine Abrechnungsinformationen.',
    'page-title': 'Abrechnung',
    'payment-information': {
      'billing-email': 'Abrechnungs-E-Mail',
      'edit-button': 'Bearbeiten',
      heading: 'Zahlungsinformationen',
    },
    'pending-downgrade-banner': {
      button: 'Aktuelles Abonnement beibehalten',
      description:
        'Dein Abonnement wird am {{date}} auf den {{planName}}-Plan ({{billingInterval}}) herabgestuft.',
      intervals: {
        annual: 'jährlich',
        monthly: 'monatlich',
      },
      'loading-button': 'Abonnement wird aktualisiert ...',
      'success-title': 'Aktuelles Abonnement beibehalten',
      title: 'Herabstufung geplant',
    },
    'plan-information': {
      'amount-format': '${{amount}}',
      'current-plan': 'Aktueller Plan',
      heading: 'Dein Plan',
      'manage-plan': 'Plan verwalten',
      'manage-users': 'Benutzer verwalten',
      'next-billing-date': 'Nächstes Abrechnungsdatum',
      'projected-total': 'Voraussichtlicher Gesamtbetrag',
      'rate-format-annual':
        '${{amount}} <1>pro Nutzer, jährlich abgerechnet</1>',
      'rate-format-monthly':
        '${{amount}} <1>pro Nutzer, monatlich abgerechnet</1>',
      users: 'Nutzer',
      'users-format': '{{current}} / {{max}}',
      'view-invoices': 'Rechnungen ansehen',
    },
    'pricing-modal': {
      'add-payment-information': 'Zahlungsinformationen hinzufügen',
      'adding-payment-information':
        'Zahlungsinformationen werden hinzugefügt ...',
      'cancel-subscription-banner': {
        button: 'Abonnement kündigen',
        description:
          'Nach der Kündigung kannst du dein Konto bis zum Ende des aktuellen Abrechnungszeitraums weiter nutzen.',
        title: 'Abonnement kündigen',
      },
      'current-plan': 'Aktueller Plan',
      description: 'Wähle einen Plan, der deinen Bedürfnissen entspricht.',
      'downgrade-button': 'Herabstufen',
      downgrading: 'Wird herabgestuft ...',
      'switch-to-annual-button': 'Auf jährlich umstellen',
      'switch-to-monthly-button': 'Auf monatlich umstellen',
      title: 'Plan verwalten',
      'upgrade-button': 'Upgrade',
      upgrading: 'Wird hochgestuft ...',
    },
    'subscription-cancelled-banner': {
      button: 'Abonnement reaktivieren',
      description: 'Dein Abonnement wurde gekündigt.',
      modal: {
        description: 'Wähle einen Plan, der deinen Bedürfnissen entspricht.',
        title: 'Wähle einen Plan, um dein Abonnement zu reaktivieren',
      },
      title: 'Dein Abonnement ist inaktiv.',
    },
    'update-billing-email-modal': {
      description: 'Deine Rechnungen werden an diese E-Mail-Adresse gesendet.',
      'email-invalid':
        "Eine gültige E-Mail-Adresse besteht aus Buchstaben, '@' und '.'.",
      'email-label': 'E-Mail',
      'email-must-be-string': 'Die E-Mail-Adresse muss ein String sein.',
      'email-placeholder': 'billing@company.com',
      'email-required':
        'Bitte gib eine gültige E-Mail-Adresse ein (erforderlich).',
      'saving-changes': 'Änderungen werden gespeichert ...',
      'submit-button': 'Änderungen speichern',
      'success-title': 'Abrechnungs-E-Mail aktualisiert',
      title: 'Deine Abrechnungs-E-Mail bearbeiten',
    },
  },
  'billing-sidebar-card': {
    'active-trial': {
      button: 'Zahlungsinformationen hinzufügen',
      description: 'Testphase endet am {{date}}.',
      title: 'Business-Plan (Testphase)',
    },
    'billing-modal': {
      description: 'Wähle einen Plan, der deinen Bedürfnissen entspricht.',
      title: 'Wähle deinen Plan',
    },
    'subscription-inactive': {
      button: 'Plan wählen',
      description:
        'Erneuere dein Abonnement, um die App weiter nutzen zu können.',
      modal: {
        description: 'Wähle einen Plan, der deinen Bedürfnissen entspricht.',
        title: 'Wähle einen Plan, um dein Abonnement zu reaktivieren',
      },
      title: 'Abonnement inaktiv',
    },
    'trial-ended': {
      button: 'Abonnement fortsetzen',
      description: 'Testphase endete am {{date}}.',
      title: 'Business-Plan (Testphase)',
    },
  },
  'billing-success-page': {
    'go-to-dashboard': 'Zum Dashboard',
    'page-title': 'Erfolgreich abonniert!',
    'payment-successful': 'Zahlung erfolgreich',
    'product-ready':
      'Dein SaaS-Produkt ist bereit und unterstützt dich dabei, deine Zeit optimal zu nutzen und deine Kunden bestmöglich zu bedienen. Verabschiede dich von mühsamer Einrichtung und begrüße direkt das Bauen.',
    'thank-you':
      'Danke, dass du der React Router SaaS Vorlage vertraust. Deine erfolgreiche Reise zum Aufbau und zur Pflege eines SaaS-Produkts beginnt jetzt!',
  },
  'contact-sales': {
    company: 'Unternehmen',
    'company-name-label': 'Unternehmen',
    'company-name-must-be-string': 'Dein Firmenname muss ein String sein.',
    'company-name-placeholder': 'Firmenname',
    'company-name-required': 'Bitte gib deinen Firmennamen ein (erforderlich).',
    'company-name-too-long':
      'Dein Firmenname darf nicht länger als 255 Zeichen sein.',
    'company-placeholder': 'Firmenname',
    'contact-sales-description':
      'Wir besprechen deine Anforderungen, zeigen eine Produktdemo und finden den passenden Plan und Preis für dich.',
    'contact-sales-title':
      'Sprich mit unserem Vertrieb über deine Anforderungen.',
    'enterprise-sales': 'Enterprise-Vertrieb',
    'first-name-label': 'Vorname',
    'first-name-must-be-string': 'Dein Vorname muss ein String sein.',
    'first-name-placeholder': 'Vorname',
    'first-name-required': 'Bitte gib deinen Vornamen ein (erforderlich).',
    'first-name-too-long':
      'Dein Vorname darf nicht länger als 255 Zeichen sein.',
    'last-name-label': 'Nachname',
    'last-name-must-be-string': 'Dein Nachname muss ein String sein.',
    'last-name-placeholder': 'Nachname',
    'last-name-required': 'Bitte gib deinen Nachnamen ein (erforderlich).',
    'last-name-too-long':
      'Dein Nachname darf nicht länger als 255 Zeichen sein.',
    'message-label': 'Nachricht',
    'message-must-be-string': 'Deine Nachricht muss ein String sein.',
    'message-placeholder':
      'Beschreibe dein Projekt, deine Anforderungen und den Zeitplan.',
    'message-required':
      'Bitte gib eine Nachricht ein, die deine Anforderungen beschreibt (erforderlich).',
    'message-too-long':
      'Deine Nachricht darf nicht länger als 5000 Zeichen sein.',
    'page-title': 'Kontakt Sales',
    'phone-number-label': 'Telefonnummer',
    'phone-number-must-be-string': 'Deine Telefonnummer muss ein String sein.',
    'phone-number-placeholder': 'Wohin sollen wir dich anrufen?',
    'phone-number-required':
      'Bitte gib deine Telefonnummer ein (erforderlich).',
    'submit-button': 'Vertrieb kontaktieren',
    'submit-button-loading': 'Kontaktaufnahme läuft ...',
    'submit-disclaimer':
      'Mit dem Absenden dieses Formulars erklärst du dich damit einverstanden, dass dich unser Vertrieb kontaktiert.',
    success: 'Erfolgreich!',
    'thank-you': 'Danke für deine Anfrage. Wir melden uns in Kürze bei dir.',
    'work-email-invalid':
      "Bitte gib eine gültige Geschäfts-E-Mail-Adresse ein, einschließlich '@' und '.'.",
    'work-email-label': 'Geschäftliche E-Mail',
    'work-email-must-be-string': 'Deine Geschäfts-E-Mail muss ein String sein.',
    'work-email-placeholder': 'name@company.com',
    'work-email-required':
      'Bitte gib deine Geschäfts-E-Mail ein (erforderlich).',
    'work-email-too-long':
      'Deine Geschäfts-E-Mail darf nicht länger als 255 Zeichen sein.',
  },
  'no-current-plan-modal': {
    annual: 'Jährlich',
    'disabled-plans-alert': {
      'description-plural':
        'Du hast aktuell {{currentSeats}} Nutzer, und der Plan {{plan1Title}} unterstützt nur {{plan1Capacity}} Nutzer, während der Plan {{plan2Title}} nur {{plan2Capacity}} Nutzer unterstützt. Bitte wähle einen Plan, der mindestens {{currentSeats}} Plätze bietet.',
      'description-singular':
        'Du hast aktuell {{currentSeats}} Nutzer, und der Plan {{planTitle}} unterstützt nur {{planCapacity}} Nutzer. Bitte wähle einen Plan, der mindestens {{currentSeats}} Plätze bietet.',
      title: 'Warum sind einige Pläne deaktiviert?',
    },
    monthly: 'Monatlich',
    'tier-card-busy': 'Abonnieren läuft ...',
    'tier-card-cta': 'Jetzt abonnieren',
  },
  pricing: {
    annual: 'Jährlich',
    custom: 'Individuell',
    free: 'Kostenlos',
    monthly: 'Monatlich',
    'most-popular': 'Am beliebtesten',
    plans: {
      enterprise: {
        cta: 'Vertrieb kontaktieren',
        description:
          'Für große Unternehmen, die individuelle Lösungen benötigen.',
        features: [
          'Individuelle Integrationen',
          'Unbegrenzte Mitglieder',
          'Dedizierter Support',
        ],
        'features-title': 'Alle Business-Funktionen, plus:',
        title: 'Enterprise',
      },
      high: {
        cta: '14 Tage kostenlos testen',
        description: 'Für Profis und Unternehmen, die wachsen möchten.',
        features: ['SSO', 'Bis zu 25 Mitglieder', 'Priorisierter Support'],
        'features-title': 'Alles in Startup, plus:',
        title: 'Business',
      },
      low: {
        cta: 'Loslegen',
        description: 'Für Hobbyisten und Anfänger, die lernen und entdecken.',
        features: [
          'Unbegrenzte öffentliche Projekte',
          'Community-Support',
          '1 Mitglied',
        ],
        'features-title': 'Funktionen:',
        title: 'Hobby',
      },
      mid: {
        cta: '14 Tage kostenlos testen',
        description:
          'Perfekt für Startups mit kleinen Teams, die skalieren möchten.',
        features: [
          'Unbegrenzte private Projekte',
          'Branding entfernen',
          'Bis zu 5 Mitglieder',
        ],
        'features-title': 'Alles in Hobby, plus:',
        title: 'Startup',
      },
    },
    price: '{{price}} <1>/Nutzer pro Monat</1>',
    'save-annually': 'Spare bis zu 20 % mit dem Jahresplan.',
  },
  'pricing-page': {
    'page-description':
      'Wähle den Plan, der deinen Bedürfnissen entspricht. Alle Pläne kommen mit einer 30-tägigen Geld-zurück-Garantie.',
    'page-title': 'Preise',
    'pricing-heading': 'Wähle deinen Plan',
  },
} satisfies typeof en;
