import { Themes } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

function SettingsPage() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-base-content mt-11">
              Theme
            </h2>
            <p className="mt-1 text-sm text-base-content/70">
              Choose a theme for your chat interface
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Themes.map((t) => (
              <button
                key={t}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  theme === t
                    ? "bg-base-200 ring-2 ring-primary"
                    : "hover:bg-base-200/50"
                }`}
                onClick={() => setTheme(t)}
              >
                <div
                  className="relative h-8 w-full rounded-md overflow-hidden"
                  data-theme={t}
                >
                  {" "}
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    {" "}
                    <div className="rounded bg-primary"></div>{" "}
                    <div className="rounded bg-secondary"></div>{" "}
                    <div className="rounded bg-accent"></div>{" "}
                    <div className="rounded bg-neutral"></div>{" "}
                  </div>{" "}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-base-content">Preview</h3>
          <div className="bg-base-200 rounded-xl p-6 shadow-lg">
            <div className="max-w-md mx-auto bg-base-100 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium text-lg">
                    J
                  </div>
                  <div>
                    <h3 className="font-semibold">John Doe</h3>
                    <p className="text-xs text-base-content/70">Online</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 h-64 overflow-y-auto">
                {PREVIEW_MESSAGES.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isSent ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.isSent
                          ? "bg-primary text-primary-content"
                          : "bg-base-200"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-[10px] mt-1.5 ${
                          message.isSent
                            ? "text-primary-content/70"
                            : "text-base-content/70"
                        }`}
                      >
                        12:00 PM
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-base-300">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 text-sm border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Type a message..."
                    value="This is a preview"
                    readOnly
                  />
                  <button className="px-4 py-2 bg-primary text-primary-content rounded-md hover:bg-primary-focus transition-colors">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
