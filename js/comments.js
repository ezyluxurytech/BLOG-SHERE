(function () {
  const store = () => window.BlogSphereStore;
  const commentsApi = {
    async getComments(postId) {
      const comments = store().listComments(postId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const profileMap = await window.BlogSpherePosts.getProfileMap([...new Set(comments.map((comment) => comment.user_id))]);
      return comments.map((comment) => ({ ...comment, profile: profileMap[comment.user_id] || null }));
    },
    async addComment(postId, content) {
      const user = window.BlogSphere.currentUser;
      if (!user) return (window.location.href = "login.html");
      const trimmed = content.trim();
      if (!trimmed) return window.BlogSphere.toast("Comment cannot be empty.", "error");
      try {
        const timestamp = new Date().toISOString();
        store().addComment({ post_id: postId, user_id: user.id, content: trimmed, created_at: timestamp, updated_at: timestamp });
        window.BlogSphere.toast("Comment added.", "success");
        window.location.reload();
      } catch (error) {
        window.BlogSphere.toast(error.message, "error");
      }
    },
    async toggleLike(postId) {
      const user = window.BlogSphere.currentUser;
      if (!user) return (window.location.href = "login.html");
      try {
        window.BlogSphere.toast(store().toggleLike(postId, user.id) ? "Post liked." : "Post unliked.", "success");
        window.location.reload();
      } catch (error) {
        window.BlogSphere.toast(error.message, "error");
      }
    },
    async toggleSave(postId) {
      const user = window.BlogSphere.currentUser;
      if (!user) return (window.location.href = "login.html");
      try {
        window.BlogSphere.toast(store().toggleSaved(postId, user.id) ? "Post saved." : "Post removed from saved list.", "success");
        window.location.reload();
      } catch (error) {
        window.BlogSphere.toast(error.message, "error");
      }
    },
    async updateViewCount(postId) {
      if (!postId || sessionStorage.getItem(`blogsphere_viewed_${postId}`)) return;
      const post = store().getPost(postId);
      if (!post) return;
      store().updatePost(postId, { views: Number(post.views || 0) + 1 });
      sessionStorage.setItem(`blogsphere_viewed_${postId}`, "1");
    },
    async renderSinglePost(postId) {
      const post = await window.BlogSpherePosts.getPostById(postId);
      if (!post || post.status !== "published") {
        window.BlogSphere.renderEmptyState(document.getElementById("postContainer"), "Post not found.");
        return;
      }
      const [profileMap, categoryMap, likeCount] = await Promise.all([
        window.BlogSpherePosts.getProfileMap([post.author_id]),
        window.BlogSpherePosts.getCategoryMap([post.category_id]),
        window.BlogSpherePosts.getLikeCount(postId),
      ]);
      const author = profileMap[post.author_id] || {};
      const category = categoryMap[post.category_id] || { name: "Uncategorized" };
      const currentUser = window.BlogSphere.currentUser;
      const liked = currentUser ? await window.BlogSpherePosts.isPostLiked(postId, currentUser.id) : false;
      const saved = currentUser ? await window.BlogSpherePosts.isPostSaved(postId, currentUser.id) : false;
      const container = document.getElementById("postContainer");
      container.innerHTML = `
        <article class="article-shell">
          <img src="${window.BlogSphere.escapeHtml(post.featured_image || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=900&q=80")}" alt="${window.BlogSphere.escapeHtml(post.title)}" />
          <div class="post-meta"><span class="tag">${window.BlogSphere.escapeHtml(category.name)}</span><span>${window.BlogSphere.escapeHtml(window.BlogSphere.formatDate(post.published_at || post.created_at))}</span></div>
          <h1>${window.BlogSphere.escapeHtml(post.title)}</h1>
          <div class="article-meta">
            <img class="avatar" src="${window.BlogSphere.escapeHtml(author.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(author.full_name || author.username || "Author"))}" alt="${window.BlogSphere.escapeHtml(author.full_name || author.username || "Author")}" />
            <span>${window.BlogSphere.escapeHtml(author.full_name || author.username || "Author")}</span><span>•</span>
            <span>${window.BlogSphere.formatNumber(post.views || 0)} views</span><span>•</span><span>${window.BlogSphere.formatNumber(likeCount)} likes</span>
          </div>
          <div class="action-row">
            <button type="button" class="btn btn-secondary" id="likeButton">${liked ? "♥ Liked" : "♡ Like"}</button>
            <button type="button" class="btn btn-ghost" id="saveButton">${saved ? "🔖 Saved" : "🔖 Save"}</button>
          </div>
          <div class="article-content">${window.BlogSphere.escapeHtml(post.content || "").replace(/\n/g, "<br>")}</div>
        </article>
        <section class="section" style="padding-top: 16px;"><div class="container" style="padding: 0;">
          <div class="page-header"><h2 style="margin: 0;">Comments</h2></div>
          <form id="commentForm" class="filter-bar" style="padding: 18px; margin-bottom: 20px;">
            <textarea id="commentInput" rows="3" placeholder="Write a comment..." style="min-height: 90px; width: 100%;"></textarea>
            <button type="submit" class="btn btn-primary">Post Comment</button>
          </form>
          <div id="commentList"></div>
        </div></section>`;
      document.getElementById("likeButton").addEventListener("click", () => this.toggleLike(postId));
      document.getElementById("saveButton").addEventListener("click", () => this.toggleSave(postId));
      document.getElementById("commentForm").addEventListener("submit", (event) => {
        event.preventDefault();
        this.addComment(postId, document.getElementById("commentInput").value);
      });

      const comments = await this.getComments(postId);
      const commentList = document.getElementById("commentList");
      if (!comments.length) return window.BlogSphere.renderEmptyState(commentList, "No comments yet.");
      commentList.innerHTML = comments.map((comment) => {
        const commenter = comment.profile || {};
        const displayName = commenter.full_name || commenter.username || "User";
        return `<div class="comment-item">
          <div class="author-row">
            <img class="avatar" src="${window.BlogSphere.escapeHtml(commenter.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName))}" alt="${window.BlogSphere.escapeHtml(displayName)}" />
            <div><strong>${window.BlogSphere.escapeHtml(displayName)}</strong><div style="font-size: 0.8rem; color: var(--muted);">${window.BlogSphere.escapeHtml(window.BlogSphere.formatDate(comment.created_at))}</div></div>
          </div><p style="margin-top: 10px; margin-bottom: 0;">${window.BlogSphere.escapeHtml(comment.content || "")}</p>
        </div>`;
      }).join("");
    },
  };
  window.BlogSphereComments = commentsApi;
  window.BlogSpherePosts = window.BlogSpherePosts || {};
  window.BlogSpherePosts.initPostPage = async function () {
    const postId = window.BlogSphere.getQueryParam("id");
    if (!postId) return window.BlogSphere.renderEmptyState(document.getElementById("postContainer"), "No post selected.");
    await commentsApi.updateViewCount(postId);
    await commentsApi.renderSinglePost(postId);
  };
})();
