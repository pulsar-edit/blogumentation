window.onload = () => {
  // Convert any dates that may be shown on page to match the date in the locale
  // that the page is being viewed in.
  const datesToConvert = document.querySelectorAll("[data-date]");

  for (const item of datesToConvert) {
    console.log(item);
    let properDate = new Date(item.dataset.date);
    item.innerText = properDate.toLocaleDateString();
  }
};

const ThemeSwitcher = {
  DEFAULT_THEME_PREFERENCE: "auto",
  MEDIA: window.matchMedia(`(prefers-color-scheme: light)`),
  setup () {
    this.root = document.documentElement;
    this.button = document.getElementById('theme-switcher');
    this.metaScheme = document.getElementById('meta-scheme');

    // We want to:
    //  - listen for clicks on this button to switch the theme
    //  - change this theme according to the OS prefferred theme
    //  - change this theme according to any stored preferences on this site
    //  - listen for OS preferred theme changing
    let preference = this.findSavedPreference() ?? this.DEFAULT_THEME_PREFERENCE;
    this.setPreference(preference);
    this.setupListeners();
  },

  findSavedPreference() {
    return localStorage.getItem("preferred-theme");
  },

  findOSTheme () {
    return this.MEDIA.matches ? "light" : "dark";
  },

  setupListeners () {
    this.button.addEventListener('click', this.onButtonClick.bind(this));
    this.MEDIA.addEventListener('change', () => {
      let newTheme = event.matches ? "light" : "dark";
      this.setTheme(newTheme);
    });
  },

  setTheme (newTheme) {
    if (this.root.dataset.theme === newTheme) return;
    this.root.dataset.theme = newTheme;

    this.metaScheme.setAttribute(
      "content",
      newTheme
    );
  },

  setPreference (newPreference) {
    localStorage.setItem("preferred-theme", newPreference);
    if (this.root.dataset.themeSetting === newPreference) return;
    this.root.dataset.themeSetting = newPreference;
    let theme = newPreference === 'auto' ? this.findOSTheme() : newPreference;
    this.setTheme(theme);
  },

  onButtonClick () {
    let currentValue = this.root.dataset.themeSetting;
    let newValue;

    switch (currentValue) {
      case 'dark':
        newValue = 'light';
        break;
      case 'light':
        newValue = 'auto';
        break;
      case 'auto':
        newValue = 'dark';
        break;
      default:
        newValue = this.DEFAULT_THEME_PREFERENCE;
    }
    this.setPreference(newValue);
  }
};

ThemeSwitcher.setup();
