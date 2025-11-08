export default {
  acceptEmailInvite: {
    acceptInvite: "Einladung annehmen",
    acceptInviteInstructions:
      "Klicke auf die Schaltfläche unten, um dich zu registrieren. Mit dieser E-Mail-Einladung trittst du automatisch der richtigen Organisation bei.",
    acceptingInvite: "Einladung wird angenommen ...",
    alreadyMemberToastDescription:
      "Du bist bereits Mitglied von {{organizationName}}",
    alreadyMemberToastTitle: "Bereits Mitglied",
    inviteEmailInvalidToastDescription:
      "Die E-Mail-Einladung ist ungültig oder abgelaufen",
    inviteEmailInvalidToastTitle: "Einladung konnte nicht angenommen werden",
    inviteEmailValidToastDescription:
      "Bitte registriere dich oder melde dich an, um die Einladung anzunehmen.",
    inviteEmailValidToastTitle: "Erfolg",
    inviteYouToJoin:
      "{{inviterName}} lädt dich ein, {{organizationName}} beizutreten",
    joinSuccessToastDescription:
      "Du bist jetzt Mitglied von {{organizationName}}",
    joinSuccessToastTitle: "Organisation erfolgreich beigetreten",
    organizationFullToastDescription:
      "Die Organisation hat ihre Mitgliedergrenze erreicht",
    organizationFullToastTitle: "Organisation ist voll",
    pageTitle: "Einladung",
    welcomeToAppName: "Willkommen bei {{appName}}",
  },
  acceptInviteLink: {
    acceptInvite: "Einladung annehmen",
    acceptInviteInstructions:
      "Klicke auf die Schaltfläche unten, um dich zu registrieren. Mit diesem Link trittst du automatisch der richtigen Organisation bei.",
    acceptingInvite: "Einladung wird angenommen ...",
    alreadyMemberToastDescription:
      "Du bist bereits Mitglied von {{organizationName}}",
    alreadyMemberToastTitle: "Bereits Mitglied",
    inviteLinkInvalidToastDescription:
      "Der Einladungslink ist ungültig oder abgelaufen",
    inviteLinkInvalidToastTitle: "Einladung konnte nicht angenommen werden",
    inviteLinkValidToastDescription:
      "Bitte registriere dich oder melde dich an, um die Einladung anzunehmen",
    inviteLinkValidToastTitle: "Erfolg",
    inviteYouToJoin:
      "{{inviterName}} lädt dich ein, {{organizationName}} beizutreten",
    joinSuccessToastDescription:
      "Du bist jetzt Mitglied von {{organizationName}}",
    joinSuccessToastTitle: "Organisation erfolgreich beigetreten",
    organizationFullToastDescription:
      "Die Organisation hat ihre Mitgliedergrenze erreicht",
    organizationFullToastTitle: "Organisation ist voll",
    pageTitle: "Einladung",
    welcomeToAppName: "Willkommen bei {{appName}}",
  },
  layout: {
    appSidebar: {
      nav: {
        app: {
          analytics: "Analytik",
          dashboard: "Dashboard",
          projects: {
            active: "Aktiv",
            all: "Alle",
            title: "Projekte",
          },
          title: "App",
        },
        settings: {
          getHelp: "Hilfe erhalten",
          organizationSettings: "Organisationseinstellungen",
          title: "Einstellungen",
        },
        sidebar: "Seitenleiste",
      },
    },
    navUser: {
      account: "Konto",
      logOut: "Abmelden",
      userMenuButtonLabel: "Benutzermenü öffnen",
    },
    organizationSwitcher: {
      newOrganization: "Neue Organisation",
      organizations: "Organisationen",
    },
  },
  new: {
    backButtonLabel: "Zurück",
    form: {
      cardDescription:
        "Erzähle uns von deiner Organisation. Du bleibst weiterhin Mitglied deiner aktuellen Organisation und kannst jederzeit zwischen ihnen wechseln.",
      cardTitle: "Neue Organisation erstellen",
      logoInvalid: "Das Logo muss gültig sein.",
      logoLabel: "Logo",
      logoMustBeUrl: "Das Logo muss eine gültige URL sein.",
      nameLabel: "Organisationsname",
      nameMaxLength:
        "Der Organisationsname darf höchstens 255 Zeichen lang sein.",
      nameMinLength:
        "Der Organisationsname muss mindestens 3 Zeichen lang sein.",
      namePlaceholder: "Organisationsname ...",
      nameRequired: "Der Organisationsname ist erforderlich.",
      save: "Speichern",
      saving: "Wird gespeichert ...",
      submitButton: "Organisation erstellen",
      termsAndPrivacy:
        "Durch das Erstellen einer Organisation stimmst du unseren <1>Nutzungsbedingungen</1> und der <2>Datenschutzerklärung</2> zu.",
    },
    pageTitle: "Neue Organisation",
  },
  organizationsList: {
    cardDescription:
      "Dies ist eine Liste aller Organisationen, bei denen du Mitglied bist. Wähle eine aus, um sie zu betreten und ihr Dashboard zu besuchen.",
    cardTitle: "Deine Organisationen",
    pageTitle: "Organisationsliste",
    roles: {
      admin: "Admin",
      member: "Mitglied",
      owner: "Eigentümer",
    },
    title: "Organisationsliste",
  },
  settings: {
    general: {
      dangerZone: {
        cancelButton: "Abbrechen",
        confirmationLabel:
          'Zur Bestätigung gib "{{organizationName}}" in das Feld unten ein',
        confirmationPlaceholder: "Organisationsnamen eingeben...",
        deleteButton: "Diese Organisation löschen",
        deleteButtonSubmitting: "Organisation wird gelöscht...",
        deleteDescription:
          "Sobald sie gelöscht ist, ist sie für immer weg. Bitte sei dir sicher.",
        deleteTitle: "Diese Organisation löschen",
        dialogDescription:
          "Bist du sicher, dass du diese Organisation löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
        dialogTitle: "Organisation löschen",
        errors: {
          confirmationMismatch:
            "Der Bestätigungstext stimmt nicht mit dem Organisationsnamen überein.",
          confirmationRequired:
            "Bitte gib den Organisationsnamen zur Bestätigung ein.",
        },
        title: "Gefahrenzone",
        triggerButton: "Organisation löschen",
      },
      description: "Allgemeine Einstellungen für diese Organisation.",
      errors: {
        invalidFileType:
          "Ungültiger Dateityp. Nur PNG-, JPG-, JPEG-, GIF- und WebP-Bilder sind erlaubt.",
        logoTooLarge: "Das Logo muss kleiner als 1 MB sein.",
        nameMax: "Der Organisationsname darf höchstens 255 Zeichen lang sein.",
        nameMin: "Der Organisationsname muss mindestens 3 Zeichen lang sein.",
      },
      form: {
        logoDescription:
          "Das Logo deiner Organisation wird in der gesamten Anwendung angezeigt.",
        logoFormats: "PNG, JPG, GIF oder WebP (max. 1 MB)",
        logoLabel: "Organisationslogo",
        logoPreviewAlt: "Vorschau des Organisationslogos",
        nameDescription:
          "Der öffentliche Anzeigename deiner Organisation. <bold>Warnung:</bold> Das Ändern des Namens <warning>bricht alle bestehenden Links</warning> zu deiner Organisation.",
        nameLabel: "Organisationsname",
        namePlaceholder: "Organisationsname ...",
        nameWarningContent:
          "Wenn du den Namen deiner Organisation änderst, ändert sich auch der URL-Slug. Das bedeutet, dass alle mit Lesezeichen versehenen Links oder geteilten URLs nicht mehr funktionieren. Stelle sicher, dass du alle Verweise auf die alte URL aktualisierst.",
        save: "Änderungen speichern",
        saving: "Änderungen werden gespeichert ...",
      },
      organizationInfo: {
        logoAlt: "Organisationslogo",
        logoDescription: "Das Logo, das deine Organisation repräsentiert.",
        logoTitle: "Organisationslogo",
        nameDescription:
          "Der Name deiner Organisation, wie er anderen angezeigt wird.",
        nameTitle: "Organisationsname",
      },
      pageTitle: "Allgemein",
      toast: {
        organizationDeleted: "Organisation wurde gelöscht",
        organizationProfileUpdated: "Organisation wurde aktualisiert",
      },
    },
    layout: {
      billing: "Abrechnung",
      general: "Allgemein",
      settingsNav: "Einstellungsnavigation",
      teamMembers: "Teammitglieder",
    },
    teamMembers: {
      description: "Verwalte deine Teammitglieder und ihre Berechtigungen.",
      descriptionMember: "Sieh, wer Mitglied deiner Organisation ist.",
      inviteByEmail: {
        cardDescription:
          "Gib die E-Mail-Adressen deiner Kollegen ein, und wir senden ihnen eine personalisierte Einladung, um deiner Organisation beizutreten. Du kannst auch die Rolle auswählen, mit der sie beitreten werden.",
        cardTitle: "Per E-Mail einladen",
        form: {
          email: "E-Mail",
          emailAlreadyMember: "{{email}} ist bereits Mitglied",
          emailInvalid: "Eine gültige E-Mail besteht aus Zeichen, '@' und '.'.",
          emailPlaceholder: "Die E-Mail deines Kollegen ...",
          emailRequired: "Bitte gib eine gültige E-Mail ein (erforderlich).",
          inviting: "E-Mail-Einladung wird gesendet ...",
          organizationFull:
            "Du hast die maximale Anzahl von Plätzen für dein Abonnement erreicht.",
          role: "Rolle",
          roleAdmin: "Admin",
          roleMember: "Mitglied",
          roleOwner: "Eigentümer",
          rolePlaceholder: "Rolle auswählen ...",
          submitButton: "E-Mail-Einladung senden",
        },
        inviteEmail: {
          buttonText: "{{organizationName}} beitreten",
          callToAction:
            "Tritt jetzt bei, um mit deinen Kollegen zusammenzuarbeiten!",
          description:
            "{{inviterName}} hat dich eingeladen, {{organizationName}} in {{appName}} beizutreten. Diese Einladung läuft in 48 Stunden ab.",
          subject: "{{inviteName}} hat dich zu {{appName}} eingeladen",
          title: "Du wurdest zu {{appName}} eingeladen!",
        },
        organizationFullToastDescription:
          "Du hast alle verfügbaren Plätze aufgebraucht.",
        organizationFullToastTitle: "Organisation ist voll",
        successToastTitle: "E-Mail-Einladung gesendet",
      },
      inviteLink: {
        cardDescription:
          'Nach dem Generieren des Links ist er 48 Stunden lang gültig. Kopiere und teile ihn mit jedem, den du mit der Rolle „Mitglied" einladen möchtest.',
        cardTitle: "Einladungslink teilen",
        copied: "Kopiert!",
        copyInviteLink: "Einladungslink in die Zwischenablage kopieren",
        createNewInviteLink: "Neuen Einladungslink erstellen",
        creating: "Wird erstellt ...",
        deactivateLink: "Link deaktivieren",
        deactivating: "Wird deaktiviert ...",
        goToLink: "Zur Seite des Einladungslinks gehen",
        inviteLinkCopied: "Einladungslink in die Zwischenablage kopiert",
        linkValidUntil: "Dein Link ist gültig bis {{date}}.",
        newLinkDeactivatesOld:
          "Das Generieren eines neuen Links deaktiviert automatisch den alten.",
        regenerateLink: "Link neu generieren",
        regenerating: "Wird neu generiert ...",
      },
      organizationIsFullAlert: {
        button: "Zur Abrechnung gehen",
        description:
          "Wechsle zu einem höheren Tarif oder kontaktiere den Vertrieb, um neue Mitglieder einzuladen.",
        title: "Keine Plätze mehr verfügbar",
      },
      pageTitle: "Teammitglieder",
      table: {
        avatarHeader: "Avatar",
        emailHeader: "E-Mail",
        nameHeader: "Name",
        noResults: "Keine Mitglieder gefunden.",
        pagination: {
          goToFirst: "Zur ersten Seite gehen",
          goToLast: "Zur letzten Seite gehen",
          goToNext: "Zur nächsten Seite gehen",
          goToPrevious: "Zur vorherigen Seite gehen",
          pageInfo: "Seite {{current}} von {{total}}",
          rowsPerPage: "Zeilen pro Seite",
        },
        roleHeader: "Rolle",
        roleSwitcher: {
          admin: "Admin",
          adminDescription:
            "Kann die Organisation bearbeiten und die Abrechnung verwalten.",
          commandLabel: "Neue Rolle auswählen",
          deactivated: "Deaktiviert",
          deactivatedDescription: "Zugriff auf alles widerrufen.",
          member: "Mitglied",
          memberDescription: "Zugriff auf Standardfunktionen.",
          noRolesFound: "Keine Rollen gefunden.",
          owner: "Eigentümer",
          ownerDescription:
            "Kann Rollen zuweisen und die Organisation löschen.",
          rolesPlaceholder: "Neue Rolle auswählen ...",
        },
        status: {
          createdTheOrganization: "Beigetreten",
          emailInvitePending: "Ausstehend",
          joinedViaEmailInvite: "Beigetreten",
          joinedViaLink: "Beigetreten",
        },
        statusHeader: "Status",
      },
    },
  },
} satisfies typeof import("../en/organizations").default;
