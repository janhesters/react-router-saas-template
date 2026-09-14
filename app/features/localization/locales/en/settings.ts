export default {
  layout: {
    backButtonLabel: "Back to home",
    pageTitle: "Settings",
  },
  userAccount: {
    dangerZone: {
      blockingOrganizations_one:
        "You are the last active owner of this organization: <1>{{organizations}}</1>.",
      blockingOrganizations_other:
        "You are the last active owner of these organizations: <1>{{organizations}}</1>.",
      blockingOrganizationsHelp:
        "Transfer ownership to another member or delete the organization before deleting your account.",
      cancel: "Cancel",
      cleanupDescription:
        "You will lose access immediately. Your memberships will be removed, and organizations with other members will be preserved. Your sign-in credentials will be deleted, and stored images will be cleaned up. Cleanup retries automatically if a service is unavailable.",
      confirmationLabel: 'To confirm, type "{{email}}" below',
      confirmationPlaceholder: "Your email address ...",
      deleteButton: "Delete Account",
      deleteConfirm: "Delete this account",
      deleteDescription:
        "Once you delete your account, there is no going back. Please be certain.",
      deleteTitle: "Delete Account",
      deleting: "Deleting account ...",
      dialogDescription:
        "Are you sure you want to delete your account? This action cannot be undone.",
      dialogTitle: "Delete Account",
      errors: {
        confirmationMismatch:
          "The confirmation text doesn't match your email address.",
        confirmationRequired: "Enter your email address to confirm deletion.",
        ownershipRequired:
          "Transfer ownership of organizations with other members before deleting your account.",
        startFailed: "Account deletion could not start. Please try again.",
      },
      implicitlyDeletedOrganizations_one:
        "The following organization will be deleted: <1>{{organizations}}</1>. Its subscriptions will be canceled.",
      implicitlyDeletedOrganizations_other:
        "The following organizations will be deleted: <1>{{organizations}}</1>. Their subscriptions will be canceled.",
      title: "Danger Zone",
    },
    deletionStatus: {
      completed: {
        description:
          "Your account has been deleted. Cleanup is complete, including organizations deleted with your account.",
        title: "Your account has been deleted",
      },
      continueButton: "Back to home",
      pageTitle: "Account deletion",
      pending: {
        description:
          "Your account access has been removed. We are completing sign-in and file cleanup, including any organizations deleted with your account. You can leave this page while cleanup continues.",
        title: "Account cleanup in progress",
      },
      retryButton: "Retry cleanup",
      retrying: {
        description:
          "A service is temporarily unavailable. Your account access remains removed, and cleanup will retry automatically. You can also retry now.",
        title: "Account cleanup will retry",
      },
      retryingButton: "Retrying cleanup ...",
    },
    description: "Manage your account settings.",
    errors: {
      avatarTooLarge: "Avatar must be less than 1MB.",
      imageConflict:
        "Your avatar changed during this upload. Refresh the page and try again.",
      invalidFileType:
        "Invalid file type. Only PNG, JPG, JPEG, GIF, and WebP images are allowed.",
      nameMax: "Your name must be at most 128 characters long.",
      nameMin: "Your name must be at least 2 characters long.",
      saveFailed:
        "We couldn't confirm your changes were saved. Refresh the page before trying again.",
      uploadFailed: "Your avatar couldn't be uploaded. Please try again.",
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
    organizationDeletions: {
      description: "View cleanup progress for organizations you deleted.",
      title: "Organization deletions",
    },
    pageTitle: "Account",
    toast: {
      userAccountDeleted: "Your account has been deleted",
      userAccountUpdated: "Your account has been updated",
    },
  },
};
