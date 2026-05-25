import { Card, CardContent, CardHeader } from "@/components/ui/card";

const SkeletonBlock = ({ className }: { className: string }) => {
  return <div className={`animate-pulse rounded-full bg-muted ${className}`} />;
};

const PublicBuyerPageSkeleton = () => {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(45,103,255,0.18),transparent_55%)]" />
      <div className="absolute left-1/2 top-40 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <section className="app-container py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <SkeletonBlock className="h-7 w-44 rounded-4xl" />
                <SkeletonBlock className="h-7 w-24 rounded-4xl" />
              </div>

              <div className="space-y-4">
                <div className="grid gap-3">
                  <SkeletonBlock className="h-4 w-36 rounded-md" />
                  <SkeletonBlock className="h-12 w-full max-w-2xl rounded-xl" />
                  <SkeletonBlock className="h-12 w-full max-w-3xl rounded-xl" />
                  <SkeletonBlock className="h-5 w-3/4 rounded-md" />
                </div>

                <div className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-3xl border border-border/70 bg-background/80 p-5 shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)] backdrop-blur">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-24 rounded-md" />
                    <SkeletonBlock className="h-10 w-44 rounded-xl" />
                  </div>
                  <div className="h-10 w-px bg-border/70" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-28 rounded-md" />
                    <SkeletonBlock className="h-6 w-52 rounded-md" />
                  </div>
                </div>
              </div>
            </div>

            <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-7 w-40 rounded-4xl" />
                    <SkeletonBlock className="h-10 w-72 rounded-xl" />
                    <SkeletonBlock className="h-12 w-full max-w-2xl rounded-xl" />
                  </div>

                  <div className="min-w-32 rounded-3xl border border-border/70 bg-background/85 px-5 py-4">
                    <SkeletonBlock className="h-3 w-20 rounded-md" />
                    <SkeletonBlock className="mt-3 h-10 w-16 rounded-xl" />
                    <SkeletonBlock className="mt-2 h-4 w-10 rounded-md" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-border/60 bg-background/75 px-4 py-4"
                  >
                    <SkeletonBlock className="h-5 w-full rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24">
            <Card className="border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(14,30,86,0.28)]">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3">
                    <div className="h-5 w-5 animate-pulse rounded-md bg-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <SkeletonBlock className="h-8 w-44 rounded-lg" />
                    <SkeletonBlock className="h-4 w-56 rounded-md" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-3xl border border-border/70 bg-muted/30 p-5">
                  <SkeletonBlock className="h-3 w-24 rounded-md" />
                  <SkeletonBlock className="mt-3 h-10 w-40 rounded-xl" />
                  <SkeletonBlock className="mt-3 h-4 w-48 rounded-md" />
                </div>

                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border/60 px-4 py-4"
                    >
                      <SkeletonBlock className="h-4 w-20 rounded-md" />
                      <SkeletonBlock className="mt-3 h-5 w-36 rounded-md" />
                    </div>
                  ))}
                </div>

                <div className="h-12 animate-pulse rounded-2xl bg-primary/18" />

                <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-4">
                  <SkeletonBlock className="h-4 w-full rounded-md" />
                  <SkeletonBlock className="mt-2 h-4 w-5/6 rounded-md" />
                </div>

                <div className="grid gap-2">
                  <SkeletonBlock className="h-3 w-40 rounded-md" />
                  <SkeletonBlock className="h-3 w-36 rounded-md" />
                  <SkeletonBlock className="h-3 w-28 rounded-md" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PublicBuyerPageSkeleton;
