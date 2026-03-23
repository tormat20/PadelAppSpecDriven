import { useEffect } from "react"

export function createBeforeUnloadHandler() {
  return (event: BeforeUnloadEvent) => {
    event.preventDefault()
    event.returnValue = ""
  }
}

export function useUnsavedCalendarGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onBeforeUnload = createBeforeUnloadHandler()

    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [enabled])
}
