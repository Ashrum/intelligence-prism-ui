"use client";

import type { Dialog } from "@base-ui/react/dialog";
import { createContext, useContext, type ReactNode } from "react";

export type PortalContainer = Dialog.Portal.Props["container"];
export type OleContext = "light" | "dark" | "paperForcedLight";
export type OleDensity = "default" | "compact";

export interface OlePortalContext {
  /** Effective context of the logical host. */
  oleContext?: OleContext;
  oleDensity?: OleDensity;
}

export interface PortalScopeProps extends OlePortalContext {
  children: ReactNode;
  /** A host inside the theme boundary and outside clipping or transformed surfaces. */
  container?: PortalContainer;
}

type ScopedPortal = OlePortalContext & { container?: PortalContainer };
type OlePortalAttributes = { "data-ole-context"?: OleContext; "data-ole-density"?: OleDensity };
const PortalContext = createContext<ScopedPortal>({});

/** A scope supplies the portal host and effective theme for the COSS popups below it. */
export function PortalScope(props: PortalScopeProps) {
  const { children, container, oleContext, oleDensity } = props;
  const parent = useContext(PortalContext);
  const value = {
    container: !("container" in props) && (oleContext || oleDensity) ? parent.container : container,
    oleContext: oleContext ?? parent.oleContext,
    oleDensity: oleDensity ?? parent.oleDensity,
  };
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

/** Use on a custom portal host to mirror the logical scope it serves. */
export function useOlePortalAttributes(): OlePortalAttributes {
  const { oleContext, oleDensity } = useContext(PortalContext);
  return {
    ...(oleContext && { "data-ole-context": oleContext }),
    ...(oleDensity && { "data-ole-density": oleDensity }),
  };
}

export function usePortalProps<T extends { container?: PortalContainer }>(
  props?: T,
): ((T | { container?: PortalContainer }) & OlePortalAttributes) | undefined {
  const { container } = useContext(PortalContext);
  const attributes = useOlePortalAttributes();
  const hasLogicalScope = attributes["data-ole-context"] || attributes["data-ole-density"];
  if (!hasLogicalScope && (props?.container !== undefined || container === undefined)) return props;
  return {
    ...props,
    ...(props?.container === undefined && container !== undefined && { container }),
    ...attributes,
  };
}
