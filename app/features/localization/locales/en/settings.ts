export default {
  layout: {
    backButtonLabel: "Back to home",
    pageTitle: "Settings",
  },
  userAccount: {
    dangerZone: {
      blockingOrganizations_one:
        "Your account is currently an owner in this organization: <1>{{organizations}}</1>.",
      blockingOrganizations_other:
        "Your account is currently an owner in these organizations: <1>{{organizations}}</1>.",
      blockingOrganizationsHelp:
        "You must remove yourself, transfer ownership, or delete this organization before you can delete your user.",
      cancel: "Cancel",
      deleteButton: "Delete Account",
      deleteConfirm: "Delete this account",
      deleteDescription:
        "Once you delete your account, there is no going back. Please be certain.",
      deleteTitle: "Delete Account",
      deleting: "Deleting account ...",
      dialogDescription:
        "Are you sure you want to delete your account? This action cannot be undone.",
      dialogTitle: "Delete Account",
      implicitlyDeletedOrganizations_one:
        "The following organization will be deleted: <1>{{organizations}}</1>",
      implicitlyDeletedOrganizations_other:
        "The following organizations will be deleted: <1>{{organizations}}</1>",
      title: "Danger Zone",
    },
    description: "Manage your account settings.",
    errors: {
      avatarTooLarge: "Avatar must be less than 1MB.",
      invalidFileType:
        "Invalid file type. Only PNG, JPG, JPEG, GIF, and WebP images are allowed.",
      nameMax: "Your name must be at most 128 characters long.",
      nameMin: "Your name must be at least 2 characters long.",
    },
    form: {
      avatarDescription: "Your avatar will be shown across the application.",
      avatarFormats: "PNG, JPG, GIF, or WebP (max. 1MB)",
      avatarLabel: "Avatar",
      avatarPreviewAlt: "Avatar preview",
      emailDescription:
        "Your email address is used to identify you and cannot be changed.",
      emailLabel: "Email",
      emailPlaceholder: "Your email address ...",
      nameDescription:
        "Your name will be shown in all organizations across the application.",
      nameLabel: "Name",
      namePlaceholder: "Your name ...",
      save: "Save changes",
      saving: "Saving changes ...",
    },
    pageTitle: "Account",
    toast: {
      userAccountDeleted: "Your account has been deleted",
      userAccountUpdated: "Your account has been updated",
    },
  },
};
