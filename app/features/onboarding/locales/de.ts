import type en from './en';

export default {
  common: {
    onboarding: 'Onboarding',
    'onboarding-progress': 'Onboarding-Fortschritt',
  },
  organization: {
    'card-description':
      'Du kannst später weitere Nutzer über die Organisationseinstellungen einladen.',
    'card-title': 'Erstelle deine Organisation',
    'logo-label': 'Logo',
    'logo-must-be-string': 'Das Logo muss eine Zeichenkette sein.',
    'logo-must-be-url': 'Das Logo muss eine gültige URL sein.',
    'name-max-length':
      'Der Name deiner Organisation darf maximal 255 Zeichen lang sein.',
    'name-min-length':
      'Der Name deiner Organisation muss mindestens 3 Zeichen lang sein.',
    'name-must-be-string':
      'Der Name deiner Organisation muss eine Zeichenkette sein.',
    'organization-name-description':
      'Bitte gib den Namen deiner Organisation ein.',
    'organization-name-label': 'Name der Organisation',
    'organization-name-placeholder': 'Name deiner Organisation ...',
    save: 'Speichern',
    saving: 'Speichert ...',
    title: 'Organisation',
  },
  'user-account': {
    'avatar-label': 'Avatar',
    'avatar-must-be-url': 'Der Avatar muss eine gültige URL sein.',
    'card-description':
      'Willkommen beim React Router SaaS Template! Bitte erstelle dein Benutzerkonto, um loszulegen.',
    'card-title': 'Erstelle dein Konto',
    'name-max-length': 'Dein Name darf maximal 128 Zeichen lang sein.',
    'name-min-length': 'Dein Name muss mindestens 2 Zeichen lang sein.',
    'name-must-be-string':
      'Dein öffentlicher Name muss eine Zeichenkette sein.',
    save: 'Speichern',
    saving: 'Speichert ...',
    title: 'Benutzerkonto',
    'user-name-description':
      'Bitte gib deinen vollständigen Namen an, wie er innerhalb deiner Organisation angezeigt werden soll.',
    'user-name-label': 'Name',
    'user-name-placeholder': 'Dein vollständiger Name ...',
  },
} satisfies typeof en;
