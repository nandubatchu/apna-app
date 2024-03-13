import { cn } from "@/lib/utils";

function Header({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="h-[50px]">
    <div className={cn("fixed bg-white h-[50px] w-full flex items-center justify-between px-2", className)} {...props}>
      
      {children}
    </div>
    </div>
  );
}

export { Header };
