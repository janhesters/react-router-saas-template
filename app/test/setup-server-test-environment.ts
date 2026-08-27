import { config } from "dotenv";

// Load environment variables from .env file.
config();

// Integration tests exercise the provider transport through MSW. Email mock
// mode stays opt-in for tests that need its deterministic result.
process.env.RESEND_API_KEY ??= "re_test_server_only";
process.env.RESEND_FROM_EMAIL ??= "React Router SaaS Test <test@example.com>";
