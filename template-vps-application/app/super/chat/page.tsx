import { requireSuperAdmin } from "@/lib/auth-helpers";
import { PlatformHeader } from "@/components/PlatformHeader";
import { ChatInbox } from "@/components/ChatInbox";

export default async function SuperChatPage() {
  await requireSuperAdmin();

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="dashboard">
        <ChatInbox title="Chat global (Super Admin)" showTenant />
      </main>
    </div>
  );
}
