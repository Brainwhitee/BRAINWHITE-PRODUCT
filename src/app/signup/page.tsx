import Link from "next/link";
import { signupOrg } from "../actions";
import { ActionForm, inputCls } from "@/components/ActionForm";

export default function Signup() {
  return (
    <div className="mx-auto mt-16 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Create your organisation</h1>
      <ActionForm action={signupOrg} submit="Create workspace">
        <input name="orgName" placeholder="Organisation name" className={inputCls} required />
        <input name="name" placeholder="Your name" className={inputCls} required />
        <input name="email" type="email" placeholder="Work email" className={inputCls} required />
        <input name="password" type="password" placeholder="Password (min 8 chars)" className={inputCls} required />
      </ActionForm>
      <p className="text-sm">
        Already have an account? <Link className="text-indigo-700 underline" href="/login">Log in</Link>
      </p>
    </div>
  );
}
