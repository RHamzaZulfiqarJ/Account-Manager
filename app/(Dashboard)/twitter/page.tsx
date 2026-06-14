"use client";

import { BsTwitterX } from "react-icons/bs";
import SocialPlatformWorkspace from "@/components/SocialPlatformWorkspace";

export default function TwitterPage() {
    return (
        <SocialPlatformWorkspace
            platform="twitter"
            title="Twitter / X"
            subtitle="Manage Twitter connections and track scheduled, posted, processing, and failed X posts."
            route="/twitter"
            connectUrl="/api/auth/oauth/twitter"
            composeUrl="/publishing?platform=twitter"
            icon={BsTwitterX}
            connectedValues={["true"]}
            connectedMessage="Twitter account connected"
            disconnectedMessage="Twitter account disconnected"
            emptyAccountText="Connect Twitter / X to publish or schedule short-form updates."
            emptyPostText="Create a post from Publishing and select a Twitter account."
            ruleText="This page only manages Twitter / X accounts and Twitter / X posts. Mastodon, Threads, and WhatsApp stay separate."
            errorMessages={{
                twitter_config: "Twitter client ID is missing in .env",
                missing_code: "Twitter did not return an authorization code",
                missing_code_verifier: "Twitter login session expired. Try connecting again.",
                invalid_state: "Twitter authorization state mismatch. Try connecting again.",
                token_exchange_failed:
                    "Twitter token exchange failed. Check callback URL, client ID, and client secret.",
                profile_fetch_failed: "Twitter profile fetch failed.",
                account_in_use: "This Twitter account is already connected to another user.",
                twitter_callback_failed: "Twitter connection failed. Check your X developer app settings.",
                access_denied: "Twitter authorization was cancelled.",
            }}
        />
    );
}
