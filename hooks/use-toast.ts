
"use client"

import * as React from "react"

type ToastVariant = "default" | "destructive"

type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: ToastVariant
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ToastInput = Omit<ToastProps, "id" | "open" | "onOpenChange">

type ToastState = {
  toasts: ToastProps[]
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function notify() {
  listeners.forEach((listener) => listener(memoryState))
}

function toast(props: ToastInput) {
  const id = Math.random().toString(36).slice(2)

  const dismiss = () => {
    memoryState = {
      toasts: memoryState.toasts.filter((item) => item.id !== id),
    }
    notify()
  }

  memoryState = {
    toasts: [
      ...memoryState.toasts,
      {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
        },
      },
    ],
  }

  notify()

  return {
    id,
    dismiss,
    update: (updatedProps: Partial<ToastInput>) => {
      memoryState = {
        toasts: memoryState.toasts.map((item) =>
          item.id === id ? { ...item, ...updatedProps } : item
        ),
      }
      notify()
    },
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (id?: string) => {
      memoryState = {
        toasts: id
          ? memoryState.toasts.filter((item) => item.id !== id)
          : [],
      }
      notify()
    },
  }
}

export { useToast, toast }
