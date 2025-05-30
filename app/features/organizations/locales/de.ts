import type en from './en';

export default {
  'accept-email-invite': {
    'accept-invite': 'Einladung annehmen',
    'accept-invite-instructions':
      'Klicke auf den Button unten, um dich anzumelden. Durch diese E-Mail-Einladung trittst du automatisch der richtigen Organisation bei.',
    'accepting-invite': 'Einladung wird angenommen ...',
    'already-member-toast-description':
      'Du bist bereits Mitglied bei {{organizationName}}',
    'already-member-toast-title': 'Bereits Mitglied',
    'invite-email-invalid-toast-description':
      'Die E-Mail-Einladung ist ungültig oder abgelaufen',
    'invite-email-invalid-toast-title': 'Annahme fehlgeschlagen',
    'invite-email-valid-toast-description':
      'Bitte registriere dich oder melde dich an, um die Einladung anzunehmen.',
    'invite-email-valid-toast-title': 'Erfolgreich',
    'invite-you-to-join':
      '{{inviterName}} lädt dich ein, {{organizationName}} beizutreten',
    'join-success-toast-description':
      'Du bist jetzt Mitglied bei {{organizationName}}',
    'join-success-toast-title': 'Organisation erfolgreich beigetreten',
    'organization-full-toast-description':
      'Die Organisation hat ihre maximale Mitgliederzahl erreicht',
    'organization-full-toast-title': 'Organisation ist voll',
    'page-title': 'Einladung',
    'welcome-to-app-name': 'Willkommen bei {{appName}}',
  },
  'accept-invite-link': {
    'accept-invite': 'Einladung annehmen',
    'accept-invite-instructions':
      'Klicke auf den Button unten, um dich anzumelden. Durch diesen Link trittst du automatisch der richtigen Organisation bei.',
    'accepting-invite': 'Einladung wird angenommen ...',
    'already-member-toast-description':
      'Du bist bereits Mitglied bei {{organizationName}}',
    'already-member-toast-title': 'Bereits Mitglied',
    'invite-link-invalid-toast-description':
      'Der Einladungslink ist ungültig oder abgelaufen',
    'invite-link-invalid-toast-title': 'Annahme fehlgeschlagen',
    'invite-link-valid-toast-description':
      'Bitte registriere dich oder melde dich an, um die Einladung anzunehmen.',
    'invite-link-valid-toast-title': 'Erfolgreich',
    'invite-you-to-join':
      '{{inviterName}} lädt dich ein, {{organizationName}} beizutreten',
    'join-success-toast-description':
      'Du bist jetzt Mitglied bei {{organizationName}}',
    'join-success-toast-title': 'Organisation erfolgreich beigetreten',
    'organization-full-toast-description':
      'Die Organisation hat ihre maximale Mitgliederzahl erreicht',
    'organization-full-toast-title': 'Organisation ist voll',
    'page-title': 'Einladung',
    'welcome-to-app-name': 'Willkommen bei {{appName}}',
  },
  layout: {
    'app-sidebar': {
      nav: {
        app: {
          analytics: 'Analysen',
          dashboard: 'Dashboard',
          projects: {
            active: 'Aktiv',
            all: 'Alle',
            title: 'Projekte',
          },
          title: 'App',
        },
        settings: {
          'get-help': 'Hilfe erhalten',
          'organization-settings': 'Organisationseinstellungen',
          title: 'Einstellungen',
        },
        sidebar: 'Seitenleiste',
      },
    },
    'nav-user': {
      account: 'Konto',
      'log-out': 'Abmelden',
      'user-menu-button-label': 'Benutzermenü öffnen',
    },
    'organization-switcher': {
      'new-organization': 'Neue Organisation',
      organizations: 'Organisationen',
    },
  },
  new: {
    'back-button-label': 'Zurück',
    form: {
      'card-description':
        'Erzähl uns von deiner Organisation. Du bleibst weiterhin Mitglied deiner aktuellen Organisation und kannst jederzeit zwischen ihnen wechseln.',
      'card-title': 'Neue Organisation erstellen',
      'logo-label': 'Logo',
      'logo-must-be-string': 'Logo muss eine Zeichenkette sein.',
      'logo-must-be-url': 'Logo muss eine gültige URL sein.',
      'name-label': 'Organisationsname',
      'name-max-length':
        'Organisationsname darf maximal 255 Zeichen lang sein.',
      'name-min-length':
        'Organisationsname muss mindestens 3 Zeichen lang sein.',
      'name-must-be-string': 'Organisationsname muss eine Zeichenkette sein.',
      'name-placeholder': 'Organisationsname ...',
      'name-required': 'Organisationsname ist erforderlich.',
      save: 'Speichern',
      saving: 'Wird gespeichert ...',
      'submit-button': 'Organisation erstellen',
      'terms-and-privacy':
        'Indem du eine Organisation erstellst, stimmst du unseren <1>Nutzungsbedingungen</1> und <2>Datenschutzrichtlinien</2> zu.',
    },
    'page-title': 'Neue Organisation',
  },
  'organizations-list': {
    'card-description':
      'Dies ist eine Liste aller Organisationen, bei denen du Mitglied bist. Wähle eine aus, um sie zu betreten und ihr Dashboard zu besuchen.',
    'card-title': 'Deine Organisationen',
    'page-title': 'Organisationsliste',
    roles: {
      admin: 'Admin',
      member: 'Mitglied',
      owner: 'Inhaber',
    },
    title: 'Organisationsliste',
  },
  settings: {
    general: {
      'danger-zone': {
        cancel: 'Abbrechen',
        'delete-button': 'Organisation löschen',
        'delete-description':
          'Einmal gelöscht, ist sie für immer weg. Bitte sei dir sicher.',
        'delete-this-organization': 'Diese Organisation löschen',
        'delete-title': 'Diese Organisation löschen',
        deleting: 'Organisation wird gelöscht...',
        'dialog-confirmation-label':
          'Zur Bestätigung gib "{{organizationName}}" in das Feld unten ein',
        'dialog-confirmation-placeholder': 'Organisationsnamen eingeben...',
        'dialog-description':
          'Bist du sicher, dass du diese Organisation löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
        'dialog-title': 'Organisation löschen',
        title: 'Gefahrenzone',
      },
      description: 'Allgemeine Einstellungen für diese Organisation.',
      form: {
        errors: {
          'delete-old-logo-failed': 'Altes Logo konnte nicht gelöscht werden.',
          'unexpected-error': 'Ein unerwarteter Fehler ist aufgetreten.',
          'upload-failed': 'Logo-Upload fehlgeschlagen.',
        },
        'logo-alt': 'Organisationslogo',
        'logo-description':
          'Das Logo deiner Organisation wird in der gesamten Anwendung angezeigt.',
        'logo-invalid-mime-type':
          'Ungültiger Dateityp. Erlaubte Dateitypen sind JPG, PNG und JPEG.',
        'logo-label': 'Organisationslogo',
        'logo-must-be-url': 'Logo muss eine gültige URL sein.',
        'name-description':
          'Der öffentliche Anzeigename deiner Organisation. <1>Achtung:</1> Änderst du den Namen, funktionieren bestehende Links zu deiner Organisation nicht mehr.',
        'name-label': 'Organisationsname',
        'name-max-length':
          'Organisationsname darf maximal 255 Zeichen lang sein.',
        'name-min-length':
          'Organisationsname muss mindestens 3 Zeichen lang sein.',
        'name-must-be-string': 'Organisationsname muss eine Zeichenkette sein.',
        'name-placeholder': 'Organisationsname ...',
        save: 'Änderungen speichern',
        saving: 'Änderungen werden gespeichert ...',
      },
      'page-title': 'Allgemein',
      toast: {
        'organization-deleted': 'Organisation wurde gelöscht',
        'organization-profile-updated': 'Organisation wurde aktualisiert',
      },
    },
    layout: {
      billing: 'Abrechnung',
      general: 'Allgemein',
      'settings-nav': 'Einstellungsnavigation',
      'team-members': 'Teammitglieder',
    },
    'team-members': {
      description: 'Verwalte deine Teammitglieder und deren Berechtigungen.',
      'description-member':
        'Sieh dir an, wer Mitglied deiner Organisation ist.',
      'invite-by-email': {
        'card-description':
          'Gib die E-Mail-Adressen deiner Kollegen ein, und wir senden ihnen eine personalisierte Einladung, deiner Organisation beizutreten. Du kannst auch die Rolle auswählen, mit der sie beitreten.',
        'card-title': 'Per E-Mail einladen',
        form: {
          email: 'E-Mail',
          'email-already-member': '{{email}} ist bereits Mitglied',
          'email-invalid':
            "Eine gültige E-Mail besteht aus Zeichen, '@' und '.'.",
          'email-must-be-string':
            'Eine gültige E-Mail-Adresse muss eine Zeichenkette sein.',
          'email-placeholder': 'E-Mail deines Kollegen ...',
          'email-required':
            'Bitte gib eine gültige E-Mail-Adresse ein (erforderlich).',
          inviting: 'E-Mail-Einladung wird gesendet ...',
          'organization-full':
            'Du hast die maximale Anzahl an Plätzen für dein Abonnement erreicht.',
          role: 'Rolle',
          'role-admin': 'Admin',
          'role-member': 'Mitglied',
          'role-owner': 'Inhaber',
          'role-placeholder': 'Wähle eine Rolle aus ...',
          'submit-button': 'E-Mail-Einladung senden',
        },
        'invite-email': {
          'button-text': '{{organizationName}} beitreten',
          'call-to-action':
            'Tritt jetzt bei, um mit deinen Kollegen zusammenzuarbeiten!',
          description:
            '{{inviterName}} hat dich eingeladen, {{organizationName}} in {{appName}} beizutreten. Diese Einladung läuft in 48 Stunden ab.',
          subject: '{{inviteName}} hat dich zu {{appName}} eingeladen',
          title: 'Du wurdest zu {{appName}} eingeladen!',
        },
        'organization-full-toast-description':
          'Du hast alle verfügbaren Plätze aufgebraucht.',
        'organization-full-toast-title': 'Organisation ist voll',
        'success-toast-title': 'E-Mail-Einladung gesendet',
      },
      'invite-link': {
        'card-description':
          'Nachdem der Link generiert wurde, ist er 48 Stunden lang gültig. Kopiere ihn und teile ihn mit jedem, den du mit der Rolle "Mitglied" einladen möchtest.',
        'card-title': 'Einen Einladungslink teilen',
        copied: 'Kopiert!',
        'copy-invite-link': 'Einladungslink in die Zwischenablage kopieren',
        'create-new-invite-link': 'Neuen Einladungslink erstellen',
        creating: 'Wird erstellt ...',
        'deactivate-link': 'Link deaktivieren',
        deactivating: 'Wird deaktiviert ...',
        'go-to-link': 'Zur Seite des Einladungslinks gehen',
        'invite-link-copied': 'Einladungslink in die Zwischenablage kopiert',
        'link-valid-until': 'Dein Link ist gültig bis {{date}}.',
        'new-link-deactivates-old':
          'Das Generieren eines neuen Links deaktiviert automatisch den alten.',
        'regenerate-link': 'Link neu generieren',
        regenerating: 'Wird neu generiert ...',
      },
      'organization-is-full-alert': {
        button: 'Zur Abrechnung',
        description:
          'Wechsle zu einem höheren Plan oder kontaktiere unser Sales Team, um neue Mitglieder einzuladen.',
        title: 'Keine Plätze mehr frei',
      },
      'page-title': 'Teammitglieder',
      table: {
        'avatar-header': 'Avatar',
        'email-header': 'E-Mail',
        'name-header': 'Name',
        'no-results': 'Keine Mitglieder gefunden.',
        pagination: {
          'go-to-first': 'Zur ersten Seite',
          'go-to-last': 'Zur letzten Seite',
          'go-to-next': 'Zur nächsten Seite',
          'go-to-previous': 'Zur vorherigen Seite',
          'page-info': 'Seite {{current}} von {{total}}',
          'rows-per-page': 'Zeilen pro Seite',
        },
        'role-header': 'Rolle',
        'role-switcher': {
          admin: 'Admin',
          'admin-description':
            'Kann die Organisation bearbeiten und die Abrechnung verwalten.',
          'command-label': 'Neue Rolle auswählen',
          deactivated: 'Deaktiviert',
          'deactivated-description': 'Zugriff auf alles widerrufen.',
          member: 'Mitglied',
          'member-description': 'Zugriff auf Standardfunktionen.',
          'no-roles-found': 'Keine Rollen gefunden.',
          owner: 'Inhaber',
          'owner-description':
            'Kann Rollen zuweisen und die Organisation löschen.',
          'roles-placeholder': 'Neue Rolle auswählen ...',
        },
        status: {
          createdTheOrganization: 'Beigetreten',
          emailInvitePending: 'Ausstehend',
          joinedViaEmailInvite: 'Beigetreten',
          joinedViaLink: 'Beigetreten',
        },
        'status-header': 'Status',
      },
    },
  },
} satisfies typeof en;
