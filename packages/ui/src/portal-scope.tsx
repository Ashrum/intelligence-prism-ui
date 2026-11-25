"use client";

import type { Dialog } from "@base-ui/react/dialog";
import { createContext, useContext, type ReactNode } from "react";

export type PortalContainer = Dialog.Portal.Props["container"];

export interface PortalScopeProps {
  children: ReactNode;
  /** A host inside the theme boundary and outside clipping or transformed surfaces. */
  container?: PortalContainer;
}

const PortalContext = createContext<PortalContainer>(undefined);

/** A scope supplies the default portal host for the COSS popups below it. */
export function PortalScope({ children, container }: PortalScopeProps) {
  return <PortalContext.Provider value={container}>{children}</PortalContext.Provider>;
}

export function usePortalProps<T extends { container?: PortalContainer }>(
  props?: T,
): T | (T & { container: PortalContainer }) | { container: PortalContainer } | undefined {
  const container = useContext(PortalContext);
  if (props?.container !== undefined || container === undefined) return props;
  return { ...props, container };
}
