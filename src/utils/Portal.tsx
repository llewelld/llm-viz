'use client';

import clsx from "clsx";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { assignImm } from "./data";
import s from './Portal.module.scss';

export const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let doc = typeof window !== 'undefined' ? window.document : null;
    let portalEl = doc?.getElementById('portal-container') ?? doc?.body ?? null;
    return portalEl ? createPortal(children, portalEl) : null;
};


export const FullscreenOverlay: React.FC<{
    className?: string,
    onClick?: React.MouseEventHandler,
    children: React.ReactNode,
}> = ({ className, onClick, children }) => {

    function handleClick(ev: React.MouseEvent) {
        ev.stopPropagation();
        if (ev.target === ev.currentTarget) {
            onClick?.(ev);
        }
    };

    return <Portal>

        <div className={clsx(s.fullscreenOverlay, className)} onClick={handleClick}>
            {children}
        </div>
    </Portal>;
}

export const ModalWindow: React.FC<{
    className?: string,
    backdropClassName?: string,
    onBackdropClick?: React.MouseEventHandler,
    children: React.ReactNode,
}> = ({ className, backdropClassName, onBackdropClick, children }) => {

    return <FullscreenOverlay className={clsx(s.modalWindowBackdrop, backdropClassName)} onClick={onBackdropClick}>
        <div className={clsx(s.modalWindow, className)}>
            {children}
        </div>
    </FullscreenOverlay>;
}

export enum PopupPos {
    BottomLeft, // we position the popup below the target, and left-align it
}

export const Popup: React.FC<{
    targetEl: HTMLElement | null,
    placement: PopupPos,
    children?: React.ReactNode,
    className?: string,
    closeBackdrop?: boolean,
    onClose?: () => void,
}> = ({ targetEl, placement, children, className, closeBackdrop, onClose }) => {
    let [popupEl, setPopupEl] = useState<HTMLElement | null>(null);
    let targetBcr = useWatchElementRect(targetEl, true);
    let popupBcr = useWatchElementRect(popupEl); // we don't need position info for the popup (would cause an infinite loop)

    let pos = computeTransform(targetBcr, popupBcr, placement);

    let el = <div ref={setPopupEl} className={clsx(s.popup, className)} style={{
        left: pos.x,
        top: pos.y,
    }}>
        {children}
    </div>;

    function handleClick(ev: React.MouseEvent) {
        // ensure the click was directly on the backdrop & not a child
        if (ev.target === ev.currentTarget) {
            onClose?.();
        }
    }

    return <Portal>
        {closeBackdrop ? <div className={s.popupBackdrop} onClick={handleClick}>{el}</div> : el}
    </Portal>;
};

function computeTransform(targetBcr: DOMRect | null, popupBcr: DOMRect | null, placement: PopupPos) {
    if (!targetBcr || !popupBcr) {
        return { x: 0, y: 0 };
    }

    let x = 0;
    let y = 0;

    switch (placement) {
        case PopupPos.BottomLeft:
            x = targetBcr.x;
            y = targetBcr.bottom;
            break;
    }

    return { x, y };
}

export function useWatchElementRect(el: HTMLElement | null, includePosition = false) {
    let [bcr, setBcr] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        function handleChange() {
            let bcr = el ? el.getBoundingClientRect() : null;
            setBcr(prev => (el && prev) ? assignImm(prev, {
                x: includePosition ? bcr!.x : 0,
                y: includePosition ? bcr!.y : 0,
                width: bcr!.width,
                height: bcr!.height,
            }) : bcr);
        }

        if (el) {
            let observer = new ResizeObserver(handleChange);
            observer.observe(el);
            handleChange();
            return () => {
                observer.unobserve(el);
                setBcr(null);
            };
        }
    }, [el]);
    return bcr;
}