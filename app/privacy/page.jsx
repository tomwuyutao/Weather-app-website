const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata = {
  title: "Privacy Policy | Weather Map",
  description: "Weather Map privacy policy."
};

const sections = [
  {
    title: "Overview",
    body: [
      "Weather Map is designed to be a small, private weather map app. The app does not collect personal information, does not create user accounts, does not show ads, and does not use tracking technologies.",
      "Your saved places, custom lists, map preferences, theme preferences, and other app settings are stored on your device."
    ]
  },
  {
    title: "Data Weather Map Stores",
    body: [
      "Weather Map stores app data locally on your device so the app can remember your saved places and preferences. This may include saved cities, custom city lists, the selected list, map overlay mode, display settings, and theme settings.",
      "This information is not sent to servers operated by Weather Map. If you delete the app or clear its data, locally stored app data may be removed. Depending on your Apple device settings, local app data may also be included in device backups managed by Apple."
    ]
  },
  {
    title: "Weather And Map Services",
    body: [
      "To show weather forecasts, Weather Map requests weather information for the places you view or save. The app uses Apple WeatherKit for weather data.",
      "To display the map, the app may request map style, map tile, or related map resources from map service providers. These requests are used to render the map and are not used by Weather Map to identify you, track you, or build a profile about you."
    ]
  },
  {
    title: "No Tracking Or Analytics",
    body: [
      "Weather Map does not use advertising SDKs, third-party analytics SDKs, cross-app tracking, or data brokers.",
      "Weather Map does not sell personal information and does not share personal information for advertising or marketing."
    ]
  },
  {
    title: "Location",
    body: [
      "Weather Map is built around places you choose on the map or save in lists. The app does not need to collect your identity to provide weather for those places.",
      "If a future version adds device-location features, this policy will be updated before that change is released."
    ]
  },
  {
    title: "Children",
    body: [
      "Weather Map does not knowingly collect personal information from children."
    ]
  },
  {
    title: "Changes",
    body: [
      "If Weather Map's privacy practices change, this policy will be updated. The date at the top of the page shows when it was last revised."
    ]
  },
  {
    title: "Contact",
    body: [
      "For privacy questions, contact the developer through the support or contact link provided with the app."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#17152F] px-5 py-8 text-weather-text md:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-16">
          <a href={`${publicBasePath}/`} className="text-sm font-medium text-weather-cloud/68 transition hover:text-weather-text">
            Weather Map
          </a>
        </nav>

        <header className="mb-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-weather-cloud/58">Privacy Policy</p>
          <h1 className="text-5xl font-semibold leading-none tracking-normal md:text-7xl">Weather Map Privacy Policy</h1>
          <p className="mt-6 text-base leading-8 text-weather-muted/68">Last updated: May 20, 2026</p>
        </header>

        <section className="mb-14 rounded-[28px] border border-white/10 bg-[#2E2961]/54 p-6 shadow-atmospheric backdrop-blur-2xl md:p-8">
          <h2 className="text-2xl font-semibold tracking-normal">Short version</h2>
          <p className="mt-4 text-lg leading-8 text-weather-muted/76">
            Weather Map does not collect your personal data. The app stores your saved places and preferences on your device, and uses weather and map services only to show the weather map.
          </p>
        </section>

        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-white/10 pt-8">
              <h2 className="text-2xl font-semibold tracking-normal">{section.title}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-weather-muted/72">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-white/10 py-8 text-sm leading-6 text-weather-cloud/52">
          <p>Weather, on a map.</p>
        </footer>
      </div>
    </main>
  );
}
