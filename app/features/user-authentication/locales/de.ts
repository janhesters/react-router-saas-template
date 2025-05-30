import type en from './en';

export default {
  common: {
    'email-invalid':
      "Eine gültige E-Mail-Adresse enthält Zeichen, '@' und '.'.",
    'email-must-be-string': 'Eine gültige E-Mail-Adresse muss ein Text sein.',
    'email-required':
      'Bitte gib eine gültige E-Mail-Adresse ein (erforderlich).',
  },
  login: {
    form: {
      'card-description':
        'Gib unten deine E-Mail-Adresse ein, um dich in dein Konto einzuloggen.',
      'card-title': 'Willkommen zurück',
      'divider-text': 'Oder weiter mit',
      email: 'E-Mail',
      'email-placeholder': 'Deine E-Mail-Adresse ...',
      google: 'Google',
      'join-organization': 'Melde dich an, um {{organizationName}} beizutreten',
      'join-organization-description':
        '{{creatorName}} hat dich eingeladen, {{organizationName}} beizutreten.',
      'login-failed': 'Login fehlgeschlagen. Bitte versuch es erneut.',
      'register-link': 'Registrieren',
      'register-prompt': 'Noch kein Mitglied?',
      'submit-button': 'Einloggen',
      'submit-button-loading': 'Login läuft ...',
      'user-doesnt-exist':
        'Es gibt keinen Benutzer mit dieser E-Mail-Adresse. Wolltest du vielleicht ein neues Konto erstellen?',
    },
    'magic-link': {
      'alert-description': 'Denk dran, auch im Spam-Ordner nachzuschauen.',
      'card-description':
        'Wir haben dir einen sicheren Login-Link per E-Mail geschickt. Bitte schau in dein Postfach und klicke auf den Link, um Zugriff auf dein Konto zu bekommen.',
      'card-title': 'Schau in dein Postfach',
      'countdown-message_one':
        'Sobald du auf den Link klickst, <1>schließe bitte diesen Tab</1>. Falls du die E-Mail innerhalb von {{count}} Sekunde nicht erhalten hast, kannst du einen neuen Link anfordern.',
      'countdown-message_other':
        'Sobald du auf den Link klickst, <1>schließe bitte diesen Tab</1>. Falls du die E-Mail innerhalb von {{count}} Sekunden nicht erhalten hast, kannst du einen neuen Link anfordern.',
      'countdown-message_zero':
        'Sobald du auf den Link klickst, <1>schließe bitte diesen Tab</1>. Falls du die E-Mail nicht erhalten hast, kannst du jetzt einen neuen Login-Link anfordern.',
      'resend-button': 'Neuen Login-Link anfordern',
      'resend-button-loading': 'Wird gesendet ...',
      'resend-success':
        'Ein neuer Login-Link wurde an deine E-Mail-Adresse gesendet. Bitte überprüfe dein Postfach.',
    },
    'page-title': 'Login',
  },
  register: {
    form: {
      'card-description': 'Erstelle dein Konto, um loszulegen.',
      'card-title': 'Neu hier?',
      'divider-text': 'Oder weiter mit',
      email: 'E-Mail',
      'email-placeholder': 'Deine E-Mail-Adresse ...',
      google: 'Google',
      'join-organization':
        'Registriere dich, um {{organizationName}} beizutreten',
      'join-organization-description':
        '{{creatorName}} hat dich eingeladen, {{organizationName}} beizutreten.',
      'login-link': 'Einloggen',
      'login-prompt': 'Du hast schon ein Konto?',
      'registration-failed':
        'Registrierung fehlgeschlagen. Bitte versuch es erneut.',
      'submit-button': 'Registrieren',
      'submit-button-loading': 'Registrierung läuft ...',
      'terms-and-privacy':
        'Mit dem Erstellen eines Kontos stimmst du unseren <1>Nutzungsbedingungen</1> und der <2>Datenschutzerklärung</2> zu.',
      'user-already-exists':
        'Es gibt bereits einen Benutzer mit dieser E-Mail-Adresse. Wolltest du dich stattdessen einloggen?',
    },
    'magic-link': {
      'alert-description': 'Denk dran, auch im Spam-Ordner nachzuschauen.',
      'card-description':
        'Wir haben dir einen Bestätigungslink per E-Mail geschickt. Bitte schau in dein Postfach und klicke auf den Link, um deine Registrierung abzuschließen.',
      'card-title': 'Bestätige deine E-Mail',
      'countdown-message_one':
        'Sobald du auf den Link klickst, <1>schließe bitte diesen Tab</1>. Falls du die E-Mail innerhalb von {{count}} Sekunde nicht erhalten hast, kannst du einen neuen Link anfordern.',
      'countdown-message_other':
        'Sobald du auf den Link klickst, <1>schließe bitte diesen Tab</1>. Falls du die E-Mail innerhalb von {{count}} Sekunden nicht erhalten hast, kannst du einen neuen Link anfordern.',
      'countdown-message_zero':
        'Sobald du auf den Link klickst, <1>schließe bitte diesen Tab</1>. Falls du die E-Mail nicht erhalten hast, kannst du jetzt einen neuen Bestätigungslink anfordern.',
      'resend-button': 'Neuen Bestätigungslink anfordern',
      'resend-button-loading': 'Wird gesendet ...',
      'resend-success':
        'Ein neuer Bestätigungslink wurde an deine E-Mail-Adresse gesendet. Bitte überprüfe dein Postfach.',
    },
    'page-title': 'Registrieren',
  },
} satisfies typeof en;
