import { Button } from "./ui/button"
import { Bell, Home, Settings, User } from "lucide-react"

export default function Demo() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">shadcn/ui + Tailwind CSS Demo</h1>
        <p className="text-muted-foreground">
          This demonstrates that Tailwind CSS, shadcn/ui, and Lucide icons are working correctly.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Button Sizes</h2>
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Icon Buttons</h2>
        <div className="flex gap-4">
          <Button size="icon">
            <Home className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary">
            <User className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Lucide Icons</h2>
        <div className="flex gap-4">
          <Home className="h-8 w-8 text-primary" />
          <Settings className="h-8 w-8 text-secondary" />
          <User className="h-8 w-8 text-muted-foreground" />
          <Bell className="h-8 w-8 text-destructive" />
        </div>
      </div>
    </div>
  )
}
