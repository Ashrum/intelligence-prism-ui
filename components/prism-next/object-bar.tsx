"use client";

import { Fragment, type ComponentProps, type ReactNode } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/coss/breadcrumb";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";
import "./page-navigation.css";

export interface ObjectBarProps extends ComponentProps<"header"> {
  back: Omit<ButtonProps, "children" | "variant">;
  breadcrumbs: readonly (Omit<ComponentProps<typeof BreadcrumbLink>, "children"> & { id: string; label: ReactNode })[];
  actions?: ReactNode;
}

/** The final breadcrumb is the current object; no preview runtime is embedded. */
export function ObjectBar({ back, breadcrumbs, actions, className, ...props }: ObjectBarProps) {
  return <header {...props} className={cn("bp-object-bar", className)}>
    <Button {...back} variant="outline">← 返回</Button>
    <Breadcrumb aria-label="对象路径">
      <BreadcrumbList className="text-ui-meta">
        {breadcrumbs.map(({ id, label, ...link }, index) => <Fragment key={id}>
          {index > 0 && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
          <BreadcrumbItem>{index === breadcrumbs.length - 1
            ? <BreadcrumbPage>{label}</BreadcrumbPage>
            : <BreadcrumbLink {...link}>{label}</BreadcrumbLink>}
          </BreadcrumbItem>
        </Fragment>)}
      </BreadcrumbList>
    </Breadcrumb>
    {actions && <div className="bp-object-bar-actions">{actions}</div>}
  </header>;
}
