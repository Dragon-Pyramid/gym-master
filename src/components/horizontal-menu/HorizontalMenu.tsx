import { useEffect, useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import menuItems from "./menuItems";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

function MenuDropdown({ item }: { item: any }) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemHover = (subItem: any) => {
    if (subItem.hasChildren) {
      setHoveredItem(subItem.title);
    } else {
      setHoveredItem(null);
    }
  };

  const handleItemClick = (subItem: any, e: React.MouseEvent) => {
    if (subItem.hasChildren) {
      e.preventDefault();
      setHoveredItem(hoveredItem === subItem.title ? null : subItem.title);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return (
    <div className="relative flex" onMouseLeave={handleMouseLeave}>
      <div className="w-[300px] p-2 max-h-[400px] overflow-y-auto">
        <div className="space-y-1">
          {item.items.map((subItem: any) => (
            <div
              key={subItem.title}
              className="relative"
              onMouseEnter={() => handleItemHover(subItem)}
            >
              <div
                className={`flex items-center justify-between select-none rounded-md p-3 leading-none no-underline outline-none transition-colors cursor-pointer ${
                  hoveredItem === subItem.title
                    ? "bg-muted text-foreground"
                    : "hover:text-foreground"
                }`}
                onClick={(e) => handleItemClick(subItem, e)}
              >
                {subItem.hasChildren ? (
                  <span className="text-sm font-medium leading-none text-foreground flex-1">
                    {subItem.title}
                  </span>
                ) : (
                  <NavigationMenuLink asChild>
                    <Link
                      href={subItem.href}
                      className="text-sm font-medium leading-none text-foreground flex-1"
                    >
                      {subItem.title}
                    </Link>
                  </NavigationMenuLink>
                )}
                {subItem.hasChildren && (
                  <ChevronRight className="h-4 w-4 text-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hoveredItem && (
        <div className="w-[300px] p-2 max-h-[400px] overflow-y-auto bg-secondary border-l">
          {(() => {
            const activeItem = item.items.find(
              (subItem: any) => subItem.title === hoveredItem
            );
            if (activeItem && activeItem.submenu) {
              return (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="p-3 border-b mb-2">
                    <NavigationMenuLink asChild>
                      <Link
                        href={activeItem.href}
                        className="text-sm font-bold text-foreground"
                      >
                        {activeItem.title}
                      </Link>
                    </NavigationMenuLink>
                  </div>

                  {/* Children items */}
                  {activeItem.submenu.map((subSubItem: any) => (
                    <NavigationMenuLink key={subSubItem.title} asChild>
                      <Link
                        href={subSubItem.href}
                        className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors text-sm text-foreground"
                      >
                        {subSubItem.title}
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
}

function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px] bg-secondary">
        <div className="flex items-center justify-between p-2 border-b text-secondary">
          <span className="font-semibold text-foreground ">Librería Chang</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="text-secondary hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="py-2 overflow-y-auto h-[calc(100vh-64px)]">
          {menuItems.map((item) => (
            <Collapsible
              key={item.title}
              open={openItems[item.title]}
              onOpenChange={() => toggleItem(item.title)}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-3 text-sm font-medium text-foreground hover:muted">
                  <div className="flex items-center gap-3">
                    <span>{item.title}</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openItems[item.title] ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-background">
                {item.items.map((subItem) => (
                  <div key={subItem.title}>
                    {subItem.hasChildren ? (
                      <Collapsible
                        open={openItems[subItem.title]}
                        onOpenChange={() => toggleItem(subItem.title)}
                        className="w-full"
                      >
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center justify-between w-full p-3 pl-10 text-sm text-foreground hover:muted">
                            <span>{subItem.title}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                openItems[subItem.title]
                                  ? "transform rotate-180"
                                  : ""
                              }`}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <Link
                            href={subItem.href}
                            className="block hover:bg-muted p-3 pl-14 text-sm font-medium text-foreground"
                          >
                            {subItem.title}
                          </Link>
                          {subItem.submenu?.map((subSubItem) => (
                            <Link
                              key={subSubItem.title}
                              href={subSubItem.href}
                              className="block p-3 pl-14 text-xs text-foreground hover:bg-muted"
                              onClick={() => setOpen(false)}
                            >
                              {subSubItem.title}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Link
                        href={subItem.href}
                        className="block p-3 pl-10 text-sm text-foreground hover:bg-muted"
                        onClick={() => setOpen(false)}
                      >
                        {subItem.title}
                      </Link>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function HorizontalMenu() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();

    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  return (
    <div className="bg-[#02a8e1]">
      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center p-3">
        <MobileSidebar />
        <div className="w-8"></div>
      </div>

      {/* Desktop Horizontal Menu */}
      <div className="hidden md:block">
        <NavigationMenu className="w-full max-w-full justify-start">
          <NavigationMenuList className="flex-wrap gap-0">
            {menuItems.map((item) => {
              return (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger className="bg-transparent hover:bg-blue-600 text-white font-normal px-4 py-3 h-auto gap-2 border-none">
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <MenuDropdown item={item} />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
export default HorizontalMenu;
