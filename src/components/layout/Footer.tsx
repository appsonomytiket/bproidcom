
export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex h-16 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bproid.com. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
