import React from "react";
import { Tooltip } from "@heroui/react";
import { cn } from "@heroui/react";

export const OverflowTooltip: React.FC<{
    children: React.ReactNode;
    className?: string;         // estilos del contenedor visible
    tooltipClassName?: string;  // estilos del contenido del tooltip
}> = ({ children, className, tooltipClassName }) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    const [overflow, setOverflow] = React.useState(false);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const check = () =>
            setOverflow(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);

        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        const mo = new MutationObserver(check);
        mo.observe(el, { childList: true, characterData: true, subtree: true });

        return () => {
            ro.disconnect();
            mo.disconnect();
        };
    }, []);

    const content = (
        <span
            ref={ref}
            className={cn("block overflow-hidden text-ellipsis whitespace-nowrap", className)}
        >
            {children}
        </span>
    );

    if (!overflow) return content;

    return (
        <Tooltip
            placement="top"
            closeDelay={50}
            content={<div className={cn("max-w-[60ch] break-words", tooltipClassName)}>{children}</div>}
        >
            {content}
        </Tooltip>
    );
};