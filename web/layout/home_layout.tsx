import { SiteHeader } from "@/components/home/site-header";

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <SiteHeader />
       <div className="mt-10 py-20 app-container">{children}</div>
    </div>
  );
};

export default HomeLayout;
