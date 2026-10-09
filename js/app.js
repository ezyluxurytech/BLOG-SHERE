(function () {
  const toastContainer = document.getElementById("toastContainer");

  function showToast(message, type = "success") {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatNumber(value) {
    const number = Number(value || 0);
    return number.toLocaleString();
  }

  function renderEmptyState(container, message) {
    if (!container) return;
    container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function initNavToggle() {
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (!navToggle || !navLinks) return;

    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.closest(".site-nav")?.classList.toggle("menu-open", isOpen);
    });
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getCurrentPage() {
    const path = window.location.pathname.split("/").pop();
    return path || "index.html";
  }

  function setPageState() {
    const currentPage = getCurrentPage();
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.endsWith(currentPage)) {
        link.classList.add("active");
      }
    });
  }

  window.BlogSphere = {
    ...window.BlogSphere,
    toast: showToast,
    escapeHtml,
    formatDate,
    formatNumber,
    renderEmptyState,
    getQueryParam,
    getCurrentPage,
    initNavToggle,
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const canRenderPage = window.BlogSphereAuth
      ? await window.BlogSphereAuth.ready
      : false;
    if (!canRenderPage) return;

    initNavToggle();
    setPageState();

    const currentPage = getCurrentPage();

    if (window.BlogSpherePosts && typeof window.BlogSpherePosts.initHomePage === "function") {
      window.BlogSpherePosts.initHomePage();
    }

    if (currentPage === "search.html" && window.BlogSpherePosts && typeof window.BlogSpherePosts.initSearchPage === "function") {
      window.BlogSpherePosts.initSearchPage();
    }

    if (currentPage === "categories.html" && window.BlogSpherePosts && typeof window.BlogSpherePosts.initCategoriesPage === "function") {
      window.BlogSpherePosts.initCategoriesPage();
    }

    if (currentPage === "post.html" && window.BlogSpherePosts && typeof window.BlogSpherePosts.initPostPage === "function") {
      window.BlogSpherePosts.initPostPage();
    }

    if (currentPage === "dashboard.html" && window.BlogSphereDashboard && typeof window.BlogSphereDashboard.initDashboard === "function") {
      window.BlogSphereDashboard.initDashboard();
    }

    if (currentPage === "profile.html" && window.BlogSphereProfile && typeof window.BlogSphereProfile.initProfile === "function") {
      window.BlogSphereProfile.initProfile();
    }

    if (currentPage === "create-post.html" && window.BlogSpherePosts && typeof window.BlogSpherePosts.initCreatePostPage === "function") {
      window.BlogSpherePosts.initCreatePostPage();
    }

    if (currentPage === "edit-post.html" && window.BlogSpherePosts && typeof window.BlogSpherePosts.initEditPostPage === "function") {
      window.BlogSpherePosts.initEditPostPage();
    }

    if (currentPage === "saved-posts.html" && window.BlogSpherePosts && typeof window.BlogSpherePosts.initSavedPostsPage === "function") {
      window.BlogSpherePosts.initSavedPostsPage();
    }

    const isAdminPage = window.location.pathname.includes("/admin/") || window.location.pathname.endsWith("/admin") || window.location.pathname.includes("admin/index.html");
    if (isAdminPage && window.BlogSphereAdmin && typeof window.BlogSphereAdmin.initAdmin === "function") {
      window.BlogSphereAdmin.initAdmin();
    }
  });
})();
