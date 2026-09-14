export default {
  layout: {
    backButtonLabel: "Zurück zur Startseite",
    pageTitle: "Einstellungen",
  },
  userAccount: {
    dangerZone: {
      blockingOrganizations_one:
        "Du bist der letzte aktive Eigentümer dieser Organisation: <1>{{organizations}}</1>.",
      blockingOrganizations_other:
        "Du bist der letzte aktive Eigentümer dieser Organisationen: <1>{{organizations}}</1>.",
      blockingOrganizationsHelp:
        "Übertrage die Eigentümerschaft auf ein anderes Mitglied oder lösche die Organisation, bevor du dein Konto löschst.",
      cancel: "Abbrechen",
      cleanupDescription:
        "Du verlierst sofort den Zugriff. Deine Mitgliedschaften werden entfernt. Organisationen mit anderen Mitgliedern bleiben erhalten. Deine Anmeldedaten werden gelöscht und gespeicherte Bilder bereinigt. Ist ein Dienst nicht erreichbar, wird die Bereinigung erneut versucht.",
      confirmationLabel: 'Gib zur Bestätigung unten "{{email}}" ein',
      confirmationPlaceholder: "Deine E-Mail-Adresse ...",
      deleteButton: "Konto löschen",
      deleteConfirm: "Dieses Konto löschen",
      deleteDescription:
        "Sobald du dein Konto löschst, gibt es kein Zurück mehr. Bitte sei dir sicher.",
      deleteTitle: "Konto löschen",
      deleting: "Konto wird gelöscht ...",
      dialogDescription:
        "Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
      dialogTitle: "Konto löschen",
      errors: {
        confirmationMismatch:
          "Der Bestätigungstext stimmt nicht mit deiner E-Mail-Adresse überein.",
        confirmationRequired:
          "Gib deine E-Mail-Adresse ein, um die Löschung zu bestätigen.",
        ownershipRequired:
          "Übertrage die Eigentümerschaft von Organisationen mit anderen Mitgliedern, bevor du dein Konto löschst.",
        startFailed:
          "Die Kontolöschung konnte nicht gestartet werden. Bitte versuche es erneut.",
      },
      implicitlyDeletedOrganizations_one:
        "Die folgende Organisation wird gelöscht: <1>{{organizations}}</1>. Ihre Abonnements werden gekündigt.",
      implicitlyDeletedOrganizations_other:
        "Die folgenden Organisationen werden gelöscht: <1>{{organizations}}</1>. Ihre Abonnements werden gekündigt.",
      title: "Gefahrenzone",
    },
    deletionStatus: {
      completed: {
        description:
          "Dein Konto wurde gelöscht. Die Bereinigung ist abgeschlossen, einschließlich der zusammen mit deinem Konto gelöschten Organisationen.",
        title: "Dein Konto wurde gelöscht",
      },
      continueButton: "Zurück zur Startseite",
      pageTitle: "Kontolöschung",
      pending: {
        description:
          "Dein Kontozugriff wurde entfernt. Wir schließen die Bereinigung deiner Anmeldedaten und Dateien sowie aller zusammen mit deinem Konto gelöschten Organisationen ab. Du kannst diese Seite verlassen, während die Bereinigung weiterläuft.",
        title: "Kontobereinigung läuft",
      },
      retryButton: "Bereinigung erneut versuchen",
      retrying: {
        description:
          "Ein Dienst ist vorübergehend nicht erreichbar. Dein Kontozugriff bleibt entfernt und die Bereinigung wird automatisch erneut versucht. Du kannst sie auch jetzt erneut starten.",
        title: "Kontobereinigung wird erneut versucht",
      },
      retryingButton: "Bereinigung wird erneut versucht ...",
    },
    description: "Verwalte deine Kontoeinstellungen.",
    errors: {
      avatarTooLarge: "Der Avatar muss kleiner als 1 MB sein.",
      imageConflict:
        "Dein Avatar wurde während des Uploads geändert. Lade die Seite neu und versuche es erneut.",
      invalidFileType:
        "Ungültiger Dateityp. Nur PNG-, JPG-, JPEG-, GIF- und WebP-Bilder sind erlaubt.",
      nameMax: "Dein Name darf höchstens 128 Zeichen lang sein.",
      nameMin: "Dein Name muss mindestens 2 Zeichen lang sein.",
      saveFailed:
        "Wir konnten nicht bestätigen, dass deine Änderungen gespeichert wurden. Lade die Seite neu, bevor du es erneut versuchst.",
      uploadFailed:
        "Dein Avatar konnte nicht hochgeladen werden. Bitte versuche es erneut.",
    },
    form: {
      avatarDescription:
        "Dein Avatar wird in der gesamten Anwendung angezeigt.",
      avatarFormats: "PNG, JPG, GIF oder WebP (max. 1 MB)",
      avatarLabel: "Avatar",
      avatarPreviewAlt: "Avatar-Vorschau",
      emailDescription:
        "Deine E-Mail-Adresse wird verwendet, um dich zu identifizieren und kann nicht geändert werden.",
      emailLabel: "E-Mail",
      emailPlaceholder: "Deine E-Mail-Adresse ...",
      nameDescription:
        "Dein Name wird in allen Organisationen in der gesamten Anwendung angezeigt.",
      nameLabel: "Name",
      namePlaceholder: "Dein Name ...",
      save: "Änderungen speichern",
      saving: "Änderungen werden gespeichert ...",
    },
    organizationDeletions: {
      description:
        "Prüfe den Fortschritt der Bereinigung deiner gelöschten Organisationen.",
      title: "Gelöschte Organisationen",
    },
    pageTitle: "Konto",
    toast: {
      userAccountDeleted: "Dein Konto wurde gelöscht",
      userAccountUpdated: "Dein Konto wurde aktualisiert",
    },
  },
} satisfies typeof import("../en/settings").default;
