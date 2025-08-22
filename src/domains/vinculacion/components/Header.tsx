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
    Image
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { ThemeSwitch } from "@/components/theme-switch"; // tu componente
import { useVinculacionFlow } from "../context/flow-context";

type HeaderProps = {
    stepTitle: string;
    stepBadge: string;   // “X de Y”
    stepSubtitle?: string;
    rfc?: string | null;
};

export default function Header({ stepTitle, stepBadge, stepSubtitle, rfc }: HeaderProps) {
    const flow = useVinculacionFlow();
    const isAuth = useIsAuthenticated();
    const { instance } = useMsal();

    const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
    const displayName = account?.name || account?.username || "Usuario";
    const email = account?.username || "";

    const logout = () => {
        instance.logoutRedirect({ postLogoutRedirectUri: "/" }).catch(console.error);
    };

    return (
        <Navbar
            classNames={{
                base: "lg:bg-transparent lg:backdrop-filter-none",
                wrapper: "px-4 sm:px-6",
            }}
            height="80px"
            maxWidth="full"
        >
            {/* Marca (opcional, puedes dejar solo el breadcrumb en centro si no quieres logo) */}
            <NavbarBrand className="ml-auto flex h-12 max-w-fit items-center gap-3 rounded-full border border-default-100 dark:border-default-100/40 shadow-lg p-0 lg:px-5 ">
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
                +
                <Image
                    alt="Logo"
                    src="https://s3.us-east-1.amazonaws.com/liquicapital-dev.liquicapital.com/logos/8.png"
                    width={80}
                />
            </NavbarBrand>

            <Tooltip content={flow.sidebarCollapsed ? "Mostrar pasos" : "Ocultar pasos"}>
                <Button
                    isIconOnly
                    variant="light"
                    radius="full"
                    onPress={() => {
                        flow.toggleSidebar();
                        console.log("Sidebar toggled", flow.sidebarCollapsed);
                    }}
                    className=" border border-default-100 dark:border-default-100/40 shadow-xl bg-content2 dark:bg-content2"
                >
                    <Icon
                        icon={flow.sidebarCollapsed ? "lucide:panel-right-open" : "lucide:panel-left-close"}
                        width={22}
                        className="text-default-600"
                    />
                </Button>
            </Tooltip>

            {/* CENTRO: breadcrumb */}
            <NavbarContent
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
            </NavbarContent>

            {/* DERECHA */}
            <NavbarContent
                justify="end"
            >
                {/* RFC */}
                {flow.rfc && (
                    <Chip size="md" variant="flat" color="primary" startContent={<Icon icon={"line-md:account-small"} fontSize={"20"} />} className="font-bold ml-auto flex h-12 max-w-fit items-center gap-3 rounded-full border border-primary-200 dark:border-default-100/40 shadow-lg p-0 lg:px-5">
                        {flow.rfc || ""}
                    </Chip>)}
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
                    <Tooltip content="Notificaciones (pronto)" placement="bottom">
                        <Button isIconOnly radius="full" variant="light" isDisabled>
                            <Icon className="text-default-500" icon="solar:bell-linear" width={22} />
                        </Button>
                    </Tooltip>
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
                        }}>
                            <DropdownItem key="profile" className="h-14 gap-2">
                                <p className="font-semibold">Sesión iniciada como</p>
                                <p className="font-semibold">{email}</p>
                            </DropdownItem>
                            <DropdownItem key="logout" color="danger">
                                Cerrar sesión
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
}
