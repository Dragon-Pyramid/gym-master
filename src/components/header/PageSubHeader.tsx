// components/PageSubheader.tsx
interface PageSubheaderProps {
  text: string;
  children?: React.ReactNode;
}

export function PageSubheader({ text, children }: PageSubheaderProps) {
  return (
    <div className="w-full flex flex-col items-center gap-2 xl:relative xl:h-[60px] xl:flex-row xl:items-center xl:justify-center bg-[#02a8e1] p-4 border border-border rounded-sm">
      <p className="text-white xl:absolute xl:left-6">{text}</p>
      <div className="w-full flex justify-start xl:justify-center xl:w-auto">
        {children}
      </div>
    </div>
  );
}
