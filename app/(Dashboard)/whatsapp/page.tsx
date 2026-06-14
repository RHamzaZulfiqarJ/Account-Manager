"use client";

import { FormEvent, useEffect, useMemo, useState, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    MessageCircle,
    Phone,
    Plus,
    Power,
    RefreshCw,
    Search,
    Send,
    Trash2,
    Users,
    XCircle,
} from "lucide-react";
import {
    ApiClientError,
    buildTemplatePreview,
    extractTemplateVariables,
    normalizeTemplateName,
    whatsappClient,
    type WhatsAppAccount,
    type WhatsAppContact,
    type WhatsAppMessageLog,
    type WhatsAppScheduledMessage,
    type WhatsAppTemplate,
    type WhatsAppTemplateCategory,
} from "@/libs/whatsapp/client";

type Tab = "send" | "contacts" | "templates" | "activity";

type Notice = {
    type: "success" | "error";
    message: string;
};

const emptyConnectForm = {
    businessName: "",
    businessAccountId: "",
    phoneNumberId: "",
    phoneNumberDisplay: "",
    accessToken: "",
};

const emptyContactForm = {
    name: "",
    phoneNumber: "",
};

const emptyScheduleForm = {
    recipientPhone: "",
    contactId: "",
    templateName: "",
    templateLanguage: "en_US",
    scheduledAt: "",
};

const emptyTemplateForm = {
    name: "",
    category: "UTILITY" as WhatsAppTemplateCategory,
    language: "en_US",
    headerText: "",
    bodyText: "",
    footerText: "",
};

const tabs: { id: Tab; label: string; icon: ElementType }[] = [
    { id: "send", label: "Send", icon: Send },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "activity", label: "Activity", icon: Activity },
];

const getErrorMessage = (error: unknown) => {
    if (error instanceof ApiClientError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Something went wrong";
};

const formatDate = (value?: string | null) => {
    if (!value) {
        return "N/A";
    }

    return new Date(value).toLocaleString();
};

const getMinScheduleDateTime = () => {
    const date = new Date(Date.now() + 60_000);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);

    return local.toISOString().slice(0, 16);
};

const extractBodyTextFromComponents = (components: unknown) => {
    if (!Array.isArray(components)) {
        return "";
    }

    const body = components.find((component) => {
        if (!component || typeof component !== "object") {
            return false;
        }

        return "type" in component && String(component.type).toUpperCase() === "BODY";
    });

    if (!body || typeof body !== "object" || !("text" in body)) {
        return "";
    }

    return String(body.text || "");
};

const normalizeExampleValues = (values: string[]) => {
    return values.map((value) => value.trim()).filter(Boolean);
};

