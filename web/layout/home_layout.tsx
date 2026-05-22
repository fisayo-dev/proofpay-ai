import { SiteHeader } from "@/components/home/site-header";
import { SiteFooter } from "@/components/home/site-footer";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SiteHeader />
      <main className="app-container py-32">{children}</main>
      <SiteFooter />
    </div>
  );
};

export default HomeLayout;
