"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavLinkProps = React.ComponentProps<typeof Link> & {
  exact?: boolean
}

export function NavLink({ exact = false, href, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const target = typeof href === "string" ? href : href.pathname ?? ""
  const active = exact
    ? pathname === target
    : pathname === target || pathname.startsWith(`${target}/`)

  return (
    <Link
      {...props}
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : undefined}
    />
  )
}
