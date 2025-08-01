
import { cn } from "@/lib/utils";

export default function AppLogo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("lucide lucide-gantt-chart", className)}
        >
            <path d="M8 6h10" />
            <path d="M6 12h9" />
            <path d="M11 18h7" />
        </svg>
    );
}
