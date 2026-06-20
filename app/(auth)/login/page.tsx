import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  return <AuthForm mode="login" googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />;
}
