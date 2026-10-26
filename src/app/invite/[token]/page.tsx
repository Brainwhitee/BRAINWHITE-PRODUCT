import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { acceptInvite } from "../../actions";
import { ActionForm, inputCls } from "@/components/ActionForm";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await db.invitation.findUnique({
    where: { tokenHash: sha256(token) },
    include: { org: true },
  });
  const valid = inv && inv.status === "PENDING" && inv.expiresAt > new Date();

  if (!inv || !valid) {
    return (
      <div className="mx-auto mt-16 max-w-sm space-y-2">
        <h1 className="text-xl font-semibold">Invite unavailable</h1>
        <p className="text-sm text-slate-600">
          This invite link has expired, was revoked or was already used. Ask your manager to resend it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-16 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Join {inv.org.name}</h1>
      <p className="text-sm text-slate-600">
        You were invited as <b>{inv.role.toLowerCase()}</b>. Create your account to continue.
      </p>
      <ActionForm action={acceptInvite.bind(null, token)} submit="Create account">
        <input value={inv.email} readOnly className={inputCls + " bg-slate-100"} />
        <input name="name" placeholder="Your name" className={inputCls} required />
        <input name="password" type="password" placeholder="Password (min 8 chars)" className={inputCls} required />
      </ActionForm>
    </div>
  );
}
