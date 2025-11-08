export default {
  layout: {
    backButtonLabel: "Zurück zur Startseite",
    pageTitle: "Einstellungen",
  },
  userAccount: {
    dangerZone: {
      blockingOrganizations_one:
        "Dein Konto ist derzeit Eigentümer dieser Organisation: <1>{{organizations}}</1>.",
      blockingOrganizations_other:
        "Dein Konto ist derzeit Eigentümer dieser Organisationen: <1>{{organizations}}</1>.",
      blockingOrganizationsHelp:
        "Du musst dich selbst entfernen, die Eigentümerschaft übertragen oder diese Organisation löschen, bevor du deinen Benutzer löschen kannst.",
      cancel: "Abbrechen",
      deleteButton: "Konto löschen",
      deleteConfirm: "Dieses Konto löschen",
      deleteDescription:
        "Sobald du dein Konto löschst, gibt es kein Zurück mehr. Bitte sei dir sicher.",
      deleteTitle: "Konto löschen",
      deleting: "Konto wird gelöscht ...",
      dialogDescription:
        "Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
      dialogTitle: "Konto löschen",
      implicitlyDeletedOrganizations_one:
        "Die folgende Organisation wird gelöscht: <1>{{organizations}}</1>",
      implicitlyDeletedOrganizations_other:
        "Die folgenden Organisationen werden gelöscht: <1>{{organizations}}</1>",
      title: "Gefahrenzone",
    },
    description: "Verwalte deine Kontoeinstellungen.",
    errors: {
      avatarTooLarge: "Der Avatar muss kleiner als 1 MB sein.",
      invalidFileType:
        "Ungültiger Dateityp. Nur PNG-, JPG-, JPEG-, GIF- und WebP-Bilder sind erlaubt.",
      nameMax: "Dein Name darf höchstens 128 Zeichen lang sein.",
      nameMin: "Dein Name muss mindestens 2 Zeichen lang sein.",
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
    pageTitle: "Konto",
    toast: {
      userAccountDeleted: "Dein Konto wurde gelöscht",
      userAccountUpdated: "Dein Konto wurde aktualisiert",
    },
  },
} satisfies typeof import("../en/settings").default;
