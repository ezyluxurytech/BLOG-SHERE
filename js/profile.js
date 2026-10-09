(function () {
  const profileApi = {
    async initProfile() {
      const currentUser = window.BlogSphere.currentUser;
      if (!currentUser) return (window.location.href = "login.html");
      const form = document.getElementById("profileForm");
      const identityBox = document.getElementById("profileIdentity");
      const avatarUrl = currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name || currentUser.username || "User")}`;
      document.getElementById("profileFullName").value = currentUser.full_name || "";
      document.getElementById("profileUsername").value = currentUser.username || "";
      document.getElementById("profileBio").value = currentUser.bio || "";
      identityBox.innerHTML = `
        <img src="${window.BlogSphere.escapeHtml(avatarUrl)}" alt="${window.BlogSphere.escapeHtml(currentUser.full_name || currentUser.username || "User")}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--border);" />
        <div><h2 style="margin: 0;">${window.BlogSphere.escapeHtml(currentUser.full_name || "User")}</h2>
        <p style="margin: 0; color: var(--muted);">@${window.BlogSphere.escapeHtml(currentUser.username || "username")}</p>
        <p style="margin: 6px 0 0; color: var(--muted);">${window.BlogSphere.escapeHtml(currentUser.bio || "No bio yet.")}</p></div>`;

      const posts = window.BlogSphereStore.listPosts()
        .filter((post) => post.author_id === currentUser.id && post.status === "published")
        .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
      const userPostsContainer = document.getElementById("userPostsContainer");
      if (!posts.length) window.BlogSphere.renderEmptyState(userPostsContainer, "You haven't created any posts.");
      else await window.BlogSpherePosts.renderPosts(userPostsContainer, posts, "You haven't created any posts.");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const username = document.getElementById("profileUsername").value.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,24}$/.test(username)) return window.BlogSphere.toast("Username must be 3–24 characters and use only letters, numbers, or underscores.", "error");
        try {
          const file = document.getElementById("profileAvatar").files[0];
          const avatar = file ? await window.BlogSpherePosts.uploadImage(file) : currentUser.avatar_url || "";
          const updated = window.BlogSphereStore.updateProfile(currentUser.id, {
            full_name: document.getElementById("profileFullName").value.trim(),
            username,
            bio: document.getElementById("profileBio").value.trim(),
            avatar_url: avatar,
          });
          window.BlogSphere.currentUser = updated;
          window.BlogSphere.toast("Profile updated.", "success");
          setTimeout(() => window.location.reload(), 500);
        } catch (error) {
          window.BlogSphere.toast(error.message || "Profile could not be updated.", "error");
        }
      });
    },
  };
  window.BlogSphereProfile = profileApi;
})();
