import { cva } from "class-variance-authority"
import styles from "./button.module.css"

const buttonVariants = cva(styles.button, {
  variants: {
    variant: {
      default: styles.primary,
      primary: styles.primary,
      secondary: styles.secondary,
      outline: styles.outline,
      ghost: styles.ghost,
      "ai-soft": styles.aiSoft,
      "ai-primary": styles.aiPrimary,
      destructive: styles.destructive,
      link: styles.link,
    },
    size: {
      default: "",
      xs: styles.xs,
      sm: styles.sm,
      lg: styles.lg,
      icon: styles.icon,
      "icon-xs": `${styles.icon} ${styles.xs}`,
      "icon-sm": `${styles.icon} ${styles.sm}`,
      "icon-lg": `${styles.icon} ${styles.lg}`,
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})

export { buttonVariants }
