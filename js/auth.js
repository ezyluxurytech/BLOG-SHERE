(function () {
  document.documentElement.classList.add("auth-checking");

  const authApi = {
    getLandingUrl() {
      return window.location.pathname.includes("/admin/") ? "../landing.html" : "landing.html";
    },

    isPublicPage() {
      return ["landing.html", "login.html", "register.html"].includes(window.location.pathname.split("/").pop());
    },

    showAuthMessage(message, type = "error") {
      const messageElement = document.getElementById("authMessage");
      if (!messageElement) {
        window.BlogSphere.toast(message, type);
        return;
      }
      messageElement.textContent = message;
      messageElement.hidden = false;
      messageElement.classList.toggle("success", type === "success");
      messageElement.classList.toggle("error", type === "error");
    },

    async getProfile(userId) {
      return window.BlogSphereStore.listUsers().find((user) => user.id === userId) || null;
    },

    updateNavigation(profile) {
      const navActions = document.getElementById("navActions");
      if (!navActions) return;
      if (!profile) {
        navActions.innerHTML = window.location.pathname.endsWith("/landing.html")
          ? '<a href="login.html" class="btn btn-ghost">Log in</a><a href="register.html" class="btn btn-primary">Create account</a>'
          : '<a href="landing.html" class="btn btn-ghost">Welcome</a>';
        return;
      }
      navActions.innerHTML = `
        <a href="dashboard.html" class="btn btn-ghost">Dashboard</a>
        <a href="create-post.html" class="btn btn-secondary">Create Post</a>
        <a href="profile.html" class="btn btn-ghost">Profile</a>
        ${profile.role === "admin" ? '<a href="admin/index.html" class="btn btn-ghost">Admin</a>' : ""}
        <button type="button" class="btn btn-primary" id="logoutButton">Logout</button>
      `;
      document.getElementById("logoutButton")?.addEventListener("click", () => this.logout());
    },

    logout() {
      window.BlogSphereStore.logout();
      window.BlogSphere.currentUser = null;
      window.BlogSphere.toast("Logged out successfully.", "success");
      setTimeout(() => { window.location.href = this.getLandingUrl(); }, 400);
    },

    bindLoginForm() {
      const form = document.getElementById("loginForm");
      if (!form) return;
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        if (!email || !password) return this.showAuthMessage("Please provide both email and password.");
        const button = document.getElementById("loginButton");
        button.disabled = true;
        button.textContent = "Logging in...";
        try {
          const user = await window.BlogSphereStore.login(email, password);
          window.BlogSphere.currentUser = user;
          this.updateNavigation(user);
          window.location.href = "index.html";
        } catch (error) {
          this.showAuthMessage(error.message);
        } finally {
          button.disabled = false;
          button.textContent = "Login";
        }
      });
    },

    bindRegisterForm() {
      const form = document.getElementById("registerForm");
      if (!form) return;
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fullName = document.getElementById("registerFullName").value.trim();
        const username = document.getElementById("registerUsername").value.trim().toLowerCase();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("registerConfirmPassword").value;
        if (!fullName || !username || !email || !password || !confirmPassword) return this.showAuthMessage("Please complete all fields.");
        if (password.length < 8) return this.showAuthMessage("Password must be at least 8 characters long.");
        if (!/^[a-z0-9_]{3,24}$/.test(username)) return this.showAuthMessage("Username must be 3–24 characters and use only letters, numbers, or underscores.");
        if (password !== confirmPassword) return this.showAuthMessage("Password confirmation does not match.");

        const button = document.getElementById("registerButton");
        button.disabled = true;
        button.textContent = "Creating account...";
        try {
          const user = await window.BlogSphereStore.register({ fullName, username, email, password });
          window.BlogSphere.currentUser = user;
          this.showAuthMessage("Account created. Taking you to BlogSphere…", "success");
          setTimeout(() => { window.location.href = "index.html"; }, 400);
        } catch (error) {
          this.showAuthMessage(error.message || "Account creation failed.");
        } finally {
          button.disabled = false;
          button.textContent = "Create account";
        }
      });
    },

    init() {
      this.bindLoginForm();
      this.bindRegisterForm();
      this.ready = this.bootstrapAuth().catch((error) => {
        console.error("Unable to read local BlogSphere data.", error);
        if (!this.isPublicPage()) {
          window.location.replace(this.getLandingUrl());
          return false;
        }
        document.documentElement.classList.remove("auth-checking");
        this.showAuthMessage("BlogSphere could not read local browser storage. Check browser storage settings and reload.");
        return false;
      });
    },

    async bootstrapAuth() {
      const currentUser = window.BlogSphereStore.currentUser();
      const currentPage = window.location.pathname.split("/").pop();
      if (!currentUser) {
        if (!this.isPublicPage()) {
          window.location.replace(this.getLandingUrl());
          return false;
        }
        this.updateNavigation(null);
        document.documentElement.classList.remove("auth-checking");
        return true;
      }

      if (currentUser.status !== "active") {
        window.BlogSphereStore.logout();
        if (!this.isPublicPage()) {
          window.location.replace(this.getLandingUrl());
          return false;
        }
        this.showAuthMessage("This account is suspended.");
        document.documentElement.classList.remove("auth-checking");
        return true;
      }

      window.BlogSphere.currentUser = currentUser;
      window.BlogSphere.currentSession = { user: { id: currentUser.id, email: currentUser.email } };
      this.updateNavigation(currentUser);
      if (["landing.html", "login.html", "register.html"].includes(currentPage)) {
        window.location.replace("index.html");
        return false;
      }
      document.documentElement.classList.remove("auth-checking");
      return true;
    },
  };

  window.BlogSphereAuth = authApi;
  document.addEventListener("DOMContentLoaded", () => authApi.init());
})();
