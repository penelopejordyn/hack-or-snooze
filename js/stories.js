"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // Check if the story is in the user's favorites
  const isFavorite = currentUser ? currentUser.favorites.some(fav => fav.storyId === story.storyId) : false;

  // Set the star icon class based on whether the story is a favorite or not
  const starIconClass = isFavorite ? "fas" : "far";
  const favoriteButton = `<span class="star">
                            <i class="${starIconClass} fa-star"></i>
                          </span>`;

  // Add a delete button for the user's own stories
  const deleteButton = currentUser && currentUser.ownStories.some(ownStory => ownStory.storyId === story.storyId)
    ? `<span class="delete">
        <i class="fas fa-trash"></i>
      </span>`
    : '';

  // Generate the HTML markup for the story
  return $(`
    <li id="${story.storyId}">
      ${deleteButton}
      ${favoriteButton}
      <a href="${story.url}" target="_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
    </li>
  `);
}


$allStoriesList.on("click", ".star", async function (evt) {
  if (currentUser) {
    const $story = $(evt.target).closest("li");
    const storyId = $story.attr("id");
    const story = storyList.stories.find(story => story.storyId === storyId);

    if ($(evt.target).hasClass("far")) {
      await story.favorite();
      $(evt.target).removeClass("far").addClass("fas");
    } else {
      await story.unfavorite();
      $(evt.target).removeClass("fas").addClass("far");
    }
  }
});

function showFavoriteStories() {
  $allStoriesList.empty();

  // loop through all of the user's favorite stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}


/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function submitNewStory(evt) {
  evt.preventDefault(); // Prevent the default form submission behavior

  // Get the form data
  const newStoryData = {
    title: $("#story-title").val(),
    author: $("#story-author").val(),
    url: $("#story-url").val(),
  };

  // Add the new story using the addStory method and get the newly added story instance
  const newStory = await storyList.addStory(currentUser, newStoryData);

  // Generate HTML markup for the new story and add it to the page
  const $newStory = generateStoryMarkup(newStory);
  $allStoriesList.prepend($newStory);

  // Clear the form fields
  $("#story-title").val("");
  $("#story-author").val("");
  $("#story-url").val("");

  // Hide the story form container after submitting
  $("#story-form-container").hide();
}

// Attach the submitNewStory function to the submit event of the story form
$("#story-form").on("submit", submitNewStory);

const $navFavorites = $("#nav-favorites");
$navFavorites.on("click", showFavoriteStories);

$allStoriesList.on("click", ".delete", async function (evt) {
  if (currentUser) {
    const $story = $(evt.target).closest("li");
    const storyId = $story.attr("id");
    const story = storyList.stories.find(story => story.storyId === storyId);

    await story.remove();

    // Remove the story from the DOM
    $story.remove();
  }
});