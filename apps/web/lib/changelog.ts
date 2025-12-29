export interface ChangelogItem {
    title: string;
    description?: string;
}

export interface ChangelogEntry {
    date: string; // ISO date (YYYY-MM-DD)
    title?: string; // Optional section title (e.g., "December 2025")
    items: ChangelogItem[];
}

// To add new changes, append a new entry at the top of this array.
// Keep the newest entries first for easy visibility.
export const CHANGELOG: ChangelogEntry[] = [
    {
        date: "2025-12-29",
        title: "December 2025",
        items: [
            {
                title: "Cookie consent and privacy policy",
                description:
                    "We've added a cookie consent banner and a dedicated privacy page so you know exactly how we use cookies and protect your data. Your calculator settings stay private in your browser.",
            },
            {
                title: "Cleaner code under the hood",
                description:
                    "We've reorganized the calculator's internal structure to make it easier to maintain and extend. The app is now built from smaller, focused components that work together smoothly.",
            },
            {
                title: "Changelog page added",
                description:
                    "There's a new Changelog page. It's powered by a simple data file, so adding entries is quick and easy.",
            },
            {
                title: "Multi-item list and combined materials",
                description:
                    "Add multiple items to your list and instantly see the combined materials and total forge time.",
            },
            {
                title: "Per-item tree view in multi mode",
                description:
                    "Click any item in your list to open its crafting tree, with quick expand and collapse controls.",
            },
            {
                title: "Book recipe support and search improvements",
                description:
                    "Enchanted books now appear in search with readable names pulled from their lore (for example, “Crop Fever I”).",
            },
            {
                title: "Hydration and local storage fixes",
                description:
                    "State now loads smoothly after opening the page—no flashing or mismatch.",
            },
        ],
    },
    {
        date: "2025-11-15",
        title: "November 2025",
        items: [
            {
                title: "Quality-of-life layout tweaks",
                description:
                    "Cleaner spacing to keep content away from the footer and better readability on mobile.",
            },
        ],
    },
];

export default CHANGELOG;
