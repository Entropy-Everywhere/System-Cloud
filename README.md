# System Cloud

A simple web app for managing alters, fronters, and account profiles.

## Deploy to GitHub Pages

1. Create a GitHub repository named `System Cloud`.
2. Push this folder to the repository.
3. In GitHub, open the repository Settings > Pages.
4. Under Source, choose Deploy from a branch.
5. Select the main branch and the root folder `/`.
6. Save and wait for the site to publish.

Your site will be available at:
`https://Entropy_Everywhere.github.io/System-Cloud/`

## App icon

The PWA uses the logo file at `icons/SystemCloudLogo.png` as the install icon and app image.

## Itch.io / web packaging

To publish this app on Itch.io as a web project:

1. Zip the entire project folder.
2. Upload the zip to Itch.io as a web project.
3. Make sure the uploaded files include `index.html` at the top level.
4. Set the project to open the app in the browser from that uploaded build.

This app is already set up as a PWA, so Itch.io hosting will allow users to install it from supported browsers.

### Installable app on Itch.io

For best results when hosting on Itch.io:

1. Publish the project as a web build with `index.html` at the top level.
2. Use a browser that supports PWA install prompts (Chrome, Edge, Brave, Safari on iOS/macOS with manual add-to-home-screen).
3. When the app loads, the install button will appear if the browser supports it.
4. On mobile, users can also install via the browser's Add to Home Screen workflow.

## Firebase / Firestore setup

1. Create a Firebase project at https://console.firebase.google.com/.
2. Enable Firestore in the Firebase Console.
3. Open `pages/firebase-config.js` and replace the placeholder values with your project settings.
4. Set `window.FIRESTORE_ENABLED = true`.
5. In Firestore rules during development, allow reads/writes for the project or configure user-based security rules.

The app will continue using localStorage as a fallback if Firestore is not available or not enabled.

## Local preview

Open `index.html` in a browser, or serve the folder with a simple static server.
