// forked from https://github.com/dpecos/mastodon-comments
// so this is probably covered by a GPL-3.0 license

class MastodonComments extends HTMLElement {
  constructor() {
    super();

    this.tootUrl = this.getAttribute("feedback");
    this.mastodonApiUrl = this.tootUrl.replace(/@[^\/]+/, 'api/v1/statuses');
    this.tootId = this.mastodonApiUrl.replace(/.*api\/v1\/statuses\//,'');

    this.commentsLoaded = false;
  }

  connectedCallback() {
    this.innerHTML = `
      <p id="ffb-comments-list"></p>
    `;

    const comments = document.getElementById("ffb-comments-list");
    this.respondToVisibility(comments, this.loadComments.bind(this));
  }

  escapeHtml(unsafe) {
    return (unsafe || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  toot_active(toot, what) {
    var count = toot[what + "_count"];
    return count > 0 ? "active" : "";
  }

  toot_count(toot, what) {
    var count = toot[what + "_count"];
    return count > 0 ? count : "";
  }

  toot_stats(toot) {
    return `
      <div class="replies ${this.toot_active(toot, "replies")}">
        <a href="${
          toot.url
        }" rel="nofollow"><i class="icn icn-reply"></i>${this.toot_count(
          toot,
          "replies",
        )}</a>
      </div>
      <div class="reblogs ${this.toot_active(toot, "reblogs")}">
        <a href="${
          toot.url
        }" rel="nofollow"><i class="icn icn-boost"></i>${this.toot_count(
          toot,
          "reblogs",
        )}</a>
      </div>
      <div class="favourites ${this.toot_active(toot, "favourites")}">
        <a href="${
          toot.url
        }" rel="nofollow"><i class="icn icn-star"></i>${this.toot_count(
          toot,
          "favourites",
        )}</a>
      </div>
    `;
  }

  user_account(account) {
    var result = `@${account.acct}`;
    if (account.acct.indexOf("@") === -1) {
      var domain = new URL(account.url);
      result += `@${domain.hostname}`;
    }
    return result;
  }

  render_toots(toots, in_reply_to, depth) {
    var tootsToRender = toots
      .filter((toot) => toot.in_reply_to_id === in_reply_to)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    tootsToRender.forEach((toot) => this.render_toot(toots, toot, depth));
  }

  render_toot(toots, toot, depth) {
    toot.account.display_name = this.escapeHtml(toot.account.display_name);
    toot.account.emojis.forEach((emoji) => {
      toot.account.display_name = toot.account.display_name.replace(
        `:${emoji.shortcode}:`,
        `<img src="${this.escapeHtml(emoji.static_url)}" alt="Emoji ${
          emoji.shortcode
        }" height="20" width="20" />`,
      );
    });

    const mastodonComment = `<div class="ffb-comment" style="margin-left: calc(var(--comment-indent) * ${depth})">
        <div class="author">
          <div class="avatar">
            <img src="${this.escapeHtml(
              toot.account.avatar_static,
            )}" height=60 width=60 alt="">
          </div>
          <div class="details">
            <a class="name" href="${toot.account.url}" rel="nofollow">${
              toot.account.display_name
            }</a>
            <a class="user" href="${
              toot.account.url
            }" rel="nofollow">${this.user_account(toot.account)}</a>
          </div>
          <a class="date" href="${
            toot.url
          }" rel="nofollow">${toot.created_at.substr(
            0,
            10,
          )} ${toot.created_at.substr(11, 8)}</a>
        </div>
        <div class="tootcontent">${toot.content}</div>
        <div class="attachments">
          ${toot.media_attachments
            .map((attachment) => {
              if (attachment.type === "image") {
                return `<a href="${attachment.url}" rel="nofollow"><img src="${
                  attachment.preview_url
                }" alt="${this.escapeHtml(attachment.description)}" /></a>`;
              } else if (attachment.type === "video") {
                return `<video controls><source src="${attachment.url}" type="${attachment.mime_type}"></video>`;
              } else if (attachment.type === "gifv") {
                return `<video autoplay loop muted playsinline><source src="${attachment.url}" type="${attachment.mime_type}"></video>`;
              } else if (attachment.type === "audio") {
                return `<audio controls><source src="${attachment.url}" type="${attachment.mime_type}"></audio>`;
              } else {
                return `<a href="${attachment.url}" rel="nofollow">${attachment.type}</a>`;
              }
            })
            .join("")}
        </div>
        <div class="status">
          ${this.toot_stats(toot)}
        </div>
      </div>`;

    var div = document.createElement("div");
    div.innerHTML =
      typeof DOMPurify !== "undefined"
        ? DOMPurify.sanitize(mastodonComment.trim())
        : mastodonComment.trim();
    document
      .getElementById("ffb-comments-list")
      .appendChild(div.firstChild);

    this.render_toots(toots, toot.id, depth + 1);
  }

  loadComments() {
    if (this.commentsLoaded) return;

    document.getElementById("ffb-comments-list").innerHTML =
      "Loading comments from the Fediverse...";

    let _this = this;

    fetch(this.mastodonApiUrl)
      .then((response) => response.json())
      .then((toot) => {
        document.getElementById("ffb-stats").innerHTML =
          this.toot_stats(toot);
      });

    fetch(this.mastodonApiUrl + "/context")
      .then((response) => response.json())
      .then((data) => {
        if (
          data["descendants"] &&
          Array.isArray(data["descendants"]) &&
          data["descendants"].length > 0
        ) {
          document.getElementById("ffb-comments-list").innerHTML = "";
          _this.render_toots(data["descendants"], _this.tootId, 0);
        } else {
          document.getElementById("ffb-comments-list").innerHTML =
            "<p>No comments found</p>";
        }

        _this.commentsLoaded = true;
      });
  }

  respondToVisibility(element, callback) {
    var options = {
      root: null,
    };

    var observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio > 0) {
          callback();
        }
      });
    }, options);

    observer.observe(element);
  }
}

customElements.define("ffb-comments", MastodonComments);
