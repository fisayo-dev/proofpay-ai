const NetBackground = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-80"
        style={{
          backgroundImage: `
          radial-gradient(circle at top, rgba(0, 102, 204, 0.18), transparent 42%),
          linear-gradient(rgba(0, 102, 204, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 102, 204, 0.08) 1px, transparent 1px)
        `,
          backgroundSize: "100% 100%, 32px 43px, 32px 32px",
          backgroundPosition: "center, center, center",
          maskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-40 bg-linear-to-b from-background via-background/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-44 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
    </>
  );
};

export default NetBackground