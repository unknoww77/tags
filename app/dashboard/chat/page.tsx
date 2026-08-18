import { requireTenantAdmin } from "@/lib/auth-helpers";
import { PlatformHeader } from "@/components/PlatformHeader";
import { ChatInbox } from "@/components/ChatInbox";

export default async function DashboardChatPage() {
  await requireTenantAdmin();

  return (
    <div className="platform-shell">
      <PlatformHeader />
      <main className="dashboard">
        <ChatInbox title="Chat / Atendimento" showTenant={false} />
      </main>
    </div>
  );
}
