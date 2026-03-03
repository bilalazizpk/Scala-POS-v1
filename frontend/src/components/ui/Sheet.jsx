import * as React from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

const Sheet = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
};

const SheetContent = ({ side = "left", className, children, onOpenChange }) => {
  return (
    <div
      className={cn(
        "fixed z-50 bg-slate-900 text-white shadow-lg transition-transform duration-300 ease-in-out h-full",
        side === "left" ? "left-0 top-0 w-64 translate-x-0" : "right-0 top-0 w-64 translate-x-0",
        className
      )}
    >
      {children}
    </div>
  );
};

const SheetHeader = ({ className, children }) => (
  <div className={cn("flex flex-col space-y-2 p-4", className)}>
    {children}
  </div>
);

const SheetClose = ({ onOpenChange, children }) => (
  <button 
    onClick={() => onOpenChange(false)}
    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
);

export { Sheet, SheetContent, SheetHeader, SheetClose };
