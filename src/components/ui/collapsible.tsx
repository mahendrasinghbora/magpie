import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

import { cn } from "@/lib/utils"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      forceMount
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]",
        className
      )}
      {...props}
    >
      <div className="overflow-hidden">{children}</div>
    </CollapsiblePrimitive.Content>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
