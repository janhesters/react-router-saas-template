export default {
  acceptEmailInvite: {
    acceptInvite: "Accept invite",
    acceptInviteInstructions:
      "Click the button below to sign up. By using this email invite you will automatically join the correct organization.",
    acceptingInvite: "Accepting invite ...",
    alreadyMemberToastDescription:
      "You are already a member of {{organizationName}}",
    alreadyMemberToastTitle: "Already a member",
    inviteEmailInvalidToastDescription:
      "The email invite is invalid or has expired",
    inviteEmailInvalidToastTitle: "Failed to accept invite",
    inviteEmailValidToastDescription:
      "Please register or log in to accept the invitation.",
    inviteEmailValidToastTitle: "Success",
    inviteYouToJoin: "{{inviterName}} invites you to join {{organizationName}}",
    joinSuccessToastDescription: "You are now a member of {{organizationName}}",
    joinSuccessToastTitle: "Successfully joined organization",
    organizationFullToastDescription:
      "The organization has reached its member limit",
    organizationFullToastTitle: "Organization is full",
    pageTitle: "Invitation",
    welcomeToAppName: "Welcome to {{appName}}",
  },
  acceptInviteLink: {
    acceptInvite: "Accept invite",
    acceptInviteInstructions:
      "Click the button below to sign up. By using this link you will automatically join the correct organization.",
    acceptingInvite: "Accepting invite ...",
    alreadyMemberToastDescription:
      "You are already a member of {{organizationName}}",
    alreadyMemberToastTitle: "Already a member",
    inviteLinkInvalidToastDescription:
      "The invite link is invalid or has expired",
    inviteLinkInvalidToastTitle: "Failed to accept invite",
    inviteLinkValidToastDescription:
      "Please register or log in to accept the invitation",
    inviteLinkValidToastTitle: "Success",
    inviteYouToJoin: "{{inviterName}} invites you to join {{organizationName}}",
    joinSuccessToastDescription: "You are now a member of {{organizationName}}",
    joinSuccessToastTitle: "Successfully joined organization",
    organizationFullToastDescription:
      "The organization has reached its member limit",
    organizationFullToastTitle: "Organization is full",
    pageTitle: "Invitation",
    welcomeToAppName: "Welcome to {{appName}}",
  },
  analytics: {
    breadcrumb: "Analytics",
    pageTitle: "Analytics",
  },
  dashboard: {
    breadcrumb: "Dashboard",
    pageTitle: "Dashboard",
  },
  getHelp: {
    breadcrumb: "Get Help",
    pageTitle: "Get Help",
  },
  layout: {
    appSidebar: {
      nav: {
        app: {
          analytics: "Analytics",
          dashboard: "Dashboard",
          projects: {
            active: "Active",
            all: "All",
            title: "Projects",
          },
          title: "App",
        },
        settings: {
          getHelp: "Get Help",
          organizationSettings: "Organization Settings",
          title: "Settings",
        },
        sidebar: "Sidebar",
      },
    },
    navUser: {
      account: "Account",
      logOut: "Log out",
      userMenuButtonLabel: "Open user menu",
    },
    organizationSwitcher: {
      newOrganization: "New organization",
      organizations: "Organizations",
    },
  },
  new: {
    backButtonLabel: "Back",
    form: {
      cardDescription:
        "Tell us about your organization. You'll still remain a member of your current organization, with the ability to switch between them anytime.",
      cardTitle: "Create a new organization",
      logoInvalid: "Logo must be valid.",
      logoLabel: "Logo",
      logoMustBeUrl: "Logo must be a valid URL.",
      nameLabel: "Organization name",
      nameMaxLength: "Organization name must be less than 255 characters long.",
      nameMinLength: "Organization name must be at least 3 characters long.",
      namePlaceholder: "Organization name ...",
      nameRequired: "Organization name is required.",
      save: "Save",
      saving: "Saving ...",
      submitButton: "Create organization",
      termsAndPrivacy:
        "By creating an organization, you agree to our <1>Terms of Service</1> and <2>Privacy Policy</2>.",
    },
    pageTitle: "New organization",
  },
  organizationsList: {
    cardDescription:
      "This is a list of all the organizations you're a member of. Pick one to enter and visit its dashboard.",
    cardTitle: "Your organizations",
    pageTitle: "Organization List",
    roles: {
      admin: "Admin",
      member: "Member",
      owner: "Owner",
    },
    title: "Organization List",
  },
  projects: {
    breadcrumb: "All Projects",
    pageTitle: "All Projects",
  },
  projectsActive: {
    breadcrumb: "Active Projects",
    pageTitle: "Active Projects",
  },
  settings: {
    breadcrumb: "Settings",
    general: {
      breadcrumb: "General",
      dangerZone: {
        cancelButton: "Cancel",
        confirmationLabel:
          'To confirm, type "{{organizationName}}" in the box below',
        confirmationPlaceholder: "Enter organization name...",
        deleteButton: "Delete this organization",
        deleteButtonSubmitting: "Deleting organization...",
        deleteDescription:
          "Once deleted, it will be gone forever. Please be certain.",
        deleteTitle: "Delete this organization",
        dialogDescription:
          "Are you sure you want to delete this organization? This action cannot be undone.",
        dialogTitle: "Delete Organization",
        errors: {
          confirmationMismatch:
            "The confirmation text doesn't match the organization name.",
          confirmationRequired:
            "Please enter the organization name to confirm.",
        },
        title: "Danger Zone",
        triggerButton: "Delete organization",
      },
      description: "General settings for this organization.",
      errors: {
        invalidFileType:
          "Invalid file type. Only PNG, JPG, JPEG, GIF, and WebP images are allowed.",
        logoTooLarge: "Logo must be less than 1MB.",
        nameMax: "Organization name must be at most 255 characters long.",
        nameMin: "Organization name must be at least 3 characters long.",
      },
      form: {
        logoDescription:
          "Your organization's logo will be shown across the application.",
        logoFormats: "PNG, JPG, GIF, or WebP (max. 1MB)",
        logoLabel: "Organization logo",
        logoPreviewAlt: "Organization logo preview",
        nameDescription:
          "Your organization's public display name. <bold>Warning:</bold> Changing the name will <warning>break all existing links</warning> to your organization.",
        nameLabel: "Organization name",
        namePlaceholder: "Organization name ...",
        nameWarningContent:
          "When you change your organization's name, the URL slug will change. This means any bookmarked links or shared URLs will no longer work. Make sure to update any references to the old URL.",
        save: "Save changes",
        saving: "Saving changes ...",
      },
      organizationInfo: {
        logoAlt: "Organization logo",
        logoDescription: "The logo that represents your organization.",
        logoTitle: "Organization Logo",
        nameDescription:
          "The name of your organization as it appears to others.",
        nameTitle: "Organization Name",
      },
      pageTitle: "General",
      toast: {
        organizationDeleted: "Organization has been deleted",
        organizationProfileUpdated: "Organization has been updated",
      },
    },
    layout: {
      billing: "Billing",
      general: "General",
      settingsNav: "Settings navigation",
      teamMembers: "Team Members",
    },
    teamMembers: {
      breadcrumb: "Team Members",
      description: "Manage your team members and their permissions.",
      descriptionMember: "View who is a member of your organization.",
      inviteByEmail: {
        cardDescription:
          "Enter your colleagues' email addresses, and we'll send them a personalized invitation to join your organization. You can also choose the role they'll join with.",
        cardTitle: "Invite by Email",
        form: {
          email: "Email",
          emailAlreadyMember: "{{email}} is already a member",
          emailInvalid: "A valid email consists of characters, '@' and '.'.",
          emailPlaceholder: "Your colleague's email ...",
          emailRequired: "Please enter a valid email (required).",
          inviting: "Sending email invitation ...",
          organizationFull:
            "You have reached the maximum number of seats for your subscription.",
          role: "Role",
          roleAdmin: "Admin",
          roleMember: "Member",
          roleOwner: "Owner",
          rolePlaceholder: "Select a role ...",
          submitButton: "Send email invitation",
        },
        inviteEmail: {
          buttonText: "Join {{organizationName}}",
          callToAction: "Join now to collaborate with your colleagues!",
          description:
            "{{inviterName}} has invited you to join {{organizationName}} in {{appName}}. This invite expires in 48 hours.",
          subject: "{{inviteName}} invited you to {{appName}}",
          title: "You've Been Invited to {{appName}}!",
        },
        organizationFullToastDescription:
          "You've used up all your available seats.",
        organizationFullToastTitle: "Organization is full",
        successToastTitle: "Email invitation sent",
      },
      inviteLink: {
        cardDescription:
          'After generating the link, it will be valid for 48 hours. Copy and share it with anyone you\'d like to join with the role of "Member".',
        cardTitle: "Share an Invite Link",
        copied: "Copied!",
        copyInviteLink: "Copy invite link to clipboard",
        createNewInviteLink: "Create new invite link",
        creating: "Creating ...",
        deactivateLink: "Deactivate link",
        deactivating: "Deactivating ...",
        goToLink: "Go to the invite link's page",
        inviteLinkCopied: "Invite link copied to clipboard",
        linkValidUntil: "Your link is valid until {{date}}.",
        newLinkDeactivatesOld:
          "Generating a new link automatically deactivates the old one.",
        regenerateLink: "Regenerate link",
        regenerating: "Regenerating ...",
      },
      organizationIsFullAlert: {
        button: "Go to billing",
        description:
          "Switch to a higher-tier plan or contact sales to invite new members.",
        title: "No seats remaining",
      },
      pageTitle: "Team Members",
      table: {
        avatarHeader: "Avatar",
        emailHeader: "Email",
        nameHeader: "Name",
        noResults: "No members found.",
        pagination: {
          goToFirst: "Go to first page",
          goToLast: "Go to last page",
          goToNext: "Go to next page",
          goToPrevious: "Go to previous page",
          pageInfo: "Page {{current}} of {{total}}",
          rowsPerPage: "Rows per page",
        },
        roleHeader: "Role",
        roleSwitcher: {
          admin: "Admin",
          adminDescription: "Can edit the organization and manage billing.",
          commandLabel: "Select new role",
          deactivated: "Deactivated",
          deactivatedDescription: "Access revoked to everything.",
          member: "Member",
          memberDescription: "Access to standard features.",
          noRolesFound: "No roles found.",
          owner: "Owner",
          ownerDescription: "Can assign roles and delete the organization.",
          rolesPlaceholder: "Select new role ...",
        },
        status: {
          createdTheOrganization: "Joined",
          emailInvitePending: "Pending",
          joinedViaEmailInvite: "Joined",
          joinedViaLink: "Joined",
        },
        statusHeader: "Status",
      },
    },
  },
};
