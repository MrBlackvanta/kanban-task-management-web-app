import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-purple text-white not-aria-disabled:hover:bg-purple-hover",
  secondary:
    "bg-secondary text-purple not-aria-disabled:hover:bg-secondary-hover",
  destructive: "bg-red text-white not-aria-disabled:hover:bg-red-hover",
};

type ButtonProps = Omit<ComponentProps<"button">, "type"> & {
  type?: "button" | "submit";
  variant: keyof typeof VARIANTS;
};

export default function Button({
  type = "button",
  variant,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type === "submit" ? "submit" : "button"}
      className={`h-10 rounded-full px-4 text-button transition-[background-color] aria-disabled:cursor-not-allowed aria-disabled:opacity-25 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
