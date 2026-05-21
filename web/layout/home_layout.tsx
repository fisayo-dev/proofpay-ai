import { SiteHeader } from "@/components/home/site-header";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SiteHeader />
      <div className="py-28 app-container">{children}</div>
    </div>
  );
};

export default HomeLayout;
