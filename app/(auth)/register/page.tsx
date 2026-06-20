import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <AuthForm mode="register" googleEnabled={!!process.env.GOOGLE_CLIENT_ID} />
  );
}
