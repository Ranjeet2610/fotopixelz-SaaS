const steps = [
  {
    title: "Choose a service",
    description: "Pick the editing category and services that match your images.",
  },
  {
    title: "Upload your images",
    description: "Create your order, then upload your source photos securely.",
  },
  {
    title: "We edit your images",
    description: "Our production team processes each image based on your instructions.",
  },
  {
    title: "Review and download",
    description: "Track your order status and download your finished files when ready.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <p className="mt-2 text-sm text-muted-foreground">From order to delivery, here&apos;s what to expect.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-xl border p-5">
            <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
            <h3 className="mt-2 font-medium">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
