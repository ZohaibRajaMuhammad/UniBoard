export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel rounded-[28px] p-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-sm text-gray-400">
            Application-level preferences are ready to extend here, including notification preferences,
            onboarding defaults, and room-specific behavior toggles.
          </p>
        </div>
      </div>
    </div>
  );
}
