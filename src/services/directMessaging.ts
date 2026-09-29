import { DirectMessage, DirectMessageChannel } from "../types";

export interface MessagingChannelInfo {
  id: DirectMessageChannel;
  name: string;
  description: string;
  status: "active" | "ready_for_credentials" | "maintenance";
  requiresExternalApi: boolean;
  credentialsNeeded?: string[];
  complianceNote?: string;
  supportsRichCards?: boolean;
}

export interface MessagingConfigResponse {
  success: boolean;
  channels: MessagingChannelInfo[];
  securityPolicy: {
    zeroPrivateAccountAccess: boolean;
    statement: string;
    officialApisOnly: boolean;
  };
}

export const DirectMessagingService = {
  async getConfig(): Promise<MessagingConfigResponse> {
    try {
      const res = await fetch("/api/messaging/config");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch {
      return {
        success: true,
        channels: [
          {
            id: "in_app",
            name: "Direct In-App Message (Active)",
            description: "Encrypted, real-time message exchange directly inside the platform.",
            status: "active",
            requiresExternalApi: false,
            supportsRichCards: true,
          },
          {
            id: "whatsapp_cloud_api",
            name: "WhatsApp Cloud API (Meta Official)",
            description: "Official Meta Graph API connector.",
            status: "ready_for_credentials",
            requiresExternalApi: true,
            complianceNote: "No personal accounts accessed without official authorization.",
          },
        ],
        securityPolicy: {
          zeroPrivateAccountAccess: true,
          statement: "VenkateshBhaiya AI Assistant operates under a strict privacy policy. Personal WhatsApp, Instagram, or Google Messages accounts are never accessed without official enterprise APIs.",
          officialApisOnly: true,
        },
      };
    }
  },

  async getDirectMessages(userId: string): Promise<DirectMessage[]> {
    try {
      const res = await fetch(`/api/direct-messages?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.messages || [];
    } catch (err: any) {
      console.warn("getDirectMessages failed:", err?.message);
      return [];
    }
  },

  async sendDirectMessage(opts: {
    userId: string;
    sender?: "user" | "admin" | "assistant";
    senderName?: string;
    message: string;
    channel?: DirectMessageChannel;
  }): Promise<{ success: boolean; message: DirectMessage }> {
    const res = await fetch("/api/direct-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: opts.userId,
        sender: opts.sender || "user",
        senderName: opts.senderName,
        message: opts.message,
        channel: opts.channel || "in_app",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to send message");
    }

    return await res.json();
  },
};
