export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
      <path
        d="M9 23V9H18.5C20.9853 9 23 11.0147 23 13.5C23 15.9853 20.9853 18 18.5 18H14"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 18L18 23"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
