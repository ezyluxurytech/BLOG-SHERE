(function () {
  const store = () => window.BlogSphereStore;
  const adminApi = {
    async requireAdmin() {
      const user = window.BlogSphere.currentUser;
      if (!user) {
        window.location.href = "../login.html";
        return null;
      }
      if (user.role !== "admin") {
        window.location.href = "../index.html";
        return null;
      }
      return user;
    },

    async loadDashboardStats() {
      const data = store().getData();
      document.getElementById("adminTotalUsers").textContent = String(data.users.length);
      document.getElementById("adminTotalPosts").textContent = String(data.posts.length);
      document.getElementById("adminPublishedPosts").textContent = String(data.posts.filter((post) => post.status === "published").length);
      document.getElementById("adminDraftPosts").textContent = String(data.posts.filter((post) => post.status === "draft").length);
      document.getElementById("adminTotalComments").textContent = String(data.comments.length);
      document.getElementById("adminTotalLikes").textContent = String(data.likes.length);
    },

    async loadUsers() {
      const users = store().listUsers().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const table = document.getElementById("usersTableBody");
      if (!table) return;
      table.innerHTML = users.map((user) => `<tr>
        <td>${window.BlogSphere.escapeHtml(user.full_name || "User")}</td>
        <td>${window.BlogSphere.escapeHtml(user.username || "—")}</td>
        <td><span class="status-badge ${user.role === "admin" ? "published" : "draft"}">${window.BlogSphere.escapeHtml(user.role || "user")}</span></td>
        <td><span class="status-badge ${window.BlogSphere.escapeHtml(user.status)}">${window.BlogSphere.escapeHtml(user.status || "active")}</span></td>
        <td>${window.BlogSphere.escapeHtml(window.BlogSphere.formatDate(user.created_at))}</td>
        <td><div class="row-actions"><button class="small-btn" type="button" data-user-status="${user.id}" data-status="${user.status === "active" ? "suspended" : "active"}" ${user.id === window.BlogSphere.currentUser.id ? "disabled" : ""}>${user.status === "active" ? "Suspend" : "Activate"}</button></div></td>
      </tr>`).join("");
      table.querySelectorAll("[data-user-status]").forEach((button) => button.addEventListener("click", () => {
        try {
          store().updateUser(button.dataset.userStatus, { status: button.dataset.status });
          window.BlogSphere.toast("User status updated.", "success");
          setTimeout(() => window.location.reload(), 400);
        } catch (error) { window.BlogSphere.toast(error.message, "error"); }
      }));
    },

    async loadPosts() {
      const data = store().getData();
      const posts = data.posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const table = document.getElementById("adminPostsTableBody");
      if (!table) return;
      table.innerHTML = posts.map((post) => {
        const author = data.users.find((user) => user.id === post.author_id);
        const likes = data.likes.filter((like) => like.post_id === post.id).length;
        return `<tr>
          <td>${window.BlogSphere.escapeHtml(post.title)}</td>
          <td>${window.BlogSphere.escapeHtml(author?.full_name || author?.username || "Unknown")}</td>
          <td><span class="status-badge ${window.BlogSphere.escapeHtml(post.status)}">${window.BlogSphere.escapeHtml(post.status)}</span></td>
          <td>${window.BlogSphere.formatNumber(post.views || 0)}</td>
          <td>${window.BlogSphere.formatNumber(likes)}</td>
          <td><div class="row-actions">
            <button class="small-btn" type="button" data-post-toggle="${post.id}" data-status="${post.status === "published" ? "draft" : "published"}">${post.status === "published" ? "Unpublish" : "Publish"}</button>
            <button class="small-btn danger" type="button" data-post-delete="${post.id}">Delete</button>
          </div></td>
        </tr>`;
      }).join("");
      table.querySelectorAll("[data-post-toggle]").forEach((button) => button.addEventListener("click", () => {
        try {
          const nextStatus = button.dataset.status;
          store().updatePost(button.dataset.postToggle, { status: nextStatus, updated_at: new Date().toISOString(), published_at: nextStatus === "published" ? new Date().toISOString() : null });
          window.BlogSphere.toast("Post status updated.", "success");
          setTimeout(() => window.location.reload(), 400);
        } catch (error) { window.BlogSphere.toast(error.message, "error"); }
      }));
      table.querySelectorAll("[data-post-delete]").forEach((button) => button.addEventListener("click", () => window.BlogSpherePosts.deletePost(button.dataset.postDelete)));
    },

    async loadComments() {
      const data = store().getData();
      const comments = data.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const table = document.getElementById("adminCommentsTableBody");
      if (!table) return;
      table.innerHTML = comments.map((comment) => {
        const post = data.posts.find((item) => item.id === comment.post_id);
        const user = data.users.find((item) => item.id === comment.user_id);
        return `<tr>
          <td>${window.BlogSphere.escapeHtml(post?.title || "Unknown post")}</td>
          <td>${window.BlogSphere.escapeHtml(user?.full_name || user?.username || "User")}</td>
          <td>${window.BlogSphere.escapeHtml(comment.content || "")}</td>
          <td><button class="small-btn danger" type="button" data-comment-delete="${comment.id}">Delete</button></td>
        </tr>`;
      }).join("");
      table.querySelectorAll("[data-comment-delete]").forEach((button) => button.addEventListener("click", () => {
        try {
          store().deleteComment(button.dataset.commentDelete);
          window.BlogSphere.toast("Comment deleted.", "success");
          setTimeout(() => window.location.reload(), 400);
        } catch (error) { window.BlogSphere.toast(error.message, "error"); }
      }));
    },

    async loadCategories() {
      const table = document.getElementById("categoryTableBody");
      if (!table) return;
      const render = () => {
        table.innerHTML = store().listCategories().map((category) => `<tr>
          <td>${window.BlogSphere.escapeHtml(category.name)}</td>
          <td>${window.BlogSphere.escapeHtml(category.slug)}</td>
          <td>${window.BlogSphere.escapeHtml(category.description || "")}</td>
          <td><div class="row-actions"><button class="small-btn danger" type="button" data-category-delete="${category.id}">Delete</button></div></td>
        </tr>`).join("");
        table.querySelectorAll("[data-category-delete]").forEach((button) => button.addEventListener("click", () => {
          try {
            store().deleteCategory(button.dataset.categoryDelete);
            window.BlogSphere.toast("Category deleted.", "success");
            setTimeout(() => window.location.reload(), 400);
          } catch (error) { window.BlogSphere.toast(error.message, "error"); }
        }));
      };
      render();
      document.getElementById("createCategoryBtn")?.addEventListener("click", () => {
        const name = document.getElementById("categoryName").value.trim();
        const description = document.getElementById("categoryDescription").value.trim();
        if (!name) return window.BlogSphere.toast("Category name is required.", "error");
        try {
          store().addCategory(name, description);
          window.BlogSphere.toast("Category created.", "success");
          setTimeout(() => window.location.reload(), 400);
        } catch (error) { window.BlogSphere.toast(error.message, "error"); }
      });
    },

    async initAdmin() {
      if (!await this.requireAdmin()) return;
      const page = window.location.pathname.split("/").pop();
      if (page === "index.html" || page === "") await this.loadDashboardStats();
      if (page === "users.html") await this.loadUsers();
      if (page === "posts.html") await this.loadPosts();
      if (page === "comments.html") await this.loadComments();
      if (page === "categories.html") await this.loadCategories();
    },
  };
  window.BlogSphereAdmin = adminApi;
})();
