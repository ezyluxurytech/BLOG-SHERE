(function () {
  const DATA_KEY = "blogsphere_data_v1";
  const SESSION_KEY = "blogsphere_session_v1";
  const now = () => new Date().toISOString();
  const id = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const starterCategories = [
    ["Technology", "Technology stories, AI, tools and the future of digital life."],
    ["Programming", "Code, logic, software engineering and practical tutorials."],
    ["Education", "Learning strategies, academic ideas and educational trends."],
    ["Business", "Leadership, entrepreneurship and business insights."],
    ["Lifestyle", "Well-being, habits and day-to-day life inspiration."],
    ["Science", "Research, discoveries and scientific thinking."],
    ["News", "Current updates and the stories shaping our world."],
    ["Personal Development", "Growth, mindset and self-improvement guidance."],
    ["Productivity", "System design and practical techniques for getting more done."],
  ].map(([name, description]) => ({
    id: id(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    description,
    created_at: now(),
    updated_at: now(),
  }));

  function readData() {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) {
      const initial = { users: [], posts: [], categories: starterCategories, comments: [], likes: [], saved_posts: [] };
      writeData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    for (const key of ["users", "posts", "categories", "comments", "likes", "saved_posts"]) {
      if (!Array.isArray(parsed[key])) parsed[key] = [];
    }
    return parsed;
  }

  function writeData(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save BlogSphere data in this browser.", error);
      throw new Error("Your browser's local storage is full or unavailable. Remove some large images or browser data and try again.");
    }
  }

  function getSessionUserId() {
    return localStorage.getItem(SESSION_KEY);
  }

  function publicProfile(user) {
    if (!user) return null;
    const { password_hash, password_salt, ...profile } = user;
    return profile;
  }

  function currentUser() {
    const userId = getSessionUserId();
    if (!userId) return null;
    return publicProfile(readData().users.find((user) => user.id === userId));
  }

  async function hashPassword(password, salt) {
    if (!window.crypto?.subtle) {
      throw new Error("Secure local account creation requires a modern browser and a local web server (for example, VS Code Live Server).");
    }
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 120000, hash: "SHA-256" },
      material,
      256
    );
    return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  const store = {
    getData() {
      const data = readData();
      return { ...data, users: data.users.map(publicProfile) };
    },
    saveData: writeData,
    currentUser,

    async register({ fullName, username, email, password }) {
      const data = readData();
      const normalizedEmail = email.trim().toLowerCase();
      if (data.users.some((user) => user.email === normalizedEmail)) throw new Error("An account already exists for this email. Try logging in.");
      if (data.users.some((user) => user.username === username.toLowerCase())) throw new Error("That username is already taken. Please choose another.");
      const salt = id();
      const user = {
        id: id(),
        email: normalizedEmail,
        password_salt: salt,
        password_hash: await hashPassword(password, salt),
        full_name: fullName.trim(),
        username: username.toLowerCase(),
        bio: "",
        avatar_url: "",
        role: data.users.length === 0 ? "admin" : "user",
        status: "active",
        created_at: now(),
        updated_at: now(),
      };
      data.users.push(user);
      writeData(data);
      localStorage.setItem(SESSION_KEY, user.id);
      return publicProfile(user);
    },

    async login(email, password) {
      const user = readData().users.find((item) => item.email === email.trim().toLowerCase());
      if (!user || user.password_hash !== await hashPassword(password, user.password_salt)) {
        throw new Error("Email or password is incorrect.");
      }
      if (user.status !== "active") throw new Error("This account is suspended.");
      localStorage.setItem(SESSION_KEY, user.id);
      return publicProfile(user);
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
    },

    updateProfile(userId, changes) {
      const data = readData();
      const user = data.users.find((item) => item.id === userId);
      if (!user) throw new Error("Account not found.");
      const username = String(changes.username || "").toLowerCase();
      if (data.users.some((item) => item.id !== userId && item.username === username)) throw new Error("That username is already taken.");
      Object.assign(user, changes, { username, updated_at: now() });
      writeData(data);
      return publicProfile(user);
    },

    listUsers() { return readData().users.map(publicProfile); },
    updateUser(userId, changes) {
      const data = readData();
      const user = data.users.find((item) => item.id === userId);
      if (!user) throw new Error("Account not found.");
      Object.assign(user, changes, { updated_at: now() });
      writeData(data);
    },
    listCategories() { return readData().categories.sort((a, b) => a.name.localeCompare(b.name)); },
    addCategory(name, description) {
      const data = readData();
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (data.categories.some((category) => category.slug === slug)) throw new Error("That category already exists.");
      data.categories.push({ id: id(), name, slug, description, created_at: now(), updated_at: now() });
      writeData(data);
    },
    deleteCategory(categoryId) {
      const data = readData();
      data.categories = data.categories.filter((category) => category.id !== categoryId);
      writeData(data);
    },
    listPosts() { return readData().posts; },
    getPost(postId) { return readData().posts.find((post) => post.id === postId) || null; },
    createPost(post) {
      const data = readData();
      data.posts.push({ ...post, id: id() });
      writeData(data);
    },
    updatePost(postId, changes) {
      const data = readData();
      const post = data.posts.find((item) => item.id === postId);
      if (!post) throw new Error("Post not found.");
      Object.assign(post, changes);
      writeData(data);
    },
    deletePost(postId) {
      const data = readData();
      data.posts = data.posts.filter((post) => post.id !== postId);
      data.comments = data.comments.filter((comment) => comment.post_id !== postId);
      data.likes = data.likes.filter((like) => like.post_id !== postId);
      data.saved_posts = data.saved_posts.filter((item) => item.post_id !== postId);
      writeData(data);
    },
    listComments(postId) { return readData().comments.filter((comment) => !postId || comment.post_id === postId); },
    addComment(comment) {
      const data = readData();
      data.comments.push({ ...comment, id: id() });
      writeData(data);
    },
    deleteComment(commentId) {
      const data = readData();
      data.comments = data.comments.filter((comment) => comment.id !== commentId);
      writeData(data);
    },
    listLikes(postId) { return readData().likes.filter((like) => !postId || like.post_id === postId); },
    toggleLike(postId, userId) {
      const data = readData();
      const index = data.likes.findIndex((like) => like.post_id === postId && like.user_id === userId);
      if (index < 0) data.likes.push({ id: id(), post_id: postId, user_id: userId, created_at: now() });
      else data.likes.splice(index, 1);
      writeData(data);
      return index < 0;
    },
    listSavedPosts(userId) { return readData().saved_posts.filter((item) => item.user_id === userId); },
    toggleSaved(postId, userId) {
      const data = readData();
      const index = data.saved_posts.findIndex((item) => item.post_id === postId && item.user_id === userId);
      if (index < 0) data.saved_posts.push({ id: id(), post_id: postId, user_id: userId, created_at: now() });
      else data.saved_posts.splice(index, 1);
      writeData(data);
      return index < 0;
    },
  };

  window.BlogSphereStore = store;
})();
