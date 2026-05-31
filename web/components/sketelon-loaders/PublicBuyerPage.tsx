import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SkeletonBlock = ({ className }: { className: string }) => {
  return <div className={`animate-pulse bg-muted ${className}`} />;
};

const SkeletonIcon = () => {
  return <SkeletonBlock className="size-5 shrink-0 rounded-md" />;
};

const PublicBuyerPageSkeleton = () => {
  return (
    <main className="bg-background">
      <section className="app-container py-6 sm:py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)]">
              <SkeletonBlock className="aspect-[4/3] w-full rounded-none sm:aspect-[16/9]" />

              <div className="grid gap-5 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <SkeletonBlock className="h-7 w-44 rounded-md" />
                  <SkeletonBlock className="h-7 w-28 rounded-md" />
                </div>

                <div className="space-y-3">
                  <SkeletonBlock className="h-10 w-full max-w-2xl rounded-lg sm:h-14" />
                  <SkeletonBlock className="h-10 w-3/4 max-w-xl rounded-lg sm:h-14" />
                  <div className="space-y-2 pt-1">
                    <SkeletonBlock className="h-4 w-full max-w-2xl rounded-md" />
                    <SkeletonBlock className="h-4 w-11/12 max-w-xl rounded-md" />
                    <SkeletonBlock className="h-4 w-2/3 max-w-md rounded-md" />
                  </div>
                </div>

                <div className="grid gap-3 border-t border-border/70 pt-5 sm:flex sm:justify-between">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <SkeletonIcon />
                      <div className="space-y-2">
                        <SkeletonBlock className="h-4 w-32 rounded-md" />
                        <SkeletonBlock className="h-3 w-28 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <Card className="border border-border/70 bg-card shadow-[0_24px_80px_-56px_rgba(15,23,42,0.3)]">
              <CardHeader className="gap-4 px-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-7 w-40 rounded-md" />
                    <div className="space-y-2">
                      <SkeletonBlock className="h-8 w-full max-w-md rounded-lg" />
                      <SkeletonBlock className="h-4 w-full max-w-2xl rounded-md" />
                      <SkeletonBlock className="h-4 w-4/5 max-w-xl rounded-md" />
                    </div>
                  </div>

                  <SkeletonBlock className="h-8 w-28 rounded-full" />
                </div>
              </CardHeader>

              <CardContent className="grid gap-3 px-5 pb-5 sm:px-6">
                <div className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-background px-4 py-3">
                  <SkeletonBlock className="h-5 w-48 rounded-md" />
                  <SkeletonBlock className="size-4 rounded-md" />
                </div>

                <div className="grid gap-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border/60 bg-background px-4 py-3"
                    >
                      <SkeletonBlock className="h-4 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card className="border border-border/70 bg-card shadow-[0_24px_80px_-52px_rgba(15,23,42,0.35)]">
              <CardHeader className="gap-4 px-5 sm:px-6">
                <div className="space-y-2">
                  <SkeletonBlock className="h-8 w-52 rounded-lg" />
                  <SkeletonBlock className="h-4 w-60 rounded-md" />
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-5 pb-5 sm:px-6">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-5">
                  <SkeletonBlock className="h-3 w-24 rounded-md" />
                  <SkeletonBlock className="mt-3 h-11 w-44 rounded-lg" />
                </div>

                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3"
                    >
                      <SkeletonIcon />
                      <div className="min-w-0 flex-1 space-y-2">
                        <SkeletonBlock className="h-3 w-24 rounded-md" />
                        <SkeletonBlock className="h-4 w-3/4 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>

                <SkeletonBlock className="h-10 w-full rounded-lg bg-primary/20" />
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default PublicBuyerPageSkeleton;
