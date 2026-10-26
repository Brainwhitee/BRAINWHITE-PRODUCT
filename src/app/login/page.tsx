import Link from "next/link";
import { login } from "../actions";
import { ActionForm, inputCls } from "@/components/ActionForm";

export default function Login() {
  return (
    <div className="mx-auto mt-16 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Log in</h1>
      <ActionForm action={login} submit="Log in">
        <input name="email" type="email" placeholder="Email" className={inputCls} required />
        <input name="password" type="password" placeholder="Password" className={inputCls} required />
      </ActionForm>
      <p className="text-sm">
        New organisation? <Link className="text-indigo-700 underline" href="/signup">Sign up</Link>
      </p>
    </div>
  );
}
