"use client";

import { SiMastodon } from "react-icons/si";
import SocialPlatformWorkspace from "@/components/SocialPlatformWorkspace";

export default function MastodonPage() {
    return (
        <SocialPlatformWorkspace
            platform="mastodon"
            title="Mastodon"
            subtitle="Manage Mastodon accounts and track scheduled, posted, processing, and failed Mastodon posts."
            route="/mastodon"
            connectUrl="/api/auth/oauth/mastodon"
            composeUrl="/publishing?platform=mastodon"
            icon={SiMastodon}
            connectedValues={["true"]}
            connectedMessage="Mastodon account connected"
            disconnectedMessage="Mastodon account disconnected"
            emptyAccountText="Connect Mastodon to publish or schedule federated posts."
            emptyPostText="Create a post from Publishing and select a Mastodon account."
            ruleText="This page only manages Mastodon accounts and Mastodon posts. Twitter, Threads, and WhatsApp stay separate."
            errorMessages={{
                missing_code: "Mastodon did not return an authorization code.",
                missing_instance: "MASTODON_INSTANCE is missing in .env.",
                token_exchange_failed:
                    "Mastodon token exchange failed. Check client ID, client secret, instance URL, and callback URL.",
                profile_fetch_failed: "Mastodon profile fetch failed.",
                account_in_use: "This Mastodon account is already connected to another user.",
                mastodon_callback_failed: "Mastodon connection failed. Check your Mastodon app settings.",
                access_denied: "Mastodon authorization was cancelled.",
            }}
        />
    );
}
