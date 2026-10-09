(function () {
  const dashboardApi = {
    async initDashboard() {
      const user = window.BlogSphere.currentUser;
      if (!user) return (window.location.href = "login.html");
      const posts = window.BlogSphereStore.listPosts()
        .filter((post) => post.author_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const data = window.BlogSphereStore.getData();
      const categoryMap = Object.fromEntries(data.categories.map((category) => [category.id, category]));
      const totalLikes = data.likes.filter((like) => posts.some((post) => post.id === like.post_id)).length;
      document.getElementById("totalPostsCount").textContent = String(posts.length);
      document.getElementById("publishedPostsCount").textContent = String(posts.filter((post) => post.status === "published").length);
      document.getElementById("draftPostsCount").textContent = String(posts.filter((post) => post.status === "draft").length);
      document.getElementById("totalViewsCount").textContent = window.BlogSphere.formatNumber(posts.reduce((sum, post) => sum + Number(post.views || 0), 0));
      document.getElementById("totalLikesCount").textContent = window.BlogSphere.formatNumber(totalLikes);
      document.getElementById("savedPostsCount").textContent = String(window.BlogSphereStore.listSavedPosts(user.id).length);

      const body = document.getElementById("myPostsTableBody");
      if (!body) return;
      if (!posts.length) {
        body.innerHTML = '<tr><td colspan="7"><div class="empty-state">You haven\'t created any posts.</div></td></tr>';
        return;
      }
      body.innerHTML = posts.map((post) => {
        const category = categoryMap[post.category_id]?.name || "Uncategorized";
        const likes = data.likes.filter((like) => like.post_id === post.id).length;
        return `<tr>
          <td>${window.BlogSphere.escapeHtml(post.title)}</td>
          <td>${window.BlogSphere.escapeHtml(category)}</td>
          <td><span class="status-badge ${post.status}">${window.BlogSphere.escapeHtml(post.status)}</span></td>
          <td>${window.BlogSphere.formatNumber(post.views || 0)}</td>
          <td>${window.BlogSphere.formatNumber(likes)}</td>
          <td>${window.BlogSphere.escapeHtml(window.BlogSphere.formatDate(post.created_at))}</td>
          <td><div class="row-actions">
            <a class="small-btn primary" href="post.html?id=${encodeURIComponent(post.id)}">View</a>
            <a class="small-btn" href="edit-post.html?id=${encodeURIComponent(post.id)}">Edit</a>
            <button class="small-btn danger" type="button" data-delete-post="${post.id}">Delete</button>
          </div></td>
        </tr>`;
      }).join("");
      body.querySelectorAll("[data-delete-post]").forEach((button) => {
        button.addEventListener("click", () => window.BlogSpherePosts.deletePost(button.getAttribute("data-delete-post")));
      });
    },
  };
  window.BlogSphereDashboard = dashboardApi;
})();
