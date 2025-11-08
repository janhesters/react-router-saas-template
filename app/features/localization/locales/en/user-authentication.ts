export default {
  layout: {
    backgroundPathsTitle: "Animated background paths",
    home: "Home",
    quote:
      "This authentication system has transformed how we handle user logins. The magic link flow is seamless and our users love it.",
    quoteAuthor: "Alex Chen, Lead Developer",
  },
  login: {
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    errors: {
      invalidEmail: "Please enter a valid email address.",
    },
    form: {
      joinOrganization: "Log in to join {{organizationName}}",
      joinOrganizationDescription:
        "{{creatorName}} has invited you to join {{organizationName}}.",
      loginFailed: "Login failed. Please try again.",
      userDoesntExist:
        "User with given email doesn't exist. Did you mean to create a new account instead?",
    },
    googleButton: "Continue with Google",
    magicLink: {
      alertDescription: "Remember to check your spam folder.",
      cardDescription:
        "We've sent a secure login link to your email address. Please check your inbox and click the link to access your account.",
      cardTitle: "Check your email",
      countdownMessage_one:
        "Once you click the link, <1>please close this tab</1>. If you haven't received the email within {{count}} second, you may request another link.",
      countdownMessage_other:
        "Once you click the link, <1>please close this tab</1>. If you haven't received the email within {{count}} seconds, you may request another link.",
      countdownMessage_zero:
        "Once you click the link, <1>please close this tab</1>. If you haven't received the email, you may request another login link now.",
      resendButton: "Request new login link",
      resendButtonLoading: "Sending...",
      resendSuccess:
        "A new login link has been sent to your email address. Please check your inbox.",
    },
    pageTitle: "Login",
    separator: "Or",
    signupCta: "Don't have an account? <signup>Sign up</signup>",
    submitButton: "Sign in with Email",
    submitButtonSubmitting: "Signing in...",
    subtitle: "Enter your email below to sign in to your account",
    title: "Welcome back",
  },
  register: {
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    errors: {
      invalidEmail: "Please enter a valid email address.",
    },
    form: {
      joinOrganization: "Register to join {{organizationName}}",
      joinOrganizationDescription:
        "{{creatorName}} has invited you to join {{organizationName}}.",
      registrationFailed: "Registration failed. Please try again.",
      termsAndPrivacy:
        "By creating an account, you agree to our <1>Terms of Service</1> and <2>Privacy Policy</2>.",
      userAlreadyExists:
        "User with given email already exists. Did you mean to log in instead?",
    },
    googleButton: "Continue with Google",
    legal:
      "By clicking continue, you agree to our <tos>Terms of Service</tos> and <pp>Privacy Policy</pp>.",
    loginCta: "Already have an account? <login>Sign in</login>",
    magicLink: {
      alertDescription: "Remember to check your spam folder.",
      cardDescription:
        "We've sent a verification link to your email address. Please check your inbox and click the link to complete your registration.",
      cardTitle: "Verify your email",
      countdownMessage_one:
        "Once you click the link, <1>please close this tab</1>. If you haven't received the email within {{count}} second, you may request another verification link.",
      countdownMessage_other:
        "Once you click the link, <1>please close this tab</1>. If you haven't received the email within {{count}} seconds, you may request another verification link.",
      countdownMessage_zero:
        "Once you click the link, <1>please close this tab</1>. If you haven't received the email, you may request another verification link now.",
      resendButton: "Request new verification link",
      resendButtonLoading: "Sending...",
      resendSuccess:
        "A new verification link has been sent to your email address. Please check your inbox.",
    },
    pageTitle: "Register",
    separator: "Or",
    submitButton: "Create Account",
    submitButtonSubmitting: "Creating account...",
    subtitle: "Enter your email below to create your account",
    title: "Create an account",
  },
};
