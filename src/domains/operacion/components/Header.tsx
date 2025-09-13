"use client";

import React, { useState } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    Button,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Tooltip,
    Badge,
    Image
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { useOperacionFlow } from "../context/flow-context";
import { redirect, useParams } from "next/navigation";

type HeaderProps = {
    stepTitle: string;
    stepBadge: string;   // “X de Y”
    stepSubtitle?: string;
    rfc?: string | null;
    showSteps?: boolean;
    showIsCollabsable?: boolean;
    showRfc?: boolean;
};

export default function Header({ stepTitle, stepBadge, stepSubtitle, showSteps = true, showIsCollabsable = true, showRfc = true }: HeaderProps) {
    const flow = useOperacionFlow();
    const isAuth = useIsAuthenticated();
    const { rfc, id, idLote } = useParams<{ rfc: string; id: string; idLote: string }>();
    const { instance } = useMsal();

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

                <NavbarBrand
                    className={`bg-content2 dark:bg-content2 absolute left-1/2 top-1/2 hidden h-12 w-full max-w-fit -translate-x-1/2 -translate-y-1/2 transform items-center px-4 sm:flex rounded-full border border-default-100 dark:border-default-100/40 shadow-lg p-6 lg:px-10`}
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

                </NavbarBrand>

                {/* DERECHA */}
                <NavbarContent className="ml-auto" justify="end">
                    {flow.rfc && showRfc && (
                        <Chip
                            size="md"
                            variant="flat"
                            color="primary"
                            startContent={<Icon icon={"line-md:account-small"} fontSize={"20"} />}
                            className="font-bold ml-0 flex h-12 max-w-fit items-center gap-3 rounded-full border border-primary-200 dark:border-default-100/40 shadow-lg p-0 lg:px-5"
                        >
                            {flow.rfc || ""}
                        </Chip>
                    )}
                </NavbarContent>

                <NavbarContent
                    className="lg:bg-content2 lg:dark:bg-content2 ml-auto flex h-12 max-w-fit items-center gap-3 rounded-full border border-default-200 dark:border-default-200/40 shadow-lg p-0 lg:px-5"
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
                    <NavbarItem className="pl-2">
                        <Dropdown placement="bottom-end">
                            <DropdownTrigger>
                                <button className="h-8 w-8 transition-transform outline-hidden">
                                    <Avatar showFallback src="https://images.unsplash.com/broken" size="sm" className="-mt-2" />
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
                                <DropdownItem key="solicitudes" color="primary" onClick={() => redirect(`/operaciones-cliente/${rfc}/${id}`)} endContent={<Icon icon="line-md:file-document" />}>
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
            <style jsx>{`
                @keyframes pulseSlow {
                    0%,100% { transform: scale(1); opacity:.85; }
                    50% { transform: scale(1.07); opacity:1; }
                }
                .animate-pulse-slow {
                    animation: pulseSlow 3.2s ease-in-out infinite;
                }
                .waves {
                    display:inline-flex;
                    align-items:flex-end;
                    gap:4px;
                    height:18px;
                    padding:2px 0;
                }
                .waves span {
                    width:4px;
                    background:linear-gradient(180deg,#16a34a,#047857);
                    border-radius:3px;
                    animation:wave 1.2s ease-in-out infinite;
                    transform-origin:50% 100%;
                    opacity:.85;
                }
                .waves span:nth-child(1){ animation-delay:0s; height:25%; }
                .waves span:nth-child(2){ animation-delay:.15s; height:55%; }
                .waves span:nth-child(3){ animation-delay:.30s; height:85%; }
                .waves span:nth-child(4){ animation-delay:.45s; height:55%; }
                .waves span:nth-child(5){ animation-delay:.60s; height:35%; }
                @keyframes wave {
                    0%,100% { transform:scaleY(.4); }
                    50% { transform:scaleY(1); }
                }
                :global(.dark) .waves span {
                    background:linear-gradient(180deg,#22c55e,#15803d);
                }
            `}</style>
        </>
    );
}
