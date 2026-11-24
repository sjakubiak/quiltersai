export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-4 py-5 text-center text-sm text-muted-foreground">
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <span>Built by</span>
        <a
          href="https://docksidedigital.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          DocksideDigital
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="mailto:sjakubiak@gmail.com"
          className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          sjakubiak@gmail.com
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://docksidedigital.ca"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          docksidedigital.ca
        </a>
      </p>
    </footer>
  );
}
