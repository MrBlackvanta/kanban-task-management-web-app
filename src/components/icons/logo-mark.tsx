export default function LogoMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="25"
      viewBox="0 0 24 25"
      fill="#635FC7"
      {...props}
      role="img"
      aria-label="kanban"
    >
      <rect width="6" height="25" rx="2" />
      <rect x="9" width="6" height="25" rx="2" opacity="0.75" />
      <rect x="18" width="6" height="25" rx="2" opacity="0.5" />
    </svg>
  );
}
