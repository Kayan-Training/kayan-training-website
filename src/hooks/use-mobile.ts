import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const getSnapshot = React.useCallback(
    () =>
      typeof window !== "undefined"
        ? window.innerWidth < MOBILE_BREAKPOINT
        : false,
    []
  )

  const subscribe = React.useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") {
      return () => undefined
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", onStoreChange)
    return () => mql.removeEventListener("change", onStoreChange)
  }, [])

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
