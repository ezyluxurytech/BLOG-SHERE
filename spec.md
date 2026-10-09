# BlogSphere — Local-First Blog Application

## Purpose

BlogSphere is a responsive blogging application built with HTML5, CSS3, and vanilla JavaScript. It lets people create local accounts, publish and manage blog posts, and interact with posts using comments, likes, and saved items.

## Pages and behavior

- `landing.html`: public welcome page with login and account-creation entry points.
- `login.html` and `register.html`: local account flows.
- `index.html`: authenticated feed with featured posts, latest posts, and categories.
- `post.html`: article view with comments, likes, saves, and view count.
- `create-post.html` and `edit-post.html`: create, save, publish, and edit posts.
- `dashboard.html`: the signed-in user's posts and activity totals.
- `profile.html`: edit profile details and list published posts.
- `categories.html`, `search.html`, and `saved-posts.html`: browse posts and personal saved items.
- `admin/`: local admin dashboard for users, posts, comments, and categories.

Visitors who are not logged in are sent to the landing page when they request a protected page. The first account created in a fresh browser is the local admin; later accounts have regular-user access. Suspended accounts cannot use the app until activated by the local admin.

## Local persistence

Store users, profile information, posts, categories, comments, likes, and saved posts in browser `localStorage`. Keep the active account ID in a separate local session key. Store password verifiers as salted PBKDF2 hashes using Web Crypto; never save raw passwords. Persist uploaded images as data URLs, and limit individual images to 1 MB so they fit more reliably in browser storage.

Initialize a starter set of blog categories when no BlogSphere data exists. Validate required post fields, usernames, account passwords, and duplicate email/username values. Display storage errors instead of silently losing changes.

## Visual and implementation requirements

- Preserve the existing BlogSphere branding, responsive layout, navigation, and polished visual styling.
- Use only HTML, CSS, and plain JavaScript; no external backend, hosted database, authentication service, or framework.
- Keep page access, forms, dashboards, and admin tools functional with local browser data.
- Escape user-provided text before rendering it into HTML.
- Load project scripts locally; the app's core functionality should not require a network connection.

## Important limitations

Browser storage exists only in the current browser profile and device. It is not shared between visitors, does not synchronize between devices, and can be cleared by the user. A static client-side app cannot provide server-enforced identity or authorization; this local mode is appropriate for local use, classroom demonstrations, and prototypes, not production hosting for untrusted users.
