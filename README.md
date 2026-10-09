# BlogSphere

BlogSphere is a local-first blogging application built with HTML, CSS, and vanilla JavaScript. It includes account creation and login, publishing and editing posts, categories, comments, likes, saved posts, profiles, dashboards, and admin pages.

## Run locally

Open the project folder in VS Code and start it with the Live Server extension, or run a static server:

```bash
python -m http.server 5500
```

Then visit `http://127.0.0.1:5500/`. A local web server is recommended because secure password hashing uses the browser Web Crypto API.

## Local data

Application records are saved in this browser's `localStorage`. The first account created in an empty browser becomes the local admin; later accounts are regular users. Passwords are stored as salted PBKDF2 hashes, not plain text. Uploaded images are saved as data URLs in the same browser storage and are limited to 1 MB each to reduce storage-quota problems.

Local browser storage is tied to this browser profile and device. Accounts, posts, and interactions are not shared with other visitors or synced to another device. Clearing browser data removes the local BlogSphere data. This client-only setup is intended for local use and demonstrations; it does not provide server-side authentication, enforceable access control, or shared multi-user hosting.

## Reset local data

To erase BlogSphere data in the current browser, open Developer Tools → Console on the local site and run:

```js
localStorage.removeItem("blogsphere_data_v1");
localStorage.removeItem("blogsphere_session_v1");
```

Reload the page to start with an empty local database and default categories.
