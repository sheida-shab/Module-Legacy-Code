import {renderEach, renderOne, destroy} from "../lib/render.mjs";
import { createBloomWithRebloom } from "../components/timeline.mjs";

import {
  state,
  getLogoutContainer,
  getLoginContainer,
  getProfileContainer,
  getTimelineContainer,
  getBloomFormContainer,
} from "../index.mjs";
import {createLogin, handleLogin} from "../components/login.mjs";
import {createLogout, handleLogout} from "../components/logout.mjs";
import {createProfile} from "../components/profile.mjs";
import {
  createBloomForm,
  handleBloomSubmit,
  handleTyping,
} from "../components/bloom-form.mjs";
import {createBloom} from "../components/bloom.mjs";

// Home view - logged in or not
function homeView() {
  destroy();
console.log("STATE TIMELINE BLOOMS:", state.timelineBlooms);

  if (state.isLoggedIn) {
    renderOne(
      {
        profileData: state.profiles.find(
          (p) => p.username === state.currentUser,
        ),
        whoToFollow: state.whoToFollow,
        isLoggedIn: state.isLoggedIn,
      },
      getProfileContainer(),
      "profile-template",
      createProfile,
    );
    renderEach(
      state.timelineBlooms,
      getTimelineContainer(),
      "bloom-template",
      createBloomWithRebloom,
    );
    
    // Rebloom button listener (event delegation)
    document
      .getElementById("timeline-container")
      ?.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-action='rebloom']");
        if (!button) return;

        const bloomElement = button.closest("[data-bloom]");
        const bloomId = bloomElement?.dataset.bloomId;
        if (!bloomId) return;

        try {
          const result = await apiService.rebloom(bloomId);
          if (result.success) {
            // Refresh timeline and profile
            await apiService.getBlooms();
            await apiService.getProfile(state.currentUser);
            // Re-render home view to update UI
            homeView();
          }
        } catch (err) {
          console.error("Error reblooming:", err);
        }
      });

    renderOne(
      state.isLoggedIn,
      getBloomFormContainer(),
      "bloom-form-template",
      createBloomForm,
    );
    renderOne(
      state.isLoggedIn,
      getLogoutContainer(),
      "logout-template",
      createLogout,
    );
    document
      .querySelector("[data-action='logout']")
      ?.addEventListener("click", handleLogout);
    document
      .querySelector("[data-form='bloom']")
      ?.addEventListener("submit", handleBloomSubmit);
    document.querySelector("textarea")?.addEventListener("input", handleTyping);
  } else {
    renderOne(
      state.isLoggedIn,
      getLoginContainer(),
      "login-template",
      createLogin
    );
    document
      .querySelector("[data-form='login']")
      ?.addEventListener("submit", handleLogin);
  }
}
export {homeView};
