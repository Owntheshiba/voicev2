"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-blue-900 group-[.toaster]:to-purple-900 group-[.toaster]:text-white group-[.toaster]:border-blue-700 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-md",
          description: "group-[.toast]:text-blue-100 group-[.toast]:opacity-90",
          actionButton:
            "group-[.toast]:bg-gradient-to-r group-[.toast]:from-purple-500 group-[.toast]:to-pink-500 group-[.toast]:text-white group-[.toast]:border-purple-300 group-[.toast]:shadow-lg",
          cancelButton:
            "group-[.toast]:bg-blue-800/30 group-[.toast]:text-blue-200 group-[.toast]:border-blue-600 group-[.toast]:hover:bg-blue-700/40",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
