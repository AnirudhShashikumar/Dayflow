"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({ children, pendingLabel = "Please wait…", ...props }: ButtonProps & { pendingLabel?: React.ReactNode }) { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending} {...props}>{pending && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />}{pending ? pendingLabel : children}</Button>; }
