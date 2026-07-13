import type { HttpMethod } from "@/lib/docs/spec"

const styles: Record<HttpMethod, string> = {
  GET: "text-method-get border-method-get/30 bg-method-get/10",
  POST: "text-method-post border-method-post/30 bg-method-post/10",
  HEAD: "text-method-head border-method-head/30 bg-method-head/10",
  OPTIONS: "text-method-options border-method-options/30 bg-method-options/10",
}

export function MethodBadge({
  method,
  className = "",
}: {
  method: HttpMethod
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-wide ${styles[method]} ${className}`}
    >
      {method}
    </span>
  )
}
