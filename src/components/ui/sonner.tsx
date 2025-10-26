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
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-gray-300 group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-md",
          description: "group-[.toast]:text-gray-700 group-[.toast]:opacity-90",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white group-[.toast]:border-gray-400 group-[.toast]:shadow-md group-[.toast]:hover:bg-gray-800",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-black group-[.toast]:border-gray-300 group-[.toast]:hover:bg-gray-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
