import type en from './en';

export default {
  settings: {
    layout: {
      'page-title': 'Einstellungen',
      'back-button-label': 'Zurück zur Startseite',
    },
    'user-account': {
      'danger-zone': {
        'blocking-organizations-help':
          'Du musst dich erst selbst entfernen, die Eigentümerschaft übertragen oder die Organisation löschen, bevor du dein Konto löschen kannst.',
        'blocking-organizations_one':
          'Du bist derzeit Eigentümer in dieser Organisation: <1>{{organizations}}</1>.',
        'blocking-organizations_other':
          'Du bist derzeit Eigentümer in diesen Organisationen: <1>{{organizations}}</1>.',
        cancel: 'Abbrechen',
        'delete-button': 'Konto löschen',
        'delete-confirm': 'Dieses Konto löschen',
        'delete-description':
          'Wenn du dein Konto löscht, gibt es kein Zurück. Bitte sei dir sicher.',
        'delete-title': 'Konto löschen',
        deleting: 'Konto wird gelöscht ...',
        'dialog-description':
          'Bist du sicher, dass du dein Konto löschen willst? Diese Aktion kann nicht rückgängig gemacht werden.',
        'dialog-title': 'Konto löschen',
        'implicitly-deleted-organizations_one':
          'Die folgende Organisation wird gelöscht: <1>{{organizations}}</1>',
        'implicitly-deleted-organizations_other':
          'Die folgenden Organisationen werden gelöscht: <1>{{organizations}}</1>',
        title: 'Gefahrenbereich',
      },
      description: 'Verwalte deine Kontoeinstellungen.',
      form: {
        'avatar-alt': 'Avatar',
        'avatar-description': 'Dein Avatar wird überall in der App angezeigt.',
        'avatar-label': 'Avatar',
        'avatar-max-file-size': 'Das Bild darf nicht größer als 1 MB sein.',
        'avatar-must-be-file': 'Der Avatar muss eine Datei sein.',
        'email-description':
          'Deine E-Mail-Adresse wird zur Identifikation verwendet und kann nicht geändert werden.',
        'email-label': 'E-Mail',
        'email-placeholder': 'Deine E-Mail-Adresse ...',
        'name-description':
          'Dein Name wird in allen Organisationen in der App angezeigt.',
        'name-label': 'Name',
        'name-max-length': 'Dein Name darf maximal 128 Zeichen lang sein.',
        'name-min-length': 'Dein Name muss mindestens 2 Zeichen lang sein.',
        'name-must-be-string': 'Dein Name muss ein Text sein.',
        'name-placeholder': 'Dein Name ...',
        save: 'Änderungen speichern',
        saving: 'Änderungen werden gespeichert ...',
        errors: {
          'delete-old-avatar-failed':
            'Alter Avatar konnte nicht gelöscht werden.',
          'upload-failed': 'Avatar konnte nicht hochgeladen werden.',
          'unexpected-error': 'Ein unerwarteter Fehler ist aufgetreten.',
        },
      },
      'page-title': 'Konto',
      toast: {
        'user-account-updated': 'Dein Konto wurde aktualisiert',
        'user-account-deleted': 'Dein Konto wurde gelöscht',
      },
    },
  },
} satisfies typeof en;
