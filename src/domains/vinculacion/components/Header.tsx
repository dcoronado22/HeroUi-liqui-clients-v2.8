"use client";

import React, { useEffect, useState } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Breadcrumbs,
    BreadcrumbItem,
    Button,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Tooltip,
    NavbarMenuToggle,
    Link,
    Popover,
    PopoverTrigger,
    Badge,
    PopoverContent,
    NavbarMenu,
    NavbarMenuItem,
    Image,
    Divider,
    Progress
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { ThemeSwitch } from "@/components/theme-switch"; // tu componente
import { useVinculacionFlow } from "../context/flow-context";
import { redirect } from "next/navigation";
import { StepExpedienteModal } from "@/src/domains/vinculacion/steps/Expediente/StepExpedienteModal.tsx";

type HeaderProps = {
    stepTitle: string;
    stepBadge: string;   // “X de Y”
    stepSubtitle?: string;
    rfc?: string | null;
    showSteps?: boolean;
    showIsCollabsable?: boolean;
    showRfc?: boolean;
};

export default function Header({ stepTitle, stepBadge, stepSubtitle, rfc, showSteps = true, showIsCollabsable = true, showRfc = true }: HeaderProps) {
    const flow = useVinculacionFlow();
    const isAuth = useIsAuthenticated();
    const { instance } = useMsal();
    const [isExpedienteOpen, setIsExpedienteOpen] = useState(false);

    const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
    const displayName = account?.name || account?.username || "Usuario";
    const email = account?.username || "";
    const name = account?.name || "Usuario";

    const logout = () => {
        instance.logoutRedirect({ postLogoutRedirectUri: "/" }).catch(console.error);
    };

    return (
        <>
            <Navbar
                classNames={{
                    base: "lg:bg-transparent lg:backdrop-filter-none",
                    wrapper: "px-4 sm:px-6",
                }}
                height="80px"
                maxWidth="full"
            >
                {showIsCollabsable && (<Tooltip content={flow.sidebarCollapsed ? "Mostrar pasos" : "Ocultar pasos"}>
                    <Button
                        isIconOnly
                        variant="light"
                        radius="full"
                        onPress={() => {
                            flow.toggleSidebar();
                            console.log("Sidebar toggled", flow.sidebarCollapsed);
                        }}
                        className=" border border-default-100 dark:border-default-100/40 shadow-xl bg-content2 dark:bg-content2 ml-3.5"
                    >
                        <Icon
                            icon={!flow.sidebarCollapsed ? "ic:round-menu-open" : "line-md:close-to-menu-transition"}
                            width={22}
                            className="text-default-600"
                        />
                    </Button>
                </Tooltip>)}

                {/* CENTRO: breadcrumb */}
                {/* {showSteps && (<NavbarContent
                    className="bg-content2 dark:bg-content2 absolute left-1/2 top-1/2 hidden h-12 w-full max-w-fit -translate-x-1/2 -translate-y-1/2 transform items-center px-4 sm:flex rounded-full border border-default-100 dark:border-default-100/40 shadow-lg p-0 lg:px-10"
                    justify="start"
                >
                    <Breadcrumbs size="sm" itemClasses={{ separator: "px-1 text-default-400", item: "text-default-600" }}>
                        <BreadcrumbItem>Vinculación</BreadcrumbItem>
                        <BreadcrumbItem isCurrent>
                            {stepTitle}
                            <Chip size="sm" color="primary" className="ml-2">{stepBadge}</Chip>
                            {stepSubtitle && <Chip size="sm" variant="flat" className="ml-2">{stepSubtitle}</Chip>}
                        </BreadcrumbItem>
                    </Breadcrumbs>
                </NavbarContent>)} */}

                <NavbarBrand
                    className={`bg-content2 dark:bg-content2 absolute left-1/2 top-1/2 hidden h-12 w-full max-w-fit -translate-x-1/2 -translate-y-1/2 transform items-center px-4 sm:flex rounded-full border border-default-100 dark:border-default-100/40 shadow-lg p-0 ${flow.rfc && showRfc ? "lg:pl-8" : "lg:px-10"}`}
                >
                    {/* Light mode */}
                    <Image
                        alt="Logo"
                        src="/liquicapital-oscuro.png"
                        width={120}
                        className="block dark:hidden"
                    />
                    {/* Dark mode (fallback to original) */}
                    <Image
                        alt="Logo"
                        src="/logo.png"
                        width={120}
                        className="hidden dark:block"
                    />
                    <span className="mx-4">
                        +
                    </span>
                    <Image
                        alt="Logo"
                        src="https://s3.us-east-1.amazonaws.com/liquicapital-dev.liquicapital.com/logos/8.png"
                        width={70}
                        className="dark:filter-none filter invert"
                    />
                    {flow.rfc && showRfc && (
                        <Chip size="md" variant="flat" color="primary" startContent={<Icon icon={"line-md:account-small"} fontSize={"20"} />} className="font-bold ml-5 flex h-12 max-w-fit items-center gap-3 rounded-full border border-primary-200 dark:border-default-100/40 shadow-lg p-0 lg:px-5">
                            {flow.rfc || ""}
                        </Chip>)}
                </NavbarBrand>

                {/* DERECHA */}
                <NavbarContent className="ml-auto" justify="end">
                    <NavbarItem className="hidden sm:flex">
                        <Tooltip content="Expediente" placement="bottom">
                            <Button
                                radius="full"
                                variant="light"
                                onPress={() => setIsExpedienteOpen(true)}
                                className="lg:bg-content2 lg:dark:bg-content2 flex h-12 min-w-50 items-center gap-3 rounded-full border border-default-100 dark:border-default-100/40 shadow-lg p-0 lg:px-3"
                            >
                                <Icon className="text-primary mx-1" icon="line-md:folder" width={35} />
                                <Divider orientation="vertical" className="h-6" />
                                <Progress
                                    aria-label="Avance del expediente"
                                    className="max-w-md pr-3 pl-1"
                                    color="success"
                                    showValueLabel
                                    size="sm"
                                    value={70}
                                />
                            </Button>
                        </Tooltip>
                    </NavbarItem>
                </NavbarContent>

                <NavbarContent
                    className="lg:bg-content2 lg:dark:bg-content2 ml-auto flex h-12 max-w-fit items-center gap-3 rounded-full border border-default-100 dark:border-default-100/40 shadow-lg p-0 lg:px-5"
                    justify="end"
                >


                    {/* Darkmode toggle */}
                    <NavbarItem className="hidden sm:flex">
                        <ThemeSwitch />
                    </NavbarItem>

                    {/* Notificaciones (disabled) */}
                    <NavbarItem className="hidden sm:flex">
                        <Badge content="5" color="danger">
                            <Tooltip content="Notificaciones (pronto)" placement="bottom">
                                <Button isIconOnly radius="full" variant="light" >
                                    <Icon className="text-default-500" icon="solar:bell-linear" width={22} />
                                </Button>
                            </Tooltip>
                        </Badge>
                    </NavbarItem>

                    {/* Avatar con menú */}
                    <NavbarItem className="px-2">
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <button className="mt-1 h-8 w-8 transition-transform outline-hidden">
                                    <Badge
                                        className="border-transparent"
                                        color="success"
                                        content=""
                                        placement="bottom-right"
                                        shape="circle"
                                        size="sm"
                                    >
                                        <Avatar size="sm" name={displayName} showFallback />
                                    </Badge>
                                </button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Acciones de perfil" variant="flat" onAction={(key) => {
                                if (key === "logout") logout();
                                if (key === "vinculaciones") redirect("/vinculacion/mis-vinculaciones");
                            }}>
                                <DropdownItem key="profile" className="h-14 gap-2">
                                    <p className="font-semibold">Sesión iniciada como</p>
                                    <p className="font-semibold">{name}</p>
                                </DropdownItem>
                                <DropdownItem key="vinculaciones" color="primary" endContent={<Icon icon="line-md:list" />}>
                                    Cambiar empresa
                                </DropdownItem>
                                <DropdownItem key="solicitudes" color="primary" endContent={<Icon icon="line-md:file-document" />}>
                                    Mis solicitudes
                                </DropdownItem>
                                <DropdownItem key="logout" color="danger" endContent={<Icon icon="line-md:logout" />}>
                                    Cerrar sesión
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </NavbarItem>
                </NavbarContent>
            </Navbar >

            <StepExpedienteModal
                isOpen={isExpedienteOpen}
                onClose={() => setIsExpedienteOpen(false)}
                folderId={"335014"}
                rfc={"OSM0302038B5"}
                id={"da04311e-f827-4c32-900a-70dd3bbe8342"}
            />
        </>
    );
}
