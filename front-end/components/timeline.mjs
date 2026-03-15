import {createBloom} from "./bloom.mjs";

/**
 * Create a timeline component
 * @param {string} template - The ID of the template to clone
 * @param {Object} blooms - The timeline content, show whatever is passed and don't make decisions
 * @returns {DocumentFragment} - The timeline element
 */
function createTimeline(template, blooms) {
  if (!blooms) return;
  const timelineElement = document
    .getElementById(template)
    .content.cloneNode(true);

  // All the bits of the template we currently want to interact with
  const content = timelineElement.querySelector("[data-content]");
  const emptyMessage = timelineElement.querySelector("[data-empty]");

  // Show/hide appropriate messages
  const isEmpty = blooms.length === 0;
  emptyMessage.hidden = !isEmpty;

  const bloomsFragment = document.createDocumentFragment();
  // Accumulate blooms
  blooms.forEach((bloom) => {
    bloomsFragment.appendChild(createBloomWithRebloom("bloom-template", bloom));
  });

  // Add all blooms to the content container at once
  content.appendChild(bloomsFragment);

  // TODO: update heading maybe

  return timelineElement;
}

// Create a bloom element and add rebloom info if available
function createBloomWithRebloom(template, bloom) {
 
  const bloomElement = createBloom(template, bloom);

  const rebloomInfo = bloomElement.querySelector("[data-rebloom-info]");
  const rebloomerLabel = bloomElement.querySelector("[data-rebloomer]");
  const rebloomCountEl = bloomElement.querySelector("[data-rebloom-count]");
  const rebloomTimeEl = bloomElement.querySelector("[data-rebloom-time]");

  // If bloom is rebloomed :
  if (bloom.rebloomer) {
    rebloomInfo.hidden = false;

    // Show rebloomer
    rebloomerLabel.textContent = `Rebloomed by ${bloom.rebloomer}`;

    // Show rebloom_count 
    if (typeof bloom.rebloom_count === "number" && bloom.rebloom_count > 0) {
      rebloomCountEl.hidden = false;

      const countLabel = bloom.rebloom_count === 1 ? "Time rebloomed" : "Times rebloomed";
      rebloomCountEl.textContent = `(${bloom.rebloom_count}  ${countLabel})`;
    } else {
      rebloomCountEl.hidden = true;
    }

    // Show last_rebloomed_at time
    if (bloom.last_rebloomed_at) {
      rebloomTimeEl.hidden = false;

      const date = new Date(bloom.last_rebloomed_at);
      rebloomTimeEl.textContent = date.toLocaleString();
    } else {
      rebloomTimeEl.hidden = true;
    }
  } else {
    // // If bloom is not rebloomed :
    rebloomInfo.hidden = true;
    rebloomerLabel.textContent = "";
    rebloomCountEl.hidden = true;
    rebloomTimeEl.hidden = true;
  }

  // Add rebloom button if doesn't exist
  if (!bloomElement.querySelector("[data-action='rebloom']")) {
    const rebloomButton = document.createElement("button");
    rebloomButton.type = "button";
    rebloomButton.classList.add("bloom__rebloom-button");
    rebloomButton.setAttribute("data-action", "rebloom");
    rebloomButton.setAttribute("aria-label", "Rebloom");
    rebloomButton.textContent = "🔄";
    bloomElement.appendChild(rebloomButton);
  }

  return bloomElement;
}


export {createTimeline};
export {createBloomWithRebloom};
