/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: It's a currency */
export default {
  billingPage: {
    breadcrumb: "Billing",
    cancelAtPeriodEndBanner: {
      button: "Resume subscription",
      description: "Your subscription runs out on {{date}}.",
      resumeSuccessTitle: "Subscription resumed",
      resumingSubscription: "Resuming subscription ...",
      title: "Your subscription is ending soon.",
    },
    cancelSubscriptionModal: {
      cancellingSubscription: "Cancelling subscription ...",
      changePlan: "Select a different plan",
      confirm: "Cancel subscription",
      description:
        "Canceling your subscription means you will lose access to your benefits at the end of your billing cycle.",
      features: [
        "SSO",
        "Unlimited members",
        "Unlimited private projects",
        "Priority support",
      ],
      title: "Are you sure you want to cancel your subscription?",
    },
    freeTrialBanner: {
      button: "Add payment information",
      description: "Your free trial will end on {{date}}.",
      modal: {
        description: "Pick a plan that fits your needs.",
        title: "Choose your plan",
      },
      title: "Your organization is currently on a free trial.",
    },
    openingCustomerPortal: "Opening customer portal ...",
    pageDescription: "Manage your billing information.",
    pageTitle: "Billing",
    paymentInformation: {
      billingEmail: "Billing Email",
      editButton: "Edit",
      heading: "Payment Information",
    },
    pendingDowngradeBanner: {
      button: "Keep current subscription",
      description:
        "Your subscription will downgrade to the {{planName}} ({{billingInterval}}) plan on {{date}}.",
      intervals: {
        annual: "annual",
        monthly: "monthly",
      },
      loadingButton: "Updating subscription ...",
      successTitle: "Current subscription kept",
      title: "Downgrade scheduled",
    },
    planInformation: {
      amountFormat: "${{amount}}",
      currentPlan: "Current Plan",
      heading: "Your Plan",
      managePlan: "Manage plan",
      manageUsers: "Manage users",
      nextBillingDate: "Next Billing Date",
      projectedTotal: "Projected Total",
      rateFormatAnnual: "${{amount}} <1>per user billed annually</1>",
      rateFormatMonthly: "${{amount}} <1>per user billed monthly</1>",
      users: "Users",
      usersFormat: "{{current}} / {{max}}",
      viewInvoices: "View invoices",
    },
    pricingModal: {
      addingPaymentInformation: "Adding payment information ...",
      addPaymentInformation: "Add payment information",
      cancelSubscriptionBanner: {
        button: "Cancel subscription",
        description:
          "After cancelling your subscription, you will be able to use your account until the end of the current billing period.",
        title: "Cancel subscription",
      },
      currentPlan: "Current Plan",
      description: "Pick a plan that fits your needs.",
      downgradeButton: "Downgrade",
      downgrading: "Downgrading ...",
      switchToAnnualButton: "Switch to annual",
      switchToMonthlyButton: "Switch to monthly",
      title: "Manage plan",
      upgradeButton: "Upgrade",
      upgrading: "Upgrading ...",
    },
    subscriptionCancelledBanner: {
      button: "Reactivate subscription",
      description: "Your subscription has been cancelled.",
      modal: {
        description: "Pick a plan that fits your needs.",
        title: "Choose your plan to reactivate your subscription",
      },
      title: "Your subscription is inactive.",
    },
    updateBillingEmailModal: {
      description: "Your invoices will be sent to this email address.",
      emailInvalid: "A valid email consists of characters, '@' and '.'.",
      emailLabel: "Email",
      emailPlaceholder: "billing@company.com",
      emailRequired: "Please enter a valid email (required).",
      savingChanges: "Saving changes ...",
      submitButton: "Save changes",
      successTitle: "Billing email updated",
      title: "Edit your billing email",
    },
  },
  billingSidebarCard: {
    activeTrial: {
      button: "Add payment information",
      description: "Trial ends on {{date}}.",
      title: "Business Plan (Trial)",
    },
    billingModal: {
      description: "Pick a plan that fits your needs.",
      title: "Choose your plan",
    },
    subscriptionInactive: {
      button: "Choose plan",
      description: "Renew to keep using the app.",
      modal: {
        description: "Pick a plan that fits your needs.",
        title: "Choose your plan to reactivate your subscription",
      },
      title: "Subscription inactive",
    },
    trialEnded: {
      button: "Resume subscription",
      description: "Trial ended on {{date}}.",
      title: "Business Plan (Trial)",
    },
  },
  billingSuccessPage: {
    goToDashboard: "Go to your dashboard",
    pageTitle: "Successfully subscribed!",
    paymentSuccessful: "Payment successful",
    productReady:
      "Your SaaS product is ready and eager to help you maximize the usage of your time and serve your customers. Say goodbye to tedious set up and hello to just building.",
    thankYou:
      "Thank you for trusting React Router SaaS Template. Your successful journey towards building and maintaining a SaaS product starts now!",
  },
  contactSales: {
    company: "Company",
    companyNameLabel: "Company",
    companyNamePlaceholder: "Company name",
    companyNameRequired: "Please enter your company name (required).",
    companyNameTooLong: "Your company name must not exceed 255 characters.",
    companyPlaceholder: "Company name",
    contactSalesDescription:
      "We'll discuss your requirements, demo the product, and set up the right plan and pricing for you.",
    contactSalesTitle: "Talk to our sales team about your needs.",
    enterpriseSales: "Enterprise sales",
    firstNameLabel: "First name",
    firstNamePlaceholder: "First name",
    firstNameRequired: "Please enter your first name (required).",
    firstNameTooLong: "Your first name must not exceed 255 characters.",
    lastNameLabel: "Last name",
    lastNamePlaceholder: "Last name",
    lastNameRequired: "Please enter your last name (required).",
    lastNameTooLong: "Your last name must not exceed 255 characters.",
    messageLabel: "Message",
    messagePlaceholder: "Describe your project, needs and timeline.",
    messageRequired: "Please enter a message describing your needs (required).",
    messageTooLong: "Your message must not exceed 5000 characters.",
    pageTitle: "Contact Sales",
    phoneNumberLabel: "Phone number",
    phoneNumberPlaceholder: "Where do you want us to call you?",
    phoneNumberRequired: "Please enter your phone number (required).",
    submitButton: "Contact sales",
    submitButtonLoading: "Contacting sales ...",
    submitDisclaimer:
      "By submitting this form, I agree to be contacted by the sales team.",
    success: "Success!",
    thankYou: "Thank you for contacting us. We will get back to you shortly.",
    workEmailInvalid: "Please enter a valid work email, including '@' and '.'.",
    workEmailLabel: "Work email",
    workEmailPlaceholder: "name@company.com",
    workEmailRequired: "Please enter your work email (required).",
    workEmailTooLong: "Your work email must not exceed 255 characters.",
  },
  noCurrentPlanModal: {
    annual: "Annual",
    disabledPlansAlert: {
      descriptionPlural:
        "You currently have {{currentSeats}} users, and the {{plan1Title}} plan only supports {{plan1Capacity}} user while the {{plan2Title}} plan only supports {{plan2Capacity}} users. Please choose a plan that supports at least {{currentSeats}} seats.",
      descriptionSingular:
        "You currently have {{currentSeats}} users, and the {{planTitle}} plan only supports {{planCapacity}} user. Please choose a plan that supports at least {{currentSeats}} seats.",
      title: "Why are some plans disabled?",
    },
    monthly: "Monthly",
    tierCardBusy: "Subscribing ...",
    tierCardCta: "Subscribe Now",
  },
  pricing: {
    annual: "Annual",
    custom: "Custom",
    free: "Free",
    monthly: "Monthly",
    mostPopular: "Most Popular",
    plans: {
      enterprise: {
        cta: "Contact Sales",
        description: "For large organizations who need custom solutions.",
        features: [
          "Custom Integrations",
          "Unlimited members",
          "Dedicated support",
        ],
        featuresTitle: "All Business features, plus:",
        title: "Enterprise",
      },
      high: {
        cta: "Start a 14-day free trial",
        description: "For professionals and businesses who want to grow.",
        features: ["SSO", "Up to 25 members", "Priority support"],
        featuresTitle: "Everything in Startup, plus:",
        title: "Business",
      },
      low: {
        cta: "Get Started",
        description:
          "For hobbyists and beginners who are learning and exploring.",
        features: [
          "Unlimited public projects",
          "Community support",
          "1 member",
        ],
        featuresTitle: "Features:",
        title: "Hobby",
      },
      mid: {
        cta: "Start a 14-day free trial",
        description:
          "Perfect for startups with small teams that need to scale.",
        features: [
          "Unlimited private projects",
          "Remove branding",
          "Up to 5 members",
        ],
        featuresTitle: "Everything in Hobby, plus:",
        title: "Startup",
      },
    },
    price: "{{price}} <1>/user per month</1>",
    saveAnnually: "Save up to 20% on the annual plan.",
  },
  pricingPage: {
    pageDescription:
      "Obviously this template is free. But this is what your pricing could look like.",
    pageTitle: "Pricing",
    pricingHeading: "Choose your plan",
  },
};
