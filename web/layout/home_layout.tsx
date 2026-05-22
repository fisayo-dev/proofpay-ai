import { SiteHeader } from "@/components/home/site-header";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SiteHeader />
      <main className="app-container pt-32">{children}</main>
    </div>
  );
};

export default HomeLayout;
