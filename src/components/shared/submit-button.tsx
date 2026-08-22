"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({ children, ...props }: ButtonProps) { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending} {...props}>{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? "Please wait…" : children}</Button>; }
