"use client";

import { SiThreads } from "react-icons/si";
import SocialPlatformWorkspace from "@/components/SocialPlatformWorkspace";

export default function ThreadsPage() {
    return (
        <SocialPlatformWorkspace
            platform="threads"
            title="Instagram Threads"
            subtitle="Manage Threads accounts and track scheduled, posted, processing, and failed Threads posts."
            route="/threads"
            connectUrl="/api/auth/oauth/threads"
            composeUrl="/publishing?platform=threads"
            icon={SiThreads}
            connectedValues={["threads", "true"]}
            connectedMessage="Threads account connected"
            disconnectedMessage="Threads account disconnected"
            emptyAccountText="Connect Threads to publish or schedule creator-focused updates."
            emptyPostText="Create a post from Publishing and select a Threads account."
            ruleText="This page only manages Threads accounts and Threads posts. Twitter, Mastodon, and WhatsApp stay separate."
            errorMessages={{
                threads_config: "Threads app credentials are missing in .env",
                threads_missing_code: "Threads did not return an authorization code",
                threads_state_mismatch: "Threads authorization state mismatch. Try connecting again.",
                threads_account_in_use: "This Threads account is already connected to another user.",
                threads_callback: "Threads connection failed. Check your Meta app settings and permissions.",
                access_denied: "Threads authorization was cancelled.",
            }}
        />
    );
}
