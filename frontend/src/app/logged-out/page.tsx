export default function LoggedOutPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-semibold">You have been logged out</h1>
      <a
        href="/auth/login"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Log in again
      </a>
    </div>
  );
}