const formatPayload = (value: unknown) => {
    if (!value) {
        return "";
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const getStatusClass = (status?: string | null) => {
    const value = status?.toUpperCase();

    if (value === "APPROVED" || value === "SENT" || value === "SUCCESS") {
        return "border-[var(--chronos-olive)] text-[var(--chronos-olive-soft)]";
    }

    if (value === "QUEUED" || value === "PROCESSING" || value === "PENDING") {
        return "border-[var(--chronos-olive-soft)] text-[var(--chronos-body)]";
    }

    if (value === "FAILED" || value === "REJECTED") {
        return "border-[var(--chronos-danger)] text-[var(--chronos-danger)]";
    }

    return "border-[var(--chronos-line-strong)] text-[var(--chronos-muted)]";
};

export default function WhatsAppDashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>("send");
    const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [scheduledMessages, setScheduledMessages] = useState<WhatsAppScheduledMessage[]>([]);
    const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [notice, setNotice] = useState<Notice | null>(null);
    const [searchContacts, setSearchContacts] = useState("");
    const [searchLogs, setSearchLogs] = useState("");
    const [connectForm, setConnectForm] = useState(emptyConnectForm);
    const [contactForm, setContactForm] = useState(emptyContactForm);
    const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
    const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
    const [templateExampleValues, setTemplateExampleValues] = useState<string[]>([]);
    const [scheduleParamValues, setScheduleParamValues] = useState<string[]>([]);

    const selectedAccount = useMemo(() => {
        return accounts.find((account) => account.id === selectedAccountId) || null;
    }, [accounts, selectedAccountId]);

    const approvedTemplates = useMemo(() => {
        return templates.filter((template) => template.status?.toUpperCase() === "APPROVED");
    }, [templates]);

    const selectedScheduleTemplate = useMemo(() => {
        return (
            templates.find((template) => {
                return (
                    template.name === scheduleForm.templateName && template.language === scheduleForm.templateLanguage
                );
            }) || null
        );
    }, [templates, scheduleForm.templateName, scheduleForm.templateLanguage]);

    const selectedTemplateBodyText = useMemo(() => {
        return extractBodyTextFromComponents(selectedScheduleTemplate?.components);
    }, [selectedScheduleTemplate]);

    const selectedTemplateVariables = useMemo(() => {
        return extractTemplateVariables(selectedTemplateBodyText);
    }, [selectedTemplateBodyText]);

    const schedulePreview = useMemo(() => {
        if (!selectedTemplateBodyText) {
            return "";
        }

        return buildTemplatePreview(selectedTemplateBodyText, scheduleParamValues);
    }, [selectedTemplateBodyText, scheduleParamValues]);

    const createTemplateVariables = useMemo(() => {
        return extractTemplateVariables(templateForm.bodyText);
    }, [templateForm.bodyText]);

    const createTemplatePreview = useMemo(() => {
        return buildTemplatePreview(templateForm.bodyText, templateExampleValues);
    }, [templateForm.bodyText, templateExampleValues]);

    const stats = useMemo(() => {
        return {
            accounts: accounts.length,
            contacts: contacts.length,
            templates: templates.length,
            approved: approvedTemplates.length,
            queued: scheduledMessages.filter((message) => message.status === "QUEUED").length,
            sent: scheduledMessages.filter((message) => message.status === "SENT").length,
            failed: scheduledMessages.filter((message) => message.status === "FAILED").length,
            logs: logs.length,
        };
    }, [accounts, contacts, templates, approvedTemplates, scheduledMessages, logs]);

    const showNotice = (type: Notice["type"], message: string) => {
        setNotice({ type, message });

        window.setTimeout(() => {
            setNotice(null);
        }, 3500);
    };

    const loadAccounts = async () => {
        const data = await whatsappClient.listAccounts();

        setAccounts(data.accounts);

        if (data.accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(data.accounts[0].id);
        }

        if (data.accounts.length === 0) {
            setSelectedAccountId("");
        }
    };

    const loadAccountData = async (accountId: string) => {
        const [contactsData, templatesData, scheduledData, logsData] = await Promise.all([
            whatsappClient.listContacts(accountId, { limit: 30, q: searchContacts || undefined }),
            whatsappClient.listTemplates(accountId, { limit: 80 }),
            whatsappClient.listScheduledMessages(accountId, { limit: 30 }),
            whatsappClient.listLogs(accountId, { limit: 30, q: searchLogs || undefined }),
        ]);

        setContacts(contactsData.items);
        setTemplates(templatesData.items);
        setScheduledMessages(scheduledData.items);
        setLogs(logsData.items);
    };

    const refreshAll = async () => {
        try {
            setLoading(true);
            await loadAccounts();
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const refreshSelectedAccountData = async () => {
        if (!selectedAccountId) {
            setContacts([]);
            setTemplates([]);
            setScheduledMessages([]);
            setLogs([]);
            return;
        }

        try {
            setActionLoading("refresh");
            await loadAccountData(selectedAccountId);
            showNotice("success", "Workspace refreshed");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    useEffect(() => {
        refreshAll();
    }, []);

    useEffect(() => {
        if (!selectedAccountId) {
            setContacts([]);
            setTemplates([]);
            setScheduledMessages([]);
            setLogs([]);
            return;
        }

        loadAccountData(selectedAccountId).catch((error) => {
            showNotice("error", getErrorMessage(error));
        });
    }, [selectedAccountId]);

    useEffect(() => {
        setTemplateExampleValues((current) => {
            return createTemplateVariables.map((_, index) => current[index] || "");
        });
    }, [createTemplateVariables.length]);

    useEffect(() => {
        setScheduleParamValues((current) => {
            return selectedTemplateVariables.map((_, index) => current[index] || "");
        });
    }, [selectedTemplateVariables.length]);

    const handleConnectAccount = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            setActionLoading("connect");

            const result = await whatsappClient.connectAccount(connectForm);

            setConnectForm(emptyConnectForm);
            await loadAccounts();
            setSelectedAccountId(result.account.id);
            showNotice("success", "WhatsApp account connected");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleDisconnectAccount = async () => {
        if (!selectedAccountId) {
            return;
        }

        const confirmed = window.confirm("Disconnect this WhatsApp account? History will stay saved.");

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading("disconnect");
            await whatsappClient.disconnectAccount(selectedAccountId);
            await loadAccounts();
            setContacts([]);
            setTemplates([]);
            setScheduledMessages([]);
            setLogs([]);
            showNotice("success", "WhatsApp account disconnected");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleCreateContact = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedAccountId) {
            showNotice("error", "Select a WhatsApp account first");
            return;
        }

        try {
            setActionLoading("contact");

            await whatsappClient.createContact({
                socialAccountId: selectedAccountId,
                name: contactForm.name,
                phoneNumber: contactForm.phoneNumber,
            });

            setContactForm(emptyContactForm);
            await loadAccountData(selectedAccountId);
            showNotice("success", "Contact added");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleDeleteContact = async (id: string) => {
        const confirmed = window.confirm("Delete this WhatsApp contact?");

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(id);
            await whatsappClient.deleteContact(id);

            if (selectedAccountId) {
                await loadAccountData(selectedAccountId);
            }

            showNotice("success", "Contact deleted");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleCreateTemplate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedAccountId) {
            showNotice("error", "Select a WhatsApp account first");
            return;
        }

        try {
            setActionLoading("createTemplate");

            const result = await whatsappClient.createTemplate({
                socialAccountId: selectedAccountId,
                name: normalizeTemplateName(templateForm.name),
                category: templateForm.category,
                language: templateForm.language,
                headerText: templateForm.headerText || undefined,
                bodyText: templateForm.bodyText,
                footerText: templateForm.footerText || undefined,
                bodyExamples: normalizeExampleValues(templateExampleValues),
            });

            setTemplateForm(emptyTemplateForm);
            setTemplateExampleValues([]);
            await loadAccountData(selectedAccountId);
            showNotice("success", `Template created with status ${result.template.status || "PENDING"}`);
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleSyncTemplates = async () => {
        if (!selectedAccountId) {
            showNotice("error", "Select a WhatsApp account first");
            return;
        }

        try {
            setActionLoading("syncTemplates");
            const result = await whatsappClient.syncTemplates(selectedAccountId);
            await loadAccountData(selectedAccountId);
            showNotice("success", `${result.synced} templates synced`);
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const getTemplateMessagePayload = () => {
        if (!selectedAccountId) {
            throw new Error("Select a WhatsApp account first");
        }

        if (!scheduleForm.recipientPhone.trim()) {
            throw new Error("Recipient phone number is required");
        }

        if (!scheduleForm.templateName.trim()) {
            throw new Error("Select an approved template first");
        }

        const hasMissingValues =
            selectedTemplateVariables.length > 0 && scheduleParamValues.some((value) => !value.trim());

        if (hasMissingValues) {
            throw new Error("Fill all template values");
        }

        return {
            socialAccountId: selectedAccountId,
            contactId: scheduleForm.contactId || undefined,
            recipientPhone: scheduleForm.recipientPhone,
            templateName: scheduleForm.templateName,
            templateLanguage: scheduleForm.templateLanguage || "en_US",
            templateParams: selectedTemplateVariables.length > 0 ? scheduleParamValues : undefined,
        };
    };

    const handleSendNowMessage = async () => {
        try {
            setActionLoading("sendNow");

            const result = await whatsappClient.sendNowMessage({
                ...getTemplateMessagePayload(),
                scheduledAt: new Date().toISOString(),
            });

            if (!result.success) {
                throw new Error(result.error || "Message could not be sent");
            }

            setScheduleForm(emptyScheduleForm);
            setScheduleParamValues([]);
            await loadAccountData(selectedAccountId);
            showNotice("success", "Message sent");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleScheduleMessage = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            if (!scheduleForm.scheduledAt) {
                throw new Error("Schedule time is required");
            }

            setActionLoading("schedule");

            await whatsappClient.scheduleMessage({
                ...getTemplateMessagePayload(),
                scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
            });

            setScheduleForm(emptyScheduleForm);
            setScheduleParamValues([]);
            await loadAccountData(selectedAccountId);
            showNotice("success", "Message scheduled");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleCancelMessage = async (id: string) => {
        const confirmed = window.confirm("Cancel this scheduled WhatsApp message?");

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(id);
            await whatsappClient.cancelScheduledMessage(id);

            if (selectedAccountId) {
                await loadAccountData(selectedAccountId);
            }

            showNotice("success", "Message cancelled");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleRetryMessage = async (id: string) => {
        try {
            setActionLoading(id);
            await whatsappClient.retryScheduledMessage(id);

            if (selectedAccountId) {
                await loadAccountData(selectedAccountId);
            }

            showNotice("success", "Message queued again");
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleContactSearch = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedAccountId) {
            return;
        }

        try {
            setActionLoading("searchContacts");

            const data = await whatsappClient.listContacts(selectedAccountId, {
                limit: 30,
                q: searchContacts || undefined,
            });

            setContacts(data.items);
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleLogSearch = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedAccountId) {
            return;
        }

        try {
            setActionLoading("searchLogs");

            const data = await whatsappClient.listLogs(selectedAccountId, {
                limit: 30,
                q: searchLogs || undefined,
            });

            setLogs(data.items);
        } catch (error) {
            showNotice("error", getErrorMessage(error));
        } finally {
            setActionLoading("");
        }
    };

    const handleContactSelectForSchedule = (contactId: string) => {
        const contact = contacts.find((item) => item.id === contactId);

        setScheduleForm((current) => ({
            ...current,
            contactId,
            recipientPhone: contact?.phoneNumber || current.recipientPhone,
        }));
    };

    const handleTemplateSelectForSchedule = (templateId: string) => {
        const template = templates.find((item) => item.id === templateId);

        setScheduleForm((current) => ({
            ...current,
            templateName: template?.name || "",
            templateLanguage: template?.language || "en_US",
        }));

        const bodyText = extractBodyTextFromComponents(template?.components);
        const variables = extractTemplateVariables(bodyText);

        setScheduleParamValues(variables.map(() => ""));
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="chronos-panel flex items-center gap-3 px-5 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--chronos-olive)]" strokeWidth={1.75} />
                    <span className="chronos-label">Loading WhatsApp</span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
        >
            <section className="chronos-panel overflow-hidden">
                <div className="flex flex-col gap-5 border-b border-[var(--chronos-line)] p-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <p className="chronos-label">WhatsApp Business</p>
                        <h1 className="mt-2 text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)] sm:text-4xl">
                            Messaging workspace
                        </h1>
                        <p className="mt-2 text-sm text-[var(--chronos-muted)]">
                            Accounts, contacts, templates, scheduled messages and logs.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={selectedAccountId}
                            onChange={(event) => setSelectedAccountId(event.target.value)}
                            className="h-11 min-w-full px-4 text-sm sm:min-w-[280px]"
                        >
                            <option value="">Select account</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.businessName || account.accountUsername}
                                    {account.phoneNumberDisplay ? ` (${account.phoneNumberDisplay})` : ""}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={refreshSelectedAccountData}
                            disabled={!selectedAccountId || actionLoading === "refresh"}
                            className="chronos-button chronos-button-soft"
                        >
                            {actionLoading === "refresh" ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                            ) : (
                                <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                            )}
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={handleDisconnectAccount}
                            disabled={!selectedAccountId || actionLoading === "disconnect"}
                            className="chronos-button chronos-button-soft border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                        >
                            {actionLoading === "disconnect" ? (
                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                            ) : (
                                <Power className="h-4 w-4" strokeWidth={1.75} />
                            )}
                            Disconnect
                        </button>
                    </div>
                </div>

                <div className="grid gap-px bg-[var(--chronos-line)] sm:grid-cols-2 lg:grid-cols-7">
                    <Metric label="Accounts" value={stats.accounts} icon={MessageCircle} />
                    <Metric label="Contacts" value={stats.contacts} icon={Users} />
                    <Metric label="Templates" value={stats.templates} icon={FileText} />
                    <Metric label="Approved" value={stats.approved} icon={CheckCircle2} />
                    <Metric label="Queued" value={stats.queued} icon={Clock} />
                    <Metric label="Sent" value={stats.sent} icon={Send} />
                    <Metric label="Failed" value={stats.failed} icon={AlertTriangle} danger={stats.failed > 0} />
                </div>

                {notice && (
                    <div
                        className={`m-4 flex items-start gap-3 rounded-[20px] border p-4 text-sm ${
                            notice.type === "success"
                                ? "border-[var(--chronos-olive)]/40 bg-[var(--chronos-olive)]/8 text-[var(--chronos-body)]"
                                : "border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 text-[var(--chronos-danger)]"
                        }`}
                    >
                        {notice.type === "success" ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                        ) : (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                        )}
                        {notice.message}
                    </div>
                )}
            </section>

            <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="space-y-4">
                    <Panel title="Current account" label="Selected number">
                        {selectedAccount ? (
                            <div className="space-y-3">
                                <InfoLine label="Business" value={selectedAccount.businessName || "N/A"} />
                                <InfoLine label="Username" value={selectedAccount.accountUsername} />
                                <InfoLine label="WABA ID" value={selectedAccount.businessAccountId || "N/A"} />
                                <InfoLine label="Phone ID" value={selectedAccount.phoneNumberId || "N/A"} />
                                <InfoLine label="Display" value={selectedAccount.phoneNumberDisplay || "N/A"} />
                            </div>
                        ) : (
                            <EmptyState title="No account selected" text="Select or connect a WhatsApp number." />
                        )}
                    </Panel>

                    <Panel title="Connect number" label="Meta details">
                        <form onSubmit={handleConnectAccount} className="space-y-3">
                            <Input
                                label="Business name"
                                value={connectForm.businessName}
                                onChange={(value) => setConnectForm((current) => ({ ...current, businessName: value }))}
                                placeholder="MIMICO Business"
                                required
                            />

                            <Input
                                label="WABA ID"
                                value={connectForm.businessAccountId}
                                onChange={(value) =>
                                    setConnectForm((current) => ({ ...current, businessAccountId: value }))
                                }
                                placeholder="4383963308557925"
                                required
                            />

                            <Input
                                label="Phone Number ID"
                                value={connectForm.phoneNumberId}
                                onChange={(value) =>
                                    setConnectForm((current) => ({ ...current, phoneNumberId: value }))
                                }
                                placeholder="1108178919047639"
                                required
                            />

                            <Input
                                label="Display Number"
                                value={connectForm.phoneNumberDisplay}
                                onChange={(value) =>
                                    setConnectForm((current) => ({ ...current, phoneNumberDisplay: value }))
                                }
                                placeholder="+92 300 1234567"
                                required
                            />

                            <Textarea
                                label="Access Token"
                                value={connectForm.accessToken}
                                onChange={(value) => setConnectForm((current) => ({ ...current, accessToken: value }))}
                                placeholder="Paste Meta access token"
                                rows={4}
                                required
                            />

                            <button
                                type="submit"
                                disabled={actionLoading === "connect"}
                                className="chronos-button w-full"
                            >
                                {actionLoading === "connect" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                ) : (
                                    <Plus className="h-4 w-4" strokeWidth={1.75} />
                                )}
                                Connect
                            </button>
                        </form>
                    </Panel>
                </aside>

                <div className="chronos-panel overflow-hidden">
                    <div className="flex flex-wrap gap-2 border-b border-[var(--chronos-line)] p-3">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`chronos-button h-10 ${active ? "" : "chronos-button-soft"}`}
                                >
                                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {activeTab === "send" && (
                        <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                            <form onSubmit={handleScheduleMessage} className="chronos-panel p-4">
                                <SectionTitle title="Send template message" text="Use approved templates only." />

                                <div className="mt-4 space-y-3">
                                    <Select
                                        label="Contact"
                                        value={scheduleForm.contactId}
                                        onChange={handleContactSelectForSchedule}
                                    >
                                        <option value="">Manual phone number</option>
                                        {contacts.map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.name} ({contact.phoneNumber})
                                            </option>
                                        ))}
                                    </Select>

                                    <Input
                                        label="Recipient phone"
                                        value={scheduleForm.recipientPhone}
                                        onChange={(value) =>
                                            setScheduleForm((current) => ({ ...current, recipientPhone: value }))
                                        }
                                        placeholder="923001234567"
                                        required
                                    />

                                    <Select
                                        label="Approved template"
                                        value={selectedScheduleTemplate?.id || ""}
                                        onChange={handleTemplateSelectForSchedule}
                                        required
                                    >
                                        <option value="">Select template</option>
                                        {approvedTemplates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name} ({template.language})
                                            </option>
                                        ))}
                                    </Select>

                                    {selectedTemplateVariables.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="chronos-label">Template values</p>

                                            {selectedTemplateVariables.map((variable, index) => (
                                                <Input
                                                    key={variable}
                                                    label={`Value {{${variable}}}`}
                                                    value={scheduleParamValues[index] || ""}
                                                    onChange={(value) => {
                                                        setScheduleParamValues((current) => {
                                                            const next = [...current];
                                                            next[index] = value;
                                                            return next;
                                                        });
                                                    }}
                                                    placeholder={`Value for {{${variable}}}`}
                                                    required
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <Input
                                        label="Schedule time"
                                        type="datetime-local"
                                        value={scheduleForm.scheduledAt}
                                        onChange={(value) =>
                                            setScheduleForm((current) => ({ ...current, scheduledAt: value }))
                                        }
                                        min={getMinScheduleDateTime()}
                                    />

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={handleSendNowMessage}
                                            disabled={actionLoading === "sendNow"}
                                            className="chronos-button chronos-button-soft w-full"
                                        >
                                            {actionLoading === "sendNow" ? (
                                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                            ) : (
                                                <Send className="h-4 w-4" strokeWidth={1.75} />
                                            )}
                                            Send now
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={actionLoading === "schedule"}
                                            className="chronos-button w-full"
                                        >
                                            {actionLoading === "schedule" ? (
                                                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                            ) : (
                                                <Clock className="h-4 w-4" strokeWidth={1.75} />
                                            )}
                                            Schedule
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <Panel title="Message preview" label="Template output">
                                {schedulePreview ? (
                                    <div className="rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4">
                                        <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--chronos-body)]">
                                            {schedulePreview}
                                        </p>
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="No preview"
                                        text="Select a template to preview message content."
                                    />
                                )}
                            </Panel>
                        </div>
                    )}

                    {activeTab === "contacts" && (
                        <div className="grid gap-4 p-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                            <form onSubmit={handleCreateContact} className="chronos-panel p-4">
                                <SectionTitle title="Add contact" text="Save reusable recipients." />

                                <div className="mt-4 space-y-3">
                                    <Input
                                        label="Name"
                                        value={contactForm.name}
                                        onChange={(value) => setContactForm((current) => ({ ...current, name: value }))}
                                        placeholder="Customer name"
                                        required
                                    />

                                    <Input
                                        label="Phone number"
                                        value={contactForm.phoneNumber}
                                        onChange={(value) =>
                                            setContactForm((current) => ({ ...current, phoneNumber: value }))
                                        }
                                        placeholder="923001234567"
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={actionLoading === "contact"}
                                        className="chronos-button w-full"
                                    >
                                        {actionLoading === "contact" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                        ) : (
                                            <Plus className="h-4 w-4" strokeWidth={1.75} />
                                        )}
                                        Add contact
                                    </button>
                                </div>
                            </form>

                            <Panel
                                title="Contacts"
                                label={`${contacts.length} saved`}
                                action={
                                    <form onSubmit={handleContactSearch} className="flex gap-2">
                                        <input
                                            value={searchContacts}
                                            onChange={(event) => setSearchContacts(event.target.value)}
                                            placeholder="Search"
                                            className="h-10 w-40 px-4 text-sm"
                                        />

                                        <button type="submit" className="chronos-button h-10 w-10 px-0">
                                            <Search className="h-4 w-4" strokeWidth={1.75} />
                                        </button>
                                    </form>
                                }
                            >
                                {contacts.length === 0 ? (
                                    <EmptyState title="No contacts" text="Add contacts to reuse them while sending." />
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[560px] text-left">
                                            <thead className="border-b border-[var(--chronos-line)] text-xs uppercase tracking-[0.14em] text-[var(--chronos-muted)]">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Name</th>
                                                    <th className="px-4 py-3 font-medium">Phone</th>
                                                    <th className="px-4 py-3 text-right font-medium">Action</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-[var(--chronos-line)]">
                                                {contacts.map((contact) => (
                                                    <tr
                                                        key={contact.id}
                                                        className="transition hover:bg-[var(--chronos-olive)]/5"
                                                    >
                                                        <td className="px-4 py-3 text-sm font-medium text-[var(--chronos-ink)]">
                                                            {contact.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-[var(--chronos-muted)]">
                                                            {contact.phoneNumber}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteContact(contact.id)}
                                                                disabled={actionLoading === contact.id}
                                                                className="chronos-button chronos-button-soft h-9 border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                                                            >
                                                                {actionLoading === contact.id ? (
                                                                    <Loader2
                                                                        className="h-4 w-4 animate-spin"
                                                                        strokeWidth={1.75}
                                                                    />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                                                                )}
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Panel>
                        </div>
                    )}

                    {activeTab === "templates" && (
                        <div className="grid gap-4 p-4 xl:grid-cols-[380px_minmax(0,1fr)]">
                            <form onSubmit={handleCreateTemplate} className="chronos-panel p-4">
                                <SectionTitle title="Create template" text="Submit template to Meta for approval." />

                                <div className="mt-4 space-y-3">
                                    <Input
                                        label="Template name"
                                        value={templateForm.name}
                                        onChange={(value) =>
                                            setTemplateForm((current) => ({ ...current, name: value }))
                                        }
                                        placeholder="order_update"
                                        required
                                    />

                                    <Select
                                        label="Category"
                                        value={templateForm.category}
                                        onChange={(value) =>
                                            setTemplateForm((current) => ({
                                                ...current,
                                                category: value as WhatsAppTemplateCategory,
                                            }))
                                        }
                                        required
                                    >
                                        <option value="UTILITY">Utility</option>
                                        <option value="MARKETING">Marketing</option>
                                        <option value="AUTHENTICATION">Authentication</option>
                                    </Select>

                                    <Input
                                        label="Language"
                                        value={templateForm.language}
                                        onChange={(value) =>
                                            setTemplateForm((current) => ({ ...current, language: value }))
                                        }
                                        placeholder="en_US"
                                        required
                                    />

                                    <Input
                                        label="Header text"
                                        value={templateForm.headerText}
                                        onChange={(value) =>
                                            setTemplateForm((current) => ({ ...current, headerText: value }))
                                        }
                                        placeholder="Optional header"
                                    />

                                    <Textarea
                                        label="Body text"
                                        value={templateForm.bodyText}
                                        onChange={(value) =>
                                            setTemplateForm((current) => ({ ...current, bodyText: value }))
                                        }
                                        placeholder="Hello {{1}}, your order {{2}} is ready."
                                        rows={5}
                                        required
                                    />

                                    <Input
                                        label="Footer text"
                                        value={templateForm.footerText}
                                        onChange={(value) =>
                                            setTemplateForm((current) => ({ ...current, footerText: value }))
                                        }
                                        placeholder="Optional footer"
                                    />

                                    {createTemplateVariables.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="chronos-label">Example values</p>

                                            {createTemplateVariables.map((variable, index) => (
                                                <Input
                                                    key={variable}
                                                    label={`Example {{${variable}}}`}
                                                    value={templateExampleValues[index] || ""}
                                                    onChange={(value) => {
                                                        setTemplateExampleValues((current) => {
                                                            const next = [...current];
                                                            next[index] = value;
                                                            return next;
                                                        });
                                                    }}
                                                    placeholder={`Example for {{${variable}}}`}
                                                    required
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {templateForm.bodyText && (
                                        <div className="rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-4">
                                            <p className="chronos-label mb-2">Preview</p>
                                            <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--chronos-muted)]">
                                                {createTemplatePreview || templateForm.bodyText}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={actionLoading === "createTemplate"}
                                        className="chronos-button w-full"
                                    >
                                        {actionLoading === "createTemplate" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                        ) : (
                                            <Plus className="h-4 w-4" strokeWidth={1.75} />
                                        )}
                                        Create template
                                    </button>
                                </div>
                            </form>

                            <Panel
                                title="Templates"
                                label={`${templates.length} total`}
                                action={
                                    <button
                                        type="button"
                                        onClick={handleSyncTemplates}
                                        disabled={!selectedAccountId || actionLoading === "syncTemplates"}
                                        className="chronos-button chronos-button-soft"
                                    >
                                        {actionLoading === "syncTemplates" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
                                        )}
                                        Sync
                                    </button>
                                }
                            >
                                {templates.length === 0 ? (
                                    <EmptyState title="No templates" text="Create or sync templates from Meta." />
                                ) : (
                                    <div className="divide-y divide-[var(--chronos-line)]">
                                        {templates.map((template) => {
                                            const bodyText = extractBodyTextFromComponents(template.components);

                                            return (
                                                <div
                                                    key={template.id}
                                                    className="p-4 transition hover:bg-[var(--chronos-olive)]/5"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--chronos-ink)]">
                                                                {template.name}
                                                            </p>
                                                            <p className="mt-1 text-xs text-[var(--chronos-muted)]">
                                                                {template.language} ·{" "}
                                                                {template.category || "No category"}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`chronos-pill ${getStatusClass(template.status)}`}
                                                        >
                                                            {template.status || "Unknown"}
                                                        </span>
                                                    </div>

                                                    {bodyText && (
                                                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--chronos-muted)]">
                                                            {bodyText}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Panel>
                        </div>
                    )}

                    {activeTab === "activity" && (
                        <div className="grid gap-4 p-4 xl:grid-cols-2">
                            <Panel title="Scheduled messages" label={`${scheduledMessages.length} records`}>
                                {scheduledMessages.length === 0 ? (
                                    <EmptyState title="No messages" text="Scheduled and sent messages appear here." />
                                ) : (
                                    <div className="divide-y divide-[var(--chronos-line)]">
                                        {scheduledMessages.map((message) => (
                                            <MessageRow
                                                key={message.id}
                                                message={message}
                                                actionLoading={actionLoading}
                                                onCancel={() => handleCancelMessage(message.id)}
                                                onRetry={() => handleRetryMessage(message.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Panel>

                            <Panel
                                title="Message logs"
                                label={`${logs.length} logs`}
                                action={
                                    <form onSubmit={handleLogSearch} className="flex gap-2">
                                        <input
                                            value={searchLogs}
                                            onChange={(event) => setSearchLogs(event.target.value)}
                                            placeholder="Search"
                                            className="h-10 w-40 px-4 text-sm"
                                        />

                                        <button type="submit" className="chronos-button h-10 w-10 px-0">
                                            <Search className="h-4 w-4" strokeWidth={1.75} />
                                        </button>
                                    </form>
                                }
                            >
                                {logs.length === 0 ? (
                                    <EmptyState
                                        title="No logs"
                                        text="Logs appear after sends, webhooks and failures."
                                    />
                                ) : (
                                    <div className="divide-y divide-[var(--chronos-line)]">
                                        {logs.map((log) => (
                                            <details key={log.id} className="group">
                                                <summary className="list-none p-4 transition hover:bg-[var(--chronos-olive)]/5">
                                                    <div className="flex cursor-pointer flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-medium text-[var(--chronos-ink)]">
                                                                    {log.direction}
                                                                </p>

                                                                {log.success ? (
                                                                    <CheckCircle2
                                                                        className="h-4 w-4 text-[var(--chronos-olive)]"
                                                                        strokeWidth={1.75}
                                                                    />
                                                                ) : (
                                                                    <XCircle
                                                                        className="h-4 w-4 text-[var(--chronos-danger)]"
                                                                        strokeWidth={1.75}
                                                                    />
                                                                )}
                                                            </div>

                                                            <p className="mt-1 text-sm text-[var(--chronos-muted)]">
                                                                {log.recipientPhone || "No recipient"}
                                                            </p>

                                                            <p className="mt-1 text-xs text-[var(--chronos-muted)]">
                                                                {formatDate(log.createdAt)}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={`chronos-pill ${log.success ? getStatusClass("SUCCESS") : getStatusClass("FAILED")}`}
                                                        >
                                                            {log.success ? "Success" : "Failed"}
                                                        </span>
                                                    </div>
                                                </summary>

                                                <div className="px-4 pb-4">
                                                    {log.errorMessage && (
                                                        <div className="mb-3 rounded-[18px] border border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 p-3 text-sm text-[var(--chronos-danger)]">
                                                            {log.errorMessage}
                                                        </div>
                                                    )}

                                                    <PayloadBlock title="Payload" value={log.payload} />
                                                    <PayloadBlock title="Response" value={log.response} />
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                )}
                            </Panel>
                        </div>
                    )}
                </div>
            </section>
        </motion.div>
    );
}

function Metric({
    label,
    value,
    icon: Icon,
    danger,
}: {
    label: string;
    value: number;
    icon: ElementType;
    danger?: boolean;
}) {
    return (
        <div className="bg-[var(--chronos-sheet)]/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="chronos-label">{label}</p>
                <Icon
                    className={`h-4 w-4 ${danger ? "text-[var(--chronos-danger)]" : "text-[var(--chronos-olive)]"}`}
                    strokeWidth={1.75}
                />
            </div>

            <p className="text-3xl font-extralight tracking-[-0.07em] text-[var(--chronos-ink)]">{value}</p>
        </div>
    );
}

function Panel({
    title,
    label,
    action,
    children,
}: {
    title: string;
    label?: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="chronos-panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[var(--chronos-line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    {label && <p className="chronos-label">{label}</p>}
                    <h2 className="mt-1 text-xl font-light tracking-[-0.05em] text-[var(--chronos-ink)]">{title}</h2>
                </div>

                {action}
            </div>

            <div className="p-4">{children}</div>
        </div>
    );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
    return (
        <div>
            <p className="chronos-label">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--chronos-muted)]">{text}</p>
        </div>
    );
}

function InfoLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-[var(--chronos-line)] pb-3 last:border-b-0 last:pb-0">
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--chronos-muted)]">{label}</span>
            <span className="max-w-[170px] truncate text-right text-sm text-[var(--chronos-ink)]">{value}</span>
        </div>
    );
}

function Input({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
    min,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    min?: string;
}) {
    return (
        <label className="block space-y-2">
            <span className="chronos-label">{label}</span>
            <input
                type={type}
                value={value}
                min={min}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
                className="h-11 w-full px-4 text-sm"
            />
        </label>
    );
}

function Textarea({
    label,
    value,
    onChange,
    placeholder,
    rows = 4,
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    required?: boolean;
}) {
    return (
        <label className="block space-y-2">
            <span className="chronos-label">{label}</span>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={rows}
                required={required}
                className="w-full resize-none p-4 text-sm leading-7"
            />
        </label>
    );
}

function Select({
    label,
    value,
    onChange,
    children,
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
    required?: boolean;
}) {
    return (
        <label className="block space-y-2">
            <span className="chronos-label">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                className="h-11 w-full px-4 text-sm"
            >
                {children}
            </select>
        </label>
    );
}

function EmptyState({ title, text }: { title: string; text: string }) {
    return (
        <div className="rounded-[20px] border border-[var(--chronos-line)] bg-[var(--chronos-olive)]/5 p-5 text-center">
            <p className="text-sm font-medium text-[var(--chronos-ink)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--chronos-muted)]">{text}</p>
        </div>
    );
}

function MessageRow({
    message,
    actionLoading,
    onCancel,
    onRetry,
}: {
    message: WhatsAppScheduledMessage;
    actionLoading: string;
    onCancel: () => void;
    onRetry: () => void;
}) {
    return (
        <div className="space-y-3 p-4 transition hover:bg-[var(--chronos-olive)]/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-[var(--chronos-ink)]">
                        {message.templateName || "Template message"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--chronos-muted)]">To {message.recipientPhone}</p>
                    <p className="mt-1 text-xs text-[var(--chronos-muted)]">
                        Scheduled {formatDate(message.scheduledAt)}
                    </p>
                    {message.sentAt && (
                        <p className="mt-1 text-xs text-[var(--chronos-muted)]">Sent {formatDate(message.sentAt)}</p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className={`chronos-pill ${getStatusClass(message.status)}`}>{message.status}</span>

                    {(message.status === "QUEUED" || message.status === "FAILED" || message.status === "DRAFT") && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={actionLoading === message.id}
                            className="chronos-button chronos-button-soft h-9 border-[var(--chronos-danger)] text-[var(--chronos-danger)] hover:bg-[var(--chronos-danger)] hover:text-[#090A0D]"
                        >
                            Cancel
                        </button>
                    )}

                    {message.status === "FAILED" && (
                        <button
                            type="button"
                            onClick={onRetry}
                            disabled={actionLoading === message.id}
                            className="chronos-button chronos-button-soft h-9"
                        >
                            Retry
                        </button>
                    )}
                </div>
            </div>

            {message.errorMessage && (
                <div className="rounded-[18px] border border-[var(--chronos-danger)]/40 bg-[var(--chronos-danger)]/5 p-3 text-sm leading-6 text-[var(--chronos-danger)]">
                    {message.errorMessage}
                </div>
            )}
        </div>
    );
}

function PayloadBlock({ title, value }: { title: string; value: unknown }) {
    const formatted = formatPayload(value);

    if (!formatted) {
        return null;
    }

    return (
        <div className="mb-3 last:mb-0">
            <p className="chronos-label mb-2">{title}</p>
            <pre className="max-h-56 overflow-auto rounded-[18px] border border-[var(--chronos-line)] bg-[var(--chronos-canvas)] p-3 text-xs leading-6 text-[var(--chronos-muted)]">
                {formatted}
            </pre>
        </div>
    );
}
