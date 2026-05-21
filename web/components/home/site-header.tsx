import { Button } from "../ui/button";

export function SiteHeader() {
  return (
    <header className="fixed z-30 w-full bg-transparent py-6 backdrop-blur-sm">
      <div className="app-container relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h2 className="text-3xl font-extrabold text-primary">Proof Pay</h2>
            {/* Links*/}
            <div className="hidden md:flex items-center text-sm">
              {["Product", "Github", ""].map((link, index) => (
                <div
                  key={index}
                  className="px-3 py-2 rounded-full cursor-pointer hover:bg-gray-100"
                >
                  {link}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button>Signup as vendor/buyer</Button>
            {/*<Button variant="outline">Login</Button>*/}
          </div>
        </div>
      </div>
    </header>
  );
}
