(function () {
  const store = () => window.BlogSphereStore;
  const sortNewest = (posts) => posts.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));

  const postsApi = {
    async getCategories() { return store().listCategories(); },
    async getPublishedPosts() { return sortNewest(store().listPosts().filter((post) => post.status === "published")); },
    async getPostsByCategory(categoryId) {
      return sortNewest(store().listPosts().filter((post) => post.status === "published" && post.category_id === categoryId));
    },
    async getPostById(postId) { return store().getPost(postId); },
    async getProfileMap(ids) {
      const users = store().listUsers();
      return Object.fromEntries(ids.map((id) => {
        const user = users.find((item) => item.id === id);
        return [id, user ? { id: user.id, username: user.username, full_name: user.full_name, avatar_url: user.avatar_url } : {}];
      }));
    },
    async getCategoryMap(ids) {
      const categories = store().listCategories();
      return Object.fromEntries(ids.map((id) => [id, categories.find((item) => item.id === id) || {}]));
    },
    async getLikeCount(postId) { return store().listLikes(postId).length; },
    async getSavedCountForCurrentUser() {
      const user = window.BlogSphere.currentUser;
      return user ? store().listSavedPosts(user.id).length : 0;
    },
    async isPostLiked(postId, userId) {
      return Boolean(userId && store().listLikes(postId).some((like) => like.user_id === userId));
    },
    async isPostSaved(postId, userId) {
      return Boolean(userId && store().listSavedPosts(userId).some((item) => item.post_id === postId));
    },
    async uploadImage(file) {
      if (!file) return "";
      if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
      if (file.size > 1024 * 1024) throw new Error("Images must be 1 MB or smaller to fit in browser storage.");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("The selected image could not be read."));
        reader.readAsDataURL(file);
      });
    },
    async buildPostCard(post) {
      const profiles = await this.getProfileMap([post.author_id]);
      const profile = profiles[post.author_id] || {};
      const categories = await this.getCategoryMap([post.category_id]);
      const category = categories[post.category_id] || { name: "Uncategorized" };
      const likeCount = await this.getLikeCount(post.id);
      const wrapper = document.createElement("article");
      wrapper.className = "card post-card";
      const imageUrl = post.featured_image || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80";
      wrapper.innerHTML = `
        <img class="post-card-image" src="${window.BlogSphere.escapeHtml(imageUrl)}" alt="${window.BlogSphere.escapeHtml(post.title)}" />
        <div class="card-body">
          <div class="post-meta"><span class="tag">${window.BlogSphere.escapeHtml(category.name)}</span><span>${window.BlogSphere.escapeHtml(window.BlogSphere.formatDate(post.published_at || post.created_at))}</span></div>
          <h3>${window.BlogSphere.escapeHtml(post.title)}</h3>
          <p>${window.BlogSphere.escapeHtml(post.excerpt || "")}</p>
          <div class="author-row">
            <img class="avatar" src="${window.BlogSphere.escapeHtml(profile.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(profile.full_name || profile.username || "Writer"))}" alt="${window.BlogSphere.escapeHtml(profile.full_name || profile.username || "Writer")}" />
            <div><strong>${window.BlogSphere.escapeHtml(profile.full_name || profile.username || "Anonymous")}</strong></div>
          </div>
          <div class="meta-row"><span class="icon-inline">👁 ${window.BlogSphere.formatNumber(post.views || 0)}</span><span class="icon-inline">❤️ ${window.BlogSphere.formatNumber(likeCount)}</span></div>
        </div>`;
      wrapper.addEventListener("click", (event) => {
        if (event.target.closest("button, a")) return;
        window.location.href = `post.html?id=${encodeURIComponent(post.id)}`;
      });
      return wrapper;
    },
    async renderPosts(container, posts, emptyMessage = "No posts found.") {
      if (!container) return;
      if (!posts?.length) return window.BlogSphere.renderEmptyState(container, emptyMessage);
      const fragment = document.createDocumentFragment();
      for (const post of posts) fragment.appendChild(await this.buildPostCard(post));
      container.replaceChildren(fragment);
    },
    renderCategoryCards(categories) {
      const render = (target) => {
        if (!target) return;
        target.replaceChildren();
        categories.forEach((category) => {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "card category-card";
          card.style.border = "1px solid var(--border)";
          card.style.padding = "20px";
          card.innerHTML = `<h3>${window.BlogSphere.escapeHtml(category.name)}</h3><p class="card-copy">${window.BlogSphere.escapeHtml(category.description || "Explore posts in this category.")}</p>`;
          card.addEventListener("click", () => { window.location.href = `categories.html?category=${encodeURIComponent(category.slug)}`; });
          target.appendChild(card);
        });
      };
      render(document.getElementById("categoryList"));
      render(document.getElementById("categoryPageList"));
    },
    async initHomePage() {
      this.renderCategoryCards(await this.getCategories());
      const posts = await this.getPublishedPosts();
      await this.renderPosts(document.getElementById("featuredPosts"), posts.slice(0, 3), "No featured posts found.");
      await this.renderPosts(document.getElementById("latestPosts"), posts.slice(0, 6), "No posts found.");
    },
    async initCategoriesPage() {
      const categories = await this.getCategories();
      this.renderCategoryCards(categories);
      const slug = new URLSearchParams(window.location.search).get("category");
      const category = categories.find((item) => item.slug === slug) || categories[0];
      if (category) await this.renderPosts(document.getElementById("categoryPostsContainer"), await this.getPostsByCategory(category.id), "No posts found in this category.");
    },
    async initSearchPage() {
      const input = document.getElementById("searchInput");
      const target = document.getElementById("searchResults");
      if (!input || !target) return;
      const runSearch = async () => {
        const query = input.value.trim().toLowerCase();
        const posts = await this.getPublishedPosts();
        if (!query) return this.renderPosts(target, posts.slice(0, 12), "No posts found.");
        const users = store().listUsers();
        const categories = store().listCategories();
        const filtered = posts.filter((post) => {
          const author = users.find((user) => user.id === post.author_id);
          const category = categories.find((item) => item.id === post.category_id);
          return `${post.title} ${post.excerpt || ""} ${post.content || ""} ${author?.full_name || ""} ${author?.username || ""} ${category?.name || ""}`.toLowerCase().includes(query);
        });
        await this.renderPosts(target, filtered, "No search results found.");
      };
      input.addEventListener("input", runSearch);
      await runSearch();
    },
    async initCreatePostPage() {
      const form = document.getElementById("createPostForm");
      const categorySelect = document.getElementById("postCategory");
      const fileInput = document.getElementById("featuredImage");
      if (!form || !categorySelect) return;
      const categories = await this.getCategories();
      categorySelect.innerHTML = categories.map((category) => `<option value="${category.id}">${window.BlogSphere.escapeHtml(category.name)}</option>`).join("");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const user = window.BlogSphere.currentUser;
        if (!user) return (window.location.href = "login.html");
        const mode = event.submitter?.dataset.mode || "draft";
        const formData = new FormData(form);
        const title = String(formData.get("title") || "").trim();
        const excerpt = String(formData.get("excerpt") || "").trim();
        const content = String(formData.get("content") || "").trim();
        const categoryId = String(formData.get("category_id") || "");
        if (!title || !excerpt || !content || !categoryId) return window.BlogSphere.toast("Please complete the title, excerpt, content, and category fields.", "error");
        try {
          const featuredImage = fileInput.files[0] ? await this.uploadImage(fileInput.files[0]) : "";
          const timestamp = new Date().toISOString();
          store().createPost({ author_id: user.id, category_id: categoryId, title, excerpt, content, featured_image: featuredImage, status: mode, views: 0, published_at: mode === "published" ? timestamp : null, created_at: timestamp, updated_at: timestamp });
          window.BlogSphere.toast(mode === "published" ? "Post published successfully." : "Draft saved successfully.", "success");
          form.reset();
        } catch (error) {
          window.BlogSphere.toast(error.message || "Post could not be saved.", "error");
        }
      });
    },
    async initEditPostPage() {
      const postId = window.BlogSphere.getQueryParam("id");
      if (!postId) return window.BlogSphere.renderEmptyState(document.querySelector(".container"), "No post selected for editing.");
      const categories = await this.getCategories();
      const categorySelect = document.getElementById("editCategory");
      categorySelect.innerHTML = categories.map((category) => `<option value="${category.id}">${window.BlogSphere.escapeHtml(category.name)}</option>`).join("");
      const post = await this.getPostById(postId);
      if (!post) return window.BlogSphere.renderEmptyState(document.querySelector(".container"), "Post not found.");
      const currentUser = window.BlogSphere.currentUser;
      if (!currentUser || (post.author_id !== currentUser.id && currentUser.role !== "admin")) {
        window.BlogSphere.toast("You are not allowed to edit this post.", "error");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 700);
        return;
      }
      document.getElementById("editTitle").value = post.title || "";
      document.getElementById("editExcerpt").value = post.excerpt || "";
      document.getElementById("editContent").value = post.content || "";
      document.getElementById("editStatus").value = post.status || "draft";
      categorySelect.value = post.category_id || categories[0]?.id || "";
      document.getElementById("editPostForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const status = document.getElementById("editStatus").value;
        try {
          const file = document.getElementById("editFeaturedImage").files[0];
          const featuredImage = file ? await this.uploadImage(file) : post.featured_image || "";
          store().updatePost(postId, {
            title: document.getElementById("editTitle").value.trim(),
            excerpt: document.getElementById("editExcerpt").value.trim(),
            content: document.getElementById("editContent").value.trim(),
            category_id: categorySelect.value,
            status,
            featured_image: featuredImage,
            updated_at: new Date().toISOString(),
            published_at: status === "published" ? post.published_at || new Date().toISOString() : null,
          });
          window.BlogSphere.toast("Post updated successfully.", "success");
          setTimeout(() => { window.location.href = "dashboard.html"; }, 700);
        } catch (error) {
          window.BlogSphere.toast(error.message || "Post could not be updated.", "error");
        }
      });
    },
    async deletePost(postId) {
      if (!postId || !window.confirm("Are you sure you want to delete this post?")) return;
      try {
        store().deletePost(postId);
        window.BlogSphere.toast("Post deleted successfully.", "success");
        setTimeout(() => window.location.reload(), 400);
      } catch (error) {
        window.BlogSphere.toast(error.message, "error");
      }
    },
    async initSavedPostsPage() {
      const user = window.BlogSphere.currentUser;
      if (!user) return (window.location.href = "login.html");
      const ids = store().listSavedPosts(user.id).map((item) => item.post_id);
      const posts = store().listPosts().filter((post) => ids.includes(post.id) && post.status === "published");
      await this.renderPosts(document.getElementById("savedPostsContainer"), sortNewest(posts), "You haven't saved any posts.");
    },
  };

  window.BlogSpherePosts = postsApi;
})();
